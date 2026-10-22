pub mod commands;

use std::path::{Path, PathBuf};
use std::sync::Mutex;
use vault_crypto::{derive_key, generate_salt, DerivedKey};
use vault_index::{storage::EncryptedVaultStorage, HybridIndex};

pub const VAULT_VERIFIER_TOKEN: &[u8] = b"CONTEXT_VAULT_AUTHENTICATED_MASTER_KEY_V1";

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug, PartialEq)]
pub enum VaultLockStatus {
    Uninitialized,
    Locked,
    Unlocked,
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
pub struct VaultLockState {
    pub status: VaultLockStatus,
    pub is_initialized: bool,
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug, PartialEq)]
pub struct ConnectorsConfig {
    pub obsidian_path: Option<String>,
    pub telegram_path: Option<String>,
    pub gmail_token: Option<String>,
    pub notion_api_key: Option<String>,
    pub auto_sync_interval_secs: u64,
}

impl Default for ConnectorsConfig {
    fn default() -> Self {
        Self {
            obsidian_path: None,
            telegram_path: None,
            gmail_token: None,
            notion_api_key: None,
            auto_sync_interval_secs: 60,
        }
    }
}

pub struct AppState {
    pub index: Mutex<HybridIndex>,
    pub key: Mutex<Option<DerivedKey>>,
    pub pii_audit_log: Mutex<Vec<String>>,
    pub connectors_config: Mutex<ConnectorsConfig>,
    pub vault_dir: PathBuf,
    pub vault_path: PathBuf,
    pub audit_path: PathBuf,
    pub config_path: PathBuf,
    pub salt_path: PathBuf,
    pub verifier_path: PathBuf,
}

impl AppState {
    pub fn get_key(&self) -> Result<DerivedKey, String> {
        let guard = self.key.lock().map_err(|e| e.to_string())?;
        (*guard)
            .clone()
            .ok_or_else(|| "Vault is locked. Enter Master Passphrase to continue.".to_string())
    }

    pub fn is_unlocked(&self) -> bool {
        if let Ok(guard) = self.key.lock() {
            guard.is_some()
        } else {
            false
        }
    }

    #[cfg(test)]
    pub fn for_test_unlocked(
        index: HybridIndex,
        key: DerivedKey,
        temp_dir: &std::path::Path,
    ) -> Self {
        Self {
            index: Mutex::new(index),
            key: Mutex::new(Some(key)),
            pii_audit_log: Mutex::new(Vec::new()),
            connectors_config: Mutex::new(ConnectorsConfig::default()),
            vault_dir: temp_dir.to_path_buf(),
            vault_path: temp_dir.join("vault.enc"),
            audit_path: temp_dir.join("audit.enc"),
            config_path: temp_dir.join("connectors.enc"),
            salt_path: temp_dir.join("vault.salt"),
            verifier_path: temp_dir.join("vault.verifier"),
        }
    }
}

pub fn get_vault_dir() -> PathBuf {
    if let Ok(dir) = std::env::var("CONTEXT_VAULT_DIR") {
        let p = PathBuf::from(dir);
        let _ = std::fs::create_dir_all(&p);
        p
    } else if let Some(home) = dirs::home_dir() {
        let dir = home.join(".context-vault");
        let _ = std::fs::create_dir_all(&dir);
        dir
    } else {
        let p = PathBuf::from(".");
        let _ = std::fs::create_dir_all(&p);
        p
    }
}

pub fn get_vault_path() -> PathBuf {
    get_vault_dir().join("vault.enc")
}

pub fn write_secure_file(path: &std::path::Path, data: &[u8]) -> std::io::Result<()> {
    use std::io::Write;
    let mut options = std::fs::OpenOptions::new();
    options.create(true).write(true).truncate(true);
    #[cfg(unix)]
    {
        use std::os::unix::fs::OpenOptionsExt;
        options.mode(0o600);
    }
    let mut file = options.open(path)?;
    file.write_all(data)?;
    file.flush()
}

pub fn create_vault_verifier(verifier_path: &std::path::Path, key: &DerivedKey) -> std::io::Result<()> {
    let encrypted = vault_crypto::encrypt(VAULT_VERIFIER_TOKEN, key)
        .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e.to_string()))?;
    let blob_bytes = serde_json::to_vec(&encrypted)
        .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e.to_string()))?;
    write_secure_file(verifier_path, &blob_bytes)
}

pub fn verify_passphrase(verifier_path: &std::path::Path, key: &DerivedKey) -> bool {
    if !verifier_path.exists() {
        return false;
    }
    if let Ok(bytes) = std::fs::read(verifier_path) {
        if let Ok(blob) = serde_json::from_slice::<vault_crypto::EncryptedBlob>(&bytes) {
            if let Ok(decrypted) = vault_crypto::decrypt(&blob, key) {
                return decrypted == VAULT_VERIFIER_TOKEN;
            }
        }
    }
    false
}

