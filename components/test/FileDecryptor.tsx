"use client";

import { useState, useRef } from "react";
import { getUserSecrets } from "@/app/home/actions";

interface FileDecryptorProps {
  userId: string;
}

interface DecryptionResult {
  success: boolean;
  decryptedData?: Uint8Array;
  fileHashHex?: string;
  originalFileName?: string;
  error?: string;
}

export default function FileDecryptor({ userId }: FileDecryptorProps) {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [nonceHex, setNonceHex] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DecryptionResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Handles file selection from the file input
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    console.log("[FileDecryptor] File selected:", selectedFile?.name);
    setFile(selectedFile);
    setResult(null);
  };

  /**
   * Decrypts the selected encrypted file using AES-256-GCM with the master key
   */
  const handleDecrypt = async () => {
    if (!file || !password || !nonceHex) {
      console.log("[FileDecryptor] Missing file, password, or nonce");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      console.log("[FileDecryptor] Starting decryption for user:", userId);
      console.log("[FileDecryptor] File name:", file.name);
      console.log("[FileDecryptor] File size:", file.size, "bytes");

      // Step 1: Get user secrets from the database
      console.log("[FileDecryptor] Fetching user secrets...");
      const secrets = await getUserSecrets(userId);

      if (!secrets) {
        throw new Error("No secrets found for this user");
      }

      // Step 2: Load WASM module
      console.log("[FileDecryptor] Loading WASM module...");
      const wasm = await import("@/pkg/rust");
      await wasm.default();

      // Step 3: Decrypt the master key using the password
      console.log("[FileDecryptor] Decrypting master key...");
      const decryptKeyResult = wasm.decrypt_master_key(
        password,
        secrets.salt,
        secrets.encrypted_master_key,
        secrets.mk_nonce,
      );

      if (!decryptKeyResult.success) {
        console.error(
          "[FileDecryptor] Master key decryption failed:",
          decryptKeyResult.error_message,
        );
        throw new Error(
          `Master key decryption failed: ${decryptKeyResult.error_message}`,
        );
      }

      console.log("[FileDecryptor] Master key decrypted successfully");
      const masterKeyHex = decryptKeyResult.master_key_hex;

      // Step 4: Read encrypted file as ArrayBuffer
      console.log("[FileDecryptor] Reading encrypted file...");
      const fileBuffer = await file.arrayBuffer();
      const encryptedData = new Uint8Array(fileBuffer);
      console.log(
        "[FileDecryptor] File read, size:",
        encryptedData.length,
        "bytes",
      );

      // Step 5: Decrypt the file using the master key and nonce
      console.log("[FileDecryptor] Decrypting file...");
      const decryptResult = wasm.decrypt_file(
        encryptedData,
        masterKeyHex,
        nonceHex.trim(),
      );

      if (!decryptResult.success) {
        console.error(
          "[FileDecryptor] File decryption failed:",
          decryptResult.error_message,
        );
        throw new Error(
          `File decryption failed: ${decryptResult.error_message}`,
        );
      }

      console.log("[FileDecryptor] File decrypted successfully");
      console.log(
        "[FileDecryptor] Decrypted file hash:",
        decryptResult.file_hash_hex,
      );
      console.log(
        "[FileDecryptor] Decrypted size:",
        decryptResult.decrypted_data.length,
        "bytes",
      );

      // Derive original filename by removing .encrypted extension
      const originalFileName = file.name.endsWith(".encrypted")
        ? file.name.slice(0, -10)
        : `decrypted_${file.name}`;

      setResult({
        success: true,
        decryptedData: decryptResult.decrypted_data,
        fileHashHex: decryptResult.file_hash_hex,
        originalFileName,
      });
    } catch (err) {
      console.error("[FileDecryptor] Error during decryption:", err);
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
   * Downloads the decrypted file
   */
  const handleDownload = () => {
    if (!result?.decryptedData || !result?.originalFileName) {
      console.log("[FileDecryptor] No decrypted data to download");
      return;
    }

    console.log("[FileDecryptor] Downloading decrypted file...");
    // Create a new Uint8Array copy with a proper ArrayBuffer for Blob compatibility
    const dataCopy = new Uint8Array(result.decryptedData);
    const blob = new Blob([dataCopy.buffer as ArrayBuffer], {
      type: "application/octet-stream",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.originalFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log("[FileDecryptor] Download initiated");
  };

  /**
   * Clears the current state
   */
  const handleClear = () => {
    setFile(null);
    setPassword("");
    setNonceHex("");
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full max-w-md p-4 border border-foreground/20 rounded">
      <h1 className="text-xl font-bold mb-4">Testing: File Decryptor</h1>

      <div className="flex flex-col gap-3">
        {/* File Input */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-foreground/70">
            Select Encrypted File
          </label>
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

        {/* Nonce Input */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-foreground/70">
            Nonce (from encryption)
          </label>
          <input
            type="text"
            value={nonceHex}
            onChange={(e) => setNonceHex(e.target.value)}
            className="border border-foreground/20 p-2 rounded text-foreground bg-background font-mono text-sm"
            placeholder="Enter 24-character hex nonce"
            disabled={loading}
          />
        </div>

        {/* Password Input */}
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleDecrypt()}
          className="border border-foreground/20 p-2 rounded text-foreground bg-background"
          placeholder="Enter master password"
          disabled={loading}
        />

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleDecrypt}
            disabled={loading || !file || !password || !nonceHex}
            className="flex-1 bg-foreground text-background p-2 rounded cursor-pointer disabled:opacity-50"
          >
            {loading ? "Decrypting..." : "Decrypt"}
          </button>

          {(file || result) && (
            <button
              onClick={handleClear}
              className="px-4 py-2 border border-foreground/20 rounded cursor-pointer"
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
                <span className="font-semibold">✓ Decryption Successful!</span>

                <div className="flex flex-col gap-1">
                  <span className="font-medium">
                    Decrypted File Hash (SHA-256):
                  </span>
                  <code className="text-xs break-all bg-green-200 p-1 rounded">
                    {result.fileHashHex}
                  </code>
                  <span className="text-xs text-green-600">
                    Compare this with the original file hash to verify integrity
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="font-medium">Decrypted Size:</span>
                  <span className="text-xs">
                    {result.decryptedData?.length.toLocaleString()} bytes
                  </span>
                </div>

                <button
                  onClick={handleDownload}
                  className="mt-2 bg-green-600 text-white p-2 rounded cursor-pointer hover:bg-green-700"
                >
                  Download Decrypted File
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
