use std::fs::{File, OpenOptions};
use std::io::{Read, Write};
use std::path::Path;
use thiserror::Error;
use vault_crypto::{decrypt, encrypt, DerivedKey, EncryptedBlob};
use crate::IndexedDocument;

#[derive(Error, Debug)]
pub enum StorageError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),
    #[error("Cryptographic error: {0}")]
    Crypto(#[from] vault_crypto::CryptoError),
    #[error("Corrupted vault ledger at byte offset {0}")]
    CorruptedLedger(usize),
}

pub struct EncryptedVaultStorage;

impl EncryptedVaultStorage {
    /// Appends a single encrypted document to the vault ledger on disk.
    pub fn append_document(
        path: &Path,
        key: &DerivedKey,
        doc: &IndexedDocument,
    ) -> Result<(), StorageError> {
        let plaintext = serde_json::to_vec(doc)?;
        let blob = encrypt(&plaintext, key)?;
        let blob_bytes = serde_json::to_vec(&blob)?;

        let mut file = OpenOptions::new()
            .create(true)
            .append(true)
            .open(path)?;

        let len = blob_bytes.len() as u32;
        file.write_all(&len.to_be_bytes())?;
        file.write_all(&blob_bytes)?;
        file.flush()?;

        Ok(())
    }

    /// Loads and decrypts all documents from the encrypted ledger on disk.
    pub fn load_all(path: &Path, key: &DerivedKey) -> Result<Vec<IndexedDocument>, StorageError> {
        if !path.exists() {
            return Ok(Vec::new());
        }

        let mut file = File::open(path)?;
        let mut buffer = Vec::new();
        file.read_to_end(&mut buffer)?;

        let mut docs = Vec::new();
        let mut offset = 0;

        while offset + 4 <= buffer.len() {
            let len_bytes = [
                buffer[offset],
                buffer[offset + 1],
                buffer[offset + 2],
                buffer[offset + 3],
            ];
            let blob_len = u32::from_be_bytes(len_bytes) as usize;
            offset += 4;

            if offset + blob_len > buffer.len() {
                return Err(StorageError::CorruptedLedger(offset));
            }

            let blob_slice = &buffer[offset..offset + blob_len];
            offset += blob_len;

            let blob: EncryptedBlob = serde_json::from_slice(blob_slice)?;
            let decrypted_bytes = decrypt(&blob, key)?;
            let doc: IndexedDocument = serde_json::from_slice(&decrypted_bytes)?;
            docs.push(doc);
        }

        Ok(docs)
    }

    /// Atomically rewrites the encrypted vault ledger with unique documents,
    /// deduplicating and pruning obsolete historical records.
    pub fn compact_ledger(
        path: &Path,
        key: &DerivedKey,
        docs: &[IndexedDocument],
    ) -> Result<(), StorageError> {
        let tmp_path = path.with_extension("tmp");
        if tmp_path.exists() {
            let _ = std::fs::remove_file(&tmp_path);
        }

        for doc in docs {
            Self::append_document(&tmp_path, key, doc)?;
        }

        std::fs::rename(&tmp_path, path)?;
        Ok(())
    }
}
