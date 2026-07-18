let mockIdentifierCounter = 0;

jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  randomUUID: () => `00000000-0000-4000-8000-${String(mockIdentifierCounter++).padStart(12, '0')}`,
  digest: jest.fn(async () => new Uint8Array(32).buffer),
  digestStringAsync: jest.fn(),
}));
