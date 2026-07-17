import { BackupPersistence, type PromotedBackupImage } from '@/data/backup';
import { databaseMigrations } from '@/data/database';
import { DrugRepository, ProductRepository } from '@/data/repositories';
import {
  dailyActivityBackupSchema,
  drugProductBackupSchema,
  drugRelationshipBackupSchema,
  encounterBackupSchema,
  learningProfileBackupSchema,
  pharmaShiftBackupSchema,
  reviewBackupSchema,
  shiftBackupSchema,
  trainingReportBackupSchema,
} from '@/domain/backup';
import { NodeSQLiteDatabase } from '../helpers/nodeSQLite';
import { makeBackup, makeDrug } from '../fixtures/backup';

const date = '2025-06-15T12:00:00.000Z';
const secondDrugID = '22222222-2222-4222-8222-222222222222';

async function databaseWithSchema(): Promise<NodeSQLiteDatabase> {
  const database = new NodeSQLiteDatabase();
  for (const migration of databaseMigrations) await database.execAsync(migration.sql);
  return database;
}

function fullBackup() {
  const drug = makeDrug({
    arabicExplanation: 'يستخدم لعلاج احتباس السوائل',
    pharmacologyProfileJSON: JSON.stringify({ absorption: 'Rapid', futureField: 'kept' }),
  });
  const product = drugProductBackupSchema.parse({
    id: '33333333-3333-4333-8333-333333333333',
    profileID: drug.id,
    productKey: 'furosemide|lasix|40 mg|tablet|acme|iraq',
    tradeName: 'Lasix',
    manufacturer: 'Acme',
    strength: '40 mg',
    marketedStrengthLabel: '40 mg',
    ingredientComponentsJSON: JSON.stringify([
      { name: 'Furosemide', displayStrength: '40 mg', strengthValue: 40, strengthUnit: 'mg' },
    ]),
    dosageForm: 'Tablet',
    route: 'Oral',
    country: 'Iraq',
    shelfLocation: 'A-14',
    dateAdded: date,
  });
  const relationship = drugRelationshipBackupSchema.parse({
    id: '44444444-4444-4444-8444-444444444444',
    relationshipKey: 'furosemide:interaction:ibuprofen',
    kindRaw: 'Interaction',
    severityRaw: 'Medium',
    summary: 'NSAIDs may reduce the diuretic response.',
    checkedAt: date,
    sourceDrugID: drug.id,
    targetDrugID: null,
  });
  const review = reviewBackupSchema.parse({
    id: '55555555-5555-4555-8555-555555555555',
    drugID: drug.id,
    drugNameSnapshot: drug.scientificName,
    date,
    questionTypeRaw: 'Warning',
    ratingRaw: 'Partly correct',
    wasCorrect: false,
    scoreBefore: 2,
    scoreAfter: 2,
  });
  const shift = shiftBackupSchema.parse({
    id: '66666666-6666-4666-8666-666666666666',
    date,
    startedAt: date,
    endedAt: date,
    chapterFocusRaw: 'Cardiovascular',
    newDrugsAdded: 1,
    reviewsCompleted: 1,
    pharmacistQuestions: ['When should electrolytes be checked?'],
    whatILearned: 'Dose timing matters.',
    isCompleted: true,
  });
  const encounter = encounterBackupSchema.parse({
    id: '77777777-7777-4777-8777-777777777777',
    date,
    topic: 'Morning dosing counseling',
    relatedDrugID: drug.id,
    relatedDrugNameSnapshot: drug.scientificName,
    whatHappened: 'Supervised counseling practice.',
    whatILearned: 'Ask about daily routine.',
    pharmacistNote: 'Avoid patient identifiers.',
    privacyConfirmed: true,
  });
  const report = trainingReportBackupSchema.parse({
    id: '88888888-8888-4888-8888-888888888888',
    periodStart: date,
    periodEnd: date,
    generatedAt: date,
    updatedAt: date,
    trainingSummary: 'One supervised shift.',
    skillsLearned: 'الإرشاد الدوائي',
  });
  const learningProfile = learningProfileBackupSchema.parse({
    id: '99999999-9999-4999-8999-999999999999',
    currentStreak: 2,
    longestStreak: 4,
    completedSessions: 3,
    completedQuestions: 15,
    correctAnswers: 12,
    badges: ['First evidence'],
    lastActivityDate: date,
    weakDrugRemindersEnabled: true,
  });
  const activity = dailyActivityBackupSchema.parse({
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    day: date,
    sessionsCompleted: 1,
    questionsAnswered: 5,
    correctAnswers: 4,
    missionCompleted: true,
  });

  return pharmaShiftBackupSchema.parse({
    ...makeBackup(),
    includesImages: true,
    drugs: [drug],
    products: [product],
    relationships: [relationship],
    reviews: [review],
    shifts: [shift],
    encounters: [encounter],
    reports: [report],
    learningProfiles: [learningProfile],
    dailyActivities: [activity],
  });
}

