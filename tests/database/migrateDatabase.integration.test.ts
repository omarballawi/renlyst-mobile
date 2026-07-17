import { migrateDatabase, DATABASE_SCHEMA_VERSION } from '@/data/database';
import { DrugRepository } from '@/data/repositories';
import { makeDrug } from '../fixtures/backup';
import { NodeSQLiteDatabase } from '../helpers/nodeSQLite';

describe('database initialization integration', () => {
  it('migrates idempotently and backfills legacy trade names into authoritative products once', async () => {
    const database = new NodeSQLiteDatabase();
    try {
      await migrateDatabase(database.asExpoDatabase());
      expect(await database.getFirstAsync<{ user_version: number }>('PRAGMA user_version')).toEqual(
        { user_version: DATABASE_SCHEMA_VERSION },
      );

      const repository = new DrugRepository(database.asExpoDatabase());
      await repository.save(
        makeDrug({
          tradeNames: ['Lasix', 'Frusid'],
          dosageForms: ['Tablet'],
          strengths: ['40 mg'],
        }),
      );
      await migrateDatabase(database.asExpoDatabase());
      await migrateDatabase(database.asExpoDatabase());

      expect(
        await database.getAllAsync<{ trade_name: string }>(
          'SELECT trade_name FROM drug_products ORDER BY trade_name',
        ),
      ).toEqual([{ trade_name: 'Frusid' }, { trade_name: 'Lasix' }]);
      expect(
        await database.getFirstAsync<{ count: number }>(
          'SELECT count(*) AS count FROM drug_profiles',
        ),
      ).toEqual({ count: 1 });
    } finally {
      database.close();
    }
  });
});
