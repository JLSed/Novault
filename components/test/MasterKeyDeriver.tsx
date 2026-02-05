"use client";

import { useState } from "react";

export default function MasterKeyDeriver() {
  const [userInput, setUserInput] = useState("");
  const [result, setResult] = useState<{
    encryptedPrivateKey: string;
    publicKey: string;
    salt: string;
    nonce: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDerive = async () => {
    if (!userInput) return;

    setLoading(true);

    try {
      console.log("[MasterKeyDeriver] Starting key generation");
      const wasm = await import("@/pkg/rust");
      await wasm.default();

      const encryptedResult = wasm.encrypt_master_key(userInput);
      console.log("[MasterKeyDeriver] Key generated successfully");
      setResult({
        encryptedPrivateKey: encryptedResult.encrypted_private_key_hex,
        publicKey: encryptedResult.public_key_hex,
        salt: encryptedResult.salt,
        nonce: encryptedResult.nonce_hex,
      });
    } catch (error) {
      console.error("[MasterKeyDeriver] Error generating key:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setUserInput("");
    setResult(null);
  };

  return (
    <div className="w-full max-w-md p-4 border border-foreground/20 rounded">
      <h1 className="text-xl font-bold mb-4">Testing: Master Key Generator</h1>

      <div className="flex flex-col gap-3">
        <input
          type="password"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleDerive()}
          className="border border-foreground/20 p-2 rounded text-foreground bg-background"
          placeholder="Enter master password"
          disabled={loading}
        />

        <div className="flex gap-2">
          <button
            onClick={handleDerive}
            disabled={loading || !userInput}
            className="flex-1 bg-foreground text-background p-2 rounded   disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate Keys"}
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
          <div className="p-3 rounded bg-green-100 text-green-800 text-sm">
            <div className="flex flex-col gap-2">
              <div>
                <span className="font-semibold">Public Key:</span>
                <code className="text-xs break-all bg-green-200 p-1 rounded block mt-1">
                  {result.publicKey}
                </code>
              </div>
              <div>
                <span className="font-semibold">Encrypted Private Key:</span>
                <code className="text-xs break-all bg-green-200 p-1 rounded block mt-1">
                  {result.encryptedPrivateKey}
                </code>
              </div>
              <div>
                <span className="font-semibold">Salt:</span>
                <code className="text-xs break-all bg-green-200 p-1 rounded block mt-1">
                  {result.salt}
                </code>
              </div>
              <div>
                <span className="font-semibold">Nonce:</span>
                <code className="text-xs break-all bg-green-200 p-1 rounded block mt-1">
                  {result.nonce}
                </code>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
