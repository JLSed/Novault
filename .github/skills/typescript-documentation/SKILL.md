---
name: typescript-documentation
description: 'This skill provides guidelines for documenting TypeScript/JavaScript code in the NoVault project. Triggers on requests like "add documentation", "document this function", "add JSDoc", "write comments". Ensures consistent, high-quality documentation across the codebase using JSDoc and TSDoc standards.'
---

# TypeScript Documentation (JSDoc/TSDoc) Best Practices

This skill provides comprehensive guidelines for documenting TypeScript and JavaScript code in the NoVault project.

## General Principles

1. **All exported functions, classes, interfaces, and types should be documented** with JSDoc comments.
2. It is encouraged to document internal/private members as well, especially if they are complex or not self-explanatory.
3. Documentation should explain the **why**, not just the **what** — the code itself shows what it does.

---

## JSDoc Comment Structure

### Basic Format

```typescript
/**
 * Summary description of the function. This should be a concise overview
 * of what the function does and ends with a period.
 *
 * @param paramName - Description of the parameter
 * @returns Description of the return value
 */
```

### Summary Description

- The first sentence is the summary description
- Should be a concise overview of what the member does
- Must end with a period
- Should be written in third person (e.g., "Gets the user profile" not "Get the user profile")

---

## Documentation Tags

### Parameters (`@param`)

Use `@param` for function and method parameters:

```typescript
/**
 * Encrypts a file using the user's master key.
 *
 * @param file - The file to encrypt
 * @param masterKey - The user's decrypted master key in hex format
 * @param options - Optional encryption settings
 */
```

**Guidelines:**

- Description starts with an uppercase letter
- Does not end with a period (unless multiple sentences)
- Use a hyphen `-` after the parameter name for clarity

### Return Values (`@returns`)

Use `@returns` to document return values:

```typescript
/**
 * Retrieves the user's profile from the database.
 *
 * @param userId - The unique identifier of the user
 * @returns The user profile object, or null if not found
 */
async function getUserProfile(userId: string): Promise<UserProfile | null>;
```

### Exceptions (`@throws`)

Use `@throws` to document exceptions:

```typescript
/**
 * Decrypts the master key using the provided password.
 *
 * @param password - The user's password
 * @param encryptedKey - The encrypted master key
 * @throws {DecryptionError} When the password is incorrect
 * @throws {ValidationError} When the encrypted key format is invalid
 */
```

### Type Parameters (`@typeParam` or `@template`)

Use for generic types:

```typescript
/**
 * Creates a cached version of an async function.
 *
 * @typeParam T - The return type of the function
 * @param fn - The async function to cache
 * @returns A cached version of the function
 */
function createCached<T>(fn: () => Promise<T>): () => Promise<T>;
```

### Examples (`@example`)

Provide usage examples for complex functions:

````typescript
/**
 * Formats a file size in bytes to a human-readable string.
 *
 * @param bytes - The size in bytes
 * @returns A formatted string like "1.5 MB"
 *
 * @example
 * ```typescript
 * formatFileSize(1024);       // "1 KB"
 * formatFileSize(1048576);    // "1 MB"
 * formatFileSize(1073741824); // "1 GB"
 * ```
 */
````

### Deprecation (`@deprecated`)

Mark deprecated members and provide alternatives:

```typescript
/**
 * @deprecated Use `encryptWithMasterKey` instead. Will be removed in v2.0.
 */
function oldEncrypt(data: string): string;
```

### See Also (`@see`)

Reference related documentation:

```typescript
/**
 * Derives an encryption key from a password using Argon2.
 *
 * @see {@link encryptMasterKey} for the encryption process
 * @see https://github.com/nicovault/spec for the encryption spec
 */
```

### Since (`@since`)

Indicate when a feature was introduced:

```typescript
/**
 * Enables biometric authentication for the vault.
 *
 * @since 1.2.0
 */
```

---

## Documenting Different Code Elements

### Interfaces and Types

```typescript
/**
 * Represents a user's encrypted secrets stored in the database.
 */
export interface UserSecret {
  /** The unique identifier of the user. */
  user_id: string;

  /** The salt used for key derivation, typically the user's email. */
  salt: string;

  /** The master key encrypted with the user's password-derived key. */
  encrypted_master_key: string;

  /** The nonce used for AES-256-GCM encryption (12 bytes, hex-encoded). */
  mk_nonce: string;

  /** Timestamp when the secrets were created. */
  created_at: string;

  /** Timestamp when the secrets were last updated. */
  updated_at: string;
}
```

### React Components

````typescript
/**
 * A modal dialog for setting up the user's master encryption key.
 *
 * This component guides the user through creating a strong password
 * that will be used to encrypt their master key. The master key is
 * generated client-side using WASM and never leaves the browser.
 *
 * @param props - The component props
 * @param props.isOpen - Whether the modal is visible
 * @param props.userEmail - The user's email (used as salt)
 * @param props.userId - The user's unique identifier
 * @param props.onComplete - Callback fired when setup completes successfully
 *
 * @example
 * ```tsx
 * <SetupMasterKeyModal
 *   isOpen={showModal}
 *   userEmail="user@example.com"
 *   userId="123"
 *   onComplete={() => setShowModal(false)}
 * />
 * ```
 */
