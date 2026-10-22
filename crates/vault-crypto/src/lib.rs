use aes_gcm::{
    aead::{Aead, KeyInit, OsRng},
    Aes256Gcm, Nonce,
};
use argon2::{
    Argon2, Algorithm, Version, Params,
};
use rand::RngCore;
use serde::{Deserialize, Serialize};
use thiserror::Error;
use zeroize::{Zeroize, ZeroizeOnDrop};

#[derive(Error, Debug)]
pub enum CryptoError {
    #[error("Key derivation failed: {0}")]
    KeyDerivationError(String),

    #[error("Encryption failed: {0}")]
    EncryptionError(String),

    #[error("Decryption failed (authentication tag mismatch or corrupted data)")]
    DecryptionError,

    #[error("Invalid salt length: expected at least 16 bytes")]
    InvalidSaltLength,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct EncryptedBlob {
    pub nonce: Vec<u8>,
    pub ciphertext: Vec<u8>,
}

#[derive(Zeroize, ZeroizeOnDrop, Clone)]
pub struct DerivedKey(pub [u8; 32]);

/// Derives a 256-bit cryptographic key from a master passphrase using Argon2id.
pub fn derive_key(passphrase: &str, salt: &[u8]) -> Result<DerivedKey, CryptoError> {
    if salt.len() < 16 {
        return Err(CryptoError::InvalidSaltLength);
    }

    let mut key_bytes = [0u8; 32];
    let params = Params::new(19456, 2, 1, Some(32))
        .map_err(|e| CryptoError::KeyDerivationError(e.to_string()))?;
    let argon2 = Argon2::new(Algorithm::Argon2id, Version::V0x13, params);

    argon2
        .hash_password_into(passphrase.as_bytes(), salt, &mut key_bytes)
        .map_err(|e| CryptoError::KeyDerivationError(e.to_string()))?;

    Ok(DerivedKey(key_bytes))
}

/// Generates a cryptographically secure random 16-byte salt.
pub fn generate_salt() -> [u8; 16] {
    let mut salt = [0u8; 16];
    OsRng.fill_bytes(&mut salt);
    salt
}

/// Encrypts plaintext bytes using AES-256-GCM authenticated encryption.
pub fn encrypt(plaintext: &[u8], key: &DerivedKey) -> Result<EncryptedBlob, CryptoError> {
    let cipher = Aes256Gcm::new_from_slice(&key.0)
        .map_err(|e| CryptoError::EncryptionError(e.to_string()))?;

    let mut nonce_bytes = [0u8; 12];
    OsRng.fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher
        .encrypt(nonce, plaintext)
        .map_err(|e| CryptoError::EncryptionError(e.to_string()))?;

    Ok(EncryptedBlob {
        nonce: nonce_bytes.to_vec(),
        ciphertext,
    })
}

/// Decrypts an EncryptedBlob using AES-256-GCM. Returns error if tampered.
pub fn decrypt(blob: &EncryptedBlob, key: &DerivedKey) -> Result<Vec<u8>, CryptoError> {
    if blob.nonce.len() != 12 {
        return Err(CryptoError::DecryptionError);
    }

    let cipher = Aes256Gcm::new_from_slice(&key.0)
        .map_err(|_| CryptoError::DecryptionError)?;

    let nonce = Nonce::from_slice(&blob.nonce);

    cipher
        .decrypt(nonce, blob.ciphertext.as_ref())
        .map_err(|_| CryptoError::DecryptionError)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_roundtrip_encryption_decryption() {
        let passphrase = "correct horse battery staple 2026!";
        let salt = generate_salt();
        let key = derive_key(passphrase, &salt).expect("Key derivation should succeed");

        let original = b"Secret personal email: Contract fee is $12,500 USD.";
        let blob = encrypt(original, &key).expect("Encryption should succeed");

        // Nonce must be 12 bytes
        assert_eq!(blob.nonce.len(), 12);
        // Ciphertext should not match original
        assert_ne!(&blob.ciphertext[..original.len()], original);

        let decrypted = decrypt(&blob, &key).expect("Decryption should succeed");
        assert_eq!(decrypted, original);
    }

    #[test]
    fn test_tamper_resistance() {
        let passphrase = "vault-master-key";
        let salt = generate_salt();
        let key = derive_key(passphrase, &salt).unwrap();

        let original = b"Sensitive communication snippet";
        let mut blob = encrypt(original, &key).unwrap();

        // Tamper with the ciphertext by flipping one bit
        if let Some(byte) = blob.ciphertext.first_mut() {
            *byte ^= 0x01;
        }

        // Decryption MUST fail
        let result = decrypt(&blob, &key);
        assert!(result.is_err(), "Tampered ciphertext must fail authentication");
    }

    #[test]
    fn test_wrong_key_fails() {
        let salt = generate_salt();
        let key1 = derive_key("passphrase-one", &salt).unwrap();
        let key2 = derive_key("passphrase-two", &salt).unwrap();

        let original = b"Top secret personal memories";
        let blob = encrypt(original, &key1).unwrap();

        let result = decrypt(&blob, &key2);
        assert!(result.is_err(), "Wrong key must fail decryption");
    }

    #[test]
    fn test_short_salt_rejected() {
        let short_salt = b"short";
        let result = derive_key("test", short_salt);
        assert!(result.is_err());
    }
}