pub fn get_vault_lock_state_impl(state: &AppState) -> VaultLockState {
    let has_salt = state.salt_path.exists();
    let has_verifier = state.verifier_path.exists();
    let is_initialized = has_salt && has_verifier;

    let status = if !is_initialized {
        VaultLockStatus::Uninitialized
    } else if state.is_unlocked() {
        VaultLockStatus::Unlocked
    } else {
        VaultLockStatus::Locked
    };

    VaultLockState {
        status,
        is_initialized,
    }
}

pub fn setup_master_passphrase_impl(passphrase: &str, state: &AppState) -> Result<bool, String> {
    let trimmed = passphrase.trim();
    if trimmed.len() < 8 {
        return Err("Master Passphrase must be at least 8 characters long.".to_string());
    }

    let salt = generate_salt();
    write_secure_file(&state.salt_path, &salt)
        .map_err(|e| format!("Failed to write vault salt: {}", e))?;

    let key = derive_key(trimmed, &salt)
        .map_err(|e| format!("Key derivation error: {}", e))?;

    create_vault_verifier(&state.verifier_path, &key)
        .map_err(|e| format!("Failed to write vault verifier: {}", e))?;

    // Store derived key in memory
    {
        let mut key_guard = state.key.lock().map_err(|e| e.to_string())?;
        *key_guard = Some(key);
    }

    // Clean initial index
    {
        let mut index_guard = state.index.lock().map_err(|e| e.to_string())?;
        *index_guard = HybridIndex::new();
    }

    // Remove legacy plaintext passphrase if present
    let legacy_pass = state.vault_dir.join("vault.passphrase");
    if legacy_pass.exists() {
        let _ = std::fs::remove_file(legacy_pass);
    }

    Ok(true)
}

pub fn unlock_vault_impl(passphrase: &str, state: &AppState) -> Result<bool, String> {
    let trimmed = passphrase.trim();
    if trimmed.is_empty() {
        return Err("Please enter your Master Passphrase.".to_string());
    }

    if !state.salt_path.exists() || !state.verifier_path.exists() {
        return Err("Vault is not initialized. Please set up a Master Passphrase first.".to_string());
    }

    let salt_bytes = std::fs::read(&state.salt_path)
        .map_err(|e| format!("Failed to read vault salt: {}", e))?;
    if salt_bytes.len() != 16 {
        return Err("Corrupt vault salt file.".to_string());
    }
    let mut salt = [0u8; 16];
    salt.copy_from_slice(&salt_bytes);

    let key = derive_key(trimmed, &salt)
        .map_err(|e| format!("Key derivation error: {}", e))?;

    if !verify_passphrase(&state.verifier_path, &key) {
        return Err("Incorrect Master Passphrase. Access denied.".to_string());
    }

    // Store key in memory
    {
        let mut key_guard = state.key.lock().map_err(|e| e.to_string())?;
        *key_guard = Some(key.clone());
    }

    // Load encrypted documents from vault.enc
    if state.vault_path.exists() {
        match EncryptedVaultStorage::load_all(&state.vault_path, &key) {
            Ok(existing_docs) => {
                let mut index_guard = state.index.lock().map_err(|e| e.to_string())?;
                *index_guard = HybridIndex::new();
                for doc in existing_docs {
                    let _ = index_guard.insert(doc);
                }
            }
            Err(e) => {
                eprintln!("[Context Vault] Warning: Failed to decrypt existing vault: {}", e);
            }
        }
    }

    // Load encrypted audit log
    let loaded_audit = load_audit_log(&state.audit_path, &key);
    {
        let mut audit_guard = state.pii_audit_log.lock().map_err(|e| e.to_string())?;
        *audit_guard = loaded_audit;
    }

    // Load encrypted connector configs
    let loaded_cfg = load_connectors_config(&state.config_path, &key);
    {
        let mut cfg_guard = state.connectors_config.lock().map_err(|e| e.to_string())?;
        *cfg_guard = loaded_cfg;
    }

    Ok(true)
}

pub fn lock_vault_impl(state: &AppState) -> Result<bool, String> {
    {
        let mut key_guard = state.key.lock().map_err(|e| e.to_string())?;
        *key_guard = None;
    }
    {
        let mut index_guard = state.index.lock().map_err(|e| e.to_string())?;
        *index_guard = HybridIndex::new();
    }
    {
        let mut audit_guard = state.pii_audit_log.lock().map_err(|e| e.to_string())?;
        audit_guard.clear();
    }
    Ok(true)
}

