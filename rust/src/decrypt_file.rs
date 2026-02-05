use wasm_bindgen::prelude::*;
use aes_gcm::{
    Aes256Gcm, Nonce, aead::{Aead, KeyInit, generic_array::GenericArray}
};
use x25519_dalek::{PublicKey, StaticSecret};

pub use crate::{get_key_encryption_key, bytes_to_hex, hex_to_bytes, log};
pub use crate::encrypt_file::hash_file;

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
/// * `encrypted_private_key_hex` - The encrypted private key in hexadecimal format
/// * `pk_nonce_hex` - The nonce used for private key encryption
/// * `ephemeral_public_key_hex` - The ephemeral public key used during encryption
/// * `encrypted_dek_hex` - The encrypted DEK in hexadecimal format
/// * `dek_nonce_hex` - The nonce used for DEK encryption
/// * `file_nonce_hex` - The nonce used for file encryption
/// 
/// # Returns
/// DecryptedFileResult containing decrypted data and its hash for verification
#[wasm_bindgen]
pub fn decrypt_file(
    encrypted_data: &[u8], 
    password: &str,
    pk_salt: &str,
    encrypted_private_key_hex: &str,
    pk_nonce_hex: &str,
    ephemeral_public_key_hex: &str,
    encrypted_dek_hex: &str,
    dek_nonce_hex: &str,
    file_nonce_hex: &str,
) -> DecryptedFileResult {
    log("[decrypt_file] Starting file decryption...");
    log(&format!("[decrypt_file] Encrypted size: {} bytes", encrypted_data.len()));

    // Step 1: Decrypt the private key from the user's secrets
    log("[decrypt_file] Decrypting private key...");
    
    let key_result = crate::masterkey_decryptor::decrypt_private_key(
        password,
        pk_salt,
        encrypted_private_key_hex,
        pk_nonce_hex
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

    if private_key_bytes.len() != 32 {
        log(&format!("[decrypt_file] Invalid private key length after decryption: {}", private_key_bytes.len()));
        return DecryptedFileResult {
            success: false,
            decrypted_data: vec![],
            file_hash_hex: String::new(),
            error_message: format!("Private key must be 32 bytes, got {}", private_key_bytes.len()),
        };
    }

    // Parse the ephemeral public key from hex
    let ephemeral_public_bytes = match hex_to_bytes(ephemeral_public_key_hex) {
        Ok(bytes) => bytes,
        Err(e) => {
            log(&format!("[decrypt_file] Failed to parse ephemeral public key: {}", e));
            return DecryptedFileResult {
                success: false,
                decrypted_data: vec![],
                file_hash_hex: String::new(),
                error_message: format!("Invalid ephemeral public key format: {}", e),
            };
        }
    };

    if ephemeral_public_bytes.len() != 32 {
        log(&format!("[decrypt_file] Invalid ephemeral public key length: {}", ephemeral_public_bytes.len()));
        return DecryptedFileResult {
            success: false,
            decrypted_data: vec![],
            file_hash_hex: String::new(),
            error_message: format!("Ephemeral public key must be 32 bytes, got {}", ephemeral_public_bytes.len()),
        };
    }

    // Parse the encrypted DEK from hex
    let encrypted_dek_bytes = match hex_to_bytes(encrypted_dek_hex) {
        Ok(bytes) => bytes,
        Err(e) => {
            log(&format!("[decrypt_file] Failed to parse encrypted DEK: {}", e));
            return DecryptedFileResult {
                success: false,
                decrypted_data: vec![],
                file_hash_hex: String::new(),
                error_message: format!("Invalid encrypted DEK format: {}", e),
            };
        }
    };

    // Parse the DEK nonce from hex
    let dek_nonce_bytes = match hex_to_bytes(dek_nonce_hex) {
        Ok(bytes) => bytes,
        Err(e) => {
            log(&format!("[decrypt_file] Failed to parse DEK nonce: {}", e));
            return DecryptedFileResult {
                success: false,
                decrypted_data: vec![],
                file_hash_hex: String::new(),
                error_message: format!("Invalid DEK nonce format: {}", e),
            };
        }
    };

    if dek_nonce_bytes.len() != 12 {
        log(&format!("[decrypt_file] Invalid DEK nonce length: {}", dek_nonce_bytes.len()));
        return DecryptedFileResult {
            success: false,
            decrypted_data: vec![],
            file_hash_hex: String::new(),
            error_message: format!("DEK nonce must be 12 bytes, got {}", dek_nonce_bytes.len()),
        };
    }

    // Parse the file nonce from hex
    let file_nonce_bytes = match hex_to_bytes(file_nonce_hex) {
        Ok(bytes) => bytes,
        Err(e) => {
            log(&format!("[decrypt_file] Failed to parse file nonce: {}", e));
            return DecryptedFileResult {
                success: false,
                decrypted_data: vec![],
                file_hash_hex: String::new(),
                error_message: format!("Invalid file nonce format: {}", e),
            };
        }
    };

    if file_nonce_bytes.len() != 12 {
        log(&format!("[decrypt_file] Invalid file nonce length: {}", file_nonce_bytes.len()));
        return DecryptedFileResult {
            success: false,
            decrypted_data: vec![],
            file_hash_hex: String::new(),
            error_message: format!("File nonce must be 12 bytes, got {}", file_nonce_bytes.len()),
        };
    }

    // Step 2: Perform ECDH to derive shared secret
    log("[decrypt_file] Performing ECDH to derive shared secret...");
    let private_key_array: [u8; 32] = private_key_bytes.try_into().unwrap();
    let ephemeral_public_array: [u8; 32] = ephemeral_public_bytes.try_into().unwrap();
    
    let private_key = StaticSecret::from(private_key_array);
    let ephemeral_public = PublicKey::from(ephemeral_public_array);
    
    let shared_secret = private_key.diffie_hellman(&ephemeral_public);
    log("[decrypt_file] Shared secret derived via ECDH");

    // Step 3: Decrypt the DEK using the shared secret
    log("[decrypt_file] Decrypting DEK...");
    let shared_key = GenericArray::from_slice(shared_secret.as_bytes());
    let dek_cipher = Aes256Gcm::new(shared_key);
    let dek_nonce = Nonce::from_slice(&dek_nonce_bytes);

    let dek = match dek_cipher.decrypt(dek_nonce, encrypted_dek_bytes.as_ref()) {
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
    let file_nonce = Nonce::from_slice(&file_nonce_bytes);

    match file_cipher.decrypt(file_nonce, encrypted_data) {
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
