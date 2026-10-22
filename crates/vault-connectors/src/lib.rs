pub mod traits;
pub mod obsidian;
pub mod gmail;
pub mod notion;
pub mod telegram;
pub mod manager;

pub use traits::*;
pub use obsidian::*;
pub use gmail::*;
pub use notion::*;
pub use telegram::*;
pub use manager::*;

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::path::Path;
use vault_pii::PiiScrubber;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ParsedDocument {
    pub id: String,
    pub source: String,
    pub title: String,
    pub content: String,
    pub sender: Option<String>,
    pub timestamp: DateTime<Utc>,
    pub pii_events_count: usize,
}

pub struct MarkdownConnector;

impl MarkdownConnector {
    pub fn parse_file(path: &Path, content: &str) -> Result<ParsedDocument, ConnectorError> {
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

        Ok(ParsedDocument {
            id: format!("md_{}", file_name),
            source: "Obsidian".into(),
            title,
            content: scrubbed.text,
            sender: None,
            timestamp: Utc::now(),
            pii_events_count: scrubbed.events.len(),
        })
    }
}

pub struct EmailConnector;

impl EmailConnector {
    /// Parses a raw email (.eml format or RFC-style headers) into a ParsedDocument
    pub fn parse_raw_email(id: &str, raw_content: &str) -> ParsedDocument {
        let mut subject = "Untitled Email".to_string();
        let mut from = "Unknown Sender".to_string();
        let mut date = Utc::now();
        let mut body_lines = Vec::new();
        let mut in_headers = true;

        for line in raw_content.lines() {
            if in_headers {
                if line.trim().is_empty() {
                    in_headers = false;
                    continue;
                }
                let lower = line.to_lowercase();
                if lower.starts_with("subject:") {
                    subject = line["subject:".len()..].trim().to_string();
                } else if lower.starts_with("from:") {
                    from = line["from:".len()..].trim().to_string();
                } else if lower.starts_with("date:") {
                    let date_str = line["date:".len()..].trim();
                    if let Ok(d) = DateTime::parse_from_rfc2822(date_str) {
                        date = d.with_timezone(&Utc);
                    }
                }
            } else {
                body_lines.push(line);
            }
        }

        let body = if in_headers {
            raw_content.to_string()
        } else {
            body_lines.join("\n")
        };

        let scrubbed = PiiScrubber::scrub(&body);

        ParsedDocument {
            id: format!("eml_{}", id),
            source: "Gmail".into(),
            title: subject,
            content: scrubbed.text,
            sender: Some(from),
            timestamp: date,
            pii_events_count: scrubbed.events.len(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_telegram_export_parsing() {
        let json_data = r#"{
            "name": "Sarah Jenkins",
            "type": "personal_chat",
            "id": 12345678,
            "messages": [
                {
                    "id": 101,
                    "type": "message",
                    "date": "2026-03-14T15:42:00Z",
                    "from": "Sarah Jenkins",
                    "text": "The $12,500 total sounds fair. Call me at +1-555-839-2910 if needed."
                }
            ]
        }"#;

        let docs = TelegramConnector::parse_export(json_data).unwrap();
        assert_eq!(docs.len(), 1);
        assert_eq!(docs[0].id, "tg_101");
        assert_eq!(docs[0].sender.as_deref(), Some("Sarah Jenkins"));
        // Phone must be scrubbed!
        assert!(!docs[0].content.contains("+1-555-839-2910"));
        assert!(docs[0].content.contains("[REDACTED_PHONE]"));
        assert_eq!(docs[0].pii_events_count, 1);
    }

    #[test]
    fn test_markdown_file_parsing() {
        let md = "# Project Acme Milestones\n\n- [x] Deposit of $5,000 paid via wire.\nPhone: +1-555-019-2831.";
        let path = Path::new("Projects/Acme.md");

        let doc = MarkdownConnector::parse_file(path, md).unwrap();
        assert_eq!(doc.title, "Project Acme Milestones");
        assert_eq!(doc.source, "Obsidian");
        assert!(doc.content.contains("[REDACTED_PHONE]"));
    }

    #[test]
    fn test_email_raw_parsing_and_pii_scrub() {
        let raw = "From: Alice Smith <alice@example.com>\nSubject: Q3 Bonus & SSN Verification\nDate: Mon, 20 Oct 2026 10:00:00 +0000\n\nPlease confirm employee SSN: 123-45-6789 before processing wire transfer.";
        let doc = EmailConnector::parse_raw_email("test-email-1", raw);
        assert_eq!(doc.title, "Q3 Bonus & SSN Verification");
        assert_eq!(doc.sender.as_deref(), Some("Alice Smith <alice@example.com>"));
        assert_eq!(doc.source, "Gmail");
        // SSN must be redacted!
        assert!(!doc.content.contains("123-45-6789"));
        assert!(doc.content.contains("[REDACTED_SSN]"));
        assert_eq!(doc.pii_events_count, 1);
    }
}
