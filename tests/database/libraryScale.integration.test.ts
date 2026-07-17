import { BackupPersistence } from '@/data/backup';
import { databaseMigrations } from '@/data/database';
import { DrugRepository } from '@/data/repositories';
import { NodeSQLiteDatabase } from '../helpers/nodeSQLite';
import { makeDrug } from '../fixtures/backup';

jest.setTimeout(60_000);

const profileCount = 1_000;

function profileID(index: number): string {
  return `00000000-0000-4000-8000-${index.toString().padStart(12, '0')}`;
}

describe('Library scale integration', () => {
  it('persists, searches, and exports 1,000 complete profiles through real SQLite', async () => {
    const database = new NodeSQLiteDatabase();

    try {
      for (const migration of databaseMigrations) await database.execAsync(migration.sql);

      await database.withExclusiveTransactionAsync(async (transaction) => {
        const repository = new DrugRepository(transaction);
        for (let index = 0; index < profileCount; index += 1) {
          const suffix = index.toString().padStart(4, '0');
          await repository.save(
            makeDrug({
              id: profileID(index),
              scientificName: `Scale medicine ${suffix}`,
              tradeNames: [`ScaleBrand${suffix}`],
              activeIngredients: [`Scale ingredient ${suffix}`],
              rxNormConceptIDs: [],
              arabicExplanation: index === 999 ? 'دواء الاختبار الألف' : '',
              notes: `Scale fixture ${suffix}`,
            }),
          );
        }
      });

      const repository = new DrugRepository(database.asExpoDatabase());
      const summary = await repository.summary(new Date('2025-06-15T12:00:00.000Z'));
      const latinResult = await repository.list({ query: 'ScaleBrand0999' });
      const arabicResult = await repository.list({ query: 'الاختبار' });
      const backup = await new BackupPersistence(database.asExpoDatabase()).makeBackup(false);

      expect(summary.profiles).toBe(profileCount);
      expect(latinResult.map((drug) => drug.id)).toEqual([profileID(999)]);
      expect(arabicResult.map((drug) => drug.id)).toEqual([profileID(999)]);
      expect(backup.drugs).toHaveLength(profileCount);
      expect(backup.counts.drugs).toBe(profileCount);
      expect(backup.drugs.find((drug) => drug.id === profileID(999))).toMatchObject({
        scientificName: 'Scale medicine 0999',
        tradeNames: ['ScaleBrand0999'],
        arabicExplanation: 'دواء الاختبار الألف',
      });
    } finally {
      database.close();
    }
  });
});
