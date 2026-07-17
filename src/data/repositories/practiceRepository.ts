import type { SQLiteDatabase } from 'expo-sqlite';
import { z } from 'zod';

import {
  encounterBackupSchema,
  reviewBackupSchema,
  type DrugBackup,
  type EncounterBackup,
  type ReviewBackup,
} from '@/domain/backup';
import type { PracticeQuestion } from '@/domain/learning/practiceEngine';
import { questionTypes } from '@/domain/learning/reviewScheduler';
import { addLocalDays, dateFromLegacy, isoDate } from '@/domain/shared/dates';
import { DrugRepository } from './drugRepository';

type PayloadRow = { payload_json: string };
type PackRow = {
  id: string;
  questions_json: string;
  generated_at: string;
  source_revision: string;
};

const practiceQuestionSchema = z.object({
  id: z.string(),
  drugID: z.string().nullable(),
  drugName: z.string(),
  prompt: z.string(),
  correctAnswer: z.string(),
  acceptedAnswers: z.array(z.string()),
  choices: z.array(z.string()),
  explanation: z.string(),
  questionType: z.enum(questionTypes),
  interaction: z.enum(['multipleChoice', 'textEntry', 'recall']),
  imageUri: z.string().nullable(),
  caseID: z.string().nullable(),
  difficulty: z.enum(['Foundation', 'Apply', 'Challenge']),
  learningObjective: z.string(),
  sourceField: z.string(),
});

export type ResurfacedAtomicNote = {
  drugID: string;
  drugName: string;
  kind: string;
  text: string;
  linkedField: string;
};

export type DailyRefresh = {
  drugs: DrugBackup[];
  encounter: EncounterBackup | null;
  atomicNote: ResurfacedAtomicNote | null;
};

export type MistakeVault = {
  mistakes: ReviewBackup[];
  biggestWeakness: string | null;
  biggestWeaknessCount: number;
};

export type CachedPracticePack = {
  id: string;
  generatedAt: string;
  sourceRevision: string;
  questions: PracticeQuestion[];
};

type AtomicNoteCandidate = {
  kindRaw?: unknown;
  kind?: unknown;
  text?: unknown;
  linkedField?: unknown;
};

function firstAtomicNote(drugs: readonly DrugBackup[]): ResurfacedAtomicNote | null {
  for (const drug of drugs) {
    if (!drug.atomicNotesJSON?.trim()) continue;
    try {
      const decoded: unknown = JSON.parse(drug.atomicNotesJSON);
      if (!Array.isArray(decoded)) continue;
      const note = decoded.find(
        (candidate): candidate is AtomicNoteCandidate =>
          Boolean(candidate) &&
          typeof candidate === 'object' &&
          typeof (candidate as AtomicNoteCandidate).text === 'string' &&
          Boolean(((candidate as AtomicNoteCandidate).text as string).trim()),
      );
      if (!note || typeof note.text !== 'string') continue;
      return {
        drugID: drug.id,
        drugName: drug.scientificName || drug.captureLabel || 'Unknown medicine',
        kind:
          typeof note.kindRaw === 'string'
            ? note.kindRaw
            : typeof note.kind === 'string'
              ? note.kind
              : 'linked note',
        text: note.text,
        linkedField: typeof note.linkedField === 'string' ? note.linkedField : 'General',
      };
    } catch {
      continue;
    }
  }
  return null;
}

export function libraryRevision(drugs: readonly DrugBackup[]): string {
  return [...drugs]
    .filter((drug) => !drug.isUnknown)
    .sort((first, second) => first.id.localeCompare(second.id))
    .map((drug) => `${drug.id}:${isoDate(drug.dateAdded)}`)
    .join('|');
}

