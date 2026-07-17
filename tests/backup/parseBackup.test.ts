import {
  BackupValidationError,
  parseBackupJson,
  serializeSwiftCompatibleBackup,
} from '@/domain/backup';
import { makeBackup } from '@/../tests/fixtures/backup';

describe('Swift backup contract', () => {
  it('preserves Arabic and unknown fields through a schema-v5 rollback export', () => {
    const source = makeBackup();
    const json = JSON.stringify({
      ...source,
      futureTopLevelValue: { keep: true },
      drugs: [{ ...source.drugs[0], futureClinicalField: 'لا تحذفني' }],
    });

    const parsed = parseBackupJson(json);
    const exported = JSON.parse(serializeSwiftCompatibleBackup(parsed)) as Record<string, unknown>;
    const exportedDrugs = exported.drugs as Record<string, unknown>[];

    expect(exported.futureTopLevelValue).toEqual({ keep: true });
    expect(exportedDrugs[0]?.arabicExplanation).toBe('مدر بول عروي');
    expect(exportedDrugs[0]?.futureClinicalField).toBe('لا تحذفني');
  });

  it('accepts a legacy schema with newly introduced arrays absent', () => {
    const source = makeBackup();
    const legacy = {
      ...source,
      schemaVersion: 1,
      learningProfiles: undefined,
      dailyActivities: undefined,
      products: undefined,
      relationships: undefined,
    };

    const parsed = parseBackupJson(JSON.stringify(legacy));
    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.products).toEqual([]);
    expect(parsed.relationships).toEqual([]);
    expect(parsed.counts.drugs).toBe(1);
  });

  it('rejects newer and malformed backups before restore', () => {
    expect(() => parseBackupJson('{not json')).toThrow(BackupValidationError);
    expect(() => parseBackupJson(JSON.stringify({ ...makeBackup(), schemaVersion: 6 }))).toThrow(
      'supports schemas 1–5',
    );
    expect(() => parseBackupJson(JSON.stringify({ schemaVersion: 5 }))).toThrow(
      'incomplete or malformed',
    );
  });

  it('recomputes counts instead of trusting stale metadata', () => {
    const source = makeBackup({ counts: { ...makeBackup().counts, drugs: 900 } });
    expect(parseBackupJson(JSON.stringify(source)).counts.drugs).toBe(1);
  });
});
