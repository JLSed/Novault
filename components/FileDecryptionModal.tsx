"use client";

import { useState, useCallback } from "react";
import { X, Lock, Loader2, AlertCircle, Download, Eye } from "lucide-react";
import {
  FileMetadata,
  getFileDek,
  getUserSecretsForDecryption,
} from "@/app/home/storage/actions";
import { HexToUint8Array } from "@/utils/hexUtils";
import { createClient } from "@/services/supabase/client";

/** Props for the FileDecryptionModal component */
interface FileDecryptionModalProps {
  file: FileMetadata;
  isOpen: boolean;
  onClose: () => void;
}

/** Decryption progress steps */
type DecryptionStep =
  | "idle"
  | "fetching-keys"
  | "downloading-file"
  | "decrypting-key"
  | "decrypting-file"
  | "done"
  | "error";

/** Labels displayed for each decryption step */
const stepLabels: Record<DecryptionStep, string> = {
  idle: "",
  "fetching-keys": "Fetching file keys...",
  "downloading-file": "Downloading encrypted file...",
  "decrypting-key": "Decrypting file key...",
  "decrypting-file": "Decrypting file content...",
  done: "Decryption complete!",
  error: "Decryption failed",
};

/**
 * Determines the MIME type based on file extension for rendering.
 *
 * @param fileName - The name of the file
 * @returns The MIME type string
 */
function getMimeType(fileName: string): string {
  const ext =
    fileName.lastIndexOf(".") !== -1
      ? fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase()
      : "";

  const mimeMap: Record<string, string> = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    svg: "image/svg+xml",
    txt: "text/plain",
    csv: "text/csv",
    json: "application/json",
    xml: "application/xml",
    html: "text/html",
  };

  return mimeMap[ext] ?? "application/octet-stream";
}

/**
 * Extracts the storage path from a full public URL or path.
 * The file_path in DB may be a full public URL or a relative path.
 *
 * @param filePath - The file path from the database
 * @returns The relative storage path
 */
function extractStoragePath(filePath: string): string {
  // If it's a full URL, extract the path after /storage/v1/object/public/{bucket}/
  const publicPrefix = "/storage/v1/object/public/storage/";
  const idx = filePath.indexOf(publicPrefix);
  if (idx !== -1) {
    return filePath.substring(idx + publicPrefix.length);
  }

  // If it contains the bucket name at the start, strip it
  if (filePath.startsWith("storage/")) {
    return filePath.substring("storage/".length);
  }

  return filePath;
}

/**
 * FileDecryptionModal handles the complete file decryption workflow:
 * 1. Prompts user for master password
 * 2. Fetches DEK and user secrets from the database
 * 3. Downloads the encrypted file from Supabase storage
 * 4. Decrypts using WASM (X25519 + AES-256-GCM)
 * 5. Displays the decrypted file content or error
 */
