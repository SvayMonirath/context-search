use crate::traits::{Connector, ConnectorError, ConnectorRecord, ConnectorState, SyncResult};
use chrono::{DateTime, Utc};
use notify::{Config, Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::mpsc::{channel, Receiver};
use std::sync::{Arc, Mutex};
use std::time::SystemTime;
use vault_pii::PiiScrubber;
use walkdir::WalkDir;

pub struct ObsidianConnector {
    pub vault_path: PathBuf,
}

impl ObsidianConnector {
    pub fn new<P: AsRef<Path>>(vault_path: P) -> Self {
        Self {
            vault_path: vault_path.as_ref().to_path_buf(),
        }
    }

    /// Strips Obsidian wikilinks like [[Note Title|Display Text]] -> Display Text
    /// and [[Note Title]] -> Note Title
    pub fn clean_wikilinks(text: &str) -> String {
        let mut result = String::with_capacity(text.len());
        let mut chars = text.chars().peekable();

        while let Some(ch) = chars.next() {
            if ch == '[' && chars.peek() == Some(&'[') {
                chars.next(); // consume second '['
                let mut link_content = String::new();
                let mut closed = false;

                while let Some(inner) = chars.next() {
                    if inner == ']' && chars.peek() == Some(&']') {
                        chars.next(); // consume second ']'
                        closed = true;
                        break;
                    }
                    link_content.push(inner);
                }

                if closed {
                    if let Some((_, display)) = link_content.split_once('|') {
                        result.push_str(display.trim());
                    } else {
                        result.push_str(link_content.trim());
                    }
                } else {
                    result.push_str("[[");
                    result.push_str(&link_content);
                }
            } else {
                result.push(ch);
            }
        }
        result
    }

    /// Extracts YAML frontmatter and returns (cleaned_body, metadata)
    pub fn parse_frontmatter(content: &str) -> (String, HashMap<String, String>) {
        let mut metadata = HashMap::new();
        let trimmed = content.trim_start();

        if !trimmed.starts_with("---") {
            return (content.to_string(), metadata);
        }

        let lines: Vec<&str> = trimmed.lines().collect();
        if lines.is_empty() {
            return (content.to_string(), metadata);
        }

        let mut end_idx = None;
        for (i, line) in lines.iter().enumerate().skip(1) {
            if line.trim() == "---" {
                end_idx = Some(i);
                break;
            }
        }

        if let Some(idx) = end_idx {
            for line in &lines[1..idx] {
                if let Some((key, val)) = line.split_once(':') {
                    metadata.insert(key.trim().to_string(), val.trim().to_string());
                }
            }
            let body = lines[idx + 1..].join("\n");
            (body, metadata)
        } else {
            (content.to_string(), metadata)
        }
    }

    /// Backward-compatible parser for raw string content
    pub fn parse_file_content(path: &Path, content: &str) -> Result<crate::ParsedDocument, ConnectorError> {
        let file_name = path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("Untitled.md")
            .to_string();

        let title = content
            .lines()
            .find(|line| line.starts_with("# "))
            .map(|line| line.trim_start_matches("# ").trim().to_string())
            .unwrap_or_else(|| file_name.clone());

        let scrubbed = PiiScrubber::scrub(content);

        Ok(crate::ParsedDocument {
            id: format!("md_{}", file_name),
            source: "Obsidian".into(),
            title,
            content: scrubbed.text,
            sender: None,
            timestamp: Utc::now(),
            pii_events_count: scrubbed.events.len(),
        })
    }
    pub fn parse_file(path: &Path) -> Result<ConnectorRecord, ConnectorError> {
        let raw_content = fs::read_to_string(path)?;
        let file_name = path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("Untitled")
            .to_string();

        let (body, mut metadata) = Self::parse_frontmatter(&raw_content);
        let cleaned_body = Self::clean_wikilinks(&body);

        // Derive title from frontmatter or first # Heading or filename
        let title = metadata
            .get("title")
            .cloned()
            .or_else(|| {
                cleaned_body
                    .lines()
                    .find(|l| l.starts_with("# "))
                    .map(|l| l.trim_start_matches("# ").trim().to_string())
            })
            .unwrap_or_else(|| {
                path.file_stem()
                    .and_then(|s| s.to_str())
                    .unwrap_or(&file_name)
                    .to_string()
            });

        let scrubbed = PiiScrubber::scrub(&cleaned_body);
        metadata.insert("path".to_string(), path.to_string_lossy().to_string());
        metadata.insert("pii_scrubbed".to_string(), scrubbed.events.len().to_string());

        let mtime = fs::metadata(path)
            .and_then(|m| m.modified())
            .unwrap_or_else(|_| SystemTime::now());
        let timestamp: DateTime<Utc> = mtime.into();

        Ok(ConnectorRecord {
            id: format!("obsidian_{}", path.to_string_lossy()),
            source: "Obsidian".to_string(),
            title,
            content: scrubbed.text,
            sender: None,
            timestamp,
            metadata,
        })
    }
}

impl Connector for ObsidianConnector {
    fn name(&self) -> &'static str {
        "Obsidian"
    }

    fn validate_config(&self) -> Result<(), ConnectorError> {
        if !self.vault_path.exists() {
            return Err(ConnectorError::Io(std::io::Error::new(
                std::io::ErrorKind::NotFound,
                format!("Obsidian directory not found: {:?}", self.vault_path),
            )));
        }
        if !self.vault_path.is_dir() {
            return Err(ConnectorError::Io(std::io::Error::new(
                std::io::ErrorKind::InvalidInput,
                format!("Obsidian path is not a directory: {:?}", self.vault_path),
            )));
        }
        Ok(())
    }

    fn sync(&mut self, state: &ConnectorState) -> Result<SyncResult, ConnectorError> {
        self.validate_config()?;

        let mut records = Vec::new();
        let mut latest_mtime: Option<DateTime<Utc>> = None;
        let mut skipped = 0;

        let watermark_dt: Option<DateTime<Utc>> = state
            .watermark
            .as_deref()
            .and_then(|w| DateTime::parse_from_rfc3339(w).ok())
            .map(|dt| dt.with_timezone(&Utc));

        for entry in WalkDir::new(&self.vault_path)
            .into_iter()
            .filter_entry(|e| {
                if e.depth() == 0 {
                    return true;
                }
                let name = e.file_name().to_string_lossy();
                // Skip hidden folders (.obsidian, .trash, .git)
                !name.starts_with('.')
            })
            .filter_map(|e| e.ok())
        {
            let path = entry.path();
            if !path.is_file() {
                continue;
            }

            let ext = path
                .extension()
                .and_then(|e| e.to_str())
                .unwrap_or("")
                .to_lowercase();
            if ext != "md" && ext != "markdown" && ext != "txt" && ext != "org" {
                continue;
            }

            // Check file mtime against watermark
            if let Ok(metadata) = fs::metadata(path) {
                if let Ok(mtime) = metadata.modified() {
                    let dt: DateTime<Utc> = mtime.into();
                    if let Some(watermark) = watermark_dt {
                        if dt <= watermark {
                            skipped += 1;
                            continue;
                        }
                    }

                    if latest_mtime.map_or(true, |cur| dt > cur) {
                        latest_mtime = Some(dt);
                    }
                }
            }

            match Self::parse_file(path) {
                Ok(rec) => records.push(rec),
                Err(err) => eprintln!("[ObsidianConnector] Warning: failed to parse {:?}: {}", path, err),
            }
        }

        let new_watermark = latest_mtime
            .or(watermark_dt)
            .map(|dt| dt.to_rfc3339());
        let records_added = records.len();

        Ok(SyncResult {
            records,
            new_watermark,
            records_added,
            records_skipped: skipped,
        })
    }
}