export default function SetupMasterKeyModal({
  isOpen,
  userEmail,
  userId,
  onComplete,
}: SetupMasterKeyModalProps);
````

### Server Actions (Next.js)

````typescript
/**
 * Saves the user's encrypted secrets to the database.
 *
 * This server action stores the encrypted master key and associated
 * metadata. The actual master key is encrypted client-side before
 * being sent to this action, ensuring zero-knowledge encryption.
 *
 * @param input - The secrets to save
 * @param input.userId - The user's unique identifier
 * @param input.salt - The salt used for key derivation
 * @param input.encryptedMasterKey - The encrypted master key (hex-encoded)
 * @param input.nonce - The encryption nonce (hex-encoded)
 * @returns A result object indicating success or failure
 *
 * @example
 * ```typescript
 * const result = await saveUserSecrets({
 *   userId: "123",
 *   salt: "user@example.com",
 *   encryptedMasterKey: "a1b2c3...",
 *   nonce: "d4e5f6...",
 * });
 *
 * if (!result.success) {
 *   console.error(result.error);
 * }
 * ```
 */
export async function saveUserSecrets(
  input: SaveUserSecretsInput,
): Promise<SaveUserSecretsResult>;
````

### Utility Functions

````typescript
/**
 * Creates a Supabase client configured for server-side usage.
 *
 * This client automatically handles cookie-based authentication
 * and should only be used in Server Components or Server Actions.
 *
 * @returns A configured Supabase client instance
 *
 * @remarks
 * Always use the `api` schema for queries:
 * ```typescript
 * const supabase = await createClient();
 * const { data } = await supabase.schema("api").from("users").select("*");
 * ```
 */
export async function createClient(): Promise<SupabaseClient>;
````

---

## Inline Code Documentation

### Using `{@code}` and `{@link}`

```typescript
/**
 * Converts a hex string to a {@link Uint8Array}.
 *
 * The input must be a valid hex string with an even number of characters.
 * For example, {@code "a1b2c3"} becomes {@code Uint8Array([161, 178, 195])}.
 */
```

---

## Comments for Complex Logic

For complex algorithms or non-obvious code, use inline comments:

```typescript
async function deriveKey(password: string, salt: string): Promise<CryptoKey> {
  // Use Argon2id for password-based key derivation
  // Parameters: memory=64MB, iterations=3, parallelism=4
  // These settings balance security and performance for browser environments
  const derivedBytes = await argon2id(password, salt, {
    memory: 65536,
    iterations: 3,
    parallelism: 4,
    hashLength: 32,
  });

  // Import the derived bytes as an AES-GCM key
  // This key will be used to encrypt/decrypt the master key
  return crypto.subtle.importKey(
    "raw",
    derivedBytes,
    { name: "AES-GCM" },
    false, // non-extractable for security
    ["encrypt", "decrypt"],
  );
}
```

---

## File-Level Documentation

Add a comment at the top of files to describe their purpose:

```typescript
/**
 * @fileoverview Server actions for user authentication and secrets management.
 *
 * This module contains all server-side operations related to user profiles
 * and encrypted secrets. All database queries use the `api` schema as per
 * project guidelines.
 *
 * @module app/home/actions
 */

"use server";

import { createClient } from "@/utils/supabase/server";
// ...
```

---

## Security-Sensitive Documentation

For cryptographic and security-related code, include security notes:

```typescript
/**
 * Encrypts the master key using AES-256-GCM.
 *
 * @param masterKey - The plaintext master key (32 bytes)
 * @param encryptionKey - The key derived from the user's password
 * @returns The encrypted master key with nonce
 *
 * @security
 * - The master key is generated using a CSPRNG
 * - AES-256-GCM provides authenticated encryption
 * - A unique 12-byte nonce is generated for each encryption
 * - The master key never leaves the client unencrypted
 */
```

---

## Best Practices Summary

### DO (Recommended)

- ✅ Document all exported members
- ✅ Write clear, concise summary sentences
- ✅ Include parameter and return value descriptions
- ✅ Add examples for complex functions
- ✅ Document security implications for crypto code
- ✅ Keep documentation in sync with code changes
- ✅ Use TypeScript types as part of documentation

### DON'T (Not Recommended)

- ❌ State the obvious (e.g., `@param id - the id`)
- ❌ Leave outdated documentation
- ❌ Write documentation that just repeats the function name
- ❌ Omit documentation for public APIs
- ❌ Include sensitive information in examples

---

## Documentation Checklist

When reviewing or writing documentation, verify:

- [ ] All exported functions have JSDoc comments
- [ ] Summary description is clear and ends with a period
- [ ] All parameters are documented with `@param`
- [ ] Return values are documented with `@returns`
- [ ] Exceptions are documented with `@throws`
- [ ] Complex logic has inline comments
- [ ] Security implications are noted where applicable
- [ ] Examples are provided for non-trivial functions
- [ ] Documentation matches the actual implementation
