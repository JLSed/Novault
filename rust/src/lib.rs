use wasm_bindgen::prelude::*;
use argon2::{Argon2, Algorithm, Version, Params};
use aes_gcm::{
    Aes256Gcm, aead::{AeadCore, OsRng, generic_array::GenericArray, consts::U12}
};

pub mod masterkey_generator;
pub mod masterkey_decryptor;
// pub mod encrypt_file;

// Nonce type alias for AES-256-GCM (12 bytes)
pub type Nonce = GenericArray<u8, U12>;
#[wasm_bindgen]
extern "C" {
    pub fn alert(s: &str);
    #[wasm_bindgen(js_namespace = console)]
    pub fn log(s: &str);
}

/// Derives a 32-byte key with pepper
pub fn get_encryption_key(input: &str, salt: &str) -> Vec<u8> {
    let paminta = get_paminta();
    // Combine user input with pepper
    let mut input_with_pepper = input.as_bytes().to_vec();
    input_with_pepper.extend_from_slice(&paminta);

    // Configure Argon2id with secure parameters
    let params = Params::new(
        65536,  // 64 MB memory cost
        3,      // 3 iterations
        1,      // 1 degree of parallelism
        Some(32) // 32 bytes output
    ).unwrap();

    let argon2 = Argon2::new(Algorithm::Argon2id, Version::V0x13, params);

    // Derive the key
    let mut output_key = vec![0u8; 32];
    argon2
        .hash_password_into(&input_with_pepper, salt.as_bytes(), &mut output_key)
        .expect("Failed to hash password");

    output_key
}

// - 4rD^grSXyRwJ~Wuc5vcHL5
fn get_paminta() -> Vec<u8> {
    vec![
        52, 114, 68, 94, 103, 114, 83, 88,   // 4rD^grSX
        121, 82, 119, 74, 126, 87, 117, 99,  // yRwJ~Wuc
        53, 118, 99, 72, 76, 53              // 5vcHL5
    ]
}

/// Converts byte slice to hex string
pub fn to_hex(data: &[u8]) -> String {
    data.iter().map(|b| format!("{:02x}", b)).collect()
}

/// Generates a cryptographically secure 12-byte nonce (internal use)
pub fn generate_nonce() -> Nonce {
    Aes256Gcm::generate_nonce(&mut OsRng)
}

/// Returns the derived key as a hex string
#[wasm_bindgen]
pub fn master_key_to_hex(input: &str, salt: &str) -> String {
    let key = get_encryption_key(input, salt);
    to_hex(&key)
}

/// Returns the generated nonce as a hex string
#[wasm_bindgen]
pub fn generate_nonce_hex() -> String {
    let nonce = generate_nonce();
    to_hex(nonce.as_slice())
}


