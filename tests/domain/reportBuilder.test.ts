import { buildTrainingReport } from '@/domain/training/reportBuilder';
import { makeDrug } from '../fixtures/backup';

describe('training report parity', () => {
  it('summarizes the selected period and deduplicates learning lines', () => {
    const date = '2025-06-15T12:00:00Z';
    const report = buildTrainingReport({
      id: 'report',
      periodStart: new Date('2025-06-01T00:00:00Z'),
      periodEnd: new Date('2025-06-30T00:00:00Z'),
      now: new Date(date),
      evidence: {
        drugs: [makeDrug({ dateAdded: date, counselingSentence: 'Rise slowly.' })],
        reviews: [
          {
            id: 'review',
            drugID: null,
            drugNameSnapshot: 'Furosemide',
            date,
            questionTypeRaw: 'Use',
            ratingRaw: 'Correct',
            wasCorrect: true,
            scoreBefore: 0,
            scoreAfter: 1,
            caseID: null,
          },
        ],
        shifts: [
          {
            id: 'shift',
            date,
            startedAt: date,
            endedAt: date,
            chapterFocusRaw: 'Cardiovascular',
            newDrugsAdded: 1,
            reviewsCompleted: 1,
            pharmacistQuestions: ['When should it be taken?'],
            whatILearned: 'Monitor electrolytes',
            confusingDrugs: [],
            notes: '',
            tomorrowReview: 'Loop diuretics',
            isCompleted: true,
          },
        ],
        encounters: [
          {
            id: 'encounter',
            date,
            topic: 'Counseling',
            relatedDrugID: null,
            relatedDrugNameSnapshot: '',
            whatHappened: '',
            whatILearned: 'monitor electrolytes',
            pharmacistNote: '',
            privacyConfirmed: true,
          },
        ],
      },
    });

    expect(report.trainingSummary).toBe(
      'Completed 1 shifts, added 1 drugs, and completed 1 reviews.',
    );
    expect(report.skillsLearned).toBe('• Monitor electrolytes');
    expect(report.categoriesStudied).toContain('• Cardiovascular: 1');
    expect(report.pharmacistQuestions).toContain('When should it be taken?');
  });
});
