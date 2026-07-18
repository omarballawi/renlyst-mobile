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
    jest.mocked(SecureStore.setItemAsync).mockImplementation(async (key: string, value: string) => {
      mockCredentialValues.set(key, value);
    });
  });

  it('normalizes replacements and reports only status to callers that ask for it', async () => {
    await ProviderCredentialStore.set('openRouter', '  sk-private  ');

    await expect(ProviderCredentialStore.has('openRouter')).resolves.toBe(true);
    expect(mockCredentialValues.get(keys.openRouter)).toBe('sk-private');
  });

  it('rolls earlier credentials back when a later protected-store write fails', async () => {
    mockCredentialValues.set(keys.openRouter, 'old-openrouter');
    mockCredentialValues.set(keys.deepSeek, 'old-deepseek');
    let failed = false;
    jest.mocked(SecureStore.setItemAsync).mockImplementation(async (key: string, value: string) => {
      if (key === keys.deepSeek && value === 'new-deepseek' && !failed) {
        failed = true;
        throw new Error('protected storage unavailable');
      }
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