pub fn load_audit_log(audit_path: &std::path::Path, key: &DerivedKey) -> Vec<String> {
    if !audit_path.exists() {
        return Vec::new();
    }
    if let Ok(bytes) = std::fs::read(audit_path) {
        if let Ok(blob) = serde_json::from_slice::<vault_crypto::EncryptedBlob>(&bytes) {
            if let Ok(decrypted) = vault_crypto::decrypt(&blob, key) {
                if let Ok(logs) = serde_json::from_slice::<Vec<String>>(&decrypted) {
                    return logs;
                }
            }
        }
    }
    Vec::new()
}

pub fn save_audit_log(audit_path: &std::path::Path, key: &DerivedKey, logs: &[String]) -> std::io::Result<()> {
    if let Ok(plaintext) = serde_json::to_vec(logs) {
        if let Ok(blob) = vault_crypto::encrypt(&plaintext, key) {
            if let Ok(blob_bytes) = serde_json::to_vec(&blob) {
                return write_secure_file(audit_path, &blob_bytes);
            }
        }
    }
    Err(std::io::Error::new(std::io::ErrorKind::Other, "Failed to serialize and encrypt audit log"))
}

pub fn load_connectors_config(config_path: &std::path::Path, key: &DerivedKey) -> ConnectorsConfig {
    if !config_path.exists() {
        return ConnectorsConfig::default();
    }
    if let Ok(bytes) = std::fs::read(config_path) {
        if let Ok(blob) = serde_json::from_slice::<vault_crypto::EncryptedBlob>(&bytes) {
            if let Ok(decrypted) = vault_crypto::decrypt(&blob, key) {
                if let Ok(cfg) = serde_json::from_slice::<ConnectorsConfig>(&decrypted) {
                    return cfg;
                }
            }
        }
    }
    ConnectorsConfig::default()
}

