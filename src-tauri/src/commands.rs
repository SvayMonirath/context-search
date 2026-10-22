use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use tauri::State;
use vault_connectors::{
    EmailConnector, MarkdownConnector, TelegramConnector,
    ObsidianConnector, GmailConnector, NotionConnector,
    traits::{Connector, ConnectorRecord, ConnectorState}
};
use vault_index::{
    storage::EncryptedVaultStorage,
    synthesis::{synthesize_factual_answer, FactSynthesis},
    IndexedDocument, SearchResult,
};
use walkdir::WalkDir;
use crate::AppState;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct VaultStats {
    pub total_messages: usize,
    pub storage_kb: usize,
    pub is_encrypted: bool,
    pub local_only: bool,
    pub sources_count: usize,
}

pub fn search_vault_impl(
    query: &str,
    filter: Option<&str>,
    state: &AppState,
) -> Result<Vec<SearchResult>, String> {
    if !state.is_unlocked() {
        return Err("Vault is locked. Enter Master Passphrase to continue.".to_string());
    }
    let index = state.index.lock().map_err(|e| e.to_string())?;
    let results = index.search(query, None, filter, 15);
    Ok(results)
}

pub fn synthesize_memory_impl(
    query: &str,
    filter: Option<&str>,
    state: &AppState,
) -> Result<FactSynthesis, String> {
    if !state.is_unlocked() {
        return Err("Vault is locked. Enter Master Passphrase to continue.".to_string());
    }
    let index = state.index.lock().map_err(|e| e.to_string())?;
    let results = index.search(query, None, filter, 5);
    let synthesis = synthesize_factual_answer(query, &results);
    Ok(synthesis)
}

pub fn get_vault_stats_impl(state: &AppState) -> Result<VaultStats, String> {
    if !state.is_unlocked() {
        return Ok(VaultStats {
            total_messages: 0,
            storage_kb: 0,
            is_encrypted: true,
            local_only: true,
            sources_count: 0,
        });
    }
    let index = state.index.lock().map_err(|e| e.to_string())?;

    let storage_bytes = fs::metadata(&state.vault_path)
        .map(|m| m.len() as usize)
        .unwrap_or(0);
    let storage_kb = storage_bytes / 1024;

    let sources = index.sources();
    let sources_count = sources.len();

    Ok(VaultStats {
        total_messages: index.len(),
        storage_kb,
        is_encrypted: true,
        local_only: true,
        sources_count,
    })
}

pub fn import_markdown_folder_impl(
    folder_path: &str,
    state: &AppState,
) -> Result<usize, String> {
    let path = Path::new(folder_path);
    if !path.exists() || !path.is_dir() {
        return Err(format!("Directory does not exist: {}", folder_path));
    }

    let mut parsed_docs = Vec::new();

    for entry in WalkDir::new(path).into_iter().filter_map(|e| e.ok()) {
        let file_path = entry.path();
        let ext = file_path.extension().and_then(|s| s.to_str()).unwrap_or("").to_lowercase();
        if file_path.is_file() && matches!(ext.as_str(), "md" | "markdown" | "txt" | "org" | "eml") {
            if let Ok(content) = fs::read_to_string(file_path) {
                let parsed = if ext == "eml" {
                    EmailConnector::parse_raw_email(
                        &file_path.file_name().unwrap_or_default().to_string_lossy(),
                        &content,
                    )
                } else if let Ok(parsed) = MarkdownConnector::parse_file(file_path, &content) {
                    parsed
                } else {
                    continue;
                };
                parsed_docs.push(parsed);
            }
        }
    }

    let mut index = state.index.lock().map_err(|e| e.to_string())?;
    let key = state.get_key()?;
    let mut audit = state.pii_audit_log.lock().map_err(|e| e.to_string())?;

    let count = parsed_docs.len();

    let mut newly_persisted = 0;

    for doc in parsed_docs {
        // Deduplication guard: skip append if document exists with identical content
        if let Some(existing) = index.get_document(&doc.id) {
            if existing.content == doc.content && existing.title == doc.title {
                continue;
            }
        }

        if doc.pii_events_count > 0 {
            audit.push(format!("Scrubbed {} PII entities from {}", doc.pii_events_count, doc.title));
        }

        let indexed_doc = IndexedDocument {
            id: doc.id,
            source: doc.source,
            title: doc.title,
            content: doc.content,
            vector: vec![],
            timestamp: doc.timestamp,
        };

        EncryptedVaultStorage::append_document(&state.vault_path, &key, &indexed_doc)
            .map_err(|e| format!("Failed to persist encrypted document: {}", e))?;

        index.insert(indexed_doc).map_err(|e| e.to_string())?;
        newly_persisted += 1;
    }

    // Persist updated PII audit events to encrypted disk storage
    if newly_persisted > 0 {
        let _ = crate::save_audit_log(&state.audit_path, &key, &audit);
    }

    Ok(count)
}

