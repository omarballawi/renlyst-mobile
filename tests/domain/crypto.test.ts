import * as Crypto from 'expo-crypto';

import { sha256Hex } from '@/domain/shared/crypto';

describe('native crypto bridge inputs', () => {
  it('passes image bytes as a TypedArray instead of an ArrayBuffer', async () => {
    const digest = jest.mocked(Crypto.digest);
    digest.mockResolvedValueOnce(new Uint8Array([0x0a, 0xff]).buffer);
    const bytes = new Uint8Array([1, 2, 3]);

    await expect(sha256Hex(bytes)).resolves.toBe('0aff');
    const bridgedBytes = digest.mock.calls.at(-1)?.[1];
    expect(digest).toHaveBeenLastCalledWith(
      Crypto.CryptoDigestAlgorithm.SHA256,
      expect.any(Uint8Array),
    );
    expect(Array.from(bridgedBytes as Uint8Array)).toEqual([1, 2, 3]);
    expect(bridgedBytes).not.toBe(bytes);
  });
});
