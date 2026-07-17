import type { DrugBackup } from '@/domain/backup';
import { normalizeDrugConsistency } from './consistency';

export type ConfirmedDrugIdentity = {
  scientificName: string;
  tradeNames: readonly string[];
  strength: string;
  dosageForm: string;
  route: string;
  chapterRaw: string;
  drugClass: string;
};

function unique(values: readonly string[]): string[] {
  const seen = new Set<string>();
  return values.flatMap((value) => {
    const trimmed = value.trim();
    const key = trimmed.toLocaleLowerCase();
    if (!trimmed || seen.has(key)) return [];
    seen.add(key);
    return [trimmed];
  });
}

export function tradeNamesFromInput(value: string): string[] {
  return unique(value.split(/[;,\n]/u));
}

export function applyConfirmedIdentity(
  drug: DrugBackup,
  identity: ConfirmedDrugIdentity,
): DrugBackup {
  const scientificName = identity.scientificName.trim();
  const tradeNames = unique(identity.tradeNames);
  const strength = identity.strength.trim();
  const dosageForm = identity.dosageForm.trim();
  const route = identity.route.trim();
  const chapterRaw = identity.chapterRaw.trim();
  const drugClass = identity.drugClass.trim();
  const activeIngredients =
    drug.activeIngredients && drug.activeIngredients.length > 0
      ? drug.activeIngredients
      : scientificName
        ? [scientificName]
        : drug.activeIngredients;

  return normalizeDrugConsistency({
    ...drug,
    scientificName: scientificName || drug.scientificName,
    tradeNames: tradeNames.length > 0 ? tradeNames : drug.tradeNames,
    strengths: strength ? unique([strength, ...drug.strengths]) : drug.strengths,
    dosageForms: dosageForm ? unique([dosageForm, ...drug.dosageForms]) : drug.dosageForms,
    routes: route ? unique([route, ...drug.routes]) : drug.routes,
    chapterRaw: chapterRaw || drug.chapterRaw,
    drugClass: drugClass || drug.drugClass,
    activeIngredients,
    canonicalIngredientKey:
      scientificName && scientificName !== drug.scientificName ? null : drug.canonicalIngredientKey,
  });
}
