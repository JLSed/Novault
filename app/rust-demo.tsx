"use client";

import { useEffect, useState } from "react";
import init, { greet } from "../pkg/rust";

export default function RustDemo() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    init().then(() => {
      setReady(true);
    });
  }, []);

  if (!ready) return <div className="text-zinc-500">Loading WASM...</div>;

  return (
    <button
      onClick={() => greet()}
      className="items-center justify-center rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors"
    >
      Click to Greet (Rust)
    </button>
  );
}
