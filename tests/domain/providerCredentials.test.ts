import * as SecureStore from 'expo-secure-store';

import { ProviderCredentialStore } from '@/data/repositories/settingsRepository';

const mockCredentialValues = new Map<string, string>();

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockCredentialValues.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockCredentialValues.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockCredentialValues.delete(key);
  }),
}));

const keys = {
  openRouter: 'renlyst.providers.openrouter.api-key',
  deepSeek: 'renlyst.providers.deepseek.api-key',
} as const;

describe('protected provider credential store', () => {
  beforeEach(() => {
    mockCredentialValues.clear();
    jest.clearAllMocks();
    jest
      .mocked(SecureStore.getItemAsync)
      .mockImplementation(async (key: string) => mockCredentialValues.get(key) ?? null);
    jest.mocked(SecureStore.setItemAsync).mockImplementation(async (key: string, value: string) => {
      mockCredentialValues.set(key, value);
    });
    jest.mocked(SecureStore.deleteItemAsync).mockImplementation(async (key: string) => {
      mockCredentialValues.delete(key);
    });
  });

  it('normalizes replacements and reports only status to callers that ask for it', async () => {
    await ProviderCredentialStore.set('openRouter', '  sk-private  ');

    await expect(ProviderCredentialStore.has('openRouter')).resolves.toBe(true);
    expect(mockCredentialValues.get(keys.openRouter)).toBe('sk-private');
  });

  it('retries a transient protected-store read without exposing or discarding credentials', async () => {
    mockCredentialValues.set(keys.openRouter, 'saved-openrouter');
    let attempts = 0;
    jest.mocked(SecureStore.getItemAsync).mockImplementation(async (key: string) => {
      attempts += 1;
      if (attempts === 1) throw new Error('protected storage is warming up');
      return mockCredentialValues.get(key) ?? null;
    });

    await expect(ProviderCredentialStore.has('openRouter')).resolves.toBe(true);
    expect(attempts).toBe(2);
  });

  it('rolls earlier credentials back when a later protected-store write fails', async () => {
    mockCredentialValues.set(keys.openRouter, 'old-openrouter');
    mockCredentialValues.set(keys.deepSeek, 'old-deepseek');
    jest.mocked(SecureStore.setItemAsync).mockImplementation(async (key: string, value: string) => {
      if (key === keys.deepSeek && value === 'new-deepseek')
        throw new Error('protected storage unavailable');
      mockCredentialValues.set(key, value);
    });

    await expect(
      ProviderCredentialStore.replaceMany({
        openRouter: 'new-openrouter',
        deepSeek: 'new-deepseek',
      }),
    ).rejects.toThrow('protected storage unavailable');

    expect(mockCredentialValues.get(keys.openRouter)).toBe('old-openrouter');
    expect(mockCredentialValues.get(keys.deepSeek)).toBe('old-deepseek');
  });
});