pub fn import_telegram_archive_impl(
    json_content: &str,
    state: &AppState,
) -> Result<usize, String> {
    let docs = TelegramConnector::parse_export(json_content).map_err(|e| e.to_string())?;
    let mut index = state.index.lock().map_err(|e| e.to_string())?;
    let key = state.get_key()?;
    let mut audit = state.pii_audit_log.lock().map_err(|e| e.to_string())?;

    let count = docs.len();
    let mut newly_persisted = 0;

    for doc in docs {
        // Deduplication guard
        if let Some(existing) = index.get_document(&doc.id) {
            if existing.content == doc.content && existing.title == doc.title {
                continue;
            }
        }

        if doc.pii_events_count > 0 {
            audit.push(format!("Scrubbed {} PII entities from {}", doc.pii_events_count, doc.title));
        }

        let indexed_doc = IndexedDocument {
            id: doc.id,
            source: doc.source,
            title: doc.title,
            content: doc.content,
            vector: vec![],
            timestamp: doc.timestamp,
        };

        EncryptedVaultStorage::append_document(&state.vault_path, &key, &indexed_doc)
            .map_err(|e| format!("Failed to persist encrypted document: {}", e))?;

        index.insert(indexed_doc).map_err(|e| e.to_string())?;
        newly_persisted += 1;
    }

    // Persist updated PII audit events to encrypted disk storage
    if newly_persisted > 0 {
        let _ = crate::save_audit_log(&state.audit_path, &key, &audit);
    }

    Ok(count)
}

pub fn import_telegram_file_impl(
    file_path: &str,
    state: &AppState,
) -> Result<usize, String> {
    let path = Path::new(file_path);
    if !path.exists() || !path.is_file() {
        return Err(format!("File does not exist: {}", file_path));
    }
    let content = fs::read_to_string(path)
        .map_err(|e| format!("Failed to read Telegram export file: {}", e))?;
    import_telegram_archive_impl(&content, state)
}

pub fn import_raw_email_impl(
    raw_email: &str,
    state: &AppState,
) -> Result<usize, String> {
    if raw_email.trim().is_empty() {
        return Err("Email content is empty".into());
    }

    use std::time::{SystemTime, UNIX_EPOCH};
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos();
    let doc = EmailConnector::parse_raw_email(&format!("{:x}", nanos), raw_email);

    let mut index = state.index.lock().map_err(|e| e.to_string())?;
    let key = state.get_key()?;
    let mut audit = state.pii_audit_log.lock().map_err(|e| e.to_string())?;

    // Deduplication check: if email with identical title and content exists, skip
    if index.all_documents().iter().any(|d| d.title == doc.title && d.content == doc.content) {
        return Ok(0);
    }

    if doc.pii_events_count > 0 {
        audit.push(format!("Scrubbed {} PII entities from {}", doc.pii_events_count, doc.title));
    }

    let indexed_doc = IndexedDocument {
        id: doc.id,
        source: doc.source,
        title: doc.title,
        content: doc.content,
        vector: vec![],
        timestamp: doc.timestamp,
    };

    EncryptedVaultStorage::append_document(&state.vault_path, &key, &indexed_doc)
        .map_err(|e| format!("Failed to persist encrypted email: {}", e))?;

    index.insert(indexed_doc).map_err(|e| e.to_string())?;

    // Persist updated PII audit events to encrypted disk storage
    let _ = crate::save_audit_log(&state.audit_path, &key, &audit);

    Ok(1)
}