export default function FileDecryptionModal({
  file,
  isOpen,
  onClose,
}: FileDecryptionModalProps) {
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<DecryptionStep>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [decryptedData, setDecryptedData] = useState<Uint8Array | null>(null);
  const [decryptedBlobUrl, setDecryptedBlobUrl] = useState<string | null>(null);

  /**
   * Resets modal state to initial values.
   */
  const resetState = useCallback(() => {
    setPassword("");
    setStep("idle");
    setErrorMessage("");
    if (decryptedBlobUrl) {
      URL.revokeObjectURL(decryptedBlobUrl);
    }
    setDecryptedData(null);
    setDecryptedBlobUrl(null);
  }, [decryptedBlobUrl]);

  /**
   * Handles closing the modal and cleaning up state.
   */
  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  /**
   * Runs the full decryption pipeline.
   */
  const handleDecrypt = async () => {
    if (!password.trim()) return;

    setErrorMessage("");

    try {
      // Step 1: Fetch DEK and user secrets
      setStep("fetching-keys");
      console.log(
        "[FileDecryptionModal] Fetching keys for file:",
        file.file_id,
      );

      const [dekResult, secretsResult] = await Promise.all([
        getFileDek(file.file_id),
        getUserSecretsForDecryption(),
      ]);

      if (!dekResult.success || !dekResult.dek) {
        throw new Error(
          dekResult.error ?? "Failed to fetch file encryption key",
        );
      }

      if (!secretsResult.success || !secretsResult.secrets) {
        throw new Error(secretsResult.error ?? "Failed to fetch user secrets");
      }

      const { dek } = dekResult;
      const { secrets } = secretsResult;

      console.log("[FileDecryptionModal] Keys fetched successfully");

      // Step 2: Download encrypted file from storage
      setStep("downloading-file");
      console.log(
        "[FileDecryptionModal] Downloading encrypted file from:",
        file.file_path,
      );

      const supabase = createClient();
      const storagePath = extractStoragePath(file.file_path);
      console.log("[FileDecryptionModal] Storage path:", storagePath);

      const { data: fileBlob, error: downloadError } = await supabase.storage
        .from("storage")
        .download(storagePath);

      if (downloadError || !fileBlob) {
        throw new Error(
          downloadError?.message ?? "Failed to download encrypted file",
        );
      }

      const encryptedData = new Uint8Array(await fileBlob.arrayBuffer());
      console.log(
        "[FileDecryptionModal] Downloaded",
        encryptedData.length,
        "bytes",
      );

      // Step 3: Decrypt the file key
      setStep("decrypting-key");
      console.log("[FileDecryptionModal] Loading WASM module...");

      const wasm = await import("@/pkg/rust");
      await wasm.default();

      // Step 4: Decrypt file content
      setStep("decrypting-file");
      console.log("[FileDecryptionModal] Decrypting file...");

      const encryptedPrivateKeyBytes = HexToUint8Array(
        secrets.encrypted_private_key,
      );
      const pkNonceBytes = HexToUint8Array(secrets.pk_nonce);
      const ephemeralPublicKeyBytes = HexToUint8Array(dek.ephemeral_public_key);
      const encryptedDekBytes = HexToUint8Array(dek.encrypted_dek);
      const dekNonceBytes = HexToUint8Array(dek.dek_nonce);
      const fileNonceBytes = HexToUint8Array(file.file_nonce);

      const decryptResult = wasm.decrypt_file(
        encryptedData,
        password,
        secrets.pk_salt,
        encryptedPrivateKeyBytes,
        pkNonceBytes,
        ephemeralPublicKeyBytes,
        encryptedDekBytes,
        dekNonceBytes,
        fileNonceBytes,
      );

      if (!decryptResult.success) {
        throw new Error(
          decryptResult.error_message ||
            "Decryption failed. Check your password.",
        );
      }

      console.log(
        "[FileDecryptionModal] Decryption successful, hash:",
        decryptResult.file_hash_hex,
      );

      // Create blob URL for viewing
      const mimeType = getMimeType(file.file_name);
      const dataCopy = new Uint8Array(decryptResult.decrypted_data);
      setDecryptedData(dataCopy);

      const blob = new Blob([dataCopy.buffer as ArrayBuffer], {
        type: mimeType,
      });
      const blobUrl = URL.createObjectURL(blob);
      setDecryptedBlobUrl(blobUrl);

      setStep("done");
    } catch (err) {
      console.error("[FileDecryptionModal] Decryption error:", err);
      const message = err instanceof Error ? err.message : String(err);
      setErrorMessage(message);
      setStep("error");
    }
  };

  /**
   * Downloads the decrypted file to the user's device.
   */
  const handleDownload = () => {
    if (!decryptedData) return;

    console.log("[FileDecryptionModal] Downloading decrypted file...");
    const mimeType = getMimeType(file.file_name);
    const blob = new Blob([decryptedData.buffer as ArrayBuffer], {
      type: mimeType,
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    // Remove .encrypted extension if present
    const downloadName = file.file_name.endsWith(".encrypted")
      ? file.file_name.slice(0, -10)
      : file.file_name;
    a.download = downloadName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  const isLoading = step !== "idle" && step !== "done" && step !== "error";

  // If decryption is complete, show the file content viewer
  if (step === "done" && decryptedBlobUrl) {
    const mimeType = getMimeType(file.file_name);
    const isPdf = mimeType === "application/pdf";
    const isImage = mimeType.startsWith("image/");
    const isText =
      mimeType.startsWith("text/") ||
      mimeType === "application/json" ||
      mimeType === "application/xml";
    const displayName = file.file_name.endsWith(".encrypted")
      ? file.file_name.slice(0, -10)
      : file.file_name;

    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-black/60 backdrop-blur-sm">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <Eye size={20} className="text-primary shrink-0" />
            <h2 className="text-base font-semibold text-foreground truncate">
              {displayName}
            </h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
            >
              <Download size={16} />
              Download
            </button>
            <button
              onClick={handleClose}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-300 text-foreground rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X size={16} />
              Close
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-auto bg-gray-100">
          {isPdf ? (
            <iframe
              src={decryptedBlobUrl}
              className="w-full h-full"
              title={displayName}
            />
          ) : isImage ? (
            <div className="flex items-center justify-center min-h-full p-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={decryptedBlobUrl}
                alt={displayName}
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              />
            </div>
          ) : isText ? (
            <TextFileViewer blobUrl={decryptedBlobUrl} />
          ) : (
            <div className="flex flex-col items-center justify-center min-h-full p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center mb-4">
                <Eye size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                Preview not available
              </h3>
              <p className="text-sm text-gray-500 mb-6 max-w-sm">
                This file type cannot be previewed in the browser. You can
                download it instead.
              </p>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-6 py-3 text-sm font-medium bg-primary text-white rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
              >
                <Download size={18} />
                Download File
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Password prompt / loading / error state
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Lock size={20} className="text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              View Encrypted File
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {/* File info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-foreground truncate">
              {file.file_name}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Uploaded{" "}
              {new Date(file.uploaded_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>

          {/* Error display */}
          {step === "error" && errorMessage && (
            <div className="mb-4 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  Decryption failed
                </p>
                <p className="text-xs text-red-600 mt-1">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Loading state with step indicator */}
          {isLoading && (
            <div className="mb-4 flex items-center justify-center gap-3 py-8 text-center">
              <Loader2
                size={24}
                className="text-primary animate-spin shrink-0"
              />
              <p className="text-sm font-medium text-foreground">
                {stepLabels[step]}
              </p>
            </div>
          )}

          {/* Password input */}
          {!isLoading && (
            <>
              <label
                htmlFor="decrypt-password"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Enter your master password to view this file
              </label>
              <input
                id="decrypt-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && password.trim() && handleDecrypt()
                }
                className="w-full border border-gray-300 p-3 rounded-lg text-foreground bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Master password"
                autoFocus
                disabled={isLoading}
              />
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-foreground border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleDecrypt}
            disabled={isLoading || !password.trim()}
            className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Decrypting...
              </span>
            ) : step === "error" ? (
              "Retry"
            ) : (
              "View File"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * TextFileViewer renders text-based file content from a blob URL.
 */
function TextFileViewer({ blobUrl }: { blobUrl: string }) {
  const [text, setText] = useState<string | null>(null);

  if (text === null) {
    fetch(blobUrl)
      .then((res) => res.text())
      .then(setText)
      .catch(() => setText("Failed to load text content"));
  }

  return (
    <div className="p-8">
      <pre className="bg-white p-6 rounded-lg shadow-sm text-sm text-foreground overflow-auto whitespace-pre-wrap font-mono max-w-4xl mx-auto">
        {text ?? "Loading..."}
      </pre>
    </div>
  );
}
