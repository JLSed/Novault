"use client";

import { useState } from "react";
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

    try {
      const wasm = await import("@/pkg/rust");
      await wasm.default();

      const salt = userEmail;
      const encryptedResult = wasm.encrypt_master_key(password, salt);

      const result = await saveUserSecrets({
        userId,
        salt,
        encryptedMasterKey: encryptedResult.encrypted_key_hex,
        nonce: encryptedResult.nonce_hex,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to save master key");
      }

      onComplete();
    } catch (err) {
      console.error("Error setting up master key:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
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
            className="bg-primary text-background p-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed mt-4 transition-opacity hover:opacity-90"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
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
