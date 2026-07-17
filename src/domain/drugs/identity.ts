import type { DrugBackup, DrugProductBackup } from '@/domain/backup';

export function normalizeIdentity(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase('en-US')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .join('-');
}

export function canonicalIngredientKey(
  names: readonly string[],
  rxNormIDs: readonly string[] = [],
): string {
  const identifiers = rxNormIDs.map(normalizeIdentity).filter(Boolean).sort();
  if (identifiers.length > 0) {
    return `rxcui:${identifiers.join('+')}`;
  }

  const ingredients = names.map(normalizeIdentity).filter(Boolean).sort();
  return `ingredient:${ingredients.join('+')}`;
}

export function canonicalKeyForDrug(drug: DrugBackup): string {
  if (drug.canonicalIngredientKey?.trim()) {
    return drug.canonicalIngredientKey;
  }

  const ingredients =
    drug.activeIngredients && drug.activeIngredients.length > 0
      ? drug.activeIngredients
      : [drug.scientificName];
  const key = canonicalIngredientKey(ingredients, drug.rxNormConceptIDs ?? []);
  return key === 'ingredient:' ? `unknown:${normalizeIdentity(drug.id)}` : key;
}

export function productKey(
  product: Pick<DrugProductBackup, 'tradeName' | 'manufacturer' | 'strength' | 'dosageForm'>,
  ingredientKey: string,
): string {
  return [
    ingredientKey,
    product.tradeName,
    product.manufacturer,
    product.strength,
    product.dosageForm,
  ]
    .map(normalizeIdentity)
    .join('|');
}
