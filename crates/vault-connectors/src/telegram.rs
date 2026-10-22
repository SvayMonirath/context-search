use crate::traits::{Connector, ConnectorError, ConnectorRecord, ConnectorState, SyncResult};
use chrono::{DateTime, Utc};
use serde::Deserialize;
use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::{Path, PathBuf};
use vault_pii::PiiScrubber;
use walkdir::WalkDir;
fn uuid_v4_fallback() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    format!("{:x}", nanos)
}

pub struct TelegramConnector {
    pub export_path: PathBuf,
}

#[derive(Deserialize, Debug)]
pub struct TelegramExport {
    pub name: Option<String>,
    #[serde(rename = "type")]
    pub chat_type: Option<String>,
    #[serde(default)]
    pub messages: Vec<TelegramRawMessage>,
}

#[derive(Deserialize, Debug)]
pub struct TelegramRawMessage {
    pub id: serde_json::Value,
    pub date: Option<String>,
    pub from: Option<String>,
    pub text: Option<serde_json::Value>,
}

impl TelegramConnector {
    pub fn new<P: AsRef<Path>>(export_path: P) -> Self {
        Self {
            export_path: export_path.as_ref().to_path_buf(),
        }
    }

    pub fn parse_export(json_content: &str) -> Result<Vec<crate::ParsedDocument>, ConnectorError> {
        let export: TelegramExport = serde_json::from_str(json_content)?;
        let chat_name = export.name.unwrap_or_else(|| "Telegram Chat".into());

        let mut docs = Vec::new();

        for msg in export.messages {
            let text_val = match msg.text {
                Some(t) => t,
                None => continue,
            };

            let raw_text = Self::extract_text(&text_val);
            if raw_text.trim().is_empty() {
                continue;
            }

            let scrubbed = PiiScrubber::scrub(&raw_text);

            let msg_id = match msg.id {
                serde_json::Value::Number(n) => n.to_string(),
                serde_json::Value::String(s) => s,
                _ => uuid_v4_fallback(),
            };

            let timestamp = msg
                .date
                .as_deref()
                .and_then(|d| DateTime::parse_from_rfc3339(d).ok())
                .map(|dt| dt.with_timezone(&Utc))
                .unwrap_or_else(Utc::now);

            docs.push(crate::ParsedDocument {
                id: format!("tg_{}", msg_id),
                source: "Telegram".into(),
                title: format!("Chat with {}", chat_name),
                content: scrubbed.text,
                sender: msg.from,
                timestamp,
                pii_events_count: scrubbed.events.len(),
            });
        }

        Ok(docs)
    }

    /// Extracts clean text from Telegram message text representation
    /// (can be plain string or array of text/mention/link objects)
    pub fn extract_text(text_val: &serde_json::Value) -> String {
        match text_val {
            serde_json::Value::String(s) => s.clone(),
            serde_json::Value::Array(arr) => {
                let mut combined = String::new();
                for item in arr {
                    if let serde_json::Value::String(s) = item {
                        combined.push_str(s);
                    } else if let serde_json::Value::Object(map) = item {
                        if let Some(serde_json::Value::String(text_part)) = map.get("text") {
                            combined.push_str(text_part);
                        }
                    }
                }
                combined
            }
            _ => String::new(),
        }
    }

    /// Parses a single Telegram export JSON file into a list of records
    pub fn parse_file(path: &Path, watermark_ids: &HashSet<String>) -> Result<(Vec<ConnectorRecord>, usize), ConnectorError> {
        let content = fs::read_to_string(path)?;
        let export: TelegramExport = serde_json::from_str(&content)?;
        let chat_name = export.name.unwrap_or_else(|| "Telegram Chat".into());

        let mut records = Vec::new();
        let mut skipped = 0;

        for msg in export.messages {
            let text_val = match msg.text {
                Some(t) => t,
                None => continue,
            };

            let raw_text = Self::extract_text(&text_val);
            if raw_text.trim().is_empty() {
                continue;
            }

            let msg_id = match msg.id {
                serde_json::Value::Number(n) => n.to_string(),
                serde_json::Value::String(s) => s,
                _ => continue,
            };

            let global_id = format!("tg_{}_{}", chat_name, msg_id);
            if watermark_ids.contains(&global_id) {
                skipped += 1;
                continue;
            }

            // Scrub PII on device
            let scrubbed = PiiScrubber::scrub(&raw_text);

            let timestamp = msg
                .date
                .as_deref()
                .and_then(|d| DateTime::parse_from_rfc3339(d).ok())
                .map(|dt| dt.with_timezone(&Utc))
                .unwrap_or_else(Utc::now);

            let mut metadata = HashMap::new();
            metadata.insert("chat_name".to_string(), chat_name.clone());
            metadata.insert("message_id".to_string(), msg_id);
            metadata.insert("pii_scrubbed".to_string(), scrubbed.events.len().to_string());

            records.push(ConnectorRecord {
                id: global_id,
                source: "Telegram".to_string(),
                title: format!("Chat with {}", chat_name),
                content: scrubbed.text,
                sender: msg.from,
                timestamp,
                metadata,
            });
        }

        Ok((records, skipped))
    }
}

impl Connector for TelegramConnector {
    fn name(&self) -> &'static str {
        "Telegram"
    }

    fn validate_config(&self) -> Result<(), ConnectorError> {
        if !self.export_path.exists() {
            return Err(ConnectorError::Io(std::io::Error::new(
                std::io::ErrorKind::NotFound,
                format!("Telegram export path not found: {:?}", self.export_path),
            )));
        }
        Ok(())
    }

    fn sync(&mut self, state: &ConnectorState) -> Result<SyncResult, ConnectorError> {
        self.validate_config()?;

        // Decode watermark which stores known message IDs as comma-separated or JSON list
        let watermark_set: HashSet<String> = state
            .watermark
            .as_deref()
            .map(|w| serde_json::from_str(w).unwrap_or_default())
            .unwrap_or_default();

        let mut all_records = Vec::new();
        let mut total_skipped = 0;
        let mut new_id_set = watermark_set.clone();

        if self.export_path.is_file() {
            let (records, skipped) = Self::parse_file(&self.export_path, &watermark_set)?;
            for r in &records {
                new_id_set.insert(r.id.clone());
            }
            all_records.extend(records);
            total_skipped += skipped;
        } else if self.export_path.is_dir() {
            for entry in WalkDir::new(&self.export_path)
                .into_iter()
                .filter_map(|e| e.ok())
            {
                let path = entry.path();
                if path.is_file() && path.extension().and_then(|e| e.to_str()) == Some("json") {
                    if let Ok((records, skipped)) = Self::parse_file(path, &watermark_set) {
                        for r in &records {
                            new_id_set.insert(r.id.clone());
                        }
                        all_records.extend(records);
                        total_skipped += skipped;
                    }
                }
            }
        }

        let new_watermark = serde_json::to_string(&new_id_set).ok();
        let records_added = all_records.len();

        Ok(SyncResult {
            records: all_records,
            new_watermark,
            records_added,
            records_skipped: total_skipped,
        })
    }
}
