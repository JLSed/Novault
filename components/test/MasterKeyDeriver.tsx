"use client";

import { useState } from "react";

export default function MasterKeyDeriver({ userEmail }: { userEmail: string }) {
  const [userInput, setUserInput] = useState("");
  const [masterKey, setMasterKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDerive = async () => {
    if (!userInput) return;

    setLoading(true);

    try {
      console.log("[MasterKeyDeriver] Starting key derivation for:", userEmail);
      const wasm = await import("@/pkg/rust");
      await wasm.default();

      const derivedKey = wasm.master_key_bytes_to_hex(userInput, userEmail);
      console.log("[MasterKeyDeriver] Key derived successfully");
      setMasterKey(derivedKey);
    } catch (error) {
      console.error("[MasterKeyDeriver] Error deriving key:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setUserInput("");
    setMasterKey(null);
  };

  return (
    <div className="w-full max-w-md p-4 border border-foreground/20 rounded">
      <h1 className="text-xl font-bold mb-4">Testing: Master Key Deriver</h1>

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
            className="flex-1 bg-foreground text-background p-2 rounded cursor-pointer disabled:opacity-50"
          >
            {loading ? "Deriving..." : "Derive Key"}
          </button>

          {masterKey && (
            <button
              onClick={handleClear}
              className="px-4 py-2 border border-foreground/20 rounded cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {masterKey && (
          <div className="p-3 rounded bg-green-100 text-green-800 text-sm">
            <div className="flex flex-col gap-1">
              <span>Derived Master Key:</span>
              <code className="text-xs break-all bg-green-200 p-1 rounded">
                {masterKey}
              </code>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