export class PracticeRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async dailyRefresh(now = new Date()): Promise<DailyRefresh> {
    const drugs = await new DrugRepository(this.db).list({ scope: 'all', sort: 'due', now });
    const tomorrow = addLocalDays(now, 1).valueOf();
    const refreshDrugs = drugs
      .filter(
        (drug) =>
          (dateFromLegacy(drug.nextReviewDate)?.valueOf() ?? Number.POSITIVE_INFINITY) < tomorrow ||
          drug.isConfusing,
      )
      .slice(0, 5);
    const encounterRows = await this.db.getAllAsync<PayloadRow>(
      'SELECT payload_json FROM encounter_notes ORDER BY date DESC',
    );
    const encounter = encounterRows
      .map((row) => encounterBackupSchema.parse(JSON.parse(row.payload_json) as unknown))
      .find((note) =>
        [note.topic, note.whatHappened, note.whatILearned, note.pharmacistNote].some((value) =>
          value.trim(),
        ),
      );
    return {
      drugs: refreshDrugs,
      encounter: encounter ?? null,
      atomicNote: firstAtomicNote(drugs),
    };
  }

  async mistakeVault(): Promise<MistakeVault> {
    const rows = await this.db.getAllAsync<PayloadRow>(
      `SELECT payload_json FROM review_logs
       WHERE was_correct = 0 ORDER BY date DESC LIMIT 20`,
    );
    const mistakes = rows.map((row) =>
      reviewBackupSchema.parse(JSON.parse(row.payload_json) as unknown),
    );
    const counts = new Map<string, number>();
    for (const mistake of mistakes) {
      counts.set(mistake.questionTypeRaw, (counts.get(mistake.questionTypeRaw) ?? 0) + 1);
    }
    const biggest = [...counts.entries()].sort(
      (first, second) => second[1] - first[1] || first[0].localeCompare(second[0]),
    )[0];
    return {
      mistakes,
      biggestWeakness: biggest?.[0] ?? null,
      biggestWeaknessCount: biggest?.[1] ?? 0,
    };
  }

  async loadPack(id = 'ai-practice-pack-v1'): Promise<CachedPracticePack | null> {
    const row = await this.db.getFirstAsync<PackRow>(
      `SELECT id, questions_json, generated_at, source_revision FROM practice_packs
       WHERE id = ? AND invalidated_at IS NULL`,
      id,
    );
    if (!row) return null;
    try {
      const questions = z.array(practiceQuestionSchema).parse(JSON.parse(row.questions_json));
      if (questions.length !== 5) return null;
      return {
        id: row.id,
        generatedAt: row.generated_at,
        sourceRevision: row.source_revision,
        questions,
      };
    } catch {
      return null;
    }
  }

  async savePack(
    questions: readonly PracticeQuestion[],
    drugs: readonly DrugBackup[],
    now = new Date(),
    id = 'ai-practice-pack-v1',
  ): Promise<CachedPracticePack> {
    const parsed = z.array(practiceQuestionSchema).parse(questions);
    if (parsed.length !== 5)
      throw new Error('A cached practice pack must contain exactly five questions.');
    const pack: CachedPracticePack = {
      id,
      generatedAt: now.toISOString(),
      sourceRevision: libraryRevision(drugs),
      questions: parsed,
    };
    await this.db.runAsync(
      `INSERT INTO practice_packs (
         id, mode_raw, scope_key, questions_json, generated_at, source_revision, invalidated_at
       ) VALUES (?, 'AI practice pack', 'library', ?, ?, ?, NULL)
       ON CONFLICT(id) DO UPDATE SET
         questions_json = excluded.questions_json,
         generated_at = excluded.generated_at,
         source_revision = excluded.source_revision,
         invalidated_at = NULL`,
      pack.id,
      JSON.stringify(pack.questions),
      pack.generatedAt,
      pack.sourceRevision,
    );
    return pack;
  }

  async clearPack(id = 'ai-practice-pack-v1'): Promise<void> {
    await this.db.runAsync('DELETE FROM practice_packs WHERE id = ?', id);
  }
}
