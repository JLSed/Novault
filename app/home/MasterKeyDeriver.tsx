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
      const wasm = await import("@/pkg/rust");
      await wasm.default();

      const derivedKey = wasm.master_key_bytes_to_hex(userInput, userEmail);
      setMasterKey(derivedKey);
    } catch (error) {
      console.error("Error deriving key:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-8 w-full max-w-2xl">
      <div className="flex flex-col gap-2">
        <label htmlFor="masterPassword">Master Password:</label>
        <input
          id="masterPassword"
          type="password"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          className="border border-foreground p-2 rounded text-foreground"
          placeholder="Enter your master password"
        />
      </div>
      <button
        onClick={handleDerive}
        disabled={loading || !userInput}
        className="bg-primary text-background p-2 rounded cursor-pointer disabled:opacity-50"
      >
        {loading ? "Deriving..." : "Derive Master Key"}
      </button>

      {masterKey && (
        <div className="flex flex-col gap-2 mt-4">
          <label>Derived Master Key:</label>
          <code className="bg-gray-800 text-green-400 p-2 rounded text-xs break-all">
            {masterKey}
          </code>
        </div>
      )}
    </div>
  );
}
