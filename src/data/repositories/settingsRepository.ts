import * as SecureStore from 'expo-secure-store';
import type { SQLiteDatabase } from 'expo-sqlite';

import { normalizeCredential } from '@/domain/shared/credentials';

type SettingRow = { value_json: string };

export const settingKeys = {
  themeMode: 'appearance.theme-mode',
  language: 'localization.language',
  providerConfiguration: 'providers.configuration',
  backupHistory: 'backup.history',
} as const;

export type ProviderConfiguration = {
  altibbiEnabled: boolean;
  rxNormEnabled: boolean;
  dailyMedEnabled: boolean;
  openFDAEnabled: boolean;
  openRouterModel: string;
  deepSeekModel: string;
};

export const defaultProviderConfiguration: ProviderConfiguration = {
  altibbiEnabled: true,
  rxNormEnabled: true,
  dailyMedEnabled: true,
  openFDAEnabled: true,
  openRouterModel: 'google/gemini-2.5-flash',
  deepSeekModel: 'deepseek-v4-flash',
};

export class SettingsRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async get<T>(key: string, fallback: T): Promise<T> {
    const row = await this.db.getFirstAsync<SettingRow>(
      'SELECT value_json FROM settings WHERE key = ?',
      key,
    );
    if (!row) return fallback;
    try {
      return JSON.parse(row.value_json) as T;
    } catch {
      return fallback;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    await this.db.runAsync(
      `INSERT INTO settings (key, value_json, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET
         value_json = excluded.value_json,
         updated_at = excluded.updated_at`,
      key,
      JSON.stringify(value),
      new Date().toISOString(),
    );
  }
}

const credentialKeys = {
  openRouter: 'renlyst.providers.openrouter.api-key',
  deepSeek: 'renlyst.providers.deepseek.api-key',
  altibbi: 'renlyst.providers.altibbi.api-key',
} as const;

export type ProviderCredential = keyof typeof credentialKeys;

const credentialOperationTails: Record<ProviderCredential, Promise<void>> = {
  openRouter: Promise.resolve(),
  deepSeek: Promise.resolve(),
  altibbi: Promise.resolve(),
};

const credentialRetryDelaysMs = [80, 240] as const;

async function retryCredentialOperation<T>(operation: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      const delayMs = credentialRetryDelaysMs[attempt];
      if (delayMs === undefined) throw error;
      await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

function enqueueCredentialOperation<T>(
  provider: ProviderCredential,
  operation: () => Promise<T>,
): Promise<T> {
  const run = credentialOperationTails[provider].then(operation, operation);
  credentialOperationTails[provider] = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export type ProviderCredentialValues = Record<ProviderCredential, string>;

export const ProviderCredentialStore = {
  async get(provider: ProviderCredential): Promise<string> {
    return enqueueCredentialOperation(
      provider,
      async () =>
        (await retryCredentialOperation(() =>
          SecureStore.getItemAsync(credentialKeys[provider]),
        )) ?? '',
    );
  },
  async set(provider: ProviderCredential, value: string): Promise<void> {
    return enqueueCredentialOperation(provider, async () => {
      const trimmed = normalizeCredential(value);
      if (trimmed) {
        await retryCredentialOperation(() =>
          SecureStore.setItemAsync(credentialKeys[provider], trimmed),
        );
      } else {
        await retryCredentialOperation(() => SecureStore.deleteItemAsync(credentialKeys[provider]));
      }
    });
  },
  async has(provider: ProviderCredential): Promise<boolean> {
    return Boolean(await this.get(provider));
  },
  async getMany(): Promise<ProviderCredentialValues> {
    return {
      openRouter: await this.get('openRouter'),
      deepSeek: await this.get('deepSeek'),
      altibbi: await this.get('altibbi'),
    };
  },
  async replaceMany(values: Partial<ProviderCredentialValues>): Promise<void> {
    const providers = (Object.keys(values) as ProviderCredential[]).filter(
      (provider) => values[provider] !== undefined,
    );
    const previous: Partial<ProviderCredentialValues> = {};
    for (const provider of providers) previous[provider] = await this.get(provider);
    try {
      for (const provider of providers) await this.set(provider, values[provider] ?? '');
    } catch (error) {
      for (const provider of providers) {
        try {
          await this.set(provider, previous[provider] ?? '');
        } catch {
          // Preserve the original failure; a later explicit save can retry a failed rollback.
        }
      }
      throw error;
    }
  },
};
