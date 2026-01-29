use wasm_bindgen::prelude::*;
use aes_gcm::{
    Aes256Gcm, Nonce, aead::{Aead, KeyInit, generic_array::GenericArray}
};

pub use crate::{bytes_to_hex, hex_to_bytes, log};
pub use crate::encrypt_file::hash_file;

/// Result of file decryption operation
#[wasm_bindgen]
pub struct DecryptedFileResult {
    success: bool,
    decrypted_data: Vec<u8>,
    file_hash_hex: String,
    error_message: String,
}

#[wasm_bindgen]
impl DecryptedFileResult {
    #[wasm_bindgen(getter)]
    pub fn success(&self) -> bool {
        self.success
    }

    #[wasm_bindgen(getter)]
    pub fn decrypted_data(&self) -> Vec<u8> {
        self.decrypted_data.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn file_hash_hex(&self) -> String {
        self.file_hash_hex.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn error_message(&self) -> String {
        self.error_message.clone()
    }
}

/// Decrypts file data using AES-256-GCM with the provided master key
/// 
/// # Arguments
/// * `encrypted_data` - The encrypted file bytes to decrypt
/// * `master_key_hex` - The 32-byte master key in hexadecimal format
/// * `nonce_hex` - The 12-byte nonce used during encryption in hexadecimal format
/// 
/// # Returns
/// DecryptedFileResult containing decrypted data and its hash for verification
#[wasm_bindgen]
pub fn decrypt_file(encrypted_data: &[u8], master_key_hex: &str, nonce_hex: &str) -> DecryptedFileResult {
    log("[decrypt_file] Starting file decryption...");
    log(&format!("[decrypt_file] Encrypted size: {} bytes", encrypted_data.len()));

    // Parse the master key from hex
    let master_key_bytes = match hex_to_bytes(master_key_hex) {
        Ok(bytes) => bytes,
        Err(e) => {
            log(&format!("[decrypt_file] Failed to parse master key: {}", e));
            return DecryptedFileResult {
                success: false,
                decrypted_data: vec![],
                file_hash_hex: String::new(),
                error_message: format!("Invalid master key format: {}", e),
            };
        }
    };

    // Validate master key length (must be 32 bytes for AES-256)
    if master_key_bytes.len() != 32 {
        log(&format!("[decrypt_file] Invalid master key length: {}", master_key_bytes.len()));
        return DecryptedFileResult {
            success: false,
            decrypted_data: vec![],
            file_hash_hex: String::new(),
            error_message: format!("Master key must be 32 bytes, got {}", master_key_bytes.len()),
        };
    }

    // Parse the nonce from hex
    let nonce_bytes = match hex_to_bytes(nonce_hex) {
        Ok(bytes) => bytes,
        Err(e) => {
            log(&format!("[decrypt_file] Failed to parse nonce: {}", e));
            return DecryptedFileResult {
                success: false,
                decrypted_data: vec![],
                file_hash_hex: String::new(),
                error_message: format!("Invalid nonce format: {}", e),
            };
        }
    };

    // Validate nonce length (must be 12 bytes for AES-GCM)
    if nonce_bytes.len() != 12 {
        log(&format!("[decrypt_file] Invalid nonce length: {}", nonce_bytes.len()));
        return DecryptedFileResult {
            success: false,
            decrypted_data: vec![],
            file_hash_hex: String::new(),
            error_message: format!("Nonce must be 12 bytes, got {}", nonce_bytes.len()),
        };
    }

    // Create the AES-256-GCM cipher
    let key = GenericArray::from_slice(&master_key_bytes);
    let cipher = Aes256Gcm::new(key);
    let nonce = Nonce::from_slice(&nonce_bytes);

    // Decrypt the file data
    log("[decrypt_file] Decrypting file data...");
    match cipher.decrypt(nonce, encrypted_data) {
        Ok(decrypted) => {
            log(&format!("[decrypt_file] Decryption successful! Decrypted size: {} bytes", decrypted.len()));
            
            // Compute hash of decrypted file for verification
            let file_hash = hash_file(&decrypted);
            log(&format!("[decrypt_file] Decrypted file hash: {}", file_hash));
            
            DecryptedFileResult {
                success: true,
                decrypted_data: decrypted,
                file_hash_hex: file_hash,
                error_message: String::new(),
            }
        }
        Err(e) => {
            log(&format!("[decrypt_file] Decryption failed: {}", e));
            DecryptedFileResult {
                success: false,
                decrypted_data: vec![],
                file_hash_hex: String::new(),
                error_message: "Decryption failed. Invalid key, nonce, or corrupted data.".to_string(),
            }
        }
    }
}
