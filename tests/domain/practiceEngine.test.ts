import { generatePracticeQuestions, practiceModes } from '@/domain/learning/practiceEngine';
import { makeDrug } from '@/../tests/fixtures/backup';

const drugs = [
  makeDrug({
    id: '1',
    scientificName: 'Furosemide',
    tradeNames: ['Lasix'],
    chapterRaw: 'Cardiovascular',
    drugClass: 'Loop diuretic',
    indications: ['Edema'],
    warnings: ['Monitor potassium'],
    counselingSentence: 'Take in the morning.',
  }),
  makeDrug({
    id: '2',
    scientificName: 'Metformin',
    tradeNames: ['Glucophage'],
    chapterRaw: 'Endocrine',
    drugClass: 'Biguanide',
    indications: ['Type 2 diabetes'],
    warnings: ['Pause around contrast when clinically indicated'],
    counselingSentence: 'Take with food.',
    confidenceRaw: 'Medium',
  }),
  makeDrug({
    id: '3',
    scientificName: 'Salbutamol',
    tradeNames: ['Ventolin'],
    chapterRaw: 'Respiratory',
    drugClass: 'SABA',
    indications: ['Bronchospasm'],
    warnings: ['Frequent rescue use needs review'],
    counselingSentence: 'Check inhaler technique.',
    masteryScientificName: true,
  }),
  makeDrug({
    id: '4',
    scientificName: 'Amoxicillin',
    tradeNames: ['Amoxil'],
    chapterRaw: 'Antibiotics',
    drugClass: 'Penicillin',
    indications: ['Bacterial infection'],
    warnings: ['Check penicillin allergy'],
    counselingSentence: 'Complete the prescribed course.',
  }),
];

describe('practice generation parity', () => {
  it('produces exactly five questions for every supported mode', () => {
    for (const mode of practiceModes) {
      const questions = generatePracticeQuestions({
        mode,
        drugs,
        imageUris: { '1': 'file:///furosemide.jpg', '2': 'file:///metformin.jpg' },
      });
      expect(questions).toHaveLength(5);
    }
  });

  it('uses text entry for name practice instead of invented distractors', () => {
    for (const mode of ['Scientific → Trade', 'Trade → Scientific'] as const) {
      const questions = generatePracticeQuestions({ mode, drugs });
      expect(questions.every((question) => question.interaction === 'textEntry')).toBe(true);
      expect(questions.every((question) => question.choices.length === 0)).toBe(true);
    }
  });

  it('keeps system practice inside the requested chapter', () => {
    const questions = generatePracticeQuestions({
      mode: 'System Practice',
      drugs,
      chapter: 'Respiratory',
    });
    expect(questions).toHaveLength(5);
    expect(questions.every((question) => question.drugName === 'Salbutamol')).toBe(true);
  });

  it('keeps the three Swift starter cases available even with an empty library', () => {
    const questions = generatePracticeQuestions({ mode: 'Case Practice', drugs: [] });
    expect(questions).toHaveLength(5);
    expect(questions.map((question) => question.caseID)).toEqual([
      'asthma-propranolol',
      'warfarin-bleeding',
      'insulin-low-sugar',
      'asthma-propranolol',
      'warfarin-bleeding',
    ]);
    expect(questions[0]?.prompt).toContain('asthma');
    expect(questions[0]?.correctAnswer).toContain('bronchospasm');
  });

  it('creates short unique multiple-choice options with one correct answer', () => {
    const questions = generatePracticeQuestions({ mode: 'Drug → Use', drugs });
    for (const question of questions.filter((item) => item.interaction === 'multipleChoice')) {
      expect(new Set(question.choices.map((choice) => choice.toLocaleLowerCase())).size).toBe(
        question.choices.length,
      );
      expect(question.choices.filter((choice) => choice === question.correctAnswer)).toHaveLength(
        1,
      );
      expect(question.choices.length).toBeGreaterThanOrEqual(3);
      expect(question.choices.length).toBeLessThanOrEqual(4);
      expect(question.choices.every((choice) => choice.length <= 64)).toBe(true);
    }
  });

  it('falls back to recall instead of showing short, mixed-language, or overlong distractor sets', () => {
    const sparse = drugs.slice(0, 2);
    expect(
      generatePracticeQuestions({ mode: 'Drug → Use', drugs: sparse }).every(
        (question) => question.interaction === 'recall',
      ),
    ).toBe(true);

    const mixed = [
      drugs[0]!,
      makeDrug({ id: 'arabic', indications: ['علاج الوذمة'] }),
      makeDrug({
        id: 'long',
        indications: [
          'A deliberately overlong indication that is unsafe to place inside a compact answer option',
        ],
      }),
    ];
    const questions = generatePracticeQuestions({ mode: 'Drug → Use', drugs: mixed });
    for (const question of questions.filter((item) => item.interaction === 'multipleChoice')) {
      const hasArabic = /[\u0600-\u06ff]/u.test(question.correctAnswer);
      expect(
        question.choices.every((choice) => /[\u0600-\u06ff]/u.test(choice) === hasArabic),
      ).toBe(true);
    }
  });
});
