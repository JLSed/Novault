use wasm_bindgen::prelude::*;
use aes_gcm::{
    Aes256Gcm, Nonce, aead::{Aead, KeyInit, generic_array::GenericArray}
};
use x25519_dalek::{PublicKey, StaticSecret};

pub use crate::{bytes_to_hex, log};
pub use crate::encrypt_file::hash_file;

fn validate_inputs(private_key: &[u8], ephemeral_public_key: &[u8], dek_nonce: &[u8], file_nonce: &[u8]) -> Result<(), String> {
    check_len(32, private_key, "Private Key")?;
    check_len(32, ephemeral_public_key, "Ephemeral Public Key")?;
    check_len(12, dek_nonce, "DEK Nonce")?;
    check_len(12, file_nonce, "File Nonce")?;
    Ok(())
}

fn check_len(max: usize, input: &[u8], name: &str) -> Result<(), String> {
    if input.len() != max {
        Err(format!("{} must be {} bytes, got {}", name, max, input.len()))
    } else {
        Ok(())
    }    
}

/// Result of file decryption operation
#[wasm_bindgen]
pub struct DecryptedFileResult {
    success: bool,
    decrypted_data: Vec<u8>,
    file_hash_hex: String,
    error_message: String,
}

/// Decrypts file data using hybrid decryption (X25519 + AES-256-GCM)
/// 
/// The decryption process:
/// 1. Decrypt the user's private key using password-derived key
/// 2. Perform ECDH with the decrypted private key and ephemeral public key to derive the shared secret
/// 3. Decrypt the DEK using the shared secret
/// 4. Decrypt the file using the DEK
/// 
/// This function keeps sensitive data (private key) entirely within WASM,
/// never exposing it to the JavaScript frontend.
/// 
/// # Arguments
/// * `encrypted_data` - The encrypted file bytes to decrypt
/// * `password` - The user's master password
/// * `pk_salt` - Salt used for deriving the key encryption key
/// * `encrypted_private_key` - The encrypted private key bytes (48 bytes)
/// * `pk_nonce` - The nonce used for private key encryption (12 bytes)
/// * `ephemeral_public_key` - The ephemeral public key used during encryption (32 bytes)
/// * `encrypted_dek` - The encrypted DEK bytes
/// * `dek_nonce` - The nonce used for DEK encryption (12 bytes)
/// * `file_nonce` - The nonce used for file encryption (12 bytes)
/// 
/// # Returns
/// DecryptedFileResult containing decrypted data and its hash for verification
#[wasm_bindgen]
pub fn decrypt_file(
    encrypted_data: &[u8], 
    password: &str,
    pk_salt: &str,
    encrypted_private_key: &[u8],
    pk_nonce: &[u8],
    ephemeral_public_key: &[u8],
    encrypted_dek: &[u8],
    dek_nonce: &[u8],
    file_nonce: &[u8],
) -> DecryptedFileResult {
    log("[decrypt_file] Starting file decryption...");
    log(&format!("[decrypt_file] Encrypted size: {} bytes", encrypted_data.len()));

    // Step 1: Decrypt the private key from the user's secrets
    log("[decrypt_file] Decrypting private key...");
    
    let key_result = crate::masterkey_decryptor::decrypt_private_key(
        password,
        pk_salt,
        encrypted_private_key,
        pk_nonce
    );

    if !key_result.success() {
         log(&format!("[decrypt_file] Private key decryption failed: {}", key_result.error_message()));
         return DecryptedFileResult {
            success: false,
            decrypted_data: vec![],
            file_hash_hex: String::new(),
            error_message: format!("Private key decryption failed: {}", key_result.error_message()),
        };
    }
    
    let private_key_bytes = key_result.private_key();

    if let Err(e) = validate_inputs(&private_key_bytes, ephemeral_public_key, dek_nonce, file_nonce) {
        log(&format!("[decrypt_file] Input validation failed: {}", e));
        return DecryptedFileResult {
            success: false,
            decrypted_data: vec![],
            file_hash_hex: String::new(),
            error_message: e,
        };
    }

    // Step 2: Perform ECDH to derive shared secret
    log("[decrypt_file] Performing ECDH to derive shared secret...");
    let private_key_array: [u8; 32] = private_key_bytes.try_into().unwrap();
    let ephemeral_public_array: [u8; 32] = ephemeral_public_key.try_into().unwrap();
    
    let private_key = StaticSecret::from(private_key_array);
    let ephemeral_public = PublicKey::from(ephemeral_public_array);
    
    let shared_secret = private_key.diffie_hellman(&ephemeral_public);
    log("[decrypt_file] Shared secret derived via ECDH");

    // Step 3: Decrypt the DEK using the shared secret
    log("[decrypt_file] Decrypting DEK...");
    let shared_key = GenericArray::from_slice(shared_secret.as_bytes());
    let dek_cipher = Aes256Gcm::new(shared_key);
    let dek_nonce_ga = Nonce::from_slice(dek_nonce);

    let dek = match dek_cipher.decrypt(dek_nonce_ga, encrypted_dek) {
        Ok(decrypted) => {
            log(&format!("[decrypt_file] DEK decrypted! Size: {} bytes", decrypted.len()));
            decrypted
        }
        Err(e) => {
            log(&format!("[decrypt_file] DEK decryption failed: {}", e));
            return DecryptedFileResult {
                success: false,
                decrypted_data: vec![],
                file_hash_hex: String::new(),
                error_message: "DEK decryption failed. Invalid private key or corrupted data.".to_string(),
            };
        }
    };

    if dek.len() != 32 {
        log(&format!("[decrypt_file] Invalid DEK length after decryption: {}", dek.len()));
        return DecryptedFileResult {
            success: false,
            decrypted_data: vec![],
            file_hash_hex: String::new(),
            error_message: format!("Decrypted DEK must be 32 bytes, got {}", dek.len()),
        };
    }

    // Step 4: Decrypt the file using the DEK
    log("[decrypt_file] Decrypting file data...");
    let dek_key = GenericArray::from_slice(&dek);
    let file_cipher = Aes256Gcm::new(dek_key);
    let file_nonce_ga = Nonce::from_slice(file_nonce);

    match file_cipher.decrypt(file_nonce_ga, encrypted_data) {
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
            log(&format!("[decrypt_file] File decryption failed: {}", e));
            DecryptedFileResult {
                success: false,
                decrypted_data: vec![],
                file_hash_hex: String::new(),
                error_message: "File decryption failed. Invalid DEK or corrupted data.".to_string(),
            }
        }
    }
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
