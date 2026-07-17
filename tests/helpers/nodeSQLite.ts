import { DatabaseSync, type StatementSync } from 'node:sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';

function statementArguments(params: readonly unknown[]): unknown[] {
  if (params.length === 1 && Array.isArray(params[0])) return [...params[0]];
  return [...params];
}

export class NodeSQLiteDatabase {
  private readonly database = new DatabaseSync(':memory:');

  constructor() {
    this.database.exec('PRAGMA foreign_keys = ON;');
  }

  asExpoDatabase(): SQLiteDatabase {
    return this as unknown as SQLiteDatabase;
  }

  async execAsync(sql: string): Promise<void> {
    this.database.exec(sql);
  }

  async runAsync(sql: string, ...params: unknown[]) {
    const result = this.statement(sql).run(...statementArguments(params));
    return {
      changes: Number(result.changes),
      lastInsertRowId: Number(result.lastInsertRowid),
    };
  }

  async getAllAsync<T>(sql: string, ...params: unknown[]): Promise<T[]> {
    return this.statement(sql).all(...statementArguments(params)) as T[];
  }

  async getFirstAsync<T>(sql: string, ...params: unknown[]): Promise<T | null> {
    return (this.statement(sql).get(...statementArguments(params)) as T | undefined) ?? null;
  }

  async withExclusiveTransactionAsync(
    task: (transaction: SQLiteDatabase) => Promise<void>,
  ): Promise<void> {
    this.database.exec('BEGIN IMMEDIATE;');
    try {
      await task(this.asExpoDatabase());
      this.database.exec('COMMIT;');
    } catch (error) {
      this.database.exec('ROLLBACK;');
      throw error;
    }
  }

  close(): void {
    this.database.close();
  }

  private statement(sql: string): StatementSync {
    return this.database.prepare(sql);
  }
}
