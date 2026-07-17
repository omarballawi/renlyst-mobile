import * as Crypto from 'expo-crypto';

import type { DrugBackup } from '@/domain/backup';
import { canonicalKeyForDrug } from '@/domain/drugs/identity';
import { normalizeDrugConsistency } from '@/domain/drugs/consistency';
import { swiftReferenceTime } from '@/domain/shared/dates';
import type { TrustedDrugSourcePacket } from '@/services/drugSources/trustedSources';

export const trustedImportSections = [
  'Identity',
  'Uses',
  'Dosage',
  'Safety',
  'Adverse effects',
  'Interactions',
  'Pharmacology',
  'Pregnancy',
] as const;

export type TrustedImportSection = (typeof trustedImportSections)[number];

export const trustedImportFieldKeys = [
  'identity.activeIngredients',
  'identity.dosageForms',
  'identity.routes',
  'uses.indications',
  'dosage.howToTake',
  'safety.contraindications',
  'safety.warnings',
  'adverseEffects.common',
  'interactions.entries',
  'pharmacology.profile',
  'pregnancy.caution',
] as const;

export type TrustedImportFieldKey = (typeof trustedImportFieldKeys)[number];

export type TrustedImportField = {
  key: TrustedImportFieldKey;
  section: TrustedImportSection;
  label: string;
  value: string;
};

type FieldEvidence = {
  id: string;
  fieldKey: string;
  sourceID: string;
  sourceName: string;
  sourceURL: string;
  quality: 'officialLabel' | 'altibbi';
  retrievedAt: number;
  valueFingerprint: string;
};

function list(value: string): string[] {
  return value.trim() ? [value.trim()] : [];
}

function commaList(value: string): string[] {
  return value
    .split(/[,;]\s*/u)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter(
      (item, index, all) =>
        all.findIndex((candidate) => candidate.toLocaleLowerCase() === item.toLocaleLowerCase()) ===
        index,
    );
}

function readEvidence(value: string | null | undefined): FieldEvidence[] {
  if (!value?.trim()) return [];
  try {
    const decoded: unknown = JSON.parse(value);
    return Array.isArray(decoded)
      ? decoded.filter(
          (item): item is FieldEvidence =>
            Boolean(item) &&
            typeof item === 'object' &&
            typeof (item as FieldEvidence).fieldKey === 'string',
        )
      : [];
  } catch {
    return [];
  }
}

