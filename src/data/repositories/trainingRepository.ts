import * as Crypto from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import {
  drugBackupSchema,
  encounterBackupSchema,
  reviewBackupSchema,
  shiftBackupSchema,
  trainingReportBackupSchema,
  type EncounterBackup,
  type ShiftBackup,
  type TrainingReportBackup,
} from '@/domain/backup';
import { containsObviousIdentifier } from '@/domain/privacy/privacyValidator';
import { isMastered, masteryFields } from '@/domain/drugs/mastery';
import { isoDate } from '@/domain/shared/dates';
import { buildTrainingReport } from '@/domain/training/reportBuilder';
import { DrugRepository } from './drugRepository';

type PayloadRow = { payload_json: string };
type CountRow = { count: number };

export type TrainingDashboard = {
  activeShift: ShiftBackup | null;
  completedShifts: number;
  activeNewDrugs: number;
  activeReviews: number;
  recentEncounters: EncounterBackup[];
  reports: TrainingReportBackup[];
};

export type TrainingBreakdown = { label: string; count: number };

export type TrainingAnalytics = {
  totalDrugs: number;
  mastered: number;
  weak: number;
  reviews: number;
  completedShifts: number;
  masteryValues: number[];
  chapters: TrainingBreakdown[];
  classes: TrainingBreakdown[];
};

