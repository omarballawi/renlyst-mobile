import {
  DATABASE_SCHEMA_VERSION,
  DatabaseVersionError,
  databaseMigrations,
  migrationSQLForPlatform,
  pendingMigrations,
} from '@/data/database';

describe('database migrations', () => {
  it('are ordered, unique, and cover the declared schema version', () => {
    expect(databaseMigrations.map((migration) => migration.version)).toEqual([1]);
    expect(databaseMigrations.at(-1)?.version).toBe(DATABASE_SCHEMA_VERSION);
  });

  it('does not rerun applied migrations and refuses a newer database', () => {
    expect(pendingMigrations(0)).toHaveLength(1);
    expect(pendingMigrations(1)).toHaveLength(0);
    expect(() => pendingMigrations(2)).toThrow(DatabaseVersionError);
  });

  it('keeps native FTS but removes only that unsupported extension on web', () => {
    const migration = databaseMigrations[0]!;

    expect(migration.sql).toContain('USING fts5');
    expect(migrationSQLForPlatform(migration, 'web')).not.toContain('fts5');
    expect(migrationSQLForPlatform(migration, 'web')).toContain(
      'CREATE TABLE IF NOT EXISTS drug_profiles',
    );
    expect(migrationSQLForPlatform(migration, 'ios')).toBe(migration.sql);
  });
});
