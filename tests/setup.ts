let mockIdentifierCounter = 0;

jest.mock('expo-crypto', () => ({
  randomUUID: () => `00000000-0000-4000-8000-${String(mockIdentifierCounter++).padStart(12, '0')}`,
  digestStringAsync: jest.fn(),
}));
