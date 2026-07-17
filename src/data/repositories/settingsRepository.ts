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

export const ProviderCredentialStore = {
  async get(provider: ProviderCredential): Promise<string> {
    return (await SecureStore.getItemAsync(credentialKeys[provider])) ?? '';
  },
  async set(provider: ProviderCredential, value: string): Promise<void> {
    const trimmed = normalizeCredential(value);
    if (trimmed) await SecureStore.setItemAsync(credentialKeys[provider], trimmed);
    else await SecureStore.deleteItemAsync(credentialKeys[provider]);
  },
};
