use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ConnectorError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Serialization error: {0}")]
    Json(#[from] serde_json::Error),
    #[error("HTTP request error: {0}")]
    Reqwest(#[from] reqwest::Error),
    #[error("HTTP error: {0}")]
    Http(String),
    #[error("Authentication failed: {0}")]
    Auth(String),
    #[error("Parsing error: {0}")]
    Parse(String),
    #[error("Rate limited: {0}")]
    RateLimit(String),
    #[error("Watch error: {0}")]
    Watch(String),
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct ConnectorRecord {
    pub id: String,
    pub source: String,
    pub title: String,
    pub content: String,
    pub sender: Option<String>,
    pub timestamp: DateTime<Utc>,
    pub metadata: HashMap<String, String>,
}

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct ConnectorState {
    pub connector_name: String,
    pub watermark: Option<String>,
    pub last_sync_time: Option<DateTime<Utc>>,
    pub total_synced_records: usize,
    pub is_active: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SyncResult {
    pub records: Vec<ConnectorRecord>,
    pub new_watermark: Option<String>,
    pub records_added: usize,
    pub records_skipped: usize,
}

/// Common trait implemented by all sovereign background connectors
pub trait Connector: Send + Sync {
    /// Human-readable name of the connector (e.g., "Obsidian", "Gmail", "Telegram", "Notion")
    fn name(&self) -> &'static str;

    /// Checks if credentials or configuration are valid
    fn validate_config(&self) -> Result<(), ConnectorError>;

    /// Executes an incremental sync using the provided state cursor/watermark
    fn sync(&mut self, state: &ConnectorState) -> Result<SyncResult, ConnectorError>;
}
