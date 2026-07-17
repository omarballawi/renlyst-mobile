import {
  drugBackupSchema,
  drugProductBackupSchema,
  drugRelationshipBackupSchema,
  pharmaShiftBackupSchema,
  type DrugBackup,
  type DrugProductBackup,
  type DrugRelationshipBackup,
  type PharmaShiftBackup,
} from './schema';
import { canonicalIngredientKey, normalizeIdentity, productKey } from '@/domain/drugs/identity';
import { dateFromLegacy, isoDate, type LegacyDate } from '@/domain/shared/dates';

export type DuplicateProfileMergeResult = {
  backup: PharmaShiftBackup;
  mergedProfileCount: number;
  mergedProductCount: number;
};

const stringArrayFields = [
  'tradeNames',
  'dosageForms',
  'strengths',
  'indications',
  'commonSideEffects',
  'warnings',
  'patientQuestions',
  'routes',
  'mechanismKeywords',
  'contraindications',
  'interactions',
  'patientFeelingsArabic',
  'seekHelpArabic',
  'seriousSideEffects',
  'mustKnow',
  'flashcards',
  'safetyFlagsRaw',
  'sourceMissingFields',
] as const satisfies readonly (keyof DrugBackup)[];

const masteryFields = [
  'masteryScientificName',
  'masteryTradeName',
  'masteryClass',
  'masteryUse',
  'masteryWarning',
  'masteryCounseling',
] as const satisfies readonly (keyof DrugBackup)[];

const jsonArrayFields = [
  'reviewQuestionsJSON',
  'memoryItemsJSON',
  'atomicNotesJSON',
  'fieldEvidenceJSON',
  'doseRegimensJSON',
  'dosageFormGroupsJSON',
  'clinicalDosesJSON',
  'interactionEntriesJSON',
  'adverseEffectEntriesJSON',
] as const satisfies readonly (keyof DrugBackup)[];

const richTextFields = [
  'howToTake',
  'foodInstruction',
  'counselingSentence',
  'notes',
  'sourceNote',
  'mechanism',
  'toxicity',
  'excretionNotes',
  'pkMemoryLineArabic',
  'renalCaution',
  'hepaticCaution',
  'pregnancyCaution',
  'arabicExplanation',
  'arabicMechanism',
  'arabicCounseling',
  'arabicMemoryStory',
  'arabicImportantNote',
  'arabicPersonalNotes',
  'counselingHowToTakeArabic',
  'counselingFoodArabic',
  'missedDoseArabic',
  'oneLineSummaryArabic',
  'sourceQualityNotes',
] as const satisfies readonly (keyof DrugBackup)[];

function uniqueStrings(values: readonly string[]): string[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = normalizeIdentity(value);
    return Boolean(key) && !seen.has(key) && Boolean(seen.add(key));
  });
}

function uniqueData(values: readonly (string | null | undefined)[]): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value?.trim())))];
}

function mergeText(first: string, second: string): string {
  const values = [first.trim(), second.trim()].filter(Boolean);
  return values.filter((value, index) => values.indexOf(value) === index).join('\n\n');
}

