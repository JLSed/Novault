"use client";

import { useState } from "react";
import { getUserSecrets } from "@/app/home/actions";

interface VerifyPrivateKeyProps {
  userId: string;
}

export default function VerifyPrivateKey({ userId }: VerifyPrivateKeyProps) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    privateKey?: string;
    error?: string;
  } | null>(null);

  const handleVerify = async () => {
    if (!password) return;

    setLoading(true);
    setResult(null);

    try {
      console.log("[VerifyPrivateKey] Starting verification for user:", userId);
      const secrets = await getUserSecrets(userId);

      if (!secrets) {
        throw new Error("No secrets found for this user");
      }

      const wasm = await import("@/pkg/rust");
      await wasm.default();

      const decryptResult = wasm.decrypt_private_key(
        password,
        secrets.pk_salt,
        secrets.encrypted_private_key,
        secrets.pk_nonce,
      );

      if (decryptResult.success) {
        console.log("[VerifyPrivateKey] Verification successful");
        setResult({
          success: true,
          privateKey: decryptResult.private_key_hex,
        });
      } else {
        console.error(
          "[VerifyPrivateKey] Verification failed:",
          decryptResult.error_message,
        );
        setResult({
          success: false,
          error: decryptResult.error_message,
        });
      }
    } catch (err) {
      console.error("[VerifyPrivateKey] Error verifying private key:", err);
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
    <div className="w-full max-w-md p-4 border border-foreground/20 rounded">
      <h1 className="text-xl font-bold mb-4">Testing: Verify Private Key</h1>

      <div className="flex flex-col gap-3">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleVerify()}
          className="border border-foreground/20 p-2 rounded text-foreground bg-background"
          placeholder="Enter master password"
          disabled={loading}
        />

        <div className="flex gap-2">
          <button
            onClick={handleVerify}
            disabled={loading || !password}
            className="flex-1 bg-foreground text-background p-2 rounded   disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify"}
          </button>

          {result && (
            <button
              onClick={handleClear}
              className="px-4 py-2 border border-foreground/20 rounded  "
            >
              Clear
            </button>
          )}
        </div>

        {result && (
          <div
            className={`p-3 rounded text-sm ${
              result.success
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {result.success ? (
              <div className="flex flex-col gap-1">
                <span>✓ Password verified!</span>
                <code className="text-xs break-all bg-green-200 p-1 rounded">
                  {result.privateKey}
                </code>
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
