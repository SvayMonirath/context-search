use chrono::Utc;
use std::fs;
use vault_crypto::{derive_key, generate_salt};
use vault_index::{storage::EncryptedVaultStorage, IndexedDocument};

#[test]
fn test_encrypted_storage_roundtrip_and_security() {
    let temp_dir = std::env::temp_dir().join(format!("vault_test_{}", std::process::id()));
    fs::create_dir_all(&temp_dir).unwrap();
    let vault_file = temp_dir.join("test_vault.enc");

    let salt = generate_salt();
    let key = derive_key("correct-master-passphrase-2026", &salt).unwrap();
    let wrong_key = derive_key("attacker-wrong-passphrase", &salt).unwrap();

    let doc = IndexedDocument {
        id: "doc-secret-99".into(),
        source: "Obsidian".into(),
        title: "Confidential Strategy Note".into(),
        content: "Top secret budget numbers: $500,000 allocation for AI memory engine.".into(),
        vector: vec![0.1, 0.2, 0.3, 0.4],
        timestamp: Utc::now(),
    };

    // 1. Append document to encrypted vault
    EncryptedVaultStorage::append_document(&vault_file, &key, &doc).unwrap();

    // 2. Verify file on disk is NOT plaintext
    let raw_bytes = fs::read(&vault_file).unwrap();
    let raw_str = String::from_utf8_lossy(&raw_bytes);
    assert!(!raw_str.contains("Top secret budget numbers"), "Raw disk file must be encrypted!");
    assert!(!raw_str.contains("Confidential Strategy Note"), "Raw disk file must be encrypted!");

    // 3. Load with correct key
    let loaded = EncryptedVaultStorage::load_all(&vault_file, &key).unwrap();
    assert_eq!(loaded.len(), 1);
    assert_eq!(loaded[0].id, "doc-secret-99");
    assert_eq!(loaded[0].title, "Confidential Strategy Note");
    assert_eq!(loaded[0].content, doc.content);

    // 4. Load with wrong key must fail
    let wrong_attempt = EncryptedVaultStorage::load_all(&vault_file, &wrong_key);
    assert!(wrong_attempt.is_err(), "Decryption with wrong key must fail!");

    // Clean up
    let _ = fs::remove_dir_all(&temp_dir);
}
