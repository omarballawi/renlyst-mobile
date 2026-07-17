import type { SQLiteDatabase } from 'expo-sqlite';
import { Platform } from 'react-native';

import { DATABASE_SCHEMA_VERSION, databaseMigrations, type DatabaseMigration } from './migrations';
import { repairLegacyProductAuthority } from './legacyLibraryRepair';
import { runExclusiveTransaction } from './transactions';

type UserVersionRow = { user_version: number };
const nativeFTSSection =
  /\/\* RENLYST_NATIVE_FTS_START \*\/[\s\S]*?\/\* RENLYST_NATIVE_FTS_END \*\//gu;

export class DatabaseVersionError extends Error {
  constructor(readonly databaseVersion: number) {
    super(
      `This database uses schema ${databaseVersion}, but this build supports ${DATABASE_SCHEMA_VERSION}.`,
    );
    this.name = 'DatabaseVersionError';
  }
}

export function pendingMigrations(currentVersion: number): readonly DatabaseMigration[] {
  if (currentVersion > DATABASE_SCHEMA_VERSION) {
    throw new DatabaseVersionError(currentVersion);
  }

  return databaseMigrations.filter((migration) => migration.version > currentVersion);
}

export function migrationSQLForPlatform(
  migration: DatabaseMigration,
  platform = Platform.OS,
): string {
  return platform === 'web' ? migration.sql.replace(nativeFTSSection, '') : migration.sql;
}

export async function migrateDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(
    'PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;',
  );
  const versionRow = await db.getFirstAsync<UserVersionRow>('PRAGMA user_version');
  const currentVersion = versionRow?.user_version ?? 0;

  for (const migration of pendingMigrations(currentVersion)) {
    await runExclusiveTransaction(db, async (transaction) => {
      await transaction.execAsync(migrationSQLForPlatform(migration));
      await transaction.execAsync(`PRAGMA user_version = ${migration.version};`);
    });
  }
  await repairLegacyProductAuthority(db);
}
