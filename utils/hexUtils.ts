/**
 * Converts a Postgres HEX string (e.g., "\xDEADBEEF" or "DEADBEEF")
 * into a Uint8Array for WASM usage.
 */
export const HexToUint8Array = (hexStr: string): Uint8Array => {
  if (!hexStr) return new Uint8Array(0);

  const cleanHex = hexStr.startsWith("\\x") ? hexStr.slice(2) : hexStr;

  // Safety check: ensure even length
  if (cleanHex.length % 2 !== 0) {
    console.error(`[cryptoUtils] Invalid hex length: ${cleanHex.length}`);
    throw new Error("Invalid hex string length");
  }

  const len = cleanHex.length;
  const bytes = new Uint8Array(len / 2);

  for (let i = 0; i < len; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }

  return bytes;
};
