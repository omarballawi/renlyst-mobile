import { drugBackupSchema } from '@/domain/backup';
import { normalizeDrugConsistency } from '@/domain/drugs/consistency';

describe('normalizeDrugConsistency', () => {
  it('matches Swift unit, band, route typo, and frequency normalization', () => {
    const source = drugBackupSchema.parse({
      id: 'drug-1',
      scientificName: 'Example',
      dateAdded: '2026-01-01T00:00:00.000Z',
      nextReviewDate: '2026-01-01T00:00:00.000Z',
      routes: ['Orak'],
      halfLifeText: '4–6 hours',
      onsetText: '2 hr',
      durationText: '2 days',
      dosingFrequencyRaw: 'Twice daily',
    });
    const result = normalizeDrugConsistency(source);

    expect(result.routes).toEqual(['Oral']);
    expect(result.halfLifeHours).toBe(5);
    expect(result.halfLifeBandRaw).toBe('Short');
    expect(result.onsetMinutes).toBe(120);
    expect(result.onsetBandRaw).toBe('Moderate');
    expect(result.durationHours).toBe(48);
    expect(result.durationBandRaw).toBe('Long');
    expect(result.timesPerDay).toBe(2);
  });
});