function parseJSONArray(value: string | null | undefined): unknown[] {
  if (!value?.trim()) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function mergeJSONArrays(
  first: string | null | undefined,
  second: string | null | undefined,
): string {
  const values = [...parseJSONArray(first), ...parseJSONArray(second)];
  if (values.length === 0) return first?.trim() || second?.trim() || '';
  const seen = new Set<string>();
  return JSON.stringify(
    values.filter((value) => {
      const key = JSON.stringify(value);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }),
  );
}

function earliest(first: LegacyDate, second: LegacyDate): string {
  return isoDate(
    (dateFromLegacy(first)?.valueOf() ?? Number.MAX_SAFE_INTEGER) <=
      (dateFromLegacy(second)?.valueOf() ?? Number.MAX_SAFE_INTEGER)
      ? first
      : second,
  );
}

function latest(
  first: LegacyDate | null | undefined,
  second: LegacyDate | null | undefined,
): string | null {
  const values = [first, second]
    .filter((value): value is LegacyDate => value != null)
    .map((value) => dateFromLegacy(value))
    .filter((value): value is Date => value !== null)
    .sort((a, b) => b.valueOf() - a.valueOf());
  return values[0]?.toISOString() ?? null;
}

function earliestNullable(
  first: LegacyDate | null | undefined,
  second: LegacyDate | null | undefined,
): string {
  const values = [first, second]
    .filter((value): value is LegacyDate => value != null)
    .map((value) => dateFromLegacy(value))
    .filter((value): value is Date => value !== null)
    .sort((a, b) => a.valueOf() - b.valueOf());
  return (values[0] ?? new Date()).toISOString();
}

function canonicalFor(drug: DrugBackup): string {
  const ingredients =
    drug.activeIngredients?.filter((value) => value.trim()) ??
    [drug.scientificName].filter((value) => value.trim());
  const key = canonicalIngredientKey(ingredients, drug.rxNormConceptIDs ?? []);
  return key === 'ingredient:' ? `unknown:${normalizeIdentity(drug.id)}` : key;
}

function mergeDrug(owner: DrugBackup, duplicate: DrugBackup, key: string): DrugBackup {
  const value = { ...owner } as DrugBackup;
  for (const field of stringArrayFields) {
    const first = owner[field] as string[];
    const second = duplicate[field] as string[];
    (value as unknown as Record<string, unknown>)[field] = uniqueStrings([...first, ...second]);
  }
  for (const field of richTextFields) {
    (value as unknown as Record<string, unknown>)[field] = mergeText(
      owner[field] as string,
      duplicate[field] as string,
    );
  }
  for (const field of masteryFields) {
    (value as unknown as Record<string, unknown>)[field] =
      Boolean(owner[field]) || Boolean(duplicate[field]);
  }
  for (const field of jsonArrayFields) {
    (value as unknown as Record<string, unknown>)[field] = mergeJSONArrays(
      owner[field] as string | null | undefined,
      duplicate[field] as string | null | undefined,
    );
  }

  const images = uniqueData([
    owner.imageData,
    ...owner.additionalImageData,
    duplicate.imageData,
    ...duplicate.additionalImageData,
  ]);
  const thumbnails = uniqueData([
    owner.thumbnailData,
    ...owner.additionalThumbnailData,
    duplicate.thumbnailData,
    ...duplicate.additionalThumbnailData,
  ]);
  value.imageData = images[0] ?? null;
  value.additionalImageData = images.slice(1);
  value.thumbnailData = thumbnails[0] ?? null;
  value.additionalThumbnailData = thumbnails.slice(1);
  value.activeIngredients = uniqueStrings([
    ...(owner.activeIngredients ?? []),
    ...(duplicate.activeIngredients ?? []),
  ]);
  value.rxNormConceptIDs = uniqueStrings([
    ...(owner.rxNormConceptIDs ?? []),
    ...(duplicate.rxNormConceptIDs ?? []),
  ]);
  value.scientificName = owner.scientificName.trim() || duplicate.scientificName;
  value.captureLabel = owner.captureLabel.trim() || duplicate.captureLabel;
  value.chapterRaw =
    owner.chapterRaw.trim() && owner.chapterRaw !== 'Other'
      ? owner.chapterRaw
      : duplicate.chapterRaw;
  value.drugClass = owner.drugClass.trim() || duplicate.drugClass;
  value.shelfLocation = owner.shelfLocation.trim() || duplicate.shelfLocation;
  value.importedSourceName = owner.importedSourceName.trim() || duplicate.importedSourceName;
  value.sourceURL = owner.sourceURL.trim() || duplicate.sourceURL;
  value.timesSeen = owner.timesSeen + duplicate.timesSeen;
  value.correctStreak = Math.max(owner.correctStreak, duplicate.correctStreak);
  value.dateAdded = earliest(owner.dateAdded, duplicate.dateAdded);
  value.lastSeenDate = latest(owner.lastSeenDate, duplicate.lastSeenDate);
  value.lastReviewed = latest(owner.lastReviewed, duplicate.lastReviewed);
  value.nextReviewDate = earliestNullable(owner.nextReviewDate, duplicate.nextReviewDate);
  value.sourceUpdatedAt = latest(owner.sourceUpdatedAt, duplicate.sourceUpdatedAt);
  value.lastKnowledgeRefreshAt = latest(
    owner.lastKnowledgeRefreshAt,
    duplicate.lastKnowledgeRefreshAt,
  );
  value.isUnknown = owner.isUnknown && duplicate.isUnknown;
  value.isConfusing = owner.isConfusing || duplicate.isConfusing;
  value.sourceNeedsReview = owner.sourceNeedsReview || duplicate.sourceNeedsReview;
  value.trustedSourceWasTruncated =
    owner.trustedSourceWasTruncated || duplicate.trustedSourceWasTruncated;
  value.reviewQuestionsNeedRegeneration =
    owner.reviewQuestionsNeedRegeneration || duplicate.reviewQuestionsNeedRegeneration;
  value.halfLifeHours = owner.halfLifeHours ?? duplicate.halfLifeHours;
  value.onsetMinutes = owner.onsetMinutes ?? duplicate.onsetMinutes;
  value.durationHours = owner.durationHours ?? duplicate.durationHours;
  value.timesPerDay = owner.timesPerDay ?? duplicate.timesPerDay;
  value.prodrugInfoJSON = owner.prodrugInfoJSON?.trim() || duplicate.prodrugInfoJSON;
  value.eliminationInfoJSON = owner.eliminationInfoJSON?.trim() || duplicate.eliminationInfoJSON;
  value.reproductiveSafetyJSON =
    owner.reproductiveSafetyJSON?.trim() || duplicate.reproductiveSafetyJSON;
  value.pharmacologyProfileJSON =
    owner.pharmacologyProfileJSON?.trim() || duplicate.pharmacologyProfileJSON;
  value.canonicalIngredientKey = key;
  return drugBackupSchema.parse(value);
}

function mergeProduct(owner: DrugProductBackup, duplicate: DrugProductBackup): DrugProductBackup {
  const images = uniqueData([
    owner.imageData,
    ...owner.additionalImageData,
    duplicate.imageData,
    ...duplicate.additionalImageData,
  ]);
  const thumbnails = uniqueData([
    owner.thumbnailData,
    ...owner.additionalThumbnailData,
    duplicate.thumbnailData,
    ...duplicate.additionalThumbnailData,
  ]);
  return drugProductBackupSchema.parse({
    ...owner,
    manufacturer: owner.manufacturer.trim() || duplicate.manufacturer,
    strength: owner.strength.trim() || duplicate.strength,
    marketedStrengthLabel: owner.marketedStrengthLabel?.trim() || duplicate.marketedStrengthLabel,
    ingredientComponentsJSON:
      owner.ingredientComponentsJSON?.trim() || duplicate.ingredientComponentsJSON,
    dosageForm: owner.dosageForm.trim() || duplicate.dosageForm,
    route: owner.route.trim() || duplicate.route,
    country: owner.country.trim() || duplicate.country,
    shelfLocation: owner.shelfLocation.trim() || duplicate.shelfLocation,
    imageData: images[0] ?? null,
    additionalImageData: images.slice(1),
    thumbnailData: thumbnails[0] ?? null,
    additionalThumbnailData: thumbnails.slice(1),
    leafletText: mergeText(owner.leafletText, duplicate.leafletText),
    leafletUpdatedAt: latest(owner.leafletUpdatedAt, duplicate.leafletUpdatedAt),
    sourceName: owner.sourceName.trim() || duplicate.sourceName,
    sourceURL: owner.sourceURL.trim() || duplicate.sourceURL,
    dateAdded: earliest(owner.dateAdded, duplicate.dateAdded),
  });
}

function mergeRelationship(
  owner: DrugRelationshipBackup,
  duplicate: DrugRelationshipBackup,
): DrugRelationshipBackup {
  return drugRelationshipBackupSchema.parse({
    ...owner,
    summary: mergeText(owner.summary, duplicate.summary),
    managementNote: mergeText(owner.managementNote, duplicate.managementNote),
    sourceURLs: uniqueStrings([...owner.sourceURLs, ...duplicate.sourceURLs]),
    checkedAt: latest(owner.checkedAt, duplicate.checkedAt) ?? isoDate(owner.checkedAt),
  });
}

export function mergeDuplicateProfiles(backup: PharmaShiftBackup): DuplicateProfileMergeResult {
  const parsed = pharmaShiftBackupSchema.parse(backup);
  const sorted = [...parsed.drugs].sort(
    (first, second) =>
      (dateFromLegacy(first.dateAdded)?.valueOf() ?? 0) -
      (dateFromLegacy(second.dateAdded)?.valueOf() ?? 0),
  );
  const ownerByKey = new Map<string, DrugBackup>();
  const ownerIDByDuplicateID = new Map<string, string>();
  let mergedProfileCount = 0;

  for (const drug of sorted) {
    const key = canonicalFor(drug);
    const owner = ownerByKey.get(key);
    if (!owner) {
      ownerByKey.set(key, drugBackupSchema.parse({ ...drug, canonicalIngredientKey: key }));
      continue;
    }
    const merged = mergeDrug(owner, drug, key);
    ownerByKey.set(key, merged);
    ownerIDByDuplicateID.set(drug.id, owner.id);
    mergedProfileCount += 1;
  }

  const profileID = (id: string | null | undefined) =>
    id ? (ownerIDByDuplicateID.get(id) ?? id) : null;
  const productsByKey = new Map<string, DrugProductBackup>();
  const productIDMap = new Map<string, string>();
  let mergedProductCount = 0;
  for (const product of [...(parsed.products ?? [])].sort(
    (a, b) =>
      (dateFromLegacy(a.dateAdded)?.valueOf() ?? 0) - (dateFromLegacy(b.dateAdded)?.valueOf() ?? 0),
  )) {
    const ownerProfileID = profileID(product.profileID);
    const ownerDrug = [...ownerByKey.values()].find((drug) => drug.id === ownerProfileID);
    const key = productKey(product, ownerDrug ? canonicalFor(ownerDrug) : 'ingredient:');
    const normalized = drugProductBackupSchema.parse({
      ...product,
      profileID: ownerProfileID,
      productKey: key,
    });
    const owner = productsByKey.get(key);
    if (!owner) {
      productsByKey.set(key, normalized);
      continue;
    }
    productsByKey.set(key, mergeProduct(owner, normalized));
    productIDMap.set(product.id, owner.id);
    mergedProductCount += 1;
  }

  const relationshipsByKey = new Map<string, DrugRelationshipBackup>();
  for (const relationship of parsed.relationships ?? []) {
    const sourceDrugID = profileID(relationship.sourceDrugID);
    const targetDrugID = profileID(relationship.targetDrugID);
    if (sourceDrugID && targetDrugID && sourceDrugID === targetDrugID) continue;
    const endpointKey = [sourceDrugID ?? '', targetDrugID ?? ''].sort().join('|');
    const key = `${endpointKey}|${normalizeIdentity(relationship.kindRaw || 'Interaction')}`;
    const normalized = drugRelationshipBackupSchema.parse({
      ...relationship,
      relationshipKey: key,
      sourceDrugID,
      targetDrugID,
    });
    const owner = relationshipsByKey.get(key);
    relationshipsByKey.set(key, owner ? mergeRelationship(owner, normalized) : normalized);
  }

  const drugs = [...ownerByKey.values()];
  const result = pharmaShiftBackupSchema.parse({
    ...parsed,
    drugs,
    products: [...productsByKey.values()].map((product) => ({
      ...product,
      profileID: profileID(product.profileID),
      id: productIDMap.get(product.id) ?? product.id,
    })),
    relationships: [...relationshipsByKey.values()],
    reviews: parsed.reviews.map((review) => ({ ...review, drugID: profileID(review.drugID) })),
    encounters: parsed.encounters.map((encounter) => ({
      ...encounter,
      relatedDrugID: profileID(encounter.relatedDrugID),
    })),
    counts: { ...parsed.counts, drugs: drugs.length },
  });
  return { backup: result, mergedProfileCount, mergedProductCount };
}
