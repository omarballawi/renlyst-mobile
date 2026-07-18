const retryableDatabaseMarkers = [
  'sqlite_busy',
  'sqlite_locked',
  'database is busy',
  'database is locked',
  'database table is locked',
] as const;

function errorText(error: unknown): string {
  if (error instanceof Error) return `${error.name} ${error.message}`.toLocaleLowerCase('en-US');
  return typeof error === 'string' ? error.toLocaleLowerCase('en-US') : '';
}

export function isRetryableDatabaseError(error: unknown): boolean {
  const value = errorText(error);
  return retryableDatabaseMarkers.some((marker) => value.includes(marker));
}

export async function retryBusyDatabaseOperation<T>(
  operation: () => Promise<T>,
  // A force-quit can leave the previous SQLite connection unwinding briefly on iOS.
  // Keep retrying only known transient lock errors, with a bounded 3.85-second backoff.
  delays: readonly number[] = [100, 250, 500, 1_000, 2_000],
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await operation();
    } catch (error) {
      const delay = delays[attempt];
      if (delay === undefined || !isRetryableDatabaseError(error)) throw error;
      attempt += 1;
      await new Promise<void>((resolve) => setTimeout(resolve, delay));
    }
  }
}
