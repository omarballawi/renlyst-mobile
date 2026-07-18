import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';

/**
 * Hash file bytes in JavaScript so capture and backup verification do not depend on
 * the Expo native TypedArray bridge. The result remains the SHA-256 of the raw bytes,
 * preserving compatibility with existing image identities and backup manifests.
 */
export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  return bytesToHex(sha256(bytes));
}
