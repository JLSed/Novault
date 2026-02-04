"use client";

import { useState, useRef } from "react";
import { getUserSecrets } from "@/app/home/actions";

interface FileEncryptorProps {
  userId: string;
}

interface EncryptionResult {
  success: boolean;
  encryptedData?: Uint8Array;
  nonceHex?: string;
  originalHashHex?: string;
  fileName?: string;
  error?: string;
}

export default function FileEncryptor({ userId }: FileEncryptorProps) {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EncryptionResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Handles file selection from the file input
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    console.log("[FileEncryptor] File selected:", selectedFile?.name);
    setFile(selectedFile);
    setResult(null);
  };

  /**
   * Encrypts the selected file using AES-256-GCM with the master key
   */
  const handleEncrypt = async () => {
    if (!file || !password) {
      console.log("[FileEncryptor] Missing file or password");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      console.log("[FileEncryptor] Starting encryption for user:", userId);
      console.log("[FileEncryptor] File name:", file.name);
      console.log("[FileEncryptor] File size:", file.size, "bytes");

      // Step 1: Get user secrets from the database
      console.log("[FileEncryptor] Fetching user secrets...");
      const secrets = await getUserSecrets(userId);

      if (!secrets) {
        throw new Error("No secrets found for this user");
      }

      // Step 2: Load WASM module
      console.log("[FileEncryptor] Loading WASM module...");
      const wasm = await import("@/pkg/rust");
      await wasm.default();

      // Step 3: Read file as ArrayBuffer
      console.log("[FileEncryptor] Reading file...");
      const fileBuffer = await file.arrayBuffer();
      const fileData = new Uint8Array(fileBuffer);
      console.log("[FileEncryptor] File read, size:", fileData.length, "bytes");

      // Step 4: Encrypt the file
      console.log("[FileEncryptor] Encrypting file...");
      const encryptResult = wasm.encrypt_file(
        fileData,
        password,
        secrets.salt,
        secrets.encrypted_master_key,
        secrets.mk_nonce,
      );

      if (!encryptResult.success) {
        console.error(
          "[FileEncryptor] File encryption failed:",
          encryptResult.error_message,
        );
        throw new Error(
          `File encryption failed: ${encryptResult.error_message}`,
        );
      }

      console.log("[FileEncryptor] File encrypted successfully");
      console.log("[FileEncryptor] Nonce:", encryptResult.nonce_hex);
      console.log(
        "[FileEncryptor] Original file hash:",
        encryptResult.original_hash_hex,
      );
      console.log(
        "[FileEncryptor] Encrypted size:",
        encryptResult.encrypted_data.length,
        "bytes",
      );

      setResult({
        success: true,
        encryptedData: encryptResult.encrypted_data,
        nonceHex: encryptResult.nonce_hex,
        originalHashHex: encryptResult.original_hash_hex,
        fileName: file.name,
      });
    } catch (err) {
      console.error("[FileEncryptor] Error during encryption:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setResult({
        success: false,
        error: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Downloads the encrypted file
   */
  const handleDownload = () => {
    if (!result?.encryptedData || !result?.fileName) {
      console.log("[FileEncryptor] No encrypted data to download");
      return;
    }

    console.log("[FileEncryptor] Downloading encrypted file...");
    // Create a new Uint8Array copy with a proper ArrayBuffer for Blob compatibility
    const dataCopy = new Uint8Array(result.encryptedData);
    const blob = new Blob([dataCopy.buffer as ArrayBuffer], {
      type: "application/octet-stream",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${result.fileName}.encrypted`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log("[FileEncryptor] Download initiated");
  };

  /**
   * Clears the current state
   */
  const handleClear = () => {
    setFile(null);
    setPassword("");
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full max-w-md p-4 border border-foreground/20 rounded">
      <h1 className="text-xl font-bold mb-4">Testing: File Encryptor</h1>

      <div className="flex flex-col gap-3">
        {/* File Input */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-foreground/70">Select File</label>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="border border-foreground/20 p-2 rounded text-foreground bg-background file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:bg-foreground/10 file:text-foreground file:cursor-pointer"
            disabled={loading}
          />
          {file && (
            <span className="text-xs text-foreground/50">
              {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </span>
          )}
        </div>

        {/* Password Input */}
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleEncrypt()}
          className="border border-foreground/20 p-2 rounded text-foreground bg-background"
          placeholder="Enter master password"
          disabled={loading}
        />

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleEncrypt}
            disabled={loading || !file || !password}
            className="flex-1 bg-foreground text-background p-2 rounded   disabled:opacity-50"
          >
            {loading ? "Encrypting..." : "Encrypt"}
          </button>

          {(file || result) && (
            <button
              onClick={handleClear}
              className="px-4 py-2 border border-foreground/20 rounded  "
              disabled={loading}
            >
              Clear
            </button>
          )}
        </div>

        {/* Result Display */}
        {result && (
          <div
            className={`p-3 rounded text-sm ${
              result.success
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {result.success ? (
              <div className="flex flex-col gap-2">
                <span className="font-semibold">✓ Encryption Successful!</span>

                <div className="flex flex-col gap-1">
                  <span className="font-medium">Nonce (12 bytes):</span>
                  <code className="text-xs break-all bg-green-200 p-1 rounded">
                    {result.nonceHex}
                  </code>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="font-medium">
                    Original File Hash (SHA-256):
                  </span>
                  <code className="text-xs break-all bg-green-200 p-1 rounded">
                    {result.originalHashHex}
                  </code>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="font-medium">Encrypted Size:</span>
                  <span className="text-xs">
                    {result.encryptedData?.length.toLocaleString()} bytes
                  </span>
                </div>

                <button
                  onClick={handleDownload}
                  className="mt-2 bg-green-600 text-white p-2 rounded   hover:bg-green-700"
                >
                  Download Encrypted File
                </button>
              </div>
            ) : (
              <span>✗ {result.error}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