/// Active background file watcher for an Obsidian directory
pub struct ObsidianWatcherHandle {
    _watcher: RecommendedWatcher,
    pub event_receiver: Receiver<PathBuf>,
}

pub fn start_obsidian_watcher<P: AsRef<Path>>(
    path: P,
) -> Result<ObsidianWatcherHandle, ConnectorError> {
    let (tx, rx) = channel::<PathBuf>();
    let tx_shared = Arc::new(Mutex::new(tx));

    let mut watcher = RecommendedWatcher::new(
        move |res: Result<Event, notify::Error>| match res {
            Ok(event) => {
                match event.kind {
                    EventKind::Create(_) | EventKind::Modify(_) => {
                        for path in event.paths {
                            let ext = path
                                .extension()
                                .and_then(|e| e.to_str())
                                .unwrap_or("")
                                .to_lowercase();
                            if ext == "md" || ext == "markdown" || ext == "txt" || ext == "org" {
                                if let Ok(tx) = tx_shared.lock() {
                                    let _ = tx.send(path);
                                }
                            }
                        }
                    }
                    _ => {}
                }
            }
            Err(e) => eprintln!("[ObsidianWatcher] Error: {}", e),
        },
        Config::default(),
    )
    .map_err(|e| ConnectorError::Watch(e.to_string()))?;

    watcher
        .watch(path.as_ref(), RecursiveMode::Recursive)
        .map_err(|e| ConnectorError::Watch(e.to_string()))?;

    Ok(ObsidianWatcherHandle {
        _watcher: watcher,
        event_receiver: rx,
    })
}
