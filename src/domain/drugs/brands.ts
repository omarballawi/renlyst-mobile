import { drugProductBackupSchema, type DrugBackup, type DrugProductBackup } from '@/domain/backup';
import { canonicalKeyForDrug, normalizeIdentity, productKey } from './identity';

export type IngredientComponent = {
  name: string;
  displayStrength: string;
};

export type EditableIngredientComponent = IngredientComponent & {
  saltForm: string;
  strengthValue: number | null;
  strengthUnit: string;
};

export type BrandProductDraft = {
  tradeName: string;
  manufacturer: string;
  marketedStrengthLabel: string;
  ingredientComponents: IngredientComponent[];
  dosageForm: string;
  route: string;
  country: string;
  shelfLocation: string;
};

export type BrandProductEditDraft = Omit<BrandProductDraft, 'ingredientComponents'> & {
  ingredientComponents: EditableIngredientComponent[];
  leafletText: string;
};

export type BrandMutationErrorCode =
  'brandNameRequired' | 'packagePhotoRequired' | 'duplicateBrand';

const errorMessages: Record<BrandMutationErrorCode, string> = {
  brandNameRequired: 'Enter the brand name printed on the package.',
  packagePhotoRequired: 'Add at least one package photo.',
  duplicateBrand: 'This brand and package strength are already in the profile.',
};

export class BrandMutationError extends Error {
  constructor(readonly code: BrandMutationErrorCode) {
    super(errorMessages[code]);
    this.name = 'BrandMutationError';
  }
}

function ingredientNames(drug: DrugBackup): string[] {
  const names = drug.activeIngredients?.filter((name) => name.trim()) ?? [];
  return names.length > 0 ? names : [drug.scientificName].filter((name) => name.trim());
}

export function brandDraftFor(drug: DrugBackup): BrandProductDraft {
  return {
    tradeName: '',
    manufacturer: '',
    marketedStrengthLabel: '',
    ingredientComponents: ingredientNames(drug).map((name) => ({
      name,
      displayStrength: '',
    })),
    dosageForm: drug.dosageForms[0] ?? '',
    route: drug.routes[0] ?? '',
    country: '',
    shelfLocation: drug.shelfLocation,
  };
}

function normalizedComponents(draft: BrandProductDraft, drug: DrugBackup): IngredientComponent[] {
  const strengths = new Map(
    draft.ingredientComponents.map((component) => [
      normalizeIdentity(component.name),
      component.displayStrength.trim(),
    ]),
  );
  return ingredientNames(drug).map((name) => ({
    name,
    displayStrength: strengths.get(normalizeIdentity(name)) ?? '',
  }));
}

export function parseIngredientComponents(
  value: string | null | undefined,
  drug: DrugBackup,
): EditableIngredientComponent[] {
  try {
    const parsed: unknown = value ? JSON.parse(value) : null;
    if (Array.isArray(parsed)) {
      const components = parsed.flatMap((candidate) => {
        if (!candidate || typeof candidate !== 'object') return [];
        const record = candidate as Record<string, unknown>;
        const name = typeof record.name === 'string' ? record.name : '';
        if (!name.trim()) return [];
        return [
          {
            name,
            displayStrength:
              typeof record.displayStrength === 'string' ? record.displayStrength : '',
            saltForm: typeof record.saltForm === 'string' ? record.saltForm : '',
            strengthValue:
              typeof record.strengthValue === 'number' && Number.isFinite(record.strengthValue)
                ? record.strengthValue
                : null,
            strengthUnit: typeof record.strengthUnit === 'string' ? record.strengthUnit : '',
          },
        ];
      });
      if (components.length > 0) return components;
    }
  } catch {
    // A malformed legacy payload falls back to the profile identity without blocking editing.
  }
  return ingredientNames(drug).map((name) => ({
    name,
    displayStrength: '',
    saltForm: '',
    strengthValue: null,
    strengthUnit: '',
  }));
}

type CreateBrandProductInput = {
  id: string;
  drug: DrugBackup;
  draft: BrandProductDraft;
  hasPhoto: boolean;
  existingProducts?: readonly DrugProductBackup[];
  now?: Date;
};

