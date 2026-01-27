use wasm_bindgen::prelude::*;
use aes_gcm::{Aes256Gcm, KeyInit, aead::Aead};
use aes_gcm::aead::generic_array::GenericArray;
use getrandom::getrandom;


// Re-export functions from lib
pub use crate::{generate_nonce, get_encryption_key, to_hex, alert, log};



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
    auth_tag: Vec<u8>,
    encrypted_key: Vec<u8>,
}

#[wasm_bindgen]
impl EncryptedMasterKey {
    #[wasm_bindgen(getter)]
    pub fn nonce(&self) -> Vec<u8> {
        self.nonce.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn auth_tag(&self) -> Vec<u8> {
        self.auth_tag.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn encrypted_key(&self) -> Vec<u8> {
        self.encrypted_key.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn nonce_hex(&self) -> String {
        to_hex(&self.nonce)
    }

    #[wasm_bindgen(getter)]
    pub fn auth_tag_hex(&self) -> String {
        to_hex(&self.auth_tag)
    }

    #[wasm_bindgen(getter)]
    pub fn encrypted_key_hex(&self) -> String {
        to_hex(&self.encrypted_key)
    }
}

/// Generates a random 32-byte master key
fn generate_random_master_key() -> Vec<u8> {
    let mut master_key = vec![0u8; 32];
    getrandom(&mut master_key).expect("Failed to generate random master key");
    master_key
}

/// Generates and encrypts a new master key using AES-256-GCM
/// 
/// # Arguments
/// * `input` - User's input for deriving the encryption key
/// * `salt` - Salt for key derivation
/// 
/// # Returns
/// EncryptedMasterKey containing:
/// - nonce: 12-byte nonce used for encryption
/// - auth_tag: 16-byte authentication tag (appended to ciphertext by AES-GCM)
/// - encrypted_key: The encrypted 32-byte master key
#[wasm_bindgen]
pub fn generate_encrypted_master_key(input: &str, salt: &str) -> EncryptedMasterKey {
    // Generate the data encryption key from input
    let encryption_key = get_encryption_key(input, salt);
    log(&to_hex(&encryption_key));
    let master_key = generate_random_master_key();
    log(&to_hex(&master_key));
    // Generate a 12-byte nonce
    let nonce = generate_nonce();
    log(&to_hex(&nonce));
    // Create AES-256-GCM cipher
    let key = GenericArray::from_slice(&encryption_key);
    let cipher = Aes256Gcm::new(key);
    let nonce_array = GenericArray::from_slice(&nonce);
    
    // Encrypt the master key (result includes ciphertext + 16-byte auth tag)
    let ciphertext_with_tag = cipher
        .encrypt(nonce_array, master_key.as_ref())
        .expect("Failed to encrypt master key");
    
    // AES-GCM appends the 16-byte auth tag to the ciphertext
    // Split them: ciphertext is first 32 bytes, auth tag is last 16 bytes
    let encrypted_key = ciphertext_with_tag[..32].to_vec();
    let auth_tag = ciphertext_with_tag[32..].to_vec();
    
    EncryptedMasterKey {
        nonce,
        auth_tag,
        encrypted_key,
    }
}
