import type { PropsWithChildren } from 'react';
import { SQLiteProvider } from 'expo-sqlite';

import { databaseOpenOptions } from './databaseOptions';
import { migrateDatabase } from './migrateDatabase';
import { retryBusyDatabaseOperation } from './databaseRetry';

export const DATABASE_NAME = 'renlyst.sqlite3';

async function initializeDatabase(db: Parameters<typeof migrateDatabase>[0]): Promise<void> {
  await retryBusyDatabaseOperation(() => migrateDatabase(db));
}

export function DatabaseProvider({ children }: PropsWithChildren) {
  return (
    <SQLiteProvider
      databaseName={DATABASE_NAME}
      onInit={initializeDatabase}
      options={databaseOpenOptions}
      useSuspense
    >
      {children}
    </SQLiteProvider>
  );
}
