import type { SQLiteOpenOptions } from 'expo-sqlite';

export const databaseOpenOptions: SQLiteOpenOptions = {
  // expo-sqlite can segfault while finalizing cached FTS statements during a
  // rapid iOS stop/relaunch. The connection owns no manually prepared
  // statements, so letting SQLite reclaim them with the process is safer.
  finalizeUnusedStatementsBeforeClosing: false,
};
