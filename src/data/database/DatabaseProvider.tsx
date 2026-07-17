import type { PropsWithChildren } from 'react';
import { SQLiteProvider } from 'expo-sqlite';

import { migrateDatabase } from './migrateDatabase';

export const DATABASE_NAME = 'renlyst.sqlite3';

export function DatabaseProvider({ children }: PropsWithChildren) {
  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDatabase} useSuspense>
      {children}
    </SQLiteProvider>
  );
}
