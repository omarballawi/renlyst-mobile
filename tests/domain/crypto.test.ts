import { sha256Hex } from '@/domain/shared/crypto';

describe('sha256Hex', () => {
  it('matches the standard SHA-256 vector for raw bytes', async () => {
    const bytes = new Uint8Array([0x61, 0x62, 0x63]);

    await expect(sha256Hex(bytes)).resolves.toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('hashes only the visible range of a Uint8Array view', async () => {
    const storage = new Uint8Array([0xff, 0x61, 0x62, 0x63, 0xff]);
    const bytes = storage.subarray(1, 4);

    await expect(sha256Hex(bytes)).resolves.toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });
});