function promotedDrugImage(drugID: string): PromotedBackupImage {
  return {
    id: `drug:${drugID}:0:original`,
    ownerType: 'drug',
    ownerID: drugID,
    ordinal: 0,
    role: 'original',
    finalUri: `file:///renlyst/images/${drugID}/package.jpg`,
    sha256: '1234567890abcdef',
    byteSize: 128,
    mimeType: 'image/jpeg',
    created: true,
  };
}

describe('BackupPersistence integration', () => {
  it('round-trips every record family, relationships, Arabic, future fields, and image references', async () => {
    const database = await databaseWithSchema();
    try {
      const source = fullBackup();
      const persistence = new BackupPersistence(database.asExpoDatabase());
      const result = await persistence.restore(
        source,
        [promotedDrugImage(source.drugs[0]!.id)],
        'merge',
        'round-trip-hash',
      );
      const exported = await persistence.makeBackup(false);

      expect(result.summary).toMatchObject({ mode: 'merge', imageCount: 1 });
      expect(exported.drugs).toHaveLength(1);
      expect(exported.products).toHaveLength(1);
      expect(exported.relationships).toHaveLength(1);
      expect(exported.reviews).toHaveLength(1);
      expect(exported.shifts).toHaveLength(1);
      expect(exported.encounters).toHaveLength(1);
      expect(exported.reports).toHaveLength(1);
      expect(exported.learningProfiles).toHaveLength(1);
      expect(exported.dailyActivities).toHaveLength(1);
      expect(exported.drugs[0]).toEqual(source.drugs[0]);
      expect(exported.products?.[0]).toEqual(source.products?.[0]);
      expect(exported.relationships?.[0]).toEqual(source.relationships?.[0]);
      expect(exported.reviews[0]).toEqual(source.reviews[0]);
      expect(exported.shifts[0]).toEqual(source.shifts[0]);
      expect(exported.encounters[0]).toEqual(source.encounters[0]);
      expect(exported.reports[0]).toEqual(source.reports[0]);
      expect(exported.learningProfiles?.[0]).toEqual(source.learningProfiles?.[0]);
      expect(exported.dailyActivities?.[0]).toEqual(source.dailyActivities?.[0]);
      expect(exported.drugs[0]?.arabicExplanation).toBe('يستخدم لعلاج احتباس السوائل');
      expect(JSON.parse(exported.drugs[0]?.pharmacologyProfileJSON ?? '{}')).toMatchObject({
        futureField: 'kept',
      });
      expect(exported.relationships?.[0]?.sourceDrugID).toBe(source.drugs[0]?.id);

      const storedImage = await database.getFirstAsync<{ uri: string; sha256: string }>(
        'SELECT uri, sha256 FROM drug_images',
      );
      expect(storedImage).toEqual({
        uri: promotedDrugImage(source.drugs[0]!.id).finalUri,
        sha256: '1234567890abcdef',
      });
    } finally {
      database.close();
    }
  });

  it('keeps a lightweight restore idempotent without deleting local image references', async () => {
    const database = await databaseWithSchema();
    try {
      const source = fullBackup();
      const persistence = new BackupPersistence(database.asExpoDatabase());
      await persistence.restore(
        source,
        [promotedDrugImage(source.drugs[0]!.id)],
        'merge',
        'initial-image-hash',
      );
      const lightweight = pharmaShiftBackupSchema.parse({ ...source, includesImages: false });
      await persistence.restore(lightweight, [], 'merge', 'lightweight-hash');
      await persistence.restore(lightweight, [], 'merge', 'lightweight-hash');

      expect(
        await database.getFirstAsync<{ count: number }>(
          'SELECT count(*) AS count FROM drug_profiles',
        ),
      ).toEqual({ count: 1 });
      expect(
        await database.getFirstAsync<{ count: number }>(
          'SELECT count(*) AS count FROM drug_images',
        ),
      ).toEqual({ count: 1 });
      expect(
        await database.getFirstAsync<{ has_photo: number }>(
          'SELECT has_photo FROM drug_profiles WHERE id = ?',
          source.drugs[0]!.id,
        ),
      ).toEqual({ has_photo: 1 });
    } finally {
      database.close();
    }
  });

  it('replace removes records absent from the backup and reports stale image files', async () => {
    const database = await databaseWithSchema();
    try {
      const original = fullBackup();
      const persistence = new BackupPersistence(database.asExpoDatabase());
      const image = promotedDrugImage(original.drugs[0]!.id);
      await persistence.restore(original, [image], 'merge', 'before-replace');

      const replacement = pharmaShiftBackupSchema.parse(
        makeBackup({
          drugs: [
            makeDrug({
              id: secondDrugID,
              scientificName: 'Metformin',
              canonicalIngredientKey: 'metformin',
              activeIngredients: ['Metformin'],
              tradeNames: ['Glucophage'],
            }),
          ],
        }),
      );
      const result = await persistence.restore(replacement, [], 'replace', 'replacement-hash');

      expect(result.staleImageUris).toEqual([image.finalUri]);
      expect(
        await database.getAllAsync<{ id: string }>('SELECT id FROM drug_profiles ORDER BY id'),
      ).toEqual([{ id: secondDrugID }]);
      expect(
        await database.getFirstAsync<{ count: number }>(
          'SELECT count(*) AS count FROM review_logs',
        ),
      ).toEqual({ count: 0 });
    } finally {
      database.close();
    }
  });

  it('rolls back the whole import when a canonical identity collision fails', async () => {
    const database = await databaseWithSchema();
    try {
      const persistence = new BackupPersistence(database.asExpoDatabase());
      const invalid = pharmaShiftBackupSchema.parse(
        makeBackup({
          drugs: [makeDrug(), makeDrug({ id: secondDrugID })],
        }),
      );

      await expect(persistence.restore(invalid, [], 'merge', 'collision-hash')).rejects.toThrow();
      expect(
        await database.getFirstAsync<{ count: number }>(
          'SELECT count(*) AS count FROM drug_profiles',
        ),
      ).toEqual({ count: 0 });
      expect(
        await database.getFirstAsync<{ count: number }>(
          'SELECT count(*) AS count FROM import_history',
        ),
      ).toEqual({ count: 0 });
    } finally {
      database.close();
    }
  });

  it('searches nested ingredient and package metadata and combines scope filters', async () => {
    const database = await databaseWithSchema();
    try {
      const persistence = new BackupPersistence(database.asExpoDatabase());
      const source = fullBackup();
      await persistence.restore(source, [], 'merge', 'search-hash');
      const repository = new DrugRepository(database.asExpoDatabase());

      expect(
        (await repository.list({ query: '40 mg' })).map((drug) => drug.scientificName),
      ).toEqual(['Furosemide']);
      expect(
        (await repository.list({ query: 'Acme Tablet' })).map((drug) => drug.scientificName),
      ).toEqual(['Furosemide']);
      expect(
        (
          await repository.list({
            query: 'علاج احتباس',
            scope: 'needsAttention',
            sort: 'mastery',
          })
        ).map((drug) => drug.scientificName),
      ).toEqual(['Furosemide']);
    } finally {
      database.close();
    }
  });

  it('keeps or erases linked learning history according to the deletion policy', async () => {
    const keepDatabase = await databaseWithSchema();
    try {
      const source = fullBackup();
      const drugID = source.drugs[0]!.id;
      await new BackupPersistence(keepDatabase.asExpoDatabase()).restore(
        source,
        [],
        'merge',
        'keep-history',
      );
      await new DrugRepository(keepDatabase.asExpoDatabase()).deleteProfile(drugID, 'keepHistory');

      expect(
        await keepDatabase.getFirstAsync<{ count: number }>(
          'SELECT count(*) AS count FROM drug_relationships',
        ),
      ).toEqual({ count: 0 });
      expect(
        await keepDatabase.getFirstAsync<{ drug_id: string | null; payload_json: string }>(
          'SELECT drug_id, payload_json FROM review_logs',
        ),
      ).toMatchObject({ drug_id: null, payload_json: expect.stringContaining('"drugID":null') });
      expect(
        await keepDatabase.getFirstAsync<{
          related_drug_id: string | null;
          payload_json: string;
        }>('SELECT related_drug_id, payload_json FROM encounter_notes'),
      ).toMatchObject({
        related_drug_id: null,
        payload_json: expect.stringContaining('"relatedDrugID":null'),
      });
    } finally {
      keepDatabase.close();
    }

    const eraseDatabase = await databaseWithSchema();
    try {
      const source = fullBackup();
      const drugID = source.drugs[0]!.id;
      await new BackupPersistence(eraseDatabase.asExpoDatabase()).restore(
        source,
        [],
        'merge',
        'erase-history',
      );
      await new DrugRepository(eraseDatabase.asExpoDatabase()).deleteProfile(
        drugID,
        'eraseHistory',
      );
      expect(
        await eraseDatabase.getFirstAsync<{ count: number }>(
          'SELECT count(*) AS count FROM review_logs',
        ),
      ).toEqual({ count: 0 });
      expect(
        await eraseDatabase.getFirstAsync<{ count: number }>(
          'SELECT count(*) AS count FROM encounter_notes',
        ),
      ).toEqual({ count: 0 });
    } finally {
      eraseDatabase.close();
    }
  });

  it('deleting one brand leaves its profile and invalidates cached practice', async () => {
    const database = await databaseWithSchema();
    try {
      const source = fullBackup();
      await new BackupPersistence(database.asExpoDatabase()).restore(
        source,
        [],
        'merge',
        'brand-delete',
      );
      await database.runAsync(
        `INSERT INTO practice_packs (
          id, mode_raw, scope_key, questions_json, generated_at, source_revision, invalidated_at
        ) VALUES (?, ?, ?, ?, ?, ?, NULL)`,
        'pack-1',
        'Smart Session',
        'all',
        '[]',
        date,
        'before-delete',
      );
      const productID = source.products?.[0]?.id;
      expect(productID).toBeTruthy();
      await new ProductRepository(database.asExpoDatabase()).deleteFromProfile(
        source.drugs[0]!.id,
        productID!,
      );

      expect(
        await database.getFirstAsync<{ count: number }>(
          'SELECT count(*) AS count FROM drug_profiles',
        ),
      ).toEqual({ count: 1 });
      expect(
        await database.getFirstAsync<{ count: number }>(
          'SELECT count(*) AS count FROM drug_products',
        ),
      ).toEqual({ count: 0 });
      expect(
        await database.getFirstAsync<{ invalidated_at: string | null }>(
          'SELECT invalidated_at FROM practice_packs WHERE id = ?',
          'pack-1',
        ),
      ).toMatchObject({ invalidated_at: expect.any(String) });
    } finally {
      database.close();
    }
  });
});
