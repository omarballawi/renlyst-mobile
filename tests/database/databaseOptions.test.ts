import { databaseOpenOptions } from '@/data/database/databaseOptions';

describe('database open options', () => {
  it('does not finalize cached FTS statements during iOS process teardown', () => {
    expect(databaseOpenOptions.finalizeUnusedStatementsBeforeClosing).toBe(false);
  });
});
