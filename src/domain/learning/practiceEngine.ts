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

function difficultyForMode(mode: PracticeMode): QuestionDifficulty {
  if (mode === 'Drug → Warning' || mode === 'Counseling' || mode === 'Case Practice') {
    return 'Apply';
  }
  return 'Foundation';
}

function displayName(drug: DrugBackup): string {
  return drug.scientificName.trim() || drug.captureLabel.trim() || 'Unknown medicine';
}

function firstTradeName(drug: DrugBackup): string {
  return drug.tradeNames.find((name) => name.trim())?.trim() ?? '';
}

const MAX_RECALL_CHARACTERS = 160;
const lowValueFactPattern =
  /\b(?:see (?:section|clinical pharmacology)|references?|no information is available|data (?:are|is) unavailable|package insert)\b/iu;

function shortFactCandidates(value: string): string[] {
  const normalized = value.replace(/\s+/gu, ' ').trim();
  if (!normalized || lowValueFactPattern.test(normalized)) return [];
  const sentences = normalized.match(/[^.!?]+[.!?]?/gu)?.map((item) => item.trim()) ?? [];
  return [normalized, ...sentences].filter(
    (item, index, all) =>
      item.length > 0 &&
      item.length <= MAX_RECALL_CHARACTERS &&
      all.findIndex((candidate) => candidate === item) === index,
  );
}

function conciseFact(values: readonly string[]): string {
  for (const value of values) {
    const candidate = shortFactCandidates(value)[0];
    if (candidate) return candidate;
  }
  return '';
}

function counselingFact(drug: DrugBackup): string {
  return conciseFact([drug.counselingSentence, drug.howToTake, drug.foodInstruction]);
}

function warningFact(drug: DrugBackup): string {
  return conciseFact([...drug.warnings, ...drug.contraindications, ...drug.seriousSideEffects]);
}

function supportsQuestionMode(
  mode: PracticeMode,
  drug: DrugBackup,
  imageUris: Readonly<Record<string, string>>,
): boolean {
  if (mode === 'Scientific → Trade' || mode === 'Trade → Scientific') {
    return Boolean(drug.scientificName.trim() && firstTradeName(drug));
  }
  if (mode === 'Class → Examples') return Boolean(drug.drugClass.trim());
  if (mode === 'Drug → Use') return Boolean(conciseFact(drug.indications));
  if (mode === 'Drug → Warning') return Boolean(warningFact(drug));
  if (mode === 'Image Quiz') return Boolean(imageUris[drug.id]);
  if (mode === 'Counseling') return Boolean(counselingFact(drug));
  return true;
}

const smartModeRotation: readonly PracticeMode[] = [
  'Trade → Scientific',
  'Drug → Use',
  'Drug → Warning',
  'Counseling',
  'Image Quiz',
  'Class → Examples',
  'Scientific → Trade',
];

function weakModeFor(
  drug: DrugBackup,
  imageUris: Readonly<Record<string, string>>,
): PracticeMode | null {
  const priorities: readonly [boolean, PracticeMode][] = [
    [!drug.masteryScientificName, 'Trade → Scientific'],
    [!drug.masteryTradeName, 'Scientific → Trade'],
    [!drug.masteryClass, 'Class → Examples'],
    [!drug.masteryUse, 'Drug → Use'],
    [!drug.masteryWarning, 'Drug → Warning'],
    [!drug.masteryCounseling, 'Counseling'],
    [Boolean(imageUris[drug.id]), 'Image Quiz'],
  ];
  return (
    priorities.find(
      ([needed, mode]) => needed && supportsQuestionMode(mode, drug, imageUris),
    )?.[1] ??
    smartModeRotation.find((mode) => supportsQuestionMode(mode, drug, imageUris)) ??
    null
  );
}

