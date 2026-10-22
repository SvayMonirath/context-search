use crate::traits::{Connector, ConnectorError, ConnectorRecord, ConnectorState, SyncResult};
use chrono::{DateTime, Utc};
use reqwest::blocking::Client;
use serde::Deserialize;
use std::collections::HashMap;
use std::time::Duration;
use vault_pii::PiiScrubber;

pub struct NotionConnector {
    pub api_key: Option<String>,
    pub client: Client,
}

#[derive(Deserialize, Debug)]
#[allow(dead_code)]
struct NotionSearchResponse {
    results: Vec<NotionObject>,
    #[serde(rename = "has_more")]
    has_more: bool,
    #[serde(rename = "next_cursor")]
    next_cursor: Option<String>,
}

#[derive(Deserialize, Debug)]
struct NotionObject {
    object: String,
    id: String,
    #[serde(rename = "last_edited_time")]
    last_edited_time: Option<String>,
    properties: Option<serde_json::Value>,
}

#[derive(Deserialize, Debug)]
struct NotionBlockChildrenResponse {
    results: Vec<NotionBlock>,
}

#[derive(Deserialize, Debug)]
pub struct NotionBlock {
    #[serde(rename = "type")]
    pub block_type: String,
    pub paragraph: Option<NotionRichTextBlock>,
    pub heading_1: Option<NotionRichTextBlock>,
    pub heading_2: Option<NotionRichTextBlock>,
    pub heading_3: Option<NotionRichTextBlock>,
    pub bulleted_list_item: Option<NotionRichTextBlock>,
    pub numbered_list_item: Option<NotionRichTextBlock>,
    pub to_do: Option<NotionToDoBlock>,
    pub code: Option<NotionCodeBlock>,
    pub quote: Option<NotionRichTextBlock>,
}

#[derive(Deserialize, Debug)]
pub struct NotionRichTextBlock {
    pub rich_text: Vec<NotionRichTextItem>,
}

#[derive(Deserialize, Debug)]
pub struct NotionToDoBlock {
    pub rich_text: Vec<NotionRichTextItem>,
    pub checked: bool,
}

#[derive(Deserialize, Debug)]
pub struct NotionCodeBlock {
    pub rich_text: Vec<NotionRichTextItem>,
    pub language: Option<String>,
}

#[derive(Deserialize, Debug)]
pub struct NotionRichTextItem {
    pub plain_text: Option<String>,
}

impl NotionConnector {
    pub fn new(api_key: Option<String>) -> Self {
        let client = Client::builder()
            .timeout(Duration::from_secs(15))
            .build()
            .unwrap_or_else(|_| Client::new());

        Self { api_key, client }
    }

    /// Recursively flattens block list into clean readable Markdown
    pub fn flatten_blocks(blocks: &[NotionBlock]) -> String {
        let mut lines = Vec::new();

        for block in blocks {
            match block.block_type.as_str() {
                "paragraph" => {
                    if let Some(p) = &block.paragraph {
                        lines.push(Self::extract_text(&p.rich_text));
                    }
                }
                "heading_1" => {
                    if let Some(h) = &block.heading_1 {
                        lines.push(format!("# {}", Self::extract_text(&h.rich_text)));
                    }
                }
                "heading_2" => {
                    if let Some(h) = &block.heading_2 {
                        lines.push(format!("## {}", Self::extract_text(&h.rich_text)));
                    }
                }
                "heading_3" => {
                    if let Some(h) = &block.heading_3 {
                        lines.push(format!("### {}", Self::extract_text(&h.rich_text)));
                    }
                }
                "bulleted_list_item" => {
                    if let Some(item) = &block.bulleted_list_item {
                        lines.push(format!("* {}", Self::extract_text(&item.rich_text)));
                    }
                }
                "numbered_list_item" => {
                    if let Some(item) = &block.numbered_list_item {
                        lines.push(format!("1. {}", Self::extract_text(&item.rich_text)));
                    }
                }
                "to_do" => {
                    if let Some(todo) = &block.to_do {
                        let check = if todo.checked { "[x]" } else { "[ ]" };
                        lines.push(format!("- {} {}", check, Self::extract_text(&todo.rich_text)));
                    }
                }
                "code" => {
                    if let Some(code) = &block.code {
                        let lang = code.language.as_deref().unwrap_or("");
                        lines.push(format!("```{}\n{}\n```", lang, Self::extract_text(&code.rich_text)));
                    }
                }
                "quote" => {
                    if let Some(q) = &block.quote {
                        lines.push(format!("> {}", Self::extract_text(&q.rich_text)));
                    }
                }
                _ => {}
            }
        }

        lines.join("\n\n")
    }

    fn extract_text(items: &[NotionRichTextItem]) -> String {
        items
            .iter()
            .filter_map(|i| i.plain_text.as_deref())
            .collect::<Vec<_>>()
            .join("")
    }

