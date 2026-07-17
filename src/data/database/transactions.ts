import type { SQLiteDatabase } from 'expo-sqlite';
import { Platform } from 'react-native';

/**
 * Keeps multi-record writes isolated on native while retaining the same
 * commit-or-rollback behavior in Expo SQLite's web implementation.
 *
 * Expo SQLite intentionally omits `withExclusiveTransactionAsync` on web.
 * The web engine has one local database connection, so the regular transaction
 * API is the supported equivalent for these local, awaited write sequences.
 */
export async function runExclusiveTransaction(
  db: SQLiteDatabase,
  task: (transaction: SQLiteDatabase) => Promise<void>,
  platform = Platform.OS,
): Promise<void> {
  if (platform === 'web') {
    await db.withTransactionAsync(async () => task(db));
    return;
  }

  await db.withExclusiveTransactionAsync(task);
}
