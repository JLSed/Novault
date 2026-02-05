use wasm_bindgen::prelude::*;
use aes_gcm::{
    Aes256Gcm, Nonce, aead::{Aead, KeyInit, generic_array::GenericArray}
};

pub use crate::{get_key_encryption_key, bytes_to_hex, hex_to_bytes, log};

#[wasm_bindgen]
pub struct DecryptedPrivateKey {
    success: bool,
    private_key: Vec<u8>,
    error_message: String,
}

#[wasm_bindgen]
pub fn decrypt_private_key(
    password: &str,
    salt: &str,
    encrypted_key_hex: &str,
    nonce_hex: &str,
) -> DecryptedPrivateKey {
    log("Starting private key decryption...");

    // Parse the nonce from hex
    let nonce_bytes = match hex_to_bytes(nonce_hex) {
        Ok(bytes) => bytes,
        Err(e) => {
            log(&format!("Failed to parse nonce: {}", e));
            return DecryptedPrivateKey {
                success: false,
                private_key: vec![],
                error_message: format!("Invalid nonce format: {}", e),
            };
        }
    };

    if nonce_bytes.len() != 12 {
        log(&format!("Invalid nonce length: {}", nonce_bytes.len()));
        return DecryptedPrivateKey {
            success: false,
            private_key: vec![],
            error_message: format!("Nonce must be 12 bytes, got {}", nonce_bytes.len()),
        };
    }

    // Parse the encrypted key from hex (this includes the auth tag)
    let encrypted_bytes = match hex_to_bytes(encrypted_key_hex) {
        Ok(bytes) => bytes,
        Err(e) => {
            log(&format!("Failed to parse encrypted key: {}", e));
            return DecryptedPrivateKey {
                success: false,
                private_key: vec![],
                error_message: format!("Invalid encrypted key format: {}", e),
            };
        }
    };
  
    // The encrypted_key should be 48 bytes (32 bytes key + 16 bytes auth tag)
    if encrypted_bytes.len() != 48 {
        log(&format!("Invalid encrypted key length: {}", encrypted_bytes.len()));
        return DecryptedPrivateKey {
            success: false,
            private_key: vec![],
            error_message: format!("Encrypted key must be 48 bytes, got {}", encrypted_bytes.len()),
        };
    }

    // Derive the encryption key from password and salt (includes paminta internally)
    log("Deriving encryption key from password...");
    let encryption_key = get_key_encryption_key(password, salt);
    log(&format!("Derived key: {}", bytes_to_hex(&encryption_key)));

    // Create the cipher
    let key = GenericArray::from_slice(&encryption_key);
    let cipher = Aes256Gcm::new(key);
    let nonce = Nonce::from_slice(&nonce_bytes);

    // Decrypt the private key
    log("Attempting decryption...");
    match cipher.decrypt(nonce, encrypted_bytes.as_ref()) {
        Ok(decrypted) => {
            log("Decryption successful!");
            // Private key is intentionally not logged for security
            DecryptedPrivateKey {
                success: true,
                private_key: decrypted,
                error_message: String::new(),
            }
        }
        Err(_) => {
            log("Decryption failed - invalid password or corrupted data");
            DecryptedPrivateKey {
                success: false,
                private_key: vec![],
                error_message: "Decryption failed. Please check your password.".to_string(),
            }
        }
    }
}


#[wasm_bindgen]
impl DecryptedPrivateKey {
    #[wasm_bindgen(getter)]
    pub fn success(&self) -> bool {
        self.success
    }

    #[wasm_bindgen(getter)]
    pub fn private_key(&self) -> Vec<u8> {
        self.private_key.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn private_key_hex(&self) -> String {
        if self.success {
            bytes_to_hex(&self.private_key)
        } else {
            String::new()
        }
    }

    #[wasm_bindgen(getter)]
    pub fn error_message(&self) -> String {
        self.error_message.clone()
    }
}