function createProduct(
  { id, drug, draft, hasPhoto, existingProducts = [], now = new Date() }: CreateBrandProductInput,
  requiresPhoto: boolean,
  sourceName: string,
): DrugProductBackup {
  const tradeName = draft.tradeName.trim();
  if (!tradeName) throw new BrandMutationError('brandNameRequired');
  if (requiresPhoto && !hasPhoto) throw new BrandMutationError('packagePhotoRequired');
  const marketedStrength = draft.marketedStrengthLabel.trim();
  const key = productKey(
    {
      tradeName,
      manufacturer: draft.manufacturer.trim(),
      strength: marketedStrength,
      dosageForm: draft.dosageForm.trim(),
    },
    canonicalKeyForDrug(drug),
  );
  if (existingProducts.some((product) => product.productKey === key)) {
    throw new BrandMutationError('duplicateBrand');
  }

  return drugProductBackupSchema.parse({
    id,
    profileID: drug.id,
    productKey: key,
    tradeName,
    manufacturer: draft.manufacturer.trim(),
    strength: marketedStrength,
    marketedStrengthLabel: marketedStrength,
    ingredientComponentsJSON: JSON.stringify(normalizedComponents(draft, drug)),
    dosageForm: draft.dosageForm.trim(),
    route: draft.route.trim(),
    country: draft.country.trim(),
    shelfLocation: draft.shelfLocation.trim(),
    imageData: null,
    additionalImageData: [],
    thumbnailData: null,
    additionalThumbnailData: [],
    leafletText: '',
    leafletUpdatedAt: null,
    sourceName,
    sourceURL: '',
    dateAdded: now.toISOString(),
  });
}

export function createBrandProduct(input: CreateBrandProductInput): DrugProductBackup {
  return createProduct(input, true, 'Manual brand entry');
}

export function createCapturedBrandProduct(input: CreateBrandProductInput): DrugProductBackup {
  return createProduct(input, false, 'Manual capture');
}

export function updateBrandProduct({
  product,
  drug,
  draft,
  existingProducts = [],
  now = new Date(),
}: {
  product: DrugProductBackup;
  drug: DrugBackup;
  draft: BrandProductEditDraft;
  existingProducts?: readonly DrugProductBackup[];
  now?: Date;
}): DrugProductBackup {
  const tradeName = draft.tradeName.trim();
  if (!tradeName) throw new BrandMutationError('brandNameRequired');
  const manufacturer = draft.manufacturer.trim();
  const marketedStrength = draft.marketedStrengthLabel.trim();
  const dosageForm = draft.dosageForm.trim();
  const key = productKey(
    { tradeName, manufacturer, strength: marketedStrength, dosageForm },
    canonicalKeyForDrug(drug),
  );
  if (
    existingProducts.some(
      (candidate) => candidate.id !== product.id && candidate.productKey === key,
    )
  ) {
    throw new BrandMutationError('duplicateBrand');
  }
  const components = draft.ingredientComponents
    .map((component) => ({
      ...component,
      name: component.name.trim(),
      displayStrength: component.displayStrength.trim(),
      saltForm: component.saltForm.trim(),
      strengthUnit: component.strengthUnit.trim(),
    }))
    .filter((component) => component.name.length > 0);
  const leafletText = draft.leafletText;

  return drugProductBackupSchema.parse({
    ...product,
    productKey: key,
    tradeName,
    manufacturer,
    strength: marketedStrength,
    marketedStrengthLabel: marketedStrength,
    ingredientComponentsJSON: JSON.stringify(components),
    dosageForm,
    route: draft.route.trim(),
    country: draft.country.trim(),
    shelfLocation: draft.shelfLocation.trim(),
    leafletText,
    leafletUpdatedAt: leafletText.trim() ? now.toISOString() : null,
  });
}

export function synchronizeTradeNames(
  source: DrugBackup,
  products: readonly DrugProductBackup[],
): DrugBackup {
  const drug = structuredClone(source);
  const names: string[] = [];
  const sorted = [...products].sort(
    (first, second) => new Date(first.dateAdded).valueOf() - new Date(second.dateAdded).valueOf(),
  );
  for (const product of sorted) {
    const name = product.tradeName.trim();
    if (
      name &&
      !names.some(
        (existing) => existing.localeCompare(name, undefined, { sensitivity: 'accent' }) === 0,
      )
    ) {
      names.push(name);
    }
  }
  drug.tradeNames = names;
  if (source.reviewQuestionsJSON.trim()) drug.reviewQuestionsNeedRegeneration = true;
  return drug;
}
