import type { DrugBackup, DrugProductBackup, TrainingReportBackup } from './schema';
import { dateFromLegacy } from '@/domain/shared/dates';

const csvHeader = [
  'id',
  'scientific_name',
  'trade_names',
  'chapter',
  'class',
  'dosage_forms',
  'strengths',
  'indications',
  'warnings',
  'notes',
  'arabic_explanation',
] as const;

function csvEscape(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

export function drugLibraryCSV(
  drugs: readonly DrugBackup[],
  products: readonly DrugProductBackup[] = [],
): string {
  const productsByProfile = new Map<string, string[]>();
  for (const product of products) {
    if (!product.profileID || !product.tradeName.trim()) continue;
    const names = productsByProfile.get(product.profileID) ?? [];
    names.push(product.tradeName.trim());
    productsByProfile.set(product.profileID, names);
  }
  const rows = drugs.map((drug) => {
    const tradeNames = [...drug.tradeNames, ...(productsByProfile.get(drug.id) ?? [])].filter(
      (value, index, all) =>
        value.trim() &&
        all.findIndex(
          (candidate) => candidate.trim().toLocaleLowerCase() === value.trim().toLocaleLowerCase(),
        ) === index,
    );
    return [
      drug.id,
      drug.scientificName,
      tradeNames.join(' | '),
      drug.chapterRaw,
      drug.drugClass,
      drug.dosageForms.join(' | '),
      drug.strengths.join(' | '),
      drug.indications.join(' | '),
      drug.warnings.join(' | '),
      drug.notes,
      drug.arabicExplanation,
    ]
      .map(csvEscape)
      .join(',');
  });
  return [csvHeader.join(','), ...rows].join('\r\n');
}

function reportDate(value: TrainingReportBackup['periodStart']): string {
  return dateFromLegacy(value)?.toLocaleDateString() ?? 'Unknown date';
}

export function combinedTrainingReportsText(reports: readonly TrainingReportBackup[]): string {
  return [...reports]
    .sort(
      (left, right) =>
        (dateFromLegacy(left.periodStart)?.valueOf() ?? 0) -
        (dateFromLegacy(right.periodStart)?.valueOf() ?? 0),
    )
    .map(
      (report) => `Renlyst Training Report
Period: ${reportDate(report.periodStart)} – ${reportDate(report.periodEnd)}

Training summary
${report.trainingSummary}

Skills learned
${report.skillsLearned}

Categories studied
${report.categoriesStudied}

Dosage forms seen
${report.dosageFormsSeen}

Counseling points
${report.counselingPoints}

Pharmacist questions
${report.pharmacistQuestions}

Challenges
${report.challenges}

Notes and recommendations
${report.notesAndRecommendations}

Mastered drugs
${report.masteredDrugs}`,
    )
    .join('\n\n— — —\n\n');
}
