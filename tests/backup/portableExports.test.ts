import {
  combinedTrainingReportsText,
  drugBackupSchema,
  drugLibraryCSV,
  drugProductBackupSchema,
  trainingReportBackupSchema,
} from '@/domain/backup';

describe('portable UTF-8 exports', () => {
  it('quotes CSV values and preserves Arabic and authoritative brand products', () => {
    const drug = drugBackupSchema.parse({
      id: 'drug-1',
      scientificName: 'Test, Drug',
      tradeNames: ['Legacy'],
      chapterRaw: 'Other',
      notes: 'He said "verify"',
      arabicExplanation: 'شرح عربي',
      dateAdded: '2026-01-01T00:00:00.000Z',
      nextReviewDate: '2026-01-01T00:00:00.000Z',
    });
    const product = drugProductBackupSchema.parse({
      id: 'product-1',
      profileID: 'drug-1',
      productKey: 'brand',
      tradeName: 'Brand One',
      dateAdded: '2026-01-01T00:00:00.000Z',
    });
    const csv = drugLibraryCSV([drug], [product]);

    expect(csv).toContain('"Test, Drug"');
    expect(csv).toContain('"He said ""verify"""');
    expect(csv).toContain('"Legacy | Brand One"');
    expect(csv).toContain('شرح عربي');
    expect(new TextEncoder().encode(csv).length).toBeGreaterThan(csv.length);
  });

  it('sorts and joins editable reports without losing Arabic', () => {
    const report = trainingReportBackupSchema.parse({
      id: 'report-1',
      periodStart: '2026-01-01T00:00:00.000Z',
      periodEnd: '2026-01-31T00:00:00.000Z',
      generatedAt: '2026-02-01T00:00:00.000Z',
      updatedAt: '2026-02-01T00:00:00.000Z',
      trainingSummary: 'ملخص التدريب',
    });
    const text = combinedTrainingReportsText([report]);

    expect(text).toContain('Renlyst Training Report');
    expect(text).toContain('ملخص التدريب');
    expect(new TextEncoder().encode(text).length).toBeGreaterThan(text.length);
  });
});