pub fn save_connectors_config(
    config_path: &std::path::Path,
    key: &DerivedKey,
    config: &ConnectorsConfig,
) -> std::io::Result<()> {
    if let Ok(plaintext) = serde_json::to_vec(config) {
        if let Ok(blob) = vault_crypto::encrypt(&plaintext, key) {
            if let Ok(blob_bytes) = serde_json::to_vec(&blob) {
                return write_secure_file(config_path, &blob_bytes);
            }
        }
    }
    Err(std::io::Error::new(
        std::io::ErrorKind::Other,
        "Failed to serialize and encrypt connectors config",
    ))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let vault_dir = get_vault_dir();
    let vault_path = vault_dir.join("vault.enc");
    let audit_path = vault_dir.join("audit.enc");
    let config_path = vault_dir.join("connectors.enc");
    let salt_path = vault_dir.join("vault.salt");
    let verifier_path = vault_dir.join("vault.verifier");

    // Remove legacy plaintext passphrase if present
    let legacy_pass = vault_dir.join("vault.passphrase");
    if legacy_pass.exists() {
        let _ = std::fs::remove_file(legacy_pass);
    }

    // App starts in LOCKED state; user sets up or enters password via UI
    let state = AppState {
        index: Mutex::new(HybridIndex::new()),
        key: Mutex::new(None),
        pii_audit_log: Mutex::new(Vec::new()),
        connectors_config: Mutex::new(ConnectorsConfig::default()),
        vault_dir,
        vault_path,
        audit_path,
        config_path,
        salt_path,
        verifier_path,
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .manage(state)
        .setup(|app| {
            use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};
            use tauri::{Emitter, Manager};

            // Register global hotkey to summon HUD overlay across macOS
            if let Ok(shortcut) = "CommandOrControl+Shift+Space".parse::<Shortcut>() {
                let _ = app.global_shortcut().on_shortcut(shortcut, |app, _shortcut, event| {
                    if event.state() == ShortcutState::Pressed {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                            let _ = window.emit("toggle-hud", ());
                        }
                    }
                });
            }

            // Worker 1: Continuous background connector sync (active only when unlocked)
            let app_handle_sync = app.handle().clone();
            std::thread::spawn(move || {
                loop {
                    std::thread::sleep(std::time::Duration::from_secs(60));
                    if let Some(state) = app_handle_sync.try_state::<AppState>() {
                        if state.is_unlocked() {
                            let _ = commands::sync_all_configured_connectors_internal(&state);
                        }
                    }
                }
            });

            // Worker 2: Obsidian real-time live filesystem watcher (active only when unlocked)
            let app_handle_watcher = app.handle().clone();
            std::thread::spawn(move || {
                let mut current_watched_path: Option<String> = None;
                let mut active_handle: Option<vault_connectors::ObsidianWatcherHandle> = None;

                loop {
                    if let Some(state) = app_handle_watcher.try_state::<AppState>() {
                        if state.is_unlocked() {
                            let maybe_path = {
                                if let Ok(guard) = state.connectors_config.lock() {
                                    guard.obsidian_path.clone()
                                } else {
                                    None
                                }
                            };

                            if let Some(obs_path) = maybe_path {
                                if current_watched_path.as_deref() != Some(&obs_path) && Path::new(&obs_path).is_dir() {
                                    match vault_connectors::start_obsidian_watcher(&obs_path) {
                                        Ok(handle) => {
                                            active_handle = Some(handle);
                                            current_watched_path = Some(obs_path);
                                        }
                                        Err(e) => {
                                            eprintln!("[Obsidian Watcher] Error starting watcher: {}", e);
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // Drain live file change events non-blocking
                    if let Some(handle) = &active_handle {
                        while let Ok(changed_file) = handle.event_receiver.try_recv() {
                            if let Some(state) = app_handle_watcher.try_state::<AppState>() {
                                if state.is_unlocked() {
                                    let _ = commands::ingest_single_obsidian_file_impl(&changed_file, &state);
                                }
                            }
                        }
                    }

                    std::thread::sleep(std::time::Duration::from_millis(500));
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_vault_lock_state,
            commands::setup_master_passphrase,
            commands::unlock_vault,
            commands::lock_vault,
            commands::search_vault,
            commands::synthesize_memory,
            commands::get_vault_stats,
            commands::import_markdown_folder,
            commands::import_telegram_archive,
            commands::import_telegram_file,
            commands::import_raw_email,
            commands::get_pii_audit_log,
            commands::sync_obsidian,
            commands::sync_gmail,
            commands::sync_notion,
            commands::sync_telegram,
            commands::get_connectors_config,
            commands::save_connectors_config,
            commands::sync_all_connectors,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use vault_connectors::{GmailConnector, MarkdownConnector};
    use vault_index::IndexedDocument;

    #[test]
    fn test_app_state_and_search_integration() {
        let temp_dir = std::env::temp_dir().join(format!("vault_int_{}", std::process::id()));
        fs::create_dir_all(&temp_dir).unwrap();
        let vault_file = temp_dir.join("vault.enc");

        let salt = generate_salt();
        let key = derive_key("vault-passphrase-seed", &salt).unwrap();
        let mut index = HybridIndex::new();

        let doc1 = GmailConnector::parse_email(
            "sow-final-101",
            "SOW Agreement Final - Redesign Budget",
            "Sarah Jenkins <sarah@studio.com>",
            "From: Sarah Jenkins <sarah@studio.com>\n\nHey,\n\nI reviewed the proposal document you sent over this morning. The $12,500 total sounds fair with 40/30/30 milestones ($5k upfront, $3,750 on interactive prototype, $3,750 on handover).",
            chrono::Utc::now() - chrono::Duration::days(14),
        );
        let idoc1 = IndexedDocument {
            id: doc1.id,
            source: doc1.source,
            title: doc1.title,
            content: doc1.content,
            vector: vec![],
            timestamp: doc1.timestamp,
        };
        EncryptedVaultStorage::append_document(&vault_file, &key, &idoc1).unwrap();
        index.insert(idoc1).unwrap();

        let doc2 = MarkdownConnector::parse_file(
            std::path::Path::new("Projects/Acme.md"),
            "# Project Acme Milestones\n\n- [x] Deposit of $5,000 paid via wire transfer on March 18.",
        ).unwrap();
        let idoc2 = IndexedDocument {
            id: doc2.id,
            source: doc2.source,
            title: doc2.title,
            content: doc2.content,
            vector: vec![],
            timestamp: chrono::Utc::now() - chrono::Duration::days(10),
        };
        EncryptedVaultStorage::append_document(&vault_file, &key, &idoc2).unwrap();
        index.insert(idoc2).unwrap();

        assert_eq!(index.len(), 2);

        // Search returns real match
        let results = index.search("redesign budget $12,500", None, None, 5);
        assert!(!results.is_empty());
        assert_eq!(results[0].title, "SOW Agreement Final - Redesign Budget");
        assert!(results[0].content.contains("$12,500"));

        // File is persisted and encrypted on disk
        let disk_docs = EncryptedVaultStorage::load_all(&vault_file, &key).unwrap();
        assert_eq!(disk_docs.len(), 2);

        // Real extractive synthesis test
        let synthesis = vault_index::synthesis::synthesize_factual_answer("redesign budget $12,500", &results);
        assert!(synthesis.quoted_excerpt.contains("$12,500"));
        assert!(synthesis.source_sender.contains("Sarah Jenkins"));

        // Filtered synthesis scoping test
        let state = AppState::for_test_unlocked(index, key, &temp_dir);

        // Synthesis with Gmail filter returns Gmail doc
        let synth_gmail = commands::synthesize_memory_impl("milestones budget", Some("Gmail"), &state).unwrap();
        assert_eq!(synth_gmail.source_title, "SOW Agreement Final - Redesign Budget");

        // Synthesis with Obsidian filter returns Obsidian doc
        let synth_obsidian = commands::synthesize_memory_impl("milestones budget", Some("Obsidian"), &state).unwrap();
        assert_eq!(synth_obsidian.source_title, "Project Acme Milestones");

        let _ = fs::remove_dir_all(&temp_dir);
    }

    #[test]
    fn test_markdown_folder_import_and_persistence() {
        let temp_dir = std::env::temp_dir().join(format!("vault_md_test_{}", std::process::id()));
        let notes_dir = temp_dir.join("notes");
        let vault_file = temp_dir.join("vault.enc");
        fs::create_dir_all(&notes_dir).unwrap();

        // Create 2 test markdown files
        fs::write(
            notes_dir.join("Meeting.md"),
            "# Architecture Review\n\nDiscussed migrating to encrypted SQLite storage.\nAlice phone: +1-555-019-2831.",
        ).unwrap();
        fs::write(
            notes_dir.join("Sprint.md"),
            "# Sprint 42 Plan\n\nDeliverable: PII redaction and offline memory synthesis.",
        ).unwrap();

        let salt = generate_salt();
        let key = derive_key("test-key", &salt).unwrap();
        let index = HybridIndex::new();

        let state = AppState::for_test_unlocked(index, key, &temp_dir);

        // Import folder
        let count = commands::import_markdown_folder_impl(
            notes_dir.to_str().unwrap(),
            &state,
        ).unwrap();

        assert_eq!(count, 2);

        // Verify disk file exists and size > 0
        let meta = fs::metadata(&vault_file).unwrap();
        assert!(meta.len() > 0, "Encrypted ledger must be written to disk!");

        // Verify PII audit log captured the phone number redaction
        let logs = state.pii_audit_log.lock().unwrap();
        assert_eq!(logs.len(), 1);
        assert!(logs[0].contains("Architecture Review"));

        // Verify search finds the newly imported document
        let idx = state.index.lock().unwrap();
        let search_results = idx.search("Sprint 42", None, None, 5);
        assert_eq!(search_results.len(), 1);
        assert_eq!(search_results[0].title, "Sprint 42 Plan");

        let _ = fs::remove_dir_all(&temp_dir);
    }

    #[test]
    fn test_process_restart_persistence_with_salt() {
        let temp_dir = std::env::temp_dir().join(format!("vault_restart_test_{}", std::process::id()));
        fs::create_dir_all(&temp_dir).unwrap();
        let vault_file = temp_dir.join("vault.enc");
        let salt_file = temp_dir.join("vault.salt");

        // --- SESSION 1: First boot ---
        let salt_1 = generate_salt();
        write_secure_file(&salt_file, &salt_1).unwrap();
        let key_1 = derive_key("master-passphrase-alpha", &salt_1).unwrap();

        let doc = IndexedDocument {
            id: "persisted-1".into(),
            source: "Obsidian".into(),
            title: "Crucial Architecture Decision".into(),
            content: "Must persist salt to disk for cross-restart decryption.".into(),
            vector: vec![],
            timestamp: chrono::Utc::now(),
        };

        EncryptedVaultStorage::append_document(&vault_file, &key_1, &doc).unwrap();
        assert!(vault_file.exists());

        // --- DROP SESSION 1 STATE ---
        drop(key_1);
        let _ = salt_1;

        // --- SESSION 2: Second boot (App relaunch) ---
        let salt_bytes = fs::read(&salt_file).unwrap();
        let mut salt_2 = [0u8; 16];
        salt_2.copy_from_slice(&salt_bytes);
        let key_2 = derive_key("master-passphrase-alpha", &salt_2).unwrap();

        // Must successfully load and decrypt the document written in Session 1
        let loaded = EncryptedVaultStorage::load_all(&vault_file, &key_2).unwrap();
        assert_eq!(loaded.len(), 1);
        assert_eq!(loaded[0].id, "persisted-1");
        assert_eq!(loaded[0].title, "Crucial Architecture Decision");
        assert_eq!(loaded[0].content, "Must persist salt to disk for cross-restart decryption.");

        let _ = fs::remove_dir_all(&temp_dir);
    }

    #[test]
    fn test_raw_email_import_and_search() {
        let temp_dir = std::env::temp_dir().join(format!("vault_email_test_{}", std::process::id()));
        fs::create_dir_all(&temp_dir).unwrap();

        let salt = generate_salt();
        let key = derive_key("test-key-email", &salt).unwrap();
        let state = AppState::for_test_unlocked(HybridIndex::new(), key, &temp_dir);

        let raw_email = "From: Bob Miller <bob@co.com>\nSubject: Confidential Seed Round Terms\nDate: Tue, 21 Oct 2026 14:00:00 +0000\n\nWire $50,000 to routing 021000021. Contact +1-555-839-2910.";
        let count = commands::import_raw_email_impl(raw_email, &state).unwrap();
        assert_eq!(count, 1);

        // Verify PII was scrubbed
        let logs = state.pii_audit_log.lock().unwrap();
        assert!(!logs.is_empty());

        // Verify search
        let idx = state.index.lock().unwrap();
        let results = idx.search("Confidential Seed Round", None, None, 5);
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].title, "Confidential Seed Round Terms");
        assert_eq!(results[0].source, "Gmail");
        assert!(!results[0].content.contains("+1-555-839-2910"));
        assert!(results[0].content.contains("[REDACTED_PHONE]"));

        let _ = fs::remove_dir_all(&temp_dir);
    }

    #[test]
    fn test_pii_audit_log_restart_persistence() {
        let temp_dir = std::env::temp_dir().join(format!("vault_audit_test_{}", std::process::id()));
        fs::create_dir_all(&temp_dir).unwrap();
        let audit_file = temp_dir.join("audit.enc");

        let salt = generate_salt();
        let key = derive_key("audit-test-key", &salt).unwrap();
        let state = AppState::for_test_unlocked(HybridIndex::new(), key, &temp_dir);

        let raw_email = "From: Jane <jane@domain.com>\nSubject: Card\n\nPlease charge 4532 0150 0000 0007 now.";
        let _ = commands::import_raw_email_impl(raw_email, &state).unwrap();

        // Verify audit file exists and is encrypted on disk
        assert!(audit_file.exists());
        let meta = fs::metadata(&audit_file).unwrap();
        assert!(meta.len() > 0);

        // Verify loaded audit log in memory
        {
            let current_logs = state.pii_audit_log.lock().unwrap();
            assert_eq!(current_logs.len(), 1);
            assert!(current_logs[0].contains("Scrubbed 1 PII entities"));
        }

        // Simulate app restart: re-derive key from salt and reload audit log from disk
        let key_reboot = derive_key("audit-test-key", &salt).unwrap();
        let reloaded_logs = load_audit_log(&audit_file, &key_reboot);
        assert_eq!(reloaded_logs.len(), 1);
        assert!(reloaded_logs[0].contains("Scrubbed 1 PII entities"));

        let _ = fs::remove_dir_all(&temp_dir);
    }

    #[test]
    fn test_folder_import_deduplication_and_compaction() {
        let temp_dir = std::env::temp_dir().join(format!("vault_dedup_test_{}", std::process::id()));
        let notes_dir = temp_dir.join("notes");
        let vault_file = temp_dir.join("vault.enc");
        fs::create_dir_all(&notes_dir).unwrap();

        fs::write(notes_dir.join("Doc1.md"), "# Contract Review\n\nScope of work for Q4.").unwrap();
        fs::write(notes_dir.join("Doc2.md"), "# Architecture Note\n\nArgon2id key derivation.").unwrap();

        let salt = generate_salt();
        let key = derive_key("dedup-key", &salt).unwrap();
        let state = AppState::for_test_unlocked(HybridIndex::new(), key, &temp_dir);

        // First import
        let count_1 = commands::import_markdown_folder_impl(notes_dir.to_str().unwrap(), &state).unwrap();
        assert_eq!(count_1, 2);

        let size_1 = fs::metadata(&vault_file).unwrap().len();
        assert!(size_1 > 0);

        // Second import of identical folder (must be deduplicated!)
        let count_2 = commands::import_markdown_folder_impl(notes_dir.to_str().unwrap(), &state).unwrap();
        assert_eq!(count_2, 2);

        let size_2 = fs::metadata(&vault_file).unwrap().len();
        assert_eq!(size_1, size_2, "Ledger size must remain constant on re-importing identical files");

        // Test compaction
        let key_ref = state.get_key().unwrap();
        let docs = state.index.lock().unwrap().all_documents();
        EncryptedVaultStorage::compact_ledger(&vault_file, &key_ref, &docs).unwrap();
        let reloaded = EncryptedVaultStorage::load_all(&vault_file, &key_ref).unwrap();
        assert_eq!(reloaded.len(), 2);
        assert!(reloaded.iter().any(|d| d.id == "md_Doc1.md"));
        assert!(reloaded.iter().any(|d| d.id == "md_Doc2.md"));

        let _ = fs::remove_dir_all(&temp_dir);
    }

    #[test]
    fn test_telegram_file_import_and_deduplication() {
        let temp_dir = std::env::temp_dir().join(format!("vault_tg_test_{}", std::process::id()));
        fs::create_dir_all(&temp_dir).unwrap();
        let vault_file = temp_dir.join("vault.enc");
        let tg_json_file = temp_dir.join("result.json");

        let json_data = r#"{
            "name": "Alex Vance",
            "type": "personal_chat",
            "id": 88419,
            "messages": [
                {
                    "id": 501,
                    "type": "message",
                    "date": "2026-03-20T10:15:00Z",
                    "from": "Alex Vance",
                    "text": "Sent the $20,000 wire transfer. Call me at +1-555-019-9999 to confirm."
                }
            ]
        }"#;
        fs::write(&tg_json_file, json_data).unwrap();

        let salt = generate_salt();
        let key = derive_key("tg-test-key", &salt).unwrap();
        let state = AppState::for_test_unlocked(HybridIndex::new(), key, &temp_dir);

        // First import from file
        let count_1 = commands::import_telegram_file_impl(tg_json_file.to_str().unwrap(), &state).unwrap();
        assert_eq!(count_1, 1);

        let size_1 = fs::metadata(&vault_file).unwrap().len();

        // Second import of same file (deduplicated)
        let count_2 = commands::import_telegram_file_impl(tg_json_file.to_str().unwrap(), &state).unwrap();
        assert_eq!(count_2, 1);

        let size_2 = fs::metadata(&vault_file).unwrap().len();
        assert_eq!(size_1, size_2);

        // Verify search and PII scrubbing
        let idx = state.index.lock().unwrap();
        let results = idx.search("wire transfer", None, None, 5);
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].title, "Chat with Alex Vance");
        assert!(!results[0].content.contains("+1-555-019-9999"));
        assert!(results[0].content.contains("[REDACTED_PHONE]"));

        let _ = fs::remove_dir_all(&temp_dir);
    }

    #[test]
    fn test_sync_obsidian_and_telegram_connectors_end_to_end() {
        let temp_dir = std::env::temp_dir().join(format!("vault_conn_test_{}", std::process::id()));
        let notes_dir = temp_dir.join("obsidian_vault");
        fs::create_dir_all(&notes_dir).unwrap();

        // Create an Obsidian note with frontmatter and wikilinks
        fs::write(
            notes_dir.join("Security Architecture.md"),
            "---\ntitle: Sovereign Security Architecture\nauthor: Security Team\n---\n\n# Sovereign Security Architecture\n\nRefer to [[Key Derivation Engine|Argon2id]].\nCustomer phone: +1-555-019-8888.\n",
        ).unwrap();

        let salt = generate_salt();
        let key = derive_key("connector-e2e-key", &salt).unwrap();
        let state = AppState::for_test_unlocked(HybridIndex::new(), key, &temp_dir);

        // 1. Sync Obsidian folder
        let added = commands::sync_obsidian_impl(notes_dir.to_str().unwrap(), &state).unwrap();
        assert_eq!(added, 1);

        // 2. Search finds the note and verifies PII scrubbing
        let idx = state.index.lock().unwrap();
        let results = idx.search("Argon2id", None, None, 5);
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].title, "Sovereign Security Architecture");
        assert!(results[0].content.contains("[REDACTED_PHONE]"));
        assert!(!results[0].content.contains("+1-555-019-8888"));

        let _ = fs::remove_dir_all(&temp_dir);
    }

    #[test]
    fn test_connectors_config_persistence_and_auto_sync() {
        let temp_dir = std::env::temp_dir().join(format!("vault_auto_sync_{}", std::process::id()));
        let notes_dir = temp_dir.join("obsidian_vault");
        let config_file = temp_dir.join("connectors.enc");
        fs::create_dir_all(&notes_dir).unwrap();

        fs::write(
            notes_dir.join("Continuous Note.md"),
            "# Automated Background Ingestion\n\nContext Search automatically syncs external software without user intervention.",
        ).unwrap();

        let salt = generate_salt();
        let key = derive_key("auto-sync-key", &salt).unwrap();

        // 1. Save configuration to encrypted disk file
        let config = ConnectorsConfig {
            obsidian_path: Some(notes_dir.to_str().unwrap().to_string()),
            telegram_path: None,
            gmail_token: None,
            notion_api_key: None,
            auto_sync_interval_secs: 60,
        };
        save_connectors_config(&config_file, &key, &config).unwrap();
        assert!(config_file.exists());

        // 2. Load configuration from encrypted disk file
        let loaded_config = load_connectors_config(&config_file, &key);
        assert_eq!(loaded_config.obsidian_path, Some(notes_dir.to_str().unwrap().to_string()));
        assert_eq!(loaded_config.auto_sync_interval_secs, 60);

        // 3. Initialize AppState with loaded config
        let state = AppState::for_test_unlocked(HybridIndex::new(), key, &temp_dir);
        {
            let mut cfg_guard = state.connectors_config.lock().unwrap();
            *cfg_guard = loaded_config;
        }

        // 4. Run automated continuous sync across all configured connectors
        let results = commands::sync_all_configured_connectors_internal(&state).unwrap();
        assert_eq!(results.get("Obsidian"), Some(&1));

        // 5. Verify the document is searchable in HybridIndex
        let idx = state.index.lock().unwrap();
        let search_res = idx.search("Automated Background Ingestion", None, None, 5);
        assert_eq!(search_res.len(), 1);
        assert_eq!(search_res[0].title, "Automated Background Ingestion");
        assert_eq!(search_res[0].source, "Obsidian");

        let _ = fs::remove_dir_all(&temp_dir);
    }

    #[test]
    fn test_vault_lock_and_unlock_lifecycle() {
        let temp_dir = std::env::temp_dir().join(format!("vault_lock_test_{}", std::process::id()));
        fs::create_dir_all(&temp_dir).unwrap();

        let state = AppState {
            index: Mutex::new(HybridIndex::new()),
            key: Mutex::new(None),
            pii_audit_log: Mutex::new(Vec::new()),
            connectors_config: Mutex::new(ConnectorsConfig::default()),
            vault_dir: temp_dir.clone(),
            vault_path: temp_dir.join("vault.enc"),
            audit_path: temp_dir.join("audit.enc"),
            config_path: temp_dir.join("connectors.enc"),
            salt_path: temp_dir.join("vault.salt"),
            verifier_path: temp_dir.join("vault.verifier"),
        };

        // 1. Initial state is Uninitialized
        let lock_state_1 = get_vault_lock_state_impl(&state);
        assert_eq!(lock_state_1.status, VaultLockStatus::Uninitialized);
        assert!(!lock_state_1.is_initialized);

        // 2. Setup Master Passphrase
        let setup_res = setup_master_passphrase_impl("sovereign-memory-pass-2026", &state);
        assert!(setup_res.is_ok());
        assert!(state.salt_path.exists());
        assert!(state.verifier_path.exists());
        assert!(state.is_unlocked());

        // 3. Lock the vault
        let lock_res = lock_vault_impl(&state);
        assert!(lock_res.is_ok());
        assert!(!state.is_unlocked());
        let lock_state_2 = get_vault_lock_state_impl(&state);
        assert_eq!(lock_state_2.status, VaultLockStatus::Locked);

        // 4. Unlock with wrong passphrase fails
        let wrong_unlock = unlock_vault_impl("incorrect-passphrase", &state);
        assert!(wrong_unlock.is_err());
        assert!(!state.is_unlocked());

        // 5. Unlock with correct passphrase succeeds
        let correct_unlock = unlock_vault_impl("sovereign-memory-pass-2026", &state);
        assert!(correct_unlock.is_ok());
        assert!(state.is_unlocked());
        let lock_state_3 = get_vault_lock_state_impl(&state);
        assert_eq!(lock_state_3.status, VaultLockStatus::Unlocked);

        let _ = fs::remove_dir_all(&temp_dir);
    }

    #[test]
    fn test_clean_vault_zero_initial_records() {
        let temp_dir = std::env::temp_dir().join(format!("vault_zero_test_{}", std::process::id()));
        fs::create_dir_all(&temp_dir).unwrap();

        let state = AppState {
            index: Mutex::new(HybridIndex::new()),
            key: Mutex::new(None),
            pii_audit_log: Mutex::new(Vec::new()),
            connectors_config: Mutex::new(ConnectorsConfig::default()),
            vault_dir: temp_dir.clone(),
            vault_path: temp_dir.join("vault.enc"),
            audit_path: temp_dir.join("audit.enc"),
            config_path: temp_dir.join("connectors.enc"),
            salt_path: temp_dir.join("vault.salt"),
            verifier_path: temp_dir.join("vault.verifier"),
        };

        // Initialize vault
        setup_master_passphrase_impl("my-clean-passphrase", &state).unwrap();

        // Verify vault has 0 messages, 0 fake data
        let stats = commands::get_vault_stats_impl(&state).unwrap();
        assert_eq!(stats.total_messages, 0, "A fresh vault must start with exactly 0 messages!");

        let _ = fs::remove_dir_all(&temp_dir);
    }

    #[test]
    fn test_obsidian_live_watcher_single_file_ingestion() {
        let temp_dir = std::env::temp_dir().join(format!("vault_watch_test_{}", std::process::id()));
        let notes_dir = temp_dir.join("obsidian");
        fs::create_dir_all(&notes_dir).unwrap();

        let note_file = notes_dir.join("Live Note.md");
        fs::write(
            &note_file,
            "# Live Note\n\nInstant ingestion through fsevents file watcher.",
        ).unwrap();

        let salt = generate_salt();
        let key = derive_key("watch-key", &salt).unwrap();
        let state = AppState::for_test_unlocked(HybridIndex::new(), key, &temp_dir);

        let ingested = commands::ingest_single_obsidian_file_impl(&note_file, &state).unwrap();
        assert!(ingested, "Single Obsidian file must be ingested");

        let idx = state.index.lock().unwrap();
        assert_eq!(idx.len(), 1);
        let results = idx.search("Instant ingestion", None, None, 5);
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].title, "Live Note");

        let _ = fs::remove_dir_all(&temp_dir);
    }
}
