import * as Crypto from 'expo-crypto';

function bytesToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash native file bytes without losing their TypedArray identity at the Expo bridge.
 * `Crypto.digest` accepts a BufferSource, but its Apple implementation casts the
 * data argument to a TypedArray. Passing `bytes.buffer` therefore fails on-device.
 */
export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const nativeBytes = new Uint8Array(bytes.byteLength);
  nativeBytes.set(bytes);
  const digest = await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, nativeBytes);
  return bytesToHex(digest);
}
