use wasm_bindgen::prelude::*;
use aes_gcm::{
    Aes256Gcm, Nonce, aead::{Aead, KeyInit, generic_array::GenericArray}
};
use sha2::{Sha256, Digest};

pub use crate::{generate_nonce, bytes_to_hex, hex_to_bytes, log};

/// Result of file encryption operation
#[wasm_bindgen]
pub struct EncryptedFileResult {
    success: bool,
    encrypted_data: Vec<u8>,
    nonce_hex: String,
    original_hash_hex: String,
    error_message: String,
}

#[wasm_bindgen]
impl EncryptedFileResult {
    #[wasm_bindgen(getter)]
    pub fn success(&self) -> bool {
        self.success
    }

    #[wasm_bindgen(getter)]
    pub fn encrypted_data(&self) -> Vec<u8> {
        self.encrypted_data.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn nonce_hex(&self) -> String {
        self.nonce_hex.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn original_hash_hex(&self) -> String {
        self.original_hash_hex.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn error_message(&self) -> String {
        self.error_message.clone()
    }
}

/// Computes SHA-256 hash of the given data
#[wasm_bindgen]
pub fn hash_file(data: &[u8]) -> String {
    log("[hash_file] Computing SHA-256 hash...");
    let mut hasher = Sha256::new();
    hasher.update(data);
    let result = hasher.finalize();
    let hash_hex = bytes_to_hex(&result);
    log(&format!("[hash_file] Hash computed: {}", hash_hex));
    hash_hex
}

/// Encrypts file data using AES-256-GCM with the provided master key
/// 
/// # Arguments
/// * `file_data` - The raw file bytes to encrypt
/// * `master_key_hex` - The 32-byte master key in hexadecimal format
/// 
/// # Returns
/// EncryptedFileResult containing encrypted data, nonce, and original file hash
#[wasm_bindgen]
pub fn encrypt_file(file_data: &[u8], master_key_hex: &str) -> EncryptedFileResult {
    log("[encrypt_file] Starting file encryption...");
    log(&format!("[encrypt_file] File size: {} bytes", file_data.len()));

    // Parse the master key from hex
    let master_key_bytes = match hex_to_bytes(master_key_hex) {
        Ok(bytes) => bytes,
        Err(e) => {
            log(&format!("[encrypt_file] Failed to parse master key: {}", e));
            return EncryptedFileResult {
                success: false,
                encrypted_data: vec![],
                nonce_hex: String::new(),
                original_hash_hex: String::new(),
                error_message: format!("Invalid master key format: {}", e),
            };
        }
    };

    // Validate master key length (must be 32 bytes for AES-256)
    if master_key_bytes.len() != 32 {
        log(&format!("[encrypt_file] Invalid master key length: {}", master_key_bytes.len()));
        return EncryptedFileResult {
            success: false,
            encrypted_data: vec![],
            nonce_hex: String::new(),
            original_hash_hex: String::new(),
            error_message: format!("Master key must be 32 bytes, got {}", master_key_bytes.len()),
        };
    }

    // Compute the original file hash
    log("[encrypt_file] Computing original file hash...");
    let original_hash = hash_file(file_data);

    // Generate a random nonce
    log("[encrypt_file] Generating nonce...");
    let nonce = generate_nonce();
    let nonce_hex = bytes_to_hex(nonce.as_slice());
    log(&format!("[encrypt_file] Nonce: {}", nonce_hex));

    // Create the AES-256-GCM cipher
    let key = GenericArray::from_slice(&master_key_bytes);
    let cipher = Aes256Gcm::new(key);
    let nonce_ga = Nonce::from_slice(nonce.as_slice());

    // Encrypt the file data
    log("[encrypt_file] Encrypting file data...");
    match cipher.encrypt(nonce_ga, file_data) {
        Ok(encrypted) => {
            log(&format!("[encrypt_file] Encryption successful! Encrypted size: {} bytes", encrypted.len()));
            EncryptedFileResult {
                success: true,
                encrypted_data: encrypted,
                nonce_hex,
                original_hash_hex: original_hash,
                error_message: String::new(),
            }
        }
        Err(e) => {
            log(&format!("[encrypt_file] Encryption failed: {}", e));
            EncryptedFileResult {
                success: false,
                encrypted_data: vec![],
                nonce_hex: String::new(),
                original_hash_hex: String::new(),
                error_message: format!("Encryption failed: {}", e),
            }
        }
    }
}