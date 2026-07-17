import type { DrugBackup } from '@/domain/backup';
import { summarizeTrainingAnalytics } from '@/data/repositories/trainingRepository';

function drug(overrides: Partial<DrugBackup> = {}): DrugBackup {
  return {
    id: crypto.randomUUID(),
    scientificName: 'Metformin',
    chapterRaw: 'Endocrine',
    drugClass: 'Biguanide',
    confidenceRaw: 'Weak',
    isConfusing: false,
    masteryScientificName: false,
    masteryTradeName: false,
    masteryClass: false,
    masteryUse: false,
    masteryWarning: false,
    masteryCounseling: false,
    ...overrides,
  } as DrugBackup;
}

describe('summarizeTrainingAnalytics', () => {
  it('matches the Swift report totals, mastery axes, and breakdown rules', () => {
    const result = summarizeTrainingAnalytics(
      [
        drug({ masteryScientificName: true, confidenceRaw: 'Medium' }),
        drug({
          scientificName: 'Amoxicillin',
          chapterRaw: 'Antibiotics',
          drugClass: '',
          isConfusing: true,
          masteryScientificName: true,
          masteryTradeName: true,
          masteryClass: true,
          masteryUse: true,
          masteryWarning: true,
        }),
      ],
      7,
      3,
    );

    expect(result).toMatchObject({
      totalDrugs: 2,
      mastered: 1,
      weak: 1,
      reviews: 7,
      completedShifts: 3,
    });
    expect(result.masteryValues[0]).toBe(1);
    expect(result.masteryValues[1]).toBe(0.5);
    expect(result.chapters).toEqual([
      { label: 'Antibiotics', count: 1 },
      { label: 'Endocrine', count: 1 },
    ]);
    expect(result.classes).toEqual([{ label: 'Biguanide', count: 1 }]);
  });
});