pub fn ingest_connector_records(
    records: Vec<ConnectorRecord>,
    state: &AppState,
) -> Result<usize, String> {
    if records.is_empty() {
        return Ok(0);
    }

    let mut index = state.index.lock().map_err(|e| e.to_string())?;
    let key = state.get_key()?;
    let mut audit = state.pii_audit_log.lock().map_err(|e| e.to_string())?;

    let existing_docs = index.all_documents();
    let mut new_docs = Vec::new();

    for rec in records {
        // Skip duplicate records by ID or identical content
        if existing_docs.iter().any(|d| d.id == rec.id || (d.title == rec.title && d.content == rec.content)) {
            continue;
        }

        if let Some(pii_count) = rec.metadata.get("pii_scrubbed") {
            if let Ok(count) = pii_count.parse::<usize>() {
                if count > 0 {
                    audit.push(format!("Scrubbed {} PII entities from {} ({})", count, rec.title, rec.source));
                }
            }
        }

        new_docs.push(IndexedDocument {
            id: rec.id,
            source: rec.source,
            title: rec.title,
            content: rec.content,
            vector: vec![],
            timestamp: rec.timestamp,
        });
    }

    let added_count = new_docs.len();
    if added_count > 0 {
        for doc in &new_docs {
            EncryptedVaultStorage::append_document(&state.vault_path, &key, doc)
                .map_err(|e| format!("Failed to persist encrypted records: {}", e))?;
        }

        for doc in new_docs {
            index.insert(doc).map_err(|e| e.to_string())?;
        }

        let _ = crate::save_audit_log(&state.audit_path, &key, &audit);
    }

    Ok(added_count)
}

pub fn sync_obsidian_impl(folder_path: &str, state: &AppState) -> Result<usize, String> {
    let mut connector = ObsidianConnector::new(folder_path);
    let connector_state = ConnectorState::default();
    let sync_res = connector.sync(&connector_state).map_err(|e| e.to_string())?;
    ingest_connector_records(sync_res.records, state)
}

pub fn sync_gmail_impl(access_token: &str, state: &AppState) -> Result<usize, String> {
    let mut connector = GmailConnector::new(Some(access_token.to_string()));
    let connector_state = ConnectorState::default();
    let sync_res = connector.sync(&connector_state).map_err(|e| e.to_string())?;
    ingest_connector_records(sync_res.records, state)
}

pub fn sync_notion_impl(api_key: &str, state: &AppState) -> Result<usize, String> {
    let mut connector = NotionConnector::new(Some(api_key.to_string()));
    let connector_state = ConnectorState::default();
    let sync_res = connector.sync(&connector_state).map_err(|e| e.to_string())?;
    ingest_connector_records(sync_res.records, state)
}

pub fn sync_telegram_impl(export_path: &str, state: &AppState) -> Result<usize, String> {
    let mut connector = TelegramConnector::new(export_path);
    let connector_state = ConnectorState::default();
    let sync_res = connector.sync(&connector_state).map_err(|e| e.to_string())?;
    ingest_connector_records(sync_res.records, state)
}

pub fn sync_all_configured_connectors_internal(state: &AppState) -> Result<std::collections::HashMap<String, usize>, String> {
    let cfg = {
        let guard = state.connectors_config.lock().map_err(|e| e.to_string())?;
        guard.clone()
    };

    let mut results = std::collections::HashMap::new();

    if let Some(obs_path) = &cfg.obsidian_path {
        let trimmed = obs_path.trim();
        if !trimmed.is_empty() && Path::new(trimmed).exists() {
            match sync_obsidian_impl(trimmed, state) {
                Ok(count) => { results.insert("Obsidian".to_string(), count); }
                Err(e) => { eprintln!("[Background Sync] Obsidian sync error: {}", e); }
            }
        }
    }

    if let Some(tg_path) = &cfg.telegram_path {
        let trimmed = tg_path.trim();
        if !trimmed.is_empty() && Path::new(trimmed).exists() {
            match sync_telegram_impl(trimmed, state) {
                Ok(count) => { results.insert("Telegram".to_string(), count); }
                Err(e) => { eprintln!("[Background Sync] Telegram sync error: {}", e); }
            }
        }
    }

    if let Some(gmail_tok) = &cfg.gmail_token {
        let trimmed = gmail_tok.trim();
        if !trimmed.is_empty() {
            match sync_gmail_impl(trimmed, state) {
                Ok(count) => { results.insert("Gmail".to_string(), count); }
                Err(e) => { eprintln!("[Background Sync] Gmail sync error: {}", e); }
            }
        }
    }

    if let Some(notion_key) = &cfg.notion_api_key {
        let trimmed = notion_key.trim();
        if !trimmed.is_empty() {
            match sync_notion_impl(trimmed, state) {
                Ok(count) => { results.insert("Notion".to_string(), count); }
                Err(e) => { eprintln!("[Background Sync] Notion sync error: {}", e); }
            }
        }
    }

    Ok(results)
}

// Tauri IPC Command Wrappers
#[tauri::command]
pub fn search_vault(
    query: String,
    filter: Option<String>,
    state: State<'_, AppState>,
) -> Result<Vec<SearchResult>, String> {
    search_vault_impl(&query, filter.as_deref(), &state)
}

