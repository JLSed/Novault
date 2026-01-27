"use client";

import { useState } from "react";
import { useConsole } from "@/components/ConsoleContext";
import { saveUserSecrets } from "@/app/home/actions";

interface SetupMasterKeyModalProps {
  isOpen: boolean;
  userEmail: string;
  userId: string;
  onComplete: () => void;
}

export default function SetupMasterKeyModal({
  isOpen,
  userEmail,
  userId,
  onComplete,
}: SetupMasterKeyModalProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addLog, clearLogs } = useConsole();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password) {
      setError("Password is required");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    clearLogs();

    try {
      addLog("info", "Initializing WASM module...");
      const wasm = await import("@/pkg/rust");
      await wasm.default();
      addLog("success", "WASM module loaded");

      addLog("info", "Generating salt from email...");
      const salt = userEmail;

      addLog("info", "Deriving encryption key from password...");
      addLog("info", "Generating random master key...");
      addLog("info", "Generating 12-byte nonce...");
      addLog("info", "Encrypting master key with AES-256-GCM...");

      const encryptedResult = wasm.encrypt_master_key(password, salt);

      addLog("key", "Nonce (12 bytes)", encryptedResult.nonce_hex);
      // addLog("key", "Auth Tag (16 bytes)", encryptedResult.auth_tag_hex);
      addLog("key", "Encrypted Master Key", encryptedResult.encrypted_key_hex);

      addLog("info", "Saving encrypted master key to database...");

      // Save to database
      const result = await saveUserSecrets({
        userId,
        salt,
        encryptedMasterKey: encryptedResult.encrypted_key_hex,
        nonce: encryptedResult.nonce_hex,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to save master key");
      }

      addLog("success", "Master key setup complete!");
      onComplete();
    } catch (err) {
      console.error("Error setting up master key:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      addLog("error", "Setup failed", errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-xl p-8 w-full max-w-md mx-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-foreground">
            Setup Master Key
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm font-medium">
              Master Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-foreground/20 p-3 rounded-lg text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter your master password"
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="border border-foreground/20 p-3 rounded-lg text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Confirm your master password"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password || !confirmPassword}
            className="bg-primary text-background p-3 rounded-lg font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-4 transition-opacity hover:opacity-90"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Setting up...
              </span>
            ) : (
              "Generate Master Key"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
