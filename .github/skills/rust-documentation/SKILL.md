---
name: rust-documentation
description: 'This skill provides guidelines for documenting Rust code in this project. Triggers on requests like "add rust documentation", "document this rust function", "add rustdoc", "write rust comments". Ensures consistent, high-quality documentation across the Rust/WASM codebase using rustdoc standards.'
---

# Rust Documentation (rustdoc) Best Practices

This skill provides comprehensive guidelines for documenting Rust code in this project, particularly for WebAssembly modules used in client-side encryption.

## General Principles

1. **All public functions, structs, enums, and traits must be documented** with doc comments.
2. Document internal/private members if they are complex or not self-explanatory.
3. Documentation should explain the **why**, not just the **what**.
4. Use `cargo doc --open` to preview generated documentation.

---

## Doc Comment Syntax

### Outer Doc Comments (`///`)

Use `///` for documenting items (functions, structs, fields, etc.):

```rust
/// Encrypts the master key using AES-256-GCM.
///
/// This function derives an encryption key from the password using Argon2id,
/// generates a random master key, and encrypts it with the derived key.
pub fn encrypt_master_key(password: &str, salt: &str) -> EncryptedMasterKey {
    // ...
}
```

### Inner Doc Comments (`//!`)

Use `//!` for documenting the enclosing item (modules, crates):

```rust
//! # Master Key Generator
//!
//! This module provides functions for generating and encrypting master keys
//! using AES-256-GCM with Argon2id key derivation.
//!
//! ## Security Notes
//!
//! - Master keys are 256 bits generated from a CSPRNG
//! - Key derivation uses Argon2id with secure parameters
//! - All encryption uses authenticated encryption (AEAD)

use aes_gcm::{Aes256Gcm, KeyInit};
```

---

## Documentation Sections

### Summary Line

The first paragraph is the summary. Keep it concise and end with a period:

```rust
/// Derives a 256-bit encryption key from a password and salt using Argon2id.
```

### Extended Description

Add more detail after a blank line:

```rust
/// Derives a 256-bit encryption key from a password and salt using Argon2id.
///
/// This function uses memory-hard key derivation to protect against brute-force
/// attacks. The derived key is suitable for use with AES-256-GCM encryption.
///
/// The Argon2id parameters are tuned for browser/WASM environments:
/// - Memory: 64 MB
/// - Iterations: 3
/// - Parallelism: 4
```

---

## Common Documentation Sections

### Arguments

Document parameters with a dedicated section:

```rust
/// Encrypts data using AES-256-GCM.
///
/// # Arguments
///
/// * `plaintext` - The data to encrypt
/// * `key` - A 256-bit encryption key
/// * `nonce` - A 12-byte unique nonce (must never be reused with the same key)
///
/// # Returns
///
/// The ciphertext with the authentication tag appended.
pub fn encrypt(plaintext: &[u8], key: &[u8; 32], nonce: &[u8; 12]) -> Vec<u8> {
    // ...
}
```

### Return Values

Document what the function returns:

```rust
/// Decrypts the master key using the provided password.
///
/// # Returns
///
/// Returns `Ok(master_key)` containing the decrypted 32-byte master key,
/// or `Err(DecryptError)` if decryption fails (wrong password or corrupted data).
pub fn decrypt_master_key(
    password: &str,
    salt: &str,
    encrypted_key: &str,
    nonce: &str,
) -> Result<[u8; 32], DecryptError> {
    // ...
}
```

### Errors

Document error conditions:

```rust
/// Parses a hex string into bytes.
///
/// # Errors
///
/// Returns `Err(HexError::InvalidLength)` if the string has an odd number of characters.
/// Returns `Err(HexError::InvalidCharacter)` if the string contains non-hex characters.
pub fn hex_decode(hex: &str) -> Result<Vec<u8>, HexError> {
    // ...
}
```

### Panics

Document conditions that cause panics:

```rust
/// Gets the encryption key at the specified index.
///
/// # Panics
///
/// Panics if `index` is out of bounds.
pub fn get_key(&self, index: usize) -> &[u8; 32] {
    &self.keys[index]
}
```

### Safety (for unsafe code)

Document safety requirements for unsafe functions:

```rust
/// Reads raw bytes from the WebAssembly linear memory.
///
/// # Safety
///
/// The caller must ensure that:
/// * `ptr` points to valid, initialized memory
/// * `len` bytes starting from `ptr` are within bounds
/// * The memory is not being mutated by another thread
pub unsafe fn read_bytes(ptr: *const u8, len: usize) -> Vec<u8> {
    // ...
}
```

### Examples

Provide runnable examples with code blocks:

