import { applyConfirmedIdentity, tradeNamesFromInput } from '@/domain/drugs/confirmedIdentity';
import { makeDrug } from '../fixtures/backup';

describe('confirmed import identity', () => {
  it('parses and deduplicates student-confirmed brand names', () => {
    expect(tradeNamesFromInput('Lasix, lasix; Frusid\nFurosemide Accord')).toEqual([
      'Lasix',
      'Frusid',
      'Furosemide Accord',
    ]);
  });

  it('keeps confirmed package context authoritative without deleting generated facts', () => {
    const result = applyConfirmedIdentity(
      makeDrug({ dosageForms: ['Injection'], routes: ['IV'], strengths: ['20 mg'] }),
      {
        scientificName: 'Furosemide',
        tradeNames: ['Lasix'],
        strength: '40 mg',
        dosageForm: 'Tablet',
        route: 'Orak',
        chapterRaw: 'Cardiovascular',
        drugClass: 'Loop diuretic',
      },
    );

    expect(result.tradeNames).toEqual(['Lasix']);
    expect(result.strengths).toEqual(['40 mg', '20 mg']);
    expect(result.dosageForms).toEqual(['Tablet', 'Injection']);
    expect(result.routes).toEqual(['Oral', 'IV']);
    expect(result.mechanism).toContain('Na-K-2Cl');
  });
});
