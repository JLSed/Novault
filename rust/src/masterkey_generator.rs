use wasm_bindgen::prelude::*;
use aes_gcm::{
    Aes256Gcm, Nonce, aead::{Aead, AeadCore, Key, KeyInit, OsRng, generic_array::GenericArray}
};

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
    //auth_tag: Vec<u8>,
    encrypted_key: Vec<u8>,
}

#[wasm_bindgen]
impl EncryptedMasterKey {
    #[wasm_bindgen(getter)]
    pub fn nonce(&self) -> Vec<u8> {
        self.nonce.clone()
    }

    // #[wasm_bindgen(getter)]
    // pub fn auth_tag(&self) -> Vec<u8> {
    //     self.auth_tag.clone()
    // }

    #[wasm_bindgen(getter)]
    pub fn encrypted_key(&self) -> Vec<u8> {
        self.encrypted_key.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn nonce_hex(&self) -> String {
        to_hex(&self.nonce)
    }

    // #[wasm_bindgen(getter)]
    // pub fn auth_tag_hex(&self) -> String {
    //     to_hex(&self.auth_tag)
    // }

    #[wasm_bindgen(getter)]
    pub fn encrypted_key_hex(&self) -> String {
        to_hex(&self.encrypted_key)
    }
}

/// Generates a random 32-byte master key
fn generate_master_key() -> Vec<u8> {
    let key : Key<Aes256Gcm> = Aes256Gcm::generate_key(&mut OsRng);
    key.to_vec()
}

#[wasm_bindgen]
pub fn generate_encrypted_master_key(input: &str, salt: &str) -> EncryptedMasterKey {
    // Generate the data encryption key from input
    let encryption_key = get_encryption_key(input, salt);
    log(&to_hex(&encryption_key));

    // Generate a 12-byte nonce
    let nonce = Aes256Gcm::generate_nonce(&mut OsRng);
    log(&to_hex(&nonce));

    // Create AES-256-GCM cipher
    let key = GenericArray::from_slice(&encryption_key);
    let cipher = Aes256Gcm::new(key);
    let master_key = generate_master_key();
    log(&to_hex(&master_key));

    // Encrypt the master key (result includes ciphertext + 16-byte auth tag)
    let ciphertext = cipher
        .encrypt(&nonce, master_key.as_ref())
        .expect("Failed to encrypt master key");
    
    // Split them: ciphertext is first 32 bytes, auth tag is last 16 bytes
    let encrypted_key = ciphertext[..32].to_vec();
    let auth_tag = ciphertext[32..].to_vec();
    let mk_nonce = nonce.to_vec();
    
    EncryptedMasterKey {
        nonce: mk_nonce,
        //auth_tag,
        encrypted_key,
    }
}
