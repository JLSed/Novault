use wasm_bindgen::prelude::*;
use aes_gcm::{
    Aes256Gcm, Nonce, aead::{Aead, KeyInit, generic_array::GenericArray}
};
use crate::masterkey_decryptor::decrypt_master_key;

pub use crate::{generate_nonce, bytes_to_hex, hex_to_bytes, hash_file, log};

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

/// Encrypts file data using AES-256-GCM with the provided master key
/// 
/// # Arguments
/// * `file_data` - The raw file bytes to encrypt
/// * `password` - The user's password to decrypt the master key
/// * `salt` - The salt used for key derivation
/// * `encrypted_master_key_hex` - The encrypted master key hex
/// * `master_key_nonce_hex` - The nonce used for master key encryption
/// 
/// # Returns
/// EncryptedFileResult containing encrypted data, nonce, and original file hash
#[wasm_bindgen]
pub fn encrypt_file(
    file_data: &[u8], 
    password: &str, 
    salt: &str, 
    encrypted_master_key_hex: &str, 
    master_key_nonce_hex: &str
) -> EncryptedFileResult {
    log("[encrypt_file] Starting file encryption...");
    log(&format!("[encrypt_file] File size: {} bytes", file_data.len()));

    // Decrypt the master key
    log("[encrypt_file] Decrypting master key...");
    let decrypted_key_result = decrypt_master_key(password, salt, encrypted_master_key_hex, master_key_nonce_hex);

    if !decrypted_key_result.success() {
        log(&format!("[encrypt_file] Master key decryption failed: {}", decrypted_key_result.error_message()));
        return EncryptedFileResult {
            success: false,
            encrypted_data: vec![],
            nonce_hex: String::new(),
            original_hash_hex: String::new(),
            error_message: format!("Master key decryption failed: {}", decrypted_key_result.error_message()),
        };
    }

    let master_key_bytes = decrypted_key_result.master_key();

    // Validate master key length 
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