import {
  trainingReportBackupSchema,
  type DrugBackup,
  type EncounterBackup,
  type ReviewBackup,
  type ShiftBackup,
  type TrainingReportBackup,
} from '@/domain/backup';
import { isMastered } from '@/domain/drugs/mastery';
import { addLocalDays, dateFromLegacy, startOfLocalDay } from '@/domain/shared/dates';

export type ReportEvidence = {
  drugs: readonly DrugBackup[];
  reviews: readonly ReviewBackup[];
  shifts: readonly ShiftBackup[];
  encounters: readonly EncounterBackup[];
};

function splitLines(value: string): string[] {
  return value
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);
}

function uniqueLines(values: readonly string[]): string {
  const seen = new Set<string>();
  const unique = values.flatMap(splitLines).filter((value) => {
    const key = value.toLocaleLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return unique.length > 0
    ? unique.map((value) => `• ${value}`).join('\n')
    : 'No entries recorded.';
}

function groupedCounts(values: readonly string[]): string {
  const counts = new Map<string, number>();
  for (const value of values.filter(Boolean)) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()]
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([value, count]) => `• ${value}: ${count}`)
    .join('\n');
}

function masteredByChapter(drugs: readonly DrugBackup[]): string {
  const mastered = drugs.filter(isMastered);
  if (mastered.length === 0) return 'No drugs have reached 6/6 mastery yet.';
  const groups = new Map<string, DrugBackup[]>();
  for (const drug of mastered) {
    const members = groups.get(drug.chapterRaw) ?? [];
    members.push(drug);
    groups.set(drug.chapterRaw, members);
  }
  return [...groups.entries()]
    .sort(([first], [second]) => first.localeCompare(second))
    .map(
      ([chapter, members]) =>
        `${chapter}\n${members
          .sort((first, second) => first.scientificName.localeCompare(second.scientificName))
          .map((drug) => `• ${drug.scientificName.trim() || drug.captureLabel}`)
          .join('\n')}`,
    )
    .join('\n\n');
}

function inPeriod(value: string | number, start: Date, endExclusive: Date): boolean {
  const date = dateFromLegacy(value);
  return date !== null && date >= start && date < endExclusive;
}

export function buildTrainingReport({
  id,
  periodStart,
  periodEnd,
  evidence,
  now = new Date(),
}: {
  id: string;
  periodStart: Date;
  periodEnd: Date;
  evidence: ReportEvidence;
  now?: Date;
}): TrainingReportBackup {
  const start = startOfLocalDay(periodStart);
  const endExclusive = addLocalDays(periodEnd, 1);
  const shifts = evidence.shifts.filter(
    (shift) => shift.isCompleted && inPeriod(shift.date, start, endExclusive),
  );
  const reviews = evidence.reviews.filter((review) => inPeriod(review.date, start, endExclusive));
  const encounters = evidence.encounters.filter((encounter) =>
    inPeriod(encounter.date, start, endExclusive),
  );
  const addedDrugs = evidence.drugs.filter((drug) => inPeriod(drug.dateAdded, start, endExclusive));

  return trainingReportBackupSchema.parse({
    id,
    periodStart: start.toISOString(),
    periodEnd: startOfLocalDay(periodEnd).toISOString(),
    generatedAt: now.toISOString(),
    updatedAt: now.toISOString(),
    trainingSummary: `Completed ${shifts.length} shifts, added ${addedDrugs.length} drugs, and completed ${reviews.length} reviews.`,
    skillsLearned: uniqueLines([
      ...shifts.map((shift) => shift.whatILearned),
      ...encounters.map((encounter) => encounter.whatILearned),
    ]),
    categoriesStudied: groupedCounts(evidence.drugs.map((drug) => drug.chapterRaw)),
    dosageFormsSeen: uniqueLines(evidence.drugs.flatMap((drug) => drug.dosageForms)),
    counselingPoints: uniqueLines(evidence.drugs.map((drug) => drug.counselingSentence)),
    pharmacistQuestions: uniqueLines(shifts.flatMap((shift) => shift.pharmacistQuestions)),
    challenges: uniqueLines([
      ...shifts.flatMap((shift) => shift.confusingDrugs),
      ...shifts.map((shift) => shift.notes),
    ]),
    notesAndRecommendations: uniqueLines(shifts.map((shift) => shift.tomorrowReview)),
    masteredDrugs: masteredByChapter(evidence.drugs),
  });
}

export function trainingReportText(report: TrainingReportBackup): string {
  const format = (value: string | number) =>
    dateFromLegacy(value)?.toLocaleDateString(undefined, { dateStyle: 'medium' }) ?? '';
  return `RENLYST — FINAL TRAINING REPORT
Period: ${format(report.periodStart)} – ${format(report.periodEnd)}

TRAINING PERIOD SUMMARY
${report.trainingSummary}

SKILLS LEARNED
${report.skillsLearned}

DRUG CATEGORIES STUDIED
${report.categoriesStudied}

COMMON DOSAGE FORMS SEEN
${report.dosageFormsSeen}

IMPORTANT COUNSELING POINTS LEARNED
${report.counselingPoints}

PHARMACIST QUESTIONS ASKED
${report.pharmacistQuestions}

CHALLENGES FACED
${report.challenges}

NOTES AND RECOMMENDATIONS
${report.notesAndRecommendations}

MASTERED DRUGS BY CHAPTER
${report.masteredDrugs}`;
}