function fingerprint(value: string): string {
  let hash = 2_166_136_261;
  for (const character of value) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16_777_619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function sourceID(packet: TrustedDrugSourcePacket): string {
  return (packet.sourceURL || packet.sourceName)
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

export function availableTrustedImportSections(
  packet: TrustedDrugSourcePacket,
): TrustedImportSection[] {
  return trustedImportSections.filter((section) => {
    switch (section) {
      case 'Identity':
        return Boolean(
          packet.activeIngredientText.trim() ||
          packet.dosageFormsText.trim() ||
          packet.routeText.trim(),
        );
      case 'Uses':
        return Boolean(packet.indicationsText.trim());
      case 'Dosage':
        return Boolean(packet.dosageText.trim());
      case 'Safety':
        return Boolean(packet.contraindicationsText.trim() || packet.warningsText.trim());
      case 'Adverse effects':
        return Boolean(packet.adverseReactionsText.trim());
      case 'Interactions':
        return Boolean(packet.interactionsText.trim());
      case 'Pharmacology':
        return Boolean(packet.pharmacokineticsText.trim());
      case 'Pregnancy':
        return Boolean(packet.pregnancyText.trim());
    }
  });
}

export function availableTrustedImportFields(
  packet: TrustedDrugSourcePacket,
): TrustedImportField[] {
  return [
    {
      key: 'identity.activeIngredients',
      section: 'Identity',
      label: 'Active ingredients',
      value: packet.activeIngredientText,
    },
    {
      key: 'identity.dosageForms',
      section: 'Identity',
      label: 'Dosage forms',
      value: packet.dosageFormsText,
    },
    { key: 'identity.routes', section: 'Identity', label: 'Routes', value: packet.routeText },
    {
      key: 'uses.indications',
      section: 'Uses',
      label: 'Indications / uses',
      value: packet.indicationsText,
    },
    {
      key: 'dosage.howToTake',
      section: 'Dosage',
      label: 'How to take',
      value: packet.dosageText,
    },
    {
      key: 'safety.contraindications',
      section: 'Safety',
      label: 'Contraindications',
      value: packet.contraindicationsText,
    },
    {
      key: 'safety.warnings',
      section: 'Safety',
      label: 'Warnings',
      value: packet.warningsText,
    },
    {
      key: 'adverseEffects.common',
      section: 'Adverse effects',
      label: 'Adverse effects',
      value: packet.adverseReactionsText,
    },
    {
      key: 'interactions.entries',
      section: 'Interactions',
      label: 'Interactions',
      value: packet.interactionsText,
    },
    {
      key: 'pharmacology.profile',
      section: 'Pharmacology',
      label: 'Pharmacology',
      value: packet.pharmacokineticsText,
    },
    {
      key: 'pregnancy.caution',
      section: 'Pregnancy',
      label: 'Pregnancy',
      value: packet.pregnancyText,
    },
  ].filter((field) => field.value.trim()) as TrustedImportField[];
}

export function defaultTrustedImportSelection(
  drug: DrugBackup,
  packet: TrustedDrugSourcePacket,
): Set<TrustedImportSection> {
  const available = new Set(availableTrustedImportSections(packet));
  const selected = new Set<TrustedImportSection>();
  if (
    available.has('Identity') &&
    ((drug.activeIngredients?.length ?? 0) === 0 ||
      drug.dosageForms.length === 0 ||
      drug.routes.length === 0)
  ) {
    selected.add('Identity');
  }
  if (available.has('Uses') && drug.indications.length === 0) selected.add('Uses');
  if (available.has('Dosage') && !drug.howToTake.trim()) selected.add('Dosage');
  if (
    available.has('Safety') &&
    drug.warnings.length === 0 &&
    drug.contraindications.length === 0
  ) {
    selected.add('Safety');
  }
  if (available.has('Adverse effects') && drug.commonSideEffects.length === 0) {
    selected.add('Adverse effects');
  }
  if (available.has('Interactions') && drug.interactions.length === 0) {
    selected.add('Interactions');
  }
  if (available.has('Pharmacology') && !drug.pharmacologyProfileJSON?.trim()) {
    selected.add('Pharmacology');
  }
  if (available.has('Pregnancy') && !drug.pregnancyCaution.trim()) selected.add('Pregnancy');
  return selected;
}

export function applyTrustedImport(
  drug: DrugBackup,
  packet: TrustedDrugSourcePacket,
  selection: ReadonlySet<TrustedImportSection>,
  now = new Date(),
  idFactory: () => string = Crypto.randomUUID,
  excludedFieldKeys: ReadonlySet<TrustedImportFieldKey> = new Set(),
): DrugBackup {
  let updated: DrugBackup = { ...drug };
  const changedFields = new Map<string, string>();
  const included = (field: TrustedImportFieldKey) => !excludedFieldKeys.has(field);

  if (selection.has('Identity')) {
    const activeIngredients = commaList(packet.activeIngredientText);
    const dosageForms = commaList(packet.dosageFormsText);
    const routes = commaList(packet.routeText);
    if (included('identity.activeIngredients') && activeIngredients.length > 0) {
      updated.activeIngredients = activeIngredients;
      changedFields.set('identity', activeIngredients.join('|'));
    }
    if (included('identity.dosageForms') && dosageForms.length > 0) {
      updated.dosageForms = dosageForms;
      changedFields.set('dosageForms', dosageForms.join('|'));
    }
    if (included('identity.routes') && routes.length > 0) {
      updated.routes = routes.map((route) =>
        route.toLocaleLowerCase() === 'orak' ? 'Oral' : route,
      );
      changedFields.set('routes', updated.routes.join('|'));
    }
    if (packet.sourceName === 'RxNorm' && packet.conceptID) {
      updated.rxNormConceptIDs = [packet.conceptID];
    }
    updated.isUnknown = false;
  }
  if (selection.has('Uses') && included('uses.indications') && packet.indicationsText.trim()) {
    updated.indications = list(packet.indicationsText);
    changedFields.set('uses', packet.indicationsText);
  }
  if (selection.has('Dosage') && included('dosage.howToTake') && packet.dosageText.trim()) {
    updated.howToTake = packet.dosageText.trim();
    changedFields.set('dosage', packet.dosageText);
  }
  if (selection.has('Safety')) {
    if (included('safety.contraindications') && packet.contraindicationsText.trim()) {
      updated.contraindications = list(packet.contraindicationsText);
      changedFields.set('contraindications', packet.contraindicationsText);
    }
    if (included('safety.warnings') && packet.warningsText.trim()) {
      updated.warnings = list(packet.warningsText);
      changedFields.set('warnings', packet.warningsText);
    }
  }
  if (
    selection.has('Adverse effects') &&
    included('adverseEffects.common') &&
    packet.adverseReactionsText.trim()
  ) {
    updated.commonSideEffects = list(packet.adverseReactionsText);
    changedFields.set('adverseEffects', packet.adverseReactionsText);
  }
  if (
    selection.has('Interactions') &&
    included('interactions.entries') &&
    packet.interactionsText.trim()
  ) {
    updated.interactions = list(packet.interactionsText);
    changedFields.set('interactions', packet.interactionsText);
  }
  if (
    selection.has('Pharmacology') &&
    included('pharmacology.profile') &&
    packet.pharmacokineticsText.trim()
  ) {
    updated.pharmacologyProfileJSON = JSON.stringify({
      mechanismOfAction: updated.mechanism,
      absorption: [packet.pharmacokineticsText.trim()],
      distribution: [],
      metabolism: [],
      elimination: [],
      sourceIDs: [sourceID(packet)],
    });
    changedFields.set('pharmacology', packet.pharmacokineticsText);
  }
  if (selection.has('Pregnancy') && included('pregnancy.caution') && packet.pregnancyText.trim()) {
    updated.pregnancyCaution = packet.pregnancyText.trim();
    updated.reproductiveSafetyJSON = JSON.stringify({
      pregnancy: packet.pregnancyText.trim(),
      lactation: '',
      pregnancyArabicNote: '',
      lactationArabicNote: '',
      sourceIDs: [sourceID(packet)],
    });
    changedFields.set('pregnancy', packet.pregnancyText);
  }

  const missing =
    availableTrustedImportSections(packet).length === 0
      ? ['No clinical sections were available from this source.']
      : trustedImportSections
          .filter((section) => !availableTrustedImportSections(packet).includes(section))
          .map((section) => section);
  const evidenceByField = new Map(
    readEvidence(updated.fieldEvidenceJSON).map((item) => [item.fieldKey, item]),
  );
  for (const [fieldKey, value] of changedFields) {
    evidenceByField.set(fieldKey, {
      id: idFactory(),
      fieldKey,
      sourceID: sourceID(packet),
      sourceName: packet.sourceName,
      sourceURL: packet.sourceURL,
      quality: packet.sourceName === 'Altibbi' ? 'altibbi' : 'officialLabel',
      retrievedAt: swiftReferenceTime(now),
      valueFingerprint: fingerprint(value),
    });
  }

  updated = {
    ...updated,
    importedSourceName: packet.sourceName,
    sourceURL: packet.sourceURL,
    sourceUpdatedAt: now.toISOString(),
    sourceNeedsReview: packet.sourceName === 'Altibbi' || missing.length > 0,
    sourceMissingFields: missing,
    sourceQualityNotes:
      packet.sourceName === 'Altibbi'
        ? 'Arabic reference text imported for pharmacist review.'
        : 'Official label text imported with explicit field selection.',
    trustedSourceWasTruncated: packet.isTruncated,
    lastKnowledgeRefreshAt: now.toISOString(),
    verificationRaw: 'Needs pharmacist verification',
    reviewQuestionsNeedRegeneration: changedFields.size > 0,
    fieldEvidenceJSON: JSON.stringify([...evidenceByField.values()]),
  };
  updated.canonicalIngredientKey = canonicalKeyForDrug(updated);
  return normalizeDrugConsistency(updated);
}
