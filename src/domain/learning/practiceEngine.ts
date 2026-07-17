import * as Crypto from 'expo-crypto';

import type { DrugBackup } from '@/domain/backup';
import { isMastered, masteryCount } from '@/domain/drugs/mastery';
import { addLocalDays, dateFromLegacy } from '@/domain/shared/dates';
import type { QuestionType } from './reviewScheduler';

export const practiceModes = [
  'Smart Session',
  'Scientific → Trade',
  'Trade → Scientific',
  'Class → Examples',
  'Drug → Use',
  'Drug → Warning',
  'Image Quiz',
  'Counseling',
  'Weak Drugs',
  'Due Review',
  'System Practice',
  'Case Practice',
] as const;

export type PracticeMode = (typeof practiceModes)[number];
export type PracticeInteraction = 'multipleChoice' | 'textEntry' | 'recall';
export type QuestionDifficulty = 'Foundation' | 'Apply' | 'Challenge';

export type PracticeQuestion = {
  id: string;
  drugID: string | null;
  drugName: string;
  prompt: string;
  correctAnswer: string;
  acceptedAnswers: string[];
  choices: string[];
  explanation: string;
  questionType: QuestionType;
  interaction: PracticeInteraction;
  imageUri: string | null;
  caseID: string | null;
  difficulty: QuestionDifficulty;
  learningObjective: string;
  sourceField: string;
};

export const practiceModeDetails: Record<PracticeMode, string> = {
  'Smart Session': 'A focused mix of due, weak, visual, safety, and counseling questions',
  'Scientific → Trade': 'Recall a brand from its active ingredient',
  'Trade → Scientific': 'Recall the active ingredient from a shelf brand',
  'Class → Examples': 'Retrieve a class example without ambiguous distractors',
  'Drug → Use': 'Connect a drug to its saved indications',
  'Drug → Warning': 'Recall the safety point that matters before supply',
  'Image Quiz': 'Recognize your own package photos',
  Counseling: 'Reveal a saved counseling point and self-rate',
  'Weak Drugs': 'Target incomplete mastery and confusing profiles',
  'Due Review': 'Review profiles scheduled for today',
  'System Practice': 'Keep all five questions within one clinical system',
  'Case Practice': 'Apply saved drug facts to short educational situations',
};

export const PRACTICE_QUESTION_COUNT = 5;

export function isPracticeMode(value: string): value is PracticeMode {
  return practiceModes.some((mode) => mode === value);
}

