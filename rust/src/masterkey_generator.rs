use wasm_bindgen::prelude::*;
use aes_gcm::{
    Aes256Gcm, aead::{Aead, KeyInit, OsRng, generic_array::GenericArray}
};
use x25519_dalek::{PublicKey, StaticSecret};
use argon2::{password_hash::SaltString};
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
    salt: String,
    encrypted_private_key: Vec<u8>,
    public_key: Vec<u8>,
}


#[wasm_bindgen]
pub fn encrypt_master_key(input: &str) -> EncryptedMasterKey {
    let salt = SaltString::generate(&mut OsRng);
    // Generate the data encryption key from input
    let encryption_key = get_key_encryption_key(input, salt.as_str());
    log(&bytes_to_hex(&encryption_key));

    let secret = StaticSecret::random_from_rng(OsRng);
    let public = PublicKey::from(&secret);
    log("Generated X25519 key pair");

    let key = GenericArray::from_slice(&encryption_key);
    let cipher = Aes256Gcm::new(key);
    let nonce = generate_nonce();

    log(&bytes_to_hex(&nonce));

    // Encrypt the private key
    let ciphertext = cipher
        .encrypt(&nonce, secret.to_bytes().as_ref())
        .expect("Failed to encrypt master key");
    
    EncryptedMasterKey {
        encrypted_private_key: ciphertext,
        public_key: public.to_bytes().to_vec(),
        nonce: nonce.to_vec(),
        salt: salt.as_str().to_string(),

    }
}

#[wasm_bindgen]
impl EncryptedMasterKey {
    #[wasm_bindgen(getter)]
    pub fn nonce(&self) -> Vec<u8> {
        self.nonce.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn encrypted_private_key(&self) -> Vec<u8> {
        self.encrypted_private_key.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn public_key(&self) -> Vec<u8> {
        self.public_key.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn salt(&self) -> String {
        self.salt.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn nonce_hex(&self) -> String {
        bytes_to_hex(&self.nonce)
    }

    #[wasm_bindgen(getter)]
    pub fn encrypted_private_key_hex(&self) -> String {
        bytes_to_hex(&self.encrypted_private_key)
    }

    #[wasm_bindgen(getter)]
    pub fn public_key_hex(&self) -> String {
        bytes_to_hex(&self.public_key)
    }

}