````rust
/// Converts a byte slice to a hexadecimal string.
///
/// # Examples
///
/// ```
/// use rust::hex_encode;
///
/// let bytes = [0xDE, 0xAD, 0xBE, 0xEF];
/// assert_eq!(hex_encode(&bytes), "deadbeef");
/// ```
///
/// Empty input produces an empty string:
///
/// ```
/// use rust::hex_encode;
///
/// assert_eq!(hex_encode(&[]), "");
/// ```
pub fn hex_encode(bytes: &[u8]) -> String {
    // ...
}
````

---

## Documenting Different Items

### Structs

```rust
/// The result of encrypting a master key.
///
/// This struct contains all the data needed to later decrypt the master key:
/// the encrypted key itself, the nonce used for encryption, and metadata.
#[wasm_bindgen]
pub struct EncryptedMasterKey {
    /// The encrypted master key as a hex string.
    ///
    /// This includes the 16-byte authentication tag appended to the ciphertext.
    pub encrypted_key_hex: String,

    /// The 12-byte nonce used for AES-GCM encryption, hex-encoded.
    ///
    /// This nonce must be stored alongside the encrypted key and provided
    /// during decryption. Never reuse a nonce with the same key.
    pub nonce_hex: String,
}
```

### Enums

```rust
/// Errors that can occur during cryptographic operations.
#[derive(Debug)]
pub enum CryptoError {
    /// The provided password is incorrect or the data is corrupted.
    ///
    /// AES-GCM authentication failed, indicating either wrong password
    /// (resulting in wrong derived key) or tampered ciphertext.
    DecryptionFailed,

    /// The input data has an invalid format.
    ///
    /// This occurs when hex strings have invalid characters or wrong length.
    InvalidFormat(String),

    /// Key derivation failed.
    ///
    /// This typically indicates invalid Argon2 parameters or memory issues.
    KeyDerivationFailed,
}
```

### Traits

````rust
/// A trait for types that can be securely zeroed from memory.
///
/// Implementing this trait ensures sensitive data (like encryption keys)
/// is properly cleared when no longer needed, preventing memory disclosure.
///
/// # Example
///
/// ```
/// use rust::SecureZero;
///
/// let mut key = [0u8; 32];
/// // ... use key ...
/// key.secure_zero(); // Key is now safely cleared
/// ```
pub trait SecureZero {
    /// Overwrites the memory with zeros in a way that won't be optimized away.
    fn secure_zero(&mut self);
}
````

### Functions with `wasm_bindgen`

````rust
/// Encrypts the master key using a password-derived key.
///
/// This is the main entry point for master key encryption from JavaScript.
/// It performs the following steps:
///
/// 1. Derives an encryption key from the password using Argon2id
/// 2. Generates a random 256-bit master key using the system CSPRNG
/// 3. Generates a random 12-byte nonce
/// 4. Encrypts the master key using AES-256-GCM
///
/// # Arguments
///
/// * `password` - The user's password (will be used for key derivation)
/// * `salt` - A salt for key derivation (typically the user's email)
///
/// # Returns
///
/// An `EncryptedMasterKey` struct containing:
/// - `encrypted_key_hex`: The encrypted master key with auth tag (hex)
/// - `nonce_hex`: The encryption nonce (hex)
///
/// # Example (JavaScript)
///
/// ```javascript
/// const wasm = await import('@/pkg/rust');
/// await wasm.default();
///
/// const result = wasm.encrypt_master_key("mypassword", "user@example.com");
/// console.log(result.encrypted_key_hex);
/// console.log(result.nonce_hex);
/// ```
///
/// # Security
///
/// - The master key is generated using `getrandom` (CSPRNG)
/// - Argon2id parameters: m=65536 KB, t=3, p=4
/// - AES-256-GCM provides authenticated encryption
#[wasm_bindgen]
pub fn encrypt_master_key(password: &str, salt: &str) -> EncryptedMasterKey {
    // ...
}
````

---

## Module-Level Documentation

Document modules in `lib.rs` or at the top of each module file:

````rust
//! # NoVault WASM Cryptography Module
//!
//! This crate provides client-side cryptographic operations for the NoVault
//! secure cloud storage application. All encryption happens in the browser
//! via WebAssembly, ensuring zero-knowledge encryption.
//!
//! ## Features
//!
//! - **Master Key Generation**: Secure random key generation with CSPRNG
//! - **Key Derivation**: Argon2id password-based key derivation
//! - **Encryption**: AES-256-GCM authenticated encryption
//! - **File Encryption**: Streaming file encryption for large files
//!
//! ## Security Model
//!
//! NoVault uses a hierarchical key structure:
//!
//! ```text
//! Password + Salt (email)
//!         │
//!         ▼ Argon2id
//!    Derived Key (DEK)
//!         │
//!         ▼ AES-256-GCM
//!    Master Key (encrypted)
//!         │
//!         ▼
//!    File Keys (per-file encryption)
//! ```
//!
//! ## Usage
//!
//! ```javascript
//! // In TypeScript/JavaScript
//! const wasm = await import('@/pkg/rust');
//! await wasm.default();
//!
//! // Encrypt master key
//! const encrypted = wasm.encrypt_master_key(password, email);
//!
//! // Later: decrypt master key
//! const result = wasm.decrypt_master_key(password, email, encrypted.encrypted_key_hex, encrypted.nonce_hex);
//! ```
//!
//! ## Modules
//!
//! - [`masterkey_generator`]: Master key generation and encryption
//! - [`masterkey_decryptor`]: Master key decryption
//! - [`encrypt_file`]: File encryption utilities

pub mod encrypt_file;
pub mod masterkey_decryptor;
pub mod masterkey_generator;
````

---

## Linking to Other Items

Use backticks and paths to create links:

```rust
/// Decrypts a master key that was encrypted with [`encrypt_master_key`].
///
/// See also:
/// - [`EncryptedMasterKey`] for the encryption result format
/// - [`CryptoError`] for possible error types
/// - [`masterkey_generator`] module for encryption
pub fn decrypt_master_key(...) -> Result<..., CryptoError> {
    // ...
}
```

---

## Code Blocks in Documentation

### Rust Code (default)

````rust
/// # Examples
///
/// ```
/// let key = derive_key("password", "salt");
/// assert_eq!(key.len(), 32);
/// ```
````

### Other Languages

````rust
/// # JavaScript Usage
///
/// ```javascript
/// const result = wasm.encrypt_master_key("password", "salt");
/// ```
````

### Ignored Code (won't be tested)

````rust
/// ```ignore
/// // This example requires external setup
/// let key = load_key_from_file("key.bin");
/// ```
````

### Code That Should Panic

````rust
/// # Panics
///
/// ```should_panic
/// let empty: [u8; 0] = [];
/// encrypt(&empty); // Panics on empty input
/// ```
````

### Code That Won't Compile (for illustration)

````rust
/// This won't work because keys must be 32 bytes:
///
/// ```compile_fail
/// let short_key = [0u8; 16];
/// encrypt(&data, &short_key); // Error: expected [u8; 32]
/// ```
````

---

## Attribute Documentation

### `#[doc]` Attribute

Use for special cases:

```rust
#[doc = "Encrypts data using the default algorithm (AES-256-GCM)."]
pub fn encrypt_default(data: &[u8]) -> Vec<u8> {
    // ...
}

// Include external markdown file
#[doc = include_str!("../docs/encryption.md")]
pub mod encryption;
```

### Hiding Items from Documentation

```rust
#[doc(hidden)]
pub fn internal_helper() {
    // This won't appear in generated docs
}
```

### Re-exports

```rust
/// Cryptographic utilities for NoVault.
pub mod crypto {
    #[doc(inline)]
    pub use crate::masterkey_generator::encrypt_master_key;
}
```

---

## Security-Sensitive Documentation

For cryptographic code, always include security notes:

```rust
/// Generates a cryptographically secure random nonce.
///
/// # Security
///
/// - Uses `getrandom` crate which provides OS-level CSPRNG
/// - On WASM, this uses `crypto.getRandomValues()` via the browser
/// - Nonces are 12 bytes (96 bits) as required by AES-GCM
/// - **CRITICAL**: Never reuse a nonce with the same key
///
/// # Panics
///
/// Panics if the system random number generator is unavailable.
fn generate_nonce() -> [u8; 12] {
    let mut nonce = [0u8; 12];
    getrandom::getrandom(&mut nonce).expect("CSPRNG unavailable");
    nonce
}
```

---

## Best Practices Summary

### DO (Recommended)

- ✅ Document all public items
- ✅ Write clear summary sentences ending with a period
- ✅ Include `# Arguments`, `# Returns`, `# Errors` sections
- ✅ Provide runnable examples with `# Examples`
- ✅ Document security implications for crypto code
- ✅ Use `# Safety` for all `unsafe` functions
- ✅ Link to related items with backticks
- ✅ Keep documentation in sync with code

### DON'T (Not Recommended)

- ❌ State the obvious (e.g., "Gets the value" for `get_value()`)
- ❌ Leave outdated documentation
- ❌ Omit documentation for public APIs
- ❌ Include sensitive information in examples
- ❌ Skip security notes for cryptographic functions
- ❌ Forget to document panic conditions

---

## Documentation Checklist

When reviewing or writing Rust documentation, verify:

- [ ] All public items have doc comments
- [ ] Summary is clear and ends with a period
- [ ] Arguments are documented in `# Arguments`
- [ ] Return values are documented in `# Returns`
- [ ] Errors are documented in `# Errors`
- [ ] Panic conditions are documented in `# Panics`
- [ ] Unsafe functions have `# Safety` sections
- [ ] Examples compile and run correctly
- [ ] Security implications are noted
- [ ] Cross-references use proper linking syntax
- [ ] Module-level docs explain the purpose
