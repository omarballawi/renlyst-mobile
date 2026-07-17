import * as Crypto from 'expo-crypto';

import type { DrugBackup, ReviewBackup } from '@/domain/backup';
import { confidenceFor, masteryCount, type MasteryField } from '@/domain/drugs/mastery';
import { addLocalDays, dateFromLegacy, startOfLocalDay } from '@/domain/shared/dates';

export const questionTypes = [
  'Scientific name',
  'Trade name',
  'Class',
  'Use',
  'Warning',
  'Counseling',
  'Case practice',
] as const;

export type QuestionType = (typeof questionTypes)[number];
export type ReviewRating = 'Correct' | 'Partly correct' | 'Wrong';
export type MemoryReviewGrade = 'Again' | 'Hard' | 'Good' | 'Easy';

export type MemoryItemState = {
  id: string;
  fieldRaw: QuestionType;
  difficulty: number;
  stabilityDays: number;
  retrievability: number;
  dueDate: string | number;
  lastReviewed: string | number | null;
  repetitions: number;
  lapses: number;
};

const masteryFieldForQuestion: Partial<Record<QuestionType, MasteryField>> = {
  'Scientific name': 'masteryScientificName',
  'Trade name': 'masteryTradeName',
  Class: 'masteryClass',
  Use: 'masteryUse',
  Warning: 'masteryWarning',
  Counseling: 'masteryCounseling',
};

function initialMemoryItems(now: Date): MemoryItemState[] {
  return questionTypes
    .filter((field): field is Exclude<QuestionType, 'Case practice'> => field !== 'Case practice')
    .map((field) => ({
      id: Crypto.randomUUID(),
      fieldRaw: field,
      difficulty: 5,
      stabilityDays: 0.5,
      retrievability: 1,
      dueDate: now.toISOString(),
      lastReviewed: null,
      repetitions: 0,
      lapses: 0,
    }));
}

export function readMemoryItems(drug: DrugBackup, now = new Date()): MemoryItemState[] {
  if (drug.memoryItemsJSON.trim()) {
    try {
      const decoded = JSON.parse(drug.memoryItemsJSON) as unknown;
      if (Array.isArray(decoded) && decoded.length > 0) {
        return decoded as MemoryItemState[];
      }
    } catch {
      // A damaged derived cache must not make the profile unreadable.
    }
  }
  return initialMemoryItems(now);
}

export type ReviewApplication = {
  drug: DrugBackup;
  review: ReviewBackup;
  intervalDays: number;
};

export function applyReview(
  source: DrugBackup,
  rating: ReviewRating,
  questionType: QuestionType,
  now = new Date(),
  caseID: string | null = null,
): ReviewApplication {
  const drug: DrugBackup = structuredClone(source);
  const scoreBefore = masteryCount(drug);
  let intervalDays: number;
  const masteryField = masteryFieldForQuestion[questionType];

  if (rating === 'Wrong') {
    drug.correctStreak = 0;
    if (masteryField) drug[masteryField] = false;
    intervalDays = 1;
  } else if (rating === 'Partly correct') {
    drug.correctStreak = 0;
    intervalDays = 3;
  } else {
    drug.correctStreak += 1;
    if (masteryField) drug[masteryField] = true;
    intervalDays = drug.correctStreak === 1 ? 7 : drug.correctStreak === 2 ? 14 : 30;
  }

  drug.confidenceRaw = confidenceFor(drug);
  drug.lastReviewed = now.toISOString();

  const items = readMemoryItems(drug, now);
  const itemIndex = items.findIndex((item) => item.fieldRaw === questionType);
  if (itemIndex >= 0) {
    const existing = items[itemIndex];
    if (existing) {
      const item = { ...existing };
      const previousReview = item.lastReviewed == null ? null : dateFromLegacy(item.lastReviewed);
      const elapsedDays = Math.max(
        0,
        previousReview ? (now.valueOf() - previousReview.valueOf()) / 86_400_000 : 0,
      );
      item.retrievability = Math.exp(-elapsedDays / Math.max(item.stabilityDays, 0.1));
      item.lastReviewed = now.toISOString();

      if (rating === 'Wrong') {
        item.lapses += 1;
        item.repetitions = 0;
        item.difficulty = Math.min(10, item.difficulty + 0.8);
        item.stabilityDays = Math.max(0.25, item.stabilityDays * 0.45);
      } else if (rating === 'Partly correct') {
        item.repetitions += 1;
        item.difficulty = Math.min(10, item.difficulty + 0.15);
        item.stabilityDays = Math.max(1, item.stabilityDays * 1.35);
      } else {
        item.repetitions += 1;
        item.difficulty = Math.max(1, item.difficulty - 0.2);
        const growth = 2.2 + (10 - item.difficulty) * 0.08;
        item.stabilityDays = Math.max(intervalDays, item.stabilityDays * growth);
      }

      item.retrievability = 1;
      const memoryInterval = Math.max(1, Math.round(item.stabilityDays));
      item.dueDate = addLocalDays(now, memoryInterval).toISOString();
      items[itemIndex] = item;
      drug.nextReviewDate = item.dueDate;
    }
  } else {
    drug.nextReviewDate = addLocalDays(now, intervalDays).toISOString();
  }
  drug.memoryItemsJSON = JSON.stringify(items);

  const review: ReviewBackup = {
    id: Crypto.randomUUID(),
    drugID: drug.id,
    drugNameSnapshot: drug.scientificName,
    date: now.toISOString(),
    questionTypeRaw: questionType,
    ratingRaw: rating,
    wasCorrect: rating === 'Correct',
    scoreBefore,
    scoreAfter: masteryCount(drug),
    caseID,
  };

  return { drug, review, intervalDays };
}

export function isDue(drug: DrugBackup, now = new Date()): boolean {
  const due = dateFromLegacy(drug.nextReviewDate);
  return due !== null && due < addLocalDays(startOfLocalDay(now), 1);
}

export function adjustMemoryGrade(
  source: DrugBackup,
  field: QuestionType,
  grade: MemoryReviewGrade,
  now = new Date(),
): { drug: DrugBackup; intervalDays: number } {
  const drug: DrugBackup = structuredClone(source);
  const items = readMemoryItems(drug, now);
  const index = items.findIndex((item) => item.fieldRaw === field);
  const existing = index >= 0 ? items[index] : undefined;
  if (!existing) return { drug, intervalDays: 0 };

  const item = { ...existing };
  let intervalDays: number;
  if (grade === 'Again') {
    item.stabilityDays = Math.max(0.25, item.stabilityDays * 0.45);
    item.difficulty = Math.min(10, item.difficulty + 0.8);
    item.lapses += 1;
    intervalDays = 1;
  } else if (grade === 'Hard') {
    item.stabilityDays = Math.max(2, item.stabilityDays * 0.75);
    item.difficulty = Math.min(10, item.difficulty + 0.15);
    intervalDays = Math.max(2, Math.round(item.stabilityDays));
  } else if (grade === 'Good') {
    intervalDays = Math.max(3, Math.round(item.stabilityDays));
  } else {
    item.stabilityDays = Math.max(7, item.stabilityDays * 1.55);
    item.difficulty = Math.max(1, item.difficulty - 0.3);
    intervalDays = Math.max(7, Math.round(item.stabilityDays));
  }

  item.dueDate = addLocalDays(now, intervalDays).toISOString();
  item.retrievability = 1;
  item.lastReviewed = now.toISOString();
  items[index] = item;
  drug.memoryItemsJSON = JSON.stringify(items);
  drug.nextReviewDate = item.dueDate;
  return { drug, intervalDays };
}
