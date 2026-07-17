import type { SQLiteDatabase } from 'expo-sqlite';

import { runExclusiveTransaction } from '@/data/database/transactions';

describe('runExclusiveTransaction', () => {
  it('uses Expo SQLite’s supported transactional API on web and keeps the database handle', async () => {
    const database = {
      withTransactionAsync: jest.fn(async (task: () => Promise<void>) => task()),
      withExclusiveTransactionAsync: jest.fn(),
    } as unknown as SQLiteDatabase;
    const task = jest.fn(async () => undefined);

    await runExclusiveTransaction(database, task, 'web');

    expect(database.withTransactionAsync).toHaveBeenCalledTimes(1);
    expect(database.withExclusiveTransactionAsync).not.toHaveBeenCalled();
    expect(task).toHaveBeenCalledWith(database);
  });
});
