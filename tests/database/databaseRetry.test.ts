import {
  isRetryableDatabaseError,
  retryBusyDatabaseOperation,
} from '@/data/database/databaseRetry';

describe('database startup retry policy', () => {
  it('retries only transient SQLite busy and locked failures', () => {
    expect(isRetryableDatabaseError(new Error('SQLite error: database is locked'))).toBe(true);
    expect(isRetryableDatabaseError(new Error('SQLITE_BUSY: another write is active'))).toBe(true);
    expect(isRetryableDatabaseError(new Error('no such table: settings'))).toBe(false);
    expect(isRetryableDatabaseError(new Error('disk I/O error'))).toBe(false);
  });

  it('recovers after a transient busy failure without retrying forever', async () => {
    const operation = jest
      .fn<Promise<string>, []>()
      .mockRejectedValueOnce(new Error('SQLITE_BUSY'))
      .mockResolvedValue('ready');

    await expect(retryBusyDatabaseOperation(operation, [0])).resolves.toBe('ready');
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('surfaces non-transient startup failures immediately', async () => {
    const operation = jest.fn<Promise<void>, []>().mockRejectedValue(new Error('malformed schema'));

    await expect(retryBusyDatabaseOperation(operation, [0, 0])).rejects.toThrow('malformed schema');
    expect(operation).toHaveBeenCalledTimes(1);
  });
});