    /// Extracts page title from Notion properties object
    fn extract_page_title(properties: &Option<serde_json::Value>) -> String {
        if let Some(serde_json::Value::Object(map)) = properties {
            for (_, prop_val) in map {
                if let Some(prop_type) = prop_val.get("type").and_then(|t| t.as_str()) {
                    if prop_type == "title" {
                        if let Some(arr) = prop_val.get("title").and_then(|t| t.as_array()) {
                            let title_parts: Vec<&str> = arr
                                .iter()
                                .filter_map(|item| item.get("plain_text").and_then(|pt| pt.as_str()))
                                .collect();
                            if !title_parts.is_empty() {
                                return title_parts.join("");
                            }
                        }
                    }
                }
            }
        }
        "Untitled Notion Page".to_string()
    }
}

impl Connector for NotionConnector {
    fn name(&self) -> &'static str {
        "Notion"
    }

    fn validate_config(&self) -> Result<(), ConnectorError> {
        match &self.api_key {
            Some(key) if key.starts_with("secret_") || key.len() >= 10 => Ok(()),
            _ => Err(ConnectorError::Auth(
                "Notion Internal Integration Token is missing or invalid (must start with 'secret_').".into(),
            )),
        }
    }

    fn sync(&mut self, state: &ConnectorState) -> Result<SyncResult, ConnectorError> {
        self.validate_config()?;
        let key = self.api_key.as_ref().unwrap();

        let search_url = "https://api.notion.com/v1/search";
        let body = serde_json::json!({
            "sort": {
                "direction": "descending",
                "timestamp": "last_edited_time"
            },
            "page_size": 25
        });

        let resp = self
            .client
            .post(search_url)
            .header("Authorization", format!("Bearer {}", key))
            .header("Notion-Version", "2022-06-28")
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .map_err(|e| ConnectorError::Http(e.to_string()))?;

        if resp.status() == reqwest::StatusCode::UNAUTHORIZED {
            return Err(ConnectorError::Auth("Notion API token unauthorized. Check integration permissions.".into()));
        }

        if !resp.status().is_success() {
            return Err(ConnectorError::Http(format!(
                "Notion API error {}: {}",
                resp.status(),
                resp.text().unwrap_or_default()
            )));
        }

        let search_data: NotionSearchResponse = resp
            .json()
            .map_err(ConnectorError::Reqwest)?;

        let mut records = Vec::new();
        let mut latest_edited: Option<String> = None;
        let mut skipped = 0;

        let watermark_dt: Option<DateTime<Utc>> = state
            .watermark
            .as_deref()
            .and_then(|w| DateTime::parse_from_rfc3339(w).ok())
            .map(|dt| dt.with_timezone(&Utc));

        for obj in search_data.results {
            if obj.object != "page" {
                continue;
            }

            let edited_dt: Option<DateTime<Utc>> = obj
                .last_edited_time
                .as_deref()
                .and_then(|t| DateTime::parse_from_rfc3339(t).ok())
                .map(|dt| dt.with_timezone(&Utc));

            if let Some(dt) = edited_dt {
                if let Some(watermark) = watermark_dt {
                    if dt <= watermark {
                        skipped += 1;
                        continue;
                    }
                }

                if latest_edited.is_none() {
                    latest_edited = Some(dt.to_rfc3339());
                }
            }

            // Fetch page blocks
            let blocks_url = format!("https://api.notion.com/v1/blocks/{}/children?page_size=100", obj.id);
            let blocks_resp = match self
                .client
                .get(&blocks_url)
                .header("Authorization", format!("Bearer {}", key))
                .header("Notion-Version", "2022-06-28")
                .send()
            {
                Ok(r) if r.status().is_success() => r,
                _ => continue,
            };

            let block_data: NotionBlockChildrenResponse = match blocks_resp.json() {
                Ok(b) => b,
                Err(_) => continue,
            };

            let markdown_content = Self::flatten_blocks(&block_data.results);
            let title = Self::extract_page_title(&obj.properties);

            // Scrub PII on-device
            let scrubbed = PiiScrubber::scrub(&markdown_content);

            let mut metadata = HashMap::new();
            metadata.insert("notion_page_id".to_string(), obj.id.clone());
            metadata.insert("pii_scrubbed".to_string(), scrubbed.events.len().to_string());

            let timestamp = edited_dt.unwrap_or_else(Utc::now);

            records.push(ConnectorRecord {
                id: format!("notion_{}", obj.id),
                source: "Notion".to_string(),
                title,
                content: scrubbed.text,
                sender: None,
                timestamp,
                metadata,
            });
        }

        let new_watermark = latest_edited.or_else(|| state.watermark.clone());
        let records_added = records.len();

        Ok(SyncResult {
            records,
            new_watermark,
            records_added,
            records_skipped: skipped,
        })
    }
}