function normalized(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase('en-US')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

export function answerMatches(question: PracticeQuestion, response: string): boolean {
  const value = normalized(response);
  return question.acceptedAnswers.some((answer) => normalized(answer) === value);
}

function difficulty(index: number): QuestionDifficulty {
  if (index < 2) return 'Foundation';
  if (index < 4) return 'Apply';
  return 'Challenge';
}

function displayName(drug: DrugBackup): string {
  return drug.scientificName.trim() || drug.captureLabel.trim() || 'Unknown medicine';
}

function firstTradeName(drug: DrugBackup): string {
  return drug.tradeNames.find((name) => name.trim()) ?? 'No trade name saved';
}

function uniqueShortChoices(
  correct: string,
  candidates: readonly string[],
  index: number,
): string[] {
  const trimmedCorrect = correct.trim();
  if (!trimmedCorrect || trimmedCorrect.length > 64 || trimmedCorrect.includes('\n')) return [];
  const expectedScript = /[\u0600-\u06ff]/u.test(trimmedCorrect) ? 'arabic' : 'latin';
  const unique = [correct, ...candidates]
    .map((item) => item.trim())
    .filter(
      (item) =>
        item.length > 0 &&
        item.length <= 64 &&
        !item.includes('\n') &&
        (expectedScript === 'arabic'
          ? /[\u0600-\u06ff]/u.test(item)
          : !/[\u0600-\u06ff]/u.test(item)),
    )
    .filter(
      (item, itemIndex, values) =>
        values.findIndex((value) => normalized(value) === normalized(item)) === itemIndex,
    )
    .slice(0, 4);
  if (unique.length < 3) return [];
  const shift = index % unique.length;
  return [...unique.slice(shift), ...unique.slice(0, shift)];
}

function questionFor(
  requestedMode: PracticeMode,
  drug: DrugBackup,
  all: readonly DrugBackup[],
  imageUris: Readonly<Record<string, string>>,
  index: number,
): PracticeQuestion {
  let mode = requestedMode;
  if (requestedMode === 'Weak Drugs') {
    if (!drug.masteryScientificName) mode = 'Trade → Scientific';
    else if (!drug.masteryTradeName) mode = 'Scientific → Trade';
    else if (!drug.masteryClass && drug.drugClass.trim()) mode = 'Class → Examples';
    else if (!drug.masteryUse) mode = 'Drug → Use';
    else if (!drug.masteryWarning) mode = 'Drug → Warning';
    else mode = 'Counseling';
  } else if (
    requestedMode === 'Smart Session' ||
    requestedMode === 'Due Review' ||
    requestedMode === 'System Practice'
  ) {
    const rotation: PracticeMode[] = imageUris[drug.id]
      ? ['Trade → Scientific', 'Image Quiz', 'Drug → Use', 'Drug → Warning', 'Counseling']
      : ['Trade → Scientific', 'Class → Examples', 'Drug → Use', 'Drug → Warning', 'Counseling'];
    mode = rotation[index % rotation.length] ?? 'Drug → Use';
  }

  const base = {
    id: Crypto.randomUUID(),
    drugID: drug.id,
    drugName: displayName(drug),
    imageUri: null,
    caseID: null,
    difficulty: difficulty(index),
  } as const;

  if (mode === 'Scientific → Trade') {
    const answer = firstTradeName(drug);
    return {
      ...base,
      prompt: `Name one brand of ${drug.scientificName}.`,
      correctAnswer: answer,
      acceptedAnswers: drug.tradeNames.length ? drug.tradeNames : [answer],
      choices: [],
      explanation: `Your library saves ${answer} under ${drug.scientificName}.`,
      questionType: 'Trade name',
      interaction: 'textEntry',
      learningObjective: 'Recall brand-to-ingredient identity',
      sourceField: 'products.tradeName',
    };
  }
  if (mode === 'Trade → Scientific') {
    return {
      ...base,
      prompt: `What is the active ingredient in ${firstTradeName(drug)}?`,
      correctAnswer: drug.scientificName,
      acceptedAnswers: [drug.scientificName, ...(drug.activeIngredients ?? [])],
      choices: [],
      explanation: `${firstTradeName(drug)} is saved under ${drug.scientificName}.`,
      questionType: 'Scientific name',
      interaction: 'textEntry',
      learningObjective: 'Recall ingredient from a shelf brand',
      sourceField: 'scientificName',
    };
  }
  if (mode === 'Class → Examples') {
    return {
      ...base,
      prompt: `Recall one drug in the ${drug.drugClass || 'saved'} class.`,
      correctAnswer: displayName(drug),
      acceptedAnswers: [displayName(drug)],
      choices: [],
      explanation: `${displayName(drug)} is saved as ${drug.drugClass || 'an unclassified profile'}.`,
      questionType: 'Class',
      interaction: 'recall',
      learningObjective: 'Retrieve a class example',
      sourceField: 'drugClass',
    };
  }
  if (mode === 'Drug → Use') {
    const answer =
      drug.indications.find((value) => value.trim()) ?? 'No verified indication is saved yet.';
    const choices = uniqueShortChoices(
      answer,
      all.flatMap((item) => item.indications.slice(0, 1)),
      index,
    );
    return {
      ...base,
      prompt: `Which saved use belongs to ${displayName(drug)}?`,
      correctAnswer: answer,
      acceptedAnswers: [answer],
      choices,
      explanation: answer,
      questionType: 'Use',
      interaction: choices.length ? 'multipleChoice' : 'recall',
      learningObjective: 'Connect a drug to its main indication',
      sourceField: 'indications',
    };
  }
  if (mode === 'Drug → Warning') {
    const answer =
      drug.warnings.find((value) => value.trim()) ??
      drug.contraindications.find((value) => value.trim()) ??
      'No verified warning is saved yet.';
    return {
      ...base,
      prompt: `Before supplying ${displayName(drug)}, what key warning must you recall?`,
      correctAnswer: answer,
      acceptedAnswers: [answer],
      choices: [],
      explanation: answer,
      questionType: 'Warning',
      interaction: 'recall',
      learningObjective: 'Retrieve a safety-critical fact',
      sourceField: 'warnings',
    };
  }
  if (mode === 'Image Quiz') {
    return {
      ...base,
      prompt: 'Which active ingredient belongs to this package?',
      correctAnswer: drug.scientificName,
      acceptedAnswers: [drug.scientificName],
      choices: [],
      explanation: `This package is saved under ${drug.scientificName}.`,
      questionType: 'Scientific name',
      interaction: 'textEntry',
      imageUri: imageUris[drug.id] ?? null,
      learningObjective: 'Recognize a real package',
      sourceField: 'packageImages',
    };
  }
  const answer =
    drug.counselingSentence.trim() ||
    drug.howToTake.trim() ||
    drug.foodInstruction.trim() ||
    'No counseling point is saved yet.';
  return {
    ...base,
    prompt: `Counsel a patient taking ${displayName(drug)}. What is the key point?`,
    correctAnswer: answer,
    acceptedAnswers: [answer],
    choices: [],
    explanation: answer,
    questionType: 'Counseling',
    interaction: 'recall',
    learningObjective: 'Retrieve a patient-centered counseling point',
    sourceField: 'counselingSentence',
  };
}

function caseQuestions(drugs: readonly DrugBackup[]): PracticeQuestion[] {
  const cases = [
    {
      id: 'asthma-propranolol',
      relatedScientificName: 'Propranolol',
      prompt: 'A patient with asthma is using propranolol. What should you be careful about?',
      expectedIdea:
        'Non-selective beta blockers may worsen bronchospasm. Confirm with the pharmacist.',
    },
    {
      id: 'warfarin-bleeding',
      relatedScientificName: 'Warfarin',
      prompt:
        'A patient taking an anticoagulant reports unusual bleeding. What is the safest training response?',
      expectedIdea:
        'Treat unusual bleeding as urgent and ask the pharmacist immediately. Do not make a treatment decision.',
    },
    {
      id: 'insulin-low-sugar',
      relatedScientificName: 'Insulin',
      prompt:
        'A person using insulin describes sweating and shakiness. What should the student do?',
      expectedIdea:
        'These may be warning signs of low blood glucose. Ask the pharmacist immediately and do not independently advise treatment.',
    },
  ] as const;
  return Array.from({ length: PRACTICE_QUESTION_COUNT }, (_, index) => {
    const item = cases[index % cases.length]!;
    const drug = drugs.find(
      (candidate) =>
        candidate.scientificName.localeCompare(item.relatedScientificName, undefined, {
          sensitivity: 'base',
        }) === 0,
    );
    return {
      id: Crypto.randomUUID(),
      drugID: drug?.id ?? null,
      drugName: item.relatedScientificName,
      prompt: item.prompt,
      correctAnswer: item.expectedIdea,
      acceptedAnswers: [item.expectedIdea],
      choices: [],
      explanation: item.expectedIdea,
      questionType: 'Case practice',
      interaction: 'recall',
      imageUri: null,
      caseID: item.id,
      difficulty: difficulty(index),
      learningObjective: 'Apply a saved drug fact to a short patient situation',
      sourceField: 'case',
    };
  });
}

export type GeneratePracticeOptions = {
  mode: PracticeMode;
  drugs: readonly DrugBackup[];
  imageUris?: Readonly<Record<string, string>>;
  chapter?: string;
  now?: Date;
};

export function generatePracticeQuestions({
  mode,
  drugs,
  imageUris = {},
  chapter,
  now = new Date(),
}: GeneratePracticeOptions): PracticeQuestion[] {
  const known = drugs.filter((drug) => !drug.isUnknown && drug.scientificName.trim());
  if (mode === 'Case Practice') return caseQuestions(known);
  let eligible = known.filter((drug) => !chapter || drug.chapterRaw === chapter);
  if (mode === 'Weak Drugs') {
    const weak = eligible.filter(
      (drug) => drug.confidenceRaw === 'Weak' || drug.isConfusing || !isMastered(drug),
    );
    if (weak.length > 0) eligible = weak;
  }
  if (mode === 'Due Review') {
    const tomorrow = addLocalDays(now, 1).valueOf();
    eligible = eligible.filter(
      (drug) => (dateFromLegacy(drug.nextReviewDate)?.valueOf() ?? Infinity) < tomorrow,
    );
  }
  if (mode === 'Image Quiz') eligible = eligible.filter((drug) => Boolean(imageUris[drug.id]));
  if (mode === 'Class → Examples') eligible = eligible.filter((drug) => drug.drugClass.trim());
  if (eligible.length === 0) return [];
  eligible.sort(
    (first, second) =>
      masteryCount(first) - masteryCount(second) ||
      (dateFromLegacy(first.nextReviewDate)?.valueOf() ?? Infinity) -
        (dateFromLegacy(second.nextReviewDate)?.valueOf() ?? Infinity) ||
      displayName(first).localeCompare(displayName(second)),
  );
  return Array.from({ length: PRACTICE_QUESTION_COUNT }, (_, index) =>
    questionFor(mode, eligible[index % eligible.length] ?? eligible[0]!, known, imageUris, index),
  );
}