function smartQuestionPlan(
  drugs: readonly DrugBackup[],
  imageUris: Readonly<Record<string, string>>,
): { drug: DrugBackup; mode: PracticeMode }[] {
  const plan: { drug: DrugBackup; mode: PracticeMode }[] = [];
  const usedPairs = new Set<string>();
  let drugCursor = 0;

  const canUseMode = (mode: PracticeMode) =>
    mode !== 'Image Quiz' || !plan.some((item) => item.mode === 'Image Quiz');

  for (const mode of smartModeRotation) {
    const candidates: { drug: DrugBackup; index: number }[] = Array.from(
      { length: drugs.length },
      (_, offset) => {
        const index = (drugCursor + offset) % drugs.length;
        return { drug: drugs[index]!, index };
      },
    );
    const candidate = candidates.find(
      (item) =>
        canUseMode(mode) &&
        supportsQuestionMode(mode, item.drug, imageUris) &&
        !usedPairs.has(`${item.drug.id}:${mode}`),
    );
    if (!candidate) continue;
    plan.push({ drug: candidate.drug, mode });
    usedPairs.add(`${candidate.drug.id}:${mode}`);
    drugCursor = (candidate.index + 1) % drugs.length;
    if (plan.length === PRACTICE_QUESTION_COUNT) break;
  }

  if (plan.length < PRACTICE_QUESTION_COUNT) {
    for (let offset = 0; offset < drugs.length; offset += 1) {
      const drug = drugs[(drugCursor + offset) % drugs.length]!;
      for (const mode of smartModeRotation) {
        const pair = `${drug.id}:${mode}`;
        if (
          !canUseMode(mode) ||
          !supportsQuestionMode(mode, drug, imageUris) ||
          usedPairs.has(pair)
        )
          continue;
        plan.push({ drug, mode });
        usedPairs.add(pair);
        if (plan.length === PRACTICE_QUESTION_COUNT) break;
      }
      if (plan.length === PRACTICE_QUESTION_COUNT) break;
    }
  }

  if (plan.length === 0) return [];
  return Array.from({ length: PRACTICE_QUESTION_COUNT }, (_, index) => plan[index % plan.length]!);
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
    mode = weakModeFor(drug, imageUris) ?? 'Drug → Use';
  }

  const base = {
    id: Crypto.randomUUID(),
    drugID: drug.id,
    drugName: displayName(drug),
    imageUri: null,
    caseID: null,
    difficulty: difficultyForMode(mode),
  } as const;

  if (mode === 'Scientific → Trade') {
    const answer = firstTradeName(drug);
    return {
      ...base,
      prompt: `Name one saved brand for ${drug.scientificName}.`,
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
      prompt: `Name one drug in the ${drug.drugClass} class.`,
      correctAnswer: displayName(drug),
      acceptedAnswers: [displayName(drug)],
      choices: [],
      explanation: `${displayName(drug)} is saved in the ${drug.drugClass} class.`,
      questionType: 'Class',
      interaction: 'recall',
      learningObjective: 'Retrieve a class example',
      sourceField: 'drugClass',
    };
  }
  if (mode === 'Drug → Use') {
    const answer = conciseFact(drug.indications);
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
    const answer = warningFact(drug);
    return {
      ...base,
      prompt: `What key warning matters most for ${displayName(drug)}?`,
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
  const answer = counselingFact(drug);
  return {
    ...base,
    prompt: `What counseling point matters most for ${displayName(drug)}?`,
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
      difficulty: difficultyForMode('Case Practice'),
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
  if (!['Smart Session', 'Weak Drugs', 'Due Review', 'System Practice'].includes(mode)) {
    eligible = eligible.filter((drug) => supportsQuestionMode(mode, drug, imageUris));
  }
  if (mode === 'Weak Drugs') {
    eligible = eligible.filter((drug) => weakModeFor(drug, imageUris) !== null);
  }
  if (eligible.length === 0) return [];
  eligible.sort(
    (first, second) =>
      masteryCount(first) - masteryCount(second) ||
      (dateFromLegacy(first.nextReviewDate)?.valueOf() ?? Infinity) -
        (dateFromLegacy(second.nextReviewDate)?.valueOf() ?? Infinity) ||
      displayName(first).localeCompare(displayName(second)),
  );
  if (mode === 'Smart Session' || mode === 'Due Review' || mode === 'System Practice') {
    return smartQuestionPlan(eligible, imageUris).map((item, index) =>
      questionFor(item.mode, item.drug, known, imageUris, index),
    );
  }
  return Array.from({ length: PRACTICE_QUESTION_COUNT }, (_, index) => {
    const drug = eligible[index % eligible.length] ?? eligible[0]!;
    return questionFor(mode, drug, known, imageUris, index);
  });
}
