import type { DrugBackup } from '@/domain/backup';

export type MasteryField =
  | 'masteryScientificName'
  | 'masteryTradeName'
  | 'masteryClass'
  | 'masteryUse'
  | 'masteryWarning'
  | 'masteryCounseling';

export const masteryFields: readonly MasteryField[] = [
  'masteryScientificName',
  'masteryTradeName',
  'masteryClass',
  'masteryUse',
  'masteryWarning',
  'masteryCounseling',
];

export function masteryCount(drug: DrugBackup): number {
  return masteryFields.reduce((count, field) => count + (drug[field] ? 1 : 0), 0);
}

export function requiredMasteryCount(drug: DrugBackup): 5 | 6 {
  return drug.drugClass.trim().length === 0 ? 5 : 6;
}

export function isMastered(drug: DrugBackup): boolean {
  return masteryCount(drug) >= requiredMasteryCount(drug);
}

export function confidenceFor(drug: DrugBackup): 'Weak' | 'Medium' | 'Strong' | 'Mastered' {
  const count = masteryCount(drug);
  if (count >= requiredMasteryCount(drug)) return 'Mastered';
  if (count >= 4) return 'Strong';
  if (count >= 2) return 'Medium';
  return 'Weak';
}
