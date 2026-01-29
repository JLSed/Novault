"use client";

import { useState } from "react";
import { getUserSecrets } from "@/app/home/actions";

interface VerifyMasterKeyProps {
  userId: string;
}

export default function VerifyMasterKey({ userId }: VerifyMasterKeyProps) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    masterKey?: string;
    error?: string;
  } | null>(null);

  const handleVerify = async () => {
    if (!password) return;

    setLoading(true);
    setResult(null);

    try {
      const secrets = await getUserSecrets(userId);

      if (!secrets) {
        throw new Error("No secrets found for this user");
      }

      const wasm = await import("@/pkg/rust");
      await wasm.default();

      const decryptResult = wasm.decrypt_master_key(
        password,
        secrets.salt,
        secrets.encrypted_master_key,
        secrets.mk_nonce,
      );

      if (decryptResult.success) {
        setResult({
          success: true,
          masterKey: decryptResult.master_key_hex,
        });
      } else {
        setResult({
          success: false,
          error: decryptResult.error_message,
        });
      }
    } catch (err) {
      console.error("Error verifying master key:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setResult({
        success: false,
        error: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setPassword("");
    setResult(null);
  };

  return (
    <div className="w-full max-w-md p-6 bg-background border border-foreground/10 rounded-lg shadow-sm">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <svg
          className="w-5 h-5 text-primary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
        Verify Master Key
      </h2>

      <p className="text-sm text-foreground/70 mb-4">
        Enter your master password to decrypt and view your master key.
      </p>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="verifyPassword" className="text-sm font-medium">
            Master Password
          </label>
          <input
            id="verifyPassword"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleVerify()}
            className="border border-foreground/20 p-3 rounded-lg text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Enter your master password"
            disabled={loading}
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleVerify}
            disabled={loading || !password}
            className="flex-1 bg-primary text-background p-3 rounded-lg font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-opacity hover:opacity-90"
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
                Verifying...
              </span>
            ) : (
              "Verify"
            )}
          </button>

          {result && (
            <button
              onClick={handleClear}
              className="px-4 py-3 border border-foreground/20 rounded-lg font-medium cursor-pointer transition-colors hover:bg-foreground/5"
            >
              Clear
            </button>
          )}
        </div>

        {result && (
          <div
            className={`p-4 rounded-lg ${
              result.success
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            {result.success ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-green-700 font-medium">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Password verified successfully!
                </div>
                <div className="mt-2">
                  <label className="text-sm text-green-700 font-medium">
                    Your Master Key:
                  </label>
                  <code className="block mt-1 p-2 bg-green-100 rounded text-xs text-green-800 break-all font-mono">
                    {result.masterKey}
                  </code>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-700">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                {result.error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
