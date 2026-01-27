use wasm_bindgen::prelude::*;
use aes_gcm::{
    Aes256Gcm, Nonce, aead::{Aead, KeyInit, generic_array::GenericArray}
};

// Re-export functions from lib
pub use crate::{get_encryption_key, to_hex, log};

/// Result of master key decryption
#[wasm_bindgen]
pub struct DecryptedMasterKey {
    success: bool,
    master_key: Vec<u8>,
    error_message: String,
}

#[wasm_bindgen]
impl DecryptedMasterKey {
    #[wasm_bindgen(getter)]
    pub fn success(&self) -> bool {
        self.success
    }

    #[wasm_bindgen(getter)]
    pub fn master_key(&self) -> Vec<u8> {
        self.master_key.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn master_key_hex(&self) -> String {
        if self.success {
            to_hex(&self.master_key)
        } else {
            String::new()
        }
    }

    #[wasm_bindgen(getter)]
    pub fn error_message(&self) -> String {
        self.error_message.clone()
    }
}

/// Converts a hex string to bytes
fn hex_to_bytes(hex: &str) -> Result<Vec<u8>, String> {
    if hex.len() % 2 != 0 {
        return Err("Invalid hex string length".to_string());
    }

    (0..hex.len())
        .step_by(2)
        .map(|i| {
            u8::from_str_radix(&hex[i..i + 2], 16)
                .map_err(|_| format!("Invalid hex character at position {}", i))
        })
        .collect()
}

/// Decrypts the master key using AES-256-GCM
/// 
/// # Arguments
/// * `password` - User's master password
/// * `salt` - Salt used for key derivation (user's email)
/// * `encrypted_key_hex` - The encrypted master key in hex format (includes auth tag)
/// * `nonce_hex` - The nonce/IV used during encryption in hex format
/// 
/// # Returns
/// A DecryptedMasterKey struct containing the decrypted master key or error
#[wasm_bindgen]
pub fn decrypt_master_key(
    password: &str,
    salt: &str,
    encrypted_key_hex: &str,
    nonce_hex: &str,
) -> DecryptedMasterKey {
    log("Starting master key decryption...");

    // Parse the nonce from hex
    let nonce_bytes = match hex_to_bytes(nonce_hex) {
        Ok(bytes) => bytes,
        Err(e) => {
            log(&format!("Failed to parse nonce: {}", e));
            return DecryptedMasterKey {
                success: false,
                master_key: vec![],
                error_message: format!("Invalid nonce format: {}", e),
            };
        }
    };

    if nonce_bytes.len() != 12 {
        log(&format!("Invalid nonce length: {}", nonce_bytes.len()));
        return DecryptedMasterKey {
            success: false,
            master_key: vec![],
            error_message: format!("Nonce must be 12 bytes, got {}", nonce_bytes.len()),
        };
    }

    // Parse the encrypted key from hex (this includes the auth tag)
    let encrypted_bytes = match hex_to_bytes(encrypted_key_hex) {
        Ok(bytes) => bytes,
        Err(e) => {
            log(&format!("Failed to parse encrypted key: {}", e));
            return DecryptedMasterKey {
                success: false,
                master_key: vec![],
                error_message: format!("Invalid encrypted key format: {}", e),
            };
        }
    };
  
    // The encrypted_key should be 48 bytes (32 bytes ciphertext + 16 bytes auth tag)
    if encrypted_bytes.len() != 48 {
        log(&format!("Invalid encrypted key length: {}", encrypted_bytes.len()));
        return DecryptedMasterKey {
            success: false,
            master_key: vec![],
            error_message: format!("Encrypted key must be 48 bytes, got {}", encrypted_bytes.len()),
        };
    }

    // Derive the encryption key from password and salt (includes paminta internally)
    log("Deriving encryption key from password...");
    let encryption_key = get_encryption_key(password, salt);
    log(&format!("Derived key: {}", to_hex(&encryption_key)));

    // Create the cipher
    let key = GenericArray::from_slice(&encryption_key);
    let cipher = Aes256Gcm::new(key);
    let nonce = Nonce::from_slice(&nonce_bytes);

    // Decrypt the master key
    log("Attempting decryption...");
    match cipher.decrypt(nonce, encrypted_bytes.as_ref()) {
        Ok(decrypted) => {
            log("Decryption successful!");
            log(&format!("Decrypted master key: {}", to_hex(&decrypted)));
            DecryptedMasterKey {
                success: true,
                master_key: decrypted,
                error_message: String::new(),
            }
        }
        Err(_) => {
            log("Decryption failed - invalid password or corrupted data");
            DecryptedMasterKey {
                success: false,
                master_key: vec![],
                error_message: "Decryption failed. Please check your password.".to_string(),
            }
        }
    }
}