function breakdown(values: string[], fallback?: string): TrainingBreakdown[] {
  const counts = new Map<string, number>();
  for (const raw of values) {
    const label = raw.trim() || fallback;
    if (!label) continue;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
}

export function summarizeTrainingAnalytics(
  drugs: ReturnType<typeof drugBackupSchema.parse>[],
  reviews: number,
  completedShifts: number,
): TrainingAnalytics {
  const denominator = drugs.length || 1;
  return {
    totalDrugs: drugs.length,
    mastered: drugs.filter(isMastered).length,
    weak: drugs.filter(
      (drug) => drug.confidenceRaw.trim().toLocaleLowerCase() === 'weak' || drug.isConfusing,
    ).length,
    reviews,
    completedShifts,
    masteryValues: masteryFields.map(
      (field) => drugs.filter((drug) => drug[field]).length / denominator,
    ),
    chapters: breakdown(
      drugs.map((drug) => drug.chapterRaw),
      'Other',
    ),
    classes: breakdown(drugs.map((drug) => drug.drugClass)),
  };
}

export type ShiftReflection = {
  whatILearned: string;
  confusingDrugs: string[];
  pharmacistQuestions: string[];
  tomorrowReview: string;
  notes: string;
};

export type EncounterDraft = {
  topic: string;
  relatedDrugID: string | null;
  whatHappened: string;
  whatILearned: string;
  pharmacistNote: string;
  privacyConfirmed: boolean;
};

export class TrainingRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async dashboard(): Promise<TrainingDashboard> {
    const shifts = await this.listShifts();
    const activeShift = shifts.find((shift) => !shift.isCompleted) ?? null;
    const encounterRows = await this.db.getAllAsync<PayloadRow>(
      'SELECT payload_json FROM encounter_notes ORDER BY date DESC LIMIT 3',
    );
    const reportRows = await this.db.getAllAsync<PayloadRow>(
      'SELECT payload_json FROM training_reports ORDER BY period_start DESC, updated_at DESC',
    );
    let activeNewDrugs = 0;
    let activeReviews = 0;
    if (activeShift) {
      const startedAt = isoDate(activeShift.startedAt);
      const [drugCount, reviewCount] = await Promise.all([
        this.db.getFirstAsync<CountRow>(
          'SELECT COUNT(*) AS count FROM drug_profiles WHERE date_added >= ?',
          startedAt,
        ),
        this.db.getFirstAsync<CountRow>(
          'SELECT COUNT(*) AS count FROM review_logs WHERE date >= ?',
          startedAt,
        ),
      ]);
      activeNewDrugs = drugCount?.count ?? 0;
      activeReviews = reviewCount?.count ?? 0;
    }
    return {
      activeShift,
      completedShifts: shifts.filter((shift) => shift.isCompleted).length,
      activeNewDrugs,
      activeReviews,
      recentEncounters: encounterRows.map((row) =>
        encounterBackupSchema.parse(JSON.parse(row.payload_json) as unknown),
      ),
      reports: reportRows.map((row) =>
        trainingReportBackupSchema.parse(JSON.parse(row.payload_json) as unknown),
      ),
    };
  }

  async analytics(): Promise<TrainingAnalytics> {
    const [drugRows, reviewCount, completedShiftCount] = await Promise.all([
      this.db.getAllAsync<PayloadRow>('SELECT payload_json FROM drug_profiles'),
      this.db.getFirstAsync<CountRow>('SELECT COUNT(*) AS count FROM review_logs'),
      this.db.getFirstAsync<CountRow>(
        'SELECT COUNT(*) AS count FROM shift_logs WHERE is_completed = 1',
      ),
    ]);
    return summarizeTrainingAnalytics(
      drugRows.map((row) => drugBackupSchema.parse(JSON.parse(row.payload_json) as unknown)),
      reviewCount?.count ?? 0,
      completedShiftCount?.count ?? 0,
    );
  }

  async listShifts(): Promise<ShiftBackup[]> {
    const rows = await this.db.getAllAsync<PayloadRow>(
      'SELECT payload_json FROM shift_logs ORDER BY started_at DESC',
    );
    return rows.map((row) => shiftBackupSchema.parse(JSON.parse(row.payload_json) as unknown));
  }

  async startShift(chapterFocusRaw: string, now = new Date()): Promise<ShiftBackup> {
    const existing = (await this.listShifts()).find((shift) => !shift.isCompleted);
    if (existing) return existing;
    const shift = shiftBackupSchema.parse({
      id: Crypto.randomUUID(),
      date: now.toISOString(),
      startedAt: now.toISOString(),
      endedAt: null,
      chapterFocusRaw: chapterFocusRaw.trim() || 'Other',
      newDrugsAdded: 0,
      reviewsCompleted: 0,
      pharmacistQuestions: [],
      whatILearned: '',
      confusingDrugs: [],
      notes: '',
      tomorrowReview: '',
      isCompleted: false,
    });
    await this.saveShift(shift);
    return shift;
  }

  async completeShift(
    id: string,
    reflection: ShiftReflection,
    now = new Date(),
  ): Promise<ShiftBackup> {
    const row = await this.db.getFirstAsync<PayloadRow>(
      'SELECT payload_json FROM shift_logs WHERE id = ?',
      id,
    );
    if (!row) throw new Error('The active shift is no longer available.');
    const shift = shiftBackupSchema.parse(JSON.parse(row.payload_json) as unknown);
    const [newDrugs, reviews] = await Promise.all([
      this.db.getFirstAsync<CountRow>(
        'SELECT COUNT(*) AS count FROM drug_profiles WHERE date_added >= ? AND date_added <= ?',
        isoDate(shift.startedAt),
        now.toISOString(),
      ),
      this.db.getFirstAsync<CountRow>(
        'SELECT COUNT(*) AS count FROM review_logs WHERE date >= ? AND date <= ?',
        isoDate(shift.startedAt),
        now.toISOString(),
      ),
    ]);
    const completed: ShiftBackup = {
      ...shift,
      endedAt: now.toISOString(),
      newDrugsAdded: newDrugs?.count ?? 0,
      reviewsCompleted: reviews?.count ?? 0,
      pharmacistQuestions: reflection.pharmacistQuestions,
      whatILearned: reflection.whatILearned.trim(),
      confusingDrugs: reflection.confusingDrugs,
      notes: reflection.notes.trim(),
      tomorrowReview: reflection.tomorrowReview.trim(),
      isCompleted: true,
    };
    await this.saveShift(completed);
    return completed;
  }

  async saveEncounter(draft: EncounterDraft, now = new Date()): Promise<EncounterBackup> {
    const topic = draft.topic.trim();
    if (!topic) throw new Error('Enter an educational topic.');
    if (!draft.privacyConfirmed) {
      throw new Error('Confirm that the note contains no patient-identifying data.');
    }
    const combined = [topic, draft.whatHappened, draft.whatILearned, draft.pharmacistNote].join(
      ' ',
    );
    if (containsObviousIdentifier(combined)) {
      throw new Error(
        'This looks like it may contain a phone number or email address. Remove identifying information before saving.',
      );
    }
    const relatedDrug = draft.relatedDrugID
      ? await new DrugRepository(this.db).get(draft.relatedDrugID)
      : null;
    const encounter = encounterBackupSchema.parse({
      id: Crypto.randomUUID(),
      date: now.toISOString(),
      topic,
      relatedDrugID: relatedDrug?.id ?? null,
      relatedDrugNameSnapshot:
        relatedDrug?.scientificName.trim() || relatedDrug?.captureLabel || '',
      whatHappened: draft.whatHappened.trim(),
      whatILearned: draft.whatILearned.trim(),
      pharmacistNote: draft.pharmacistNote.trim(),
      privacyConfirmed: true,
    });
    await this.db.runAsync(
      `INSERT INTO encounter_notes (
        id, date, topic, related_drug_id, related_drug_name_snapshot,
        privacy_confirmed, payload_json, updated_at
      ) VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
      encounter.id,
      isoDate(encounter.date),
      encounter.topic,
      encounter.relatedDrugID,
      encounter.relatedDrugNameSnapshot,
      JSON.stringify(encounter),
      now.toISOString(),
    );
    return encounter;
  }

  async generateReport(
    periodStart: Date,
    periodEnd: Date,
    now = new Date(),
  ): Promise<TrainingReportBackup> {
    if (periodEnd < periodStart) throw new Error('The report end date must follow its start date.');
    const [drugRows, reviewRows, shiftRows, encounterRows] = await Promise.all([
      this.db.getAllAsync<PayloadRow>('SELECT payload_json FROM drug_profiles'),
      this.db.getAllAsync<PayloadRow>('SELECT payload_json FROM review_logs'),
      this.db.getAllAsync<PayloadRow>('SELECT payload_json FROM shift_logs'),
      this.db.getAllAsync<PayloadRow>('SELECT payload_json FROM encounter_notes'),
    ]);
    const report = buildTrainingReport({
      id: Crypto.randomUUID(),
      periodStart,
      periodEnd,
      evidence: {
        drugs: drugRows.map((row) =>
          drugBackupSchema.parse(JSON.parse(row.payload_json) as unknown),
        ),
        reviews: reviewRows.map((row) =>
          reviewBackupSchema.parse(JSON.parse(row.payload_json) as unknown),
        ),
        shifts: shiftRows.map((row) =>
          shiftBackupSchema.parse(JSON.parse(row.payload_json) as unknown),
        ),
        encounters: encounterRows.map((row) =>
          encounterBackupSchema.parse(JSON.parse(row.payload_json) as unknown),
        ),
      },
      now,
    });
    await this.saveReport(report);
    return report;
  }

  async getReport(id: string): Promise<TrainingReportBackup | null> {
    const row = await this.db.getFirstAsync<PayloadRow>(
      'SELECT payload_json FROM training_reports WHERE id = ?',
      id,
    );
    return row ? trainingReportBackupSchema.parse(JSON.parse(row.payload_json) as unknown) : null;
  }

  async saveReport(report: TrainingReportBackup): Promise<void> {
    const parsed = trainingReportBackupSchema.parse(report);
    await this.db.runAsync(
      `INSERT INTO training_reports (
        id, period_start, period_end, generated_at, updated_at, payload_json
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        period_start = excluded.period_start,
        period_end = excluded.period_end,
        generated_at = excluded.generated_at,
        updated_at = excluded.updated_at,
        payload_json = excluded.payload_json`,
      parsed.id,
      isoDate(parsed.periodStart),
      isoDate(parsed.periodEnd),
      isoDate(parsed.generatedAt),
      isoDate(parsed.updatedAt),
      JSON.stringify(parsed),
    );
  }

  private async saveShift(shift: ShiftBackup): Promise<void> {
    await this.db.runAsync(
      `INSERT INTO shift_logs (
        id, date, started_at, ended_at, is_completed, payload_json, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        date = excluded.date,
        started_at = excluded.started_at,
        ended_at = excluded.ended_at,
        is_completed = excluded.is_completed,
        payload_json = excluded.payload_json,
        updated_at = excluded.updated_at`,
      shift.id,
      isoDate(shift.date),
      isoDate(shift.startedAt),
      shift.endedAt == null ? null : isoDate(shift.endedAt),
      shift.isCompleted ? 1 : 0,
      JSON.stringify(shift),
      new Date().toISOString(),
    );
  }
}
