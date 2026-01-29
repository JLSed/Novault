use wasm_bindgen::prelude::*;
use aes_gcm::{
    Aes256Gcm, aead::{Aead, Key, KeyInit, OsRng, generic_array::GenericArray}
};

// Re-export functions from lib
pub use crate::{generate_nonce, get_key_encryption_key, bytes_to_hex, alert, log};


/// Encrypts a master key using AES-256-GCM
/// 
/// # Arguments
/// * `input` - User's input for deriving the encryption key
/// * `salt` - Salt for key derivation
/// 
/// # Returns
/// A struct containing the nonce, authentication tag, and encrypted master key
#[wasm_bindgen]
pub struct EncryptedMasterKey {
    nonce: Vec<u8>,
    encrypted_key: Vec<u8>,
}

#[wasm_bindgen]
impl EncryptedMasterKey {
    #[wasm_bindgen(getter)]
    pub fn nonce(&self) -> Vec<u8> {
        self.nonce.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn encrypted_key(&self) -> Vec<u8> {
        self.encrypted_key.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn nonce_hex(&self) -> String {
        bytes_to_hex(&self.nonce)
    }
    #[wasm_bindgen(getter)]
    pub fn encrypted_key_hex(&self) -> String {
        bytes_to_hex(&self.encrypted_key)
    }
}

/// Generates a random 32-byte master key
fn generate_master_key() -> Key<Aes256Gcm> {
    Aes256Gcm::generate_key(&mut OsRng)
}

#[wasm_bindgen]
pub fn encrypt_master_key(input: &str, salt: &str) -> EncryptedMasterKey {
    // Generate the data encryption key from input
    let encryption_key = get_key_encryption_key(input, salt);
    log(&bytes_to_hex(&encryption_key));


    // Create AES-256-GCM cipher
    let key = GenericArray::from_slice(&encryption_key);
    let cipher = Aes256Gcm::new(key);
    let master_key = generate_master_key();
    let nonce = generate_nonce();
    log(&bytes_to_hex(&nonce));
    log(&bytes_to_hex(master_key.as_slice()));

    // Encrypt the master key
    let ciphertext = cipher
        .encrypt(&nonce, master_key.as_slice())
        .expect("Failed to encrypt master key");
    
    // full ciphertext (32 bytes encrypted key + 16 bytes auth tag)
    let mk_nonce = nonce.to_vec();
    
    EncryptedMasterKey {
        nonce: mk_nonce,
        encrypted_key: ciphertext,
    }
}