#[tauri::command]
pub fn synthesize_memory(
    query: String,
    filter: Option<String>,
    state: State<'_, AppState>,
) -> Result<FactSynthesis, String> {
    synthesize_memory_impl(&query, filter.as_deref(), &state)
}

#[tauri::command]
pub fn get_vault_stats(state: State<'_, AppState>) -> Result<VaultStats, String> {
    get_vault_stats_impl(&state)
}

#[tauri::command]
pub fn import_markdown_folder(
    folder_path: String,
    state: State<'_, AppState>,
) -> Result<usize, String> {
    import_markdown_folder_impl(&folder_path, &state)
}

#[tauri::command]
pub fn import_telegram_archive(
    json_content: String,
    state: State<'_, AppState>,
) -> Result<usize, String> {
    import_telegram_archive_impl(&json_content, &state)
}

#[tauri::command]
pub fn import_telegram_file(
    file_path: String,
    state: State<'_, AppState>,
) -> Result<usize, String> {
    import_telegram_file_impl(&file_path, &state)
}

#[tauri::command]
pub fn import_raw_email(
    raw_email: String,
    state: State<'_, AppState>,
) -> Result<usize, String> {
    import_raw_email_impl(&raw_email, &state)
}

#[tauri::command]
pub fn get_pii_audit_log(state: State<'_, AppState>) -> Result<Vec<String>, String> {
    let audit = state.pii_audit_log.lock().map_err(|e| e.to_string())?;
    Ok(audit.clone())
}

#[tauri::command]
pub fn sync_obsidian(
    folder_path: String,
    state: State<'_, AppState>,
) -> Result<usize, String> {
    sync_obsidian_impl(&folder_path, &state)
}

#[tauri::command]
pub fn sync_gmail(
    access_token: String,
    state: State<'_, AppState>,
) -> Result<usize, String> {
    sync_gmail_impl(&access_token, &state)
}

#[tauri::command]
pub fn sync_notion(
    api_key: String,
    state: State<'_, AppState>,
) -> Result<usize, String> {
    sync_notion_impl(&api_key, &state)
}

#[tauri::command]
pub fn sync_telegram(
    export_path: String,
    state: State<'_, AppState>,
) -> Result<usize, String> {
    sync_telegram_impl(&export_path, &state)
}

#[tauri::command]
pub fn get_connectors_config(state: State<'_, AppState>) -> Result<crate::ConnectorsConfig, String> {
    let guard = state.connectors_config.lock().map_err(|e| e.to_string())?;
    Ok(guard.clone())
}

#[tauri::command]
pub fn save_connectors_config(
    config: crate::ConnectorsConfig,
    state: State<'_, AppState>,
) -> Result<bool, String> {
    let key = state.get_key()?;
    crate::save_connectors_config(&state.config_path, &key, &config)
        .map_err(|e| e.to_string())?;
    let mut guard = state.connectors_config.lock().map_err(|e| e.to_string())?;
    *guard = config;
    Ok(true)
}

pub fn ingest_single_obsidian_file_impl(file_path: &Path, state: &AppState) -> Result<bool, String> {
    if !file_path.is_file() {
        return Ok(false);
    }
    let ext = file_path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();
    if !matches!(ext.as_str(), "md" | "markdown" | "txt" | "org") {
        return Ok(false);
    }
    let record = ObsidianConnector::parse_file(file_path).map_err(|e| e.to_string())?;
    let added = ingest_connector_records(vec![record], state)?;
    Ok(added > 0)
}

#[tauri::command]
pub fn get_vault_lock_state(state: State<'_, AppState>) -> Result<crate::VaultLockState, String> {
    Ok(crate::get_vault_lock_state_impl(&state))
}

#[tauri::command]
pub fn setup_master_passphrase(
    passphrase: String,
    state: State<'_, AppState>,
) -> Result<bool, String> {
    crate::setup_master_passphrase_impl(&passphrase, &state)
}

#[tauri::command]
pub fn unlock_vault(
    passphrase: String,
    state: State<'_, AppState>,
) -> Result<bool, String> {
    crate::unlock_vault_impl(&passphrase, &state)
}

#[tauri::command]
pub fn lock_vault(state: State<'_, AppState>) -> Result<bool, String> {
    crate::lock_vault_impl(&state)
}

#[tauri::command]
pub fn sync_all_connectors(
    state: State<'_, AppState>,
) -> Result<std::collections::HashMap<String, usize>, String> {
    sync_all_configured_connectors_internal(&state)
}
