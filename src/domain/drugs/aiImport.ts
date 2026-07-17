import * as Crypto from 'expo-crypto';

import type { DrugBackup } from '@/domain/backup';
import { canonicalKeyForDrug } from '@/domain/drugs/identity';
import { normalizeDrugConsistency } from '@/domain/drugs/consistency';
import { swiftReferenceTime } from '@/domain/shared/dates';
import type { AIDrugDraft } from '@/services/providers/providerClients';

export const aiImportSections = [
  'Identity',
  'Uses & mechanism',
  'Pharmacology',
  'Safety',
  'Counseling',
  'Arabic learning',
  'Adverse effects',
  'Dosing',
  'Memorization',
] as const;

export type AIImportSection = (typeof aiImportSections)[number];

export const aiImportFieldKeys = [
  'identity.tradeNames',
  'identity.classification',
  'identity.ingredients',
  'identity.products',
  'uses.indications',
  'uses.mechanism',
  'pharmacology.timing',
  'pharmacology.frequency',
  'pharmacology.prodrug',
  'pharmacology.elimination',
  'pharmacology.adme',
  'safety.warnings',
  'safety.contraindications',
  'safety.interactions',
  'safety.organCautions',
  'safety.reproductive',
  'counseling.instructions',
  'counseling.patient',
  'counseling.arabic',
  'arabic.learning',
  'adverse.common',
  'adverse.serious',
  'dosing.regimens',
  'dosing.clinical',
  'memorization.mustKnow',
  'memorization.flashcards',
] as const;

export type AIImportFieldKey = (typeof aiImportFieldKeys)[number];

export type AIImportField = {
  key: AIImportFieldKey;
  section: AIImportSection;
  label: string;
  summary: string;
};

function hasText(values: readonly unknown[]): boolean {
  return values.some((value) => {
    if (typeof value === 'string') return Boolean(value.trim());
    if (Array.isArray(value)) return value.length > 0;
    if (value && typeof value === 'object') {
      return hasText(Object.values(value as Record<string, unknown>));
    }
    return value !== null && value !== undefined;
  });
}

function summary(values: readonly unknown[]): string {
  return values
    .flatMap((value) => {
      if (typeof value === 'string') return [value];
      if (Array.isArray(value)) {
        return value.map((item) => (typeof item === 'string' ? item : JSON.stringify(item)));
      }
      if (value && typeof value === 'object') return [JSON.stringify(value)];
      return [];
    })
    .map((value) => value.trim())
    .filter(Boolean)
    .join(' · ');
}

export function availableAIImportFields(draft: AIDrugDraft): AIImportField[] {
  const fields: AIImportField[] = [
    {
      key: 'identity.tradeNames',
      section: 'Identity',
      label: 'Trade names',
      summary: summary(draft.tradeNames),
    },
    {
      key: 'identity.classification',
      section: 'Identity',
      label: 'Chapter, class, form & route',
      summary: summary([
        draft.chapterRaw,
        draft.drugClass,
        draft.dosageForms,
        draft.strengths,
        draft.routes,
      ]),
    },
    {
      key: 'identity.ingredients',
      section: 'Identity',
      label: 'Active ingredients',
      summary: summary(draft.activeIngredients),
    },
    {
      key: 'identity.products',
      section: 'Identity',
      label: 'Dosage forms & strengths',
      summary: summary(draft.dosageFormGroups),
    },
    {
      key: 'uses.indications',
      section: 'Uses & mechanism',
      label: 'Indications / uses',
      summary: summary(draft.indications),
    },
    {
      key: 'uses.mechanism',
      section: 'Uses & mechanism',
      label: 'Mechanism',
      summary: summary([draft.mechanism, draft.mechanismKeywords]),
    },
    {
      key: 'pharmacology.timing',
      section: 'Pharmacology',
      label: 'Half-life, onset & duration',
      summary: summary([draft.halfLifeText, draft.onsetText, draft.durationText]),
    },
    {
      key: 'pharmacology.frequency',
      section: 'Pharmacology',
      label: 'Dosing frequency',
      summary: summary([draft.dosingFrequencyRaw, draft.timesPerDay]),
    },
    {
      key: 'pharmacology.prodrug',
      section: 'Pharmacology',
      label: 'Prodrug activation',
      summary: summary([draft.prodrugStatusRaw, draft.prodrugInfo]),
    },
    {
      key: 'pharmacology.elimination',
      section: 'Pharmacology',
      label: 'Elimination',
      summary: summary([draft.excretionRouteRaw, draft.excretionNotes, draft.eliminationInfo]),
    },
    {
      key: 'pharmacology.adme',
      section: 'Pharmacology',
      label: 'ADME',
      summary: summary([draft.pharmacologyProfile]),
    },
    {
      key: 'safety.warnings',
      section: 'Safety',
      label: 'Warnings',
      summary: summary(draft.warnings),
    },
    {
      key: 'safety.contraindications',
      section: 'Safety',
      label: 'Contraindications',
      summary: summary(draft.contraindications),
    },
    {
      key: 'safety.interactions',
      section: 'Safety',
      label: 'Interactions',
      summary: summary([draft.interactions, draft.interactionEntries]),
    },
    {
      key: 'safety.organCautions',
      section: 'Safety',
      label: 'Toxicity & organ cautions',
      summary: summary([
        draft.toxicity,
        draft.renalCaution,
        draft.hepaticCaution,
        draft.pregnancyCaution,
      ]),
    },
    {
      key: 'safety.reproductive',
      section: 'Safety',
      label: 'Reproductive safety',
      summary: summary([draft.reproductiveSafety]),
    },
    {
      key: 'counseling.instructions',
      section: 'Counseling',
      label: 'How to take & food',
      summary: summary([draft.howToTake, draft.foodInstruction]),
    },
    {
      key: 'counseling.patient',
      section: 'Counseling',
      label: 'Patient counseling',
      summary: summary([draft.counselingSentence, draft.patientQuestions]),
    },
    {
      key: 'counseling.arabic',
      section: 'Counseling',
      label: 'Arabic counseling',
      summary: summary([
        draft.counselingHowToTakeArabic,
        draft.counselingFoodArabic,
        draft.patientFeelingsArabic,
        draft.seekHelpArabic,
        draft.missedDoseArabic,
      ]),
    },
    {
      key: 'arabic.learning',
      section: 'Arabic learning',
      label: 'Arabic learning',
      summary: summary([
        draft.arabicExplanation,
        draft.arabicMechanism,
        draft.arabicCounseling,
        draft.arabicMemoryStory,
        draft.arabicImportantNote,
        draft.oneLineSummaryArabic,
      ]),
    },
    {
      key: 'adverse.common',
      section: 'Adverse effects',
      label: 'Common adverse effects',
      summary: summary([draft.commonSideEffects, draft.adverseEffectEntries]),
    },
    {
      key: 'adverse.serious',
      section: 'Adverse effects',
      label: 'Serious adverse effects',
      summary: summary(draft.seriousSideEffects),
    },
    {
      key: 'dosing.regimens',
      section: 'Dosing',
      label: 'Dose regimens',
      summary: summary(draft.doseRegimens),
    },
    {
      key: 'dosing.clinical',
      section: 'Dosing',
      label: 'Clinical dosing',
      summary: summary(draft.clinicalDoses),
    },
    {
      key: 'memorization.mustKnow',
      section: 'Memorization',
      label: 'Must know',
      summary: summary([draft.mustKnow, draft.oneLineSummaryArabic]),
    },
    {
      key: 'memorization.flashcards',
      section: 'Memorization',
      label: 'Flashcards',
      summary: summary(draft.flashcards),
    },
  ];
  return fields.filter((field) => field.summary.trim());
}

export function availableAIImportSections(draft: AIDrugDraft): AIImportSection[] {
  return aiImportSections.filter((section) => {
    switch (section) {
      case 'Identity':
        return hasText([
          draft.tradeNames,
          draft.chapterRaw,
          draft.drugClass,
          draft.activeIngredients,
          draft.dosageForms,
          draft.strengths,
          draft.routes,
          draft.dosageFormGroups,
        ]);
      case 'Uses & mechanism':
        return hasText([draft.indications, draft.mechanism, draft.mechanismKeywords]);
      case 'Pharmacology':
        return hasText([
          draft.halfLifeText,
          draft.onsetText,
          draft.durationText,
          draft.prodrugStatusRaw,
          draft.excretionNotes,
          draft.pharmacologyProfile,
          draft.prodrugInfo,
          draft.eliminationInfo,
        ]);
      case 'Safety':
        return hasText([
          draft.warnings,
          draft.contraindications,
          draft.interactions,
          draft.toxicity,
          draft.renalCaution,
          draft.hepaticCaution,
          draft.pregnancyCaution,
          draft.interactionEntries,
          draft.reproductiveSafety,
        ]);
      case 'Counseling':
        return hasText([
          draft.howToTake,
          draft.foodInstruction,
          draft.counselingSentence,
          draft.patientQuestions,
          draft.counselingHowToTakeArabic,
          draft.counselingFoodArabic,
          draft.patientFeelingsArabic,
          draft.seekHelpArabic,
          draft.missedDoseArabic,
        ]);
      case 'Arabic learning':
        return hasText([
          draft.arabicExplanation,
          draft.arabicMechanism,
          draft.arabicCounseling,
          draft.arabicMemoryStory,
          draft.arabicImportantNote,
          draft.oneLineSummaryArabic,
        ]);
      case 'Adverse effects':
        return hasText([
          draft.commonSideEffects,
          draft.seriousSideEffects,
          draft.adverseEffectEntries,
        ]);
      case 'Dosing':
        return draft.doseRegimens.length > 0 || draft.clinicalDoses.length > 0;
      case 'Memorization':
        return hasText([draft.mustKnow, draft.flashcards, draft.oneLineSummaryArabic]);
    }
  });
}

export function defaultAIImportSelection(
  drug: DrugBackup,
  draft: AIDrugDraft,
): Set<AIImportSection> {
  const available = new Set(availableAIImportSections(draft));
  const selected = new Set<AIImportSection>();
  if (
    available.has('Identity') &&
    (!drug.drugClass.trim() || drug.dosageForms.length === 0 || drug.routes.length === 0)
  ) {
    selected.add('Identity');
  }
  if (
    available.has('Uses & mechanism') &&
    (!drug.mechanism.trim() || drug.indications.length === 0)
  ) {
    selected.add('Uses & mechanism');
  }
  if (available.has('Pharmacology') && !drug.pharmacologyProfileJSON?.trim()) {
    selected.add('Pharmacology');
  }
  if (
    available.has('Safety') &&
    drug.warnings.length === 0 &&
    drug.contraindications.length === 0
  ) {
    selected.add('Safety');
  }
  if (available.has('Counseling') && !drug.counselingSentence.trim()) {
    selected.add('Counseling');
  }
  if (available.has('Arabic learning') && !drug.arabicExplanation.trim()) {
    selected.add('Arabic learning');
  }
  if (available.has('Adverse effects') && drug.commonSideEffects.length === 0) {
    selected.add('Adverse effects');
  }
  if (available.has('Dosing') && !drug.doseRegimensJSON?.trim()) selected.add('Dosing');
  if (available.has('Memorization') && drug.mustKnow.length === 0 && drug.flashcards.length === 0) {
    selected.add('Memorization');
  }
  return selected;
}

function fingerprint(value: unknown): string {
  const text = JSON.stringify(value);
  let hash = 2_166_136_261;
  for (const character of text) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16_777_619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function readEvidence(value: string | null | undefined): Record<string, unknown>[] {
  if (!value?.trim()) return [];
  try {
    const decoded: unknown = JSON.parse(value);
    return Array.isArray(decoded)
      ? decoded.filter((item): item is Record<string, unknown> =>
          Boolean(item && typeof item === 'object'),
        )
      : [];
  } catch {
    return [];
  }
}

export function applyAIDrugDraft(
  drug: DrugBackup,
  draft: AIDrugDraft,
  selection: ReadonlySet<AIImportSection>,
  now = new Date(),
  idFactory: () => string = Crypto.randomUUID,
  excludedFieldKeys: ReadonlySet<AIImportFieldKey> = new Set(),
): DrugBackup {
  let value: DrugBackup = { ...drug };
  const included = (field: AIImportFieldKey) => !excludedFieldKeys.has(field);
  if (selection.has('Identity')) {
    value = {
      ...value,
      tradeNames: included('identity.tradeNames') ? draft.tradeNames : value.tradeNames,
      chapterRaw: included('identity.classification') ? draft.chapterRaw : value.chapterRaw,
      drugClass: included('identity.classification') ? draft.drugClass : value.drugClass,
      activeIngredients: included('identity.ingredients')
        ? draft.activeIngredients.length > 0
          ? draft.activeIngredients
          : [drug.scientificName]
        : value.activeIngredients,
      dosageForms: included('identity.classification') ? draft.dosageForms : value.dosageForms,
      strengths: included('identity.classification') ? draft.strengths : value.strengths,
      routes: included('identity.classification') ? draft.routes : value.routes,
      dosageFormGroupsJSON: included('identity.products')
        ? JSON.stringify(draft.dosageFormGroups)
        : value.dosageFormGroupsJSON,
      isUnknown: false,
    };
  }
  if (selection.has('Uses & mechanism')) {
    value = {
      ...value,
      indications: included('uses.indications') ? draft.indications : value.indications,
      mechanism: included('uses.mechanism') ? draft.mechanism : value.mechanism,
      mechanismKeywords: included('uses.mechanism')
        ? draft.mechanismKeywords
        : value.mechanismKeywords,
    };
  }
  if (selection.has('Pharmacology')) {
    value = {
      ...value,
      halfLifeText: included('pharmacology.timing') ? draft.halfLifeText : value.halfLifeText,
      halfLifeHours: included('pharmacology.timing') ? draft.halfLifeHours : value.halfLifeHours,
      halfLifeBandRaw: included('pharmacology.timing')
        ? draft.halfLifeBandRaw || 'Unknown'
        : value.halfLifeBandRaw,
      onsetText: included('pharmacology.timing') ? draft.onsetText : value.onsetText,
      onsetMinutes: included('pharmacology.timing') ? draft.onsetMinutes : value.onsetMinutes,
      onsetBandRaw: included('pharmacology.timing')
        ? draft.onsetBandRaw || 'Unknown'
        : value.onsetBandRaw,
      durationText: included('pharmacology.timing') ? draft.durationText : value.durationText,
      durationHours: included('pharmacology.timing') ? draft.durationHours : value.durationHours,
      durationBandRaw: included('pharmacology.timing')
        ? draft.durationBandRaw || 'Unknown'
        : value.durationBandRaw,
      dosingFrequencyRaw: included('pharmacology.frequency')
        ? draft.dosingFrequencyRaw || 'Unknown'
        : value.dosingFrequencyRaw,
      timesPerDay: included('pharmacology.frequency') ? draft.timesPerDay : value.timesPerDay,
      prodrugStatusRaw: included('pharmacology.prodrug')
        ? draft.prodrugStatusRaw || 'Unknown'
        : value.prodrugStatusRaw,
      excretionRouteRaw: included('pharmacology.elimination')
        ? draft.excretionRouteRaw || 'Unknown'
        : value.excretionRouteRaw,
      excretionNotes: included('pharmacology.elimination')
        ? draft.excretionNotes
        : value.excretionNotes,
      pharmacologyProfileJSON: included('pharmacology.adme')
        ? JSON.stringify(draft.pharmacologyProfile)
        : value.pharmacologyProfileJSON,
      prodrugInfoJSON: included('pharmacology.prodrug')
        ? JSON.stringify(draft.prodrugInfo)
        : value.prodrugInfoJSON,
      eliminationInfoJSON: included('pharmacology.elimination')
        ? JSON.stringify(draft.eliminationInfo)
        : value.eliminationInfoJSON,
    };
  }
  if (selection.has('Safety')) {
    value = {
      ...value,
      warnings: included('safety.warnings') ? draft.warnings : value.warnings,
      contraindications: included('safety.contraindications')
        ? draft.contraindications
        : value.contraindications,
      interactions: included('safety.interactions') ? draft.interactions : value.interactions,
      toxicity: included('safety.organCautions') ? draft.toxicity : value.toxicity,
      renalCaution: included('safety.organCautions') ? draft.renalCaution : value.renalCaution,
      hepaticCaution: included('safety.organCautions')
        ? draft.hepaticCaution
        : value.hepaticCaution,
      pregnancyCaution: included('safety.organCautions')
        ? draft.pregnancyCaution
        : value.pregnancyCaution,
      interactionEntriesJSON: included('safety.interactions')
        ? JSON.stringify(draft.interactionEntries)
        : value.interactionEntriesJSON,
      reproductiveSafetyJSON: included('safety.reproductive')
        ? JSON.stringify(draft.reproductiveSafety)
        : value.reproductiveSafetyJSON,
    };
  }
  if (selection.has('Counseling')) {
    value = {
      ...value,
      howToTake: included('counseling.instructions') ? draft.howToTake : value.howToTake,
      foodInstruction: included('counseling.instructions')
        ? draft.foodInstruction
        : value.foodInstruction,
      counselingSentence: included('counseling.patient')
        ? draft.counselingSentence
        : value.counselingSentence,
      patientQuestions: included('counseling.patient')
        ? draft.patientQuestions
        : value.patientQuestions,
      counselingHowToTakeArabic: included('counseling.arabic')
        ? draft.counselingHowToTakeArabic
        : value.counselingHowToTakeArabic,
      counselingFoodArabic: included('counseling.arabic')
        ? draft.counselingFoodArabic
        : value.counselingFoodArabic,
      patientFeelingsArabic: included('counseling.arabic')
        ? draft.patientFeelingsArabic
        : value.patientFeelingsArabic,
      seekHelpArabic: included('counseling.arabic') ? draft.seekHelpArabic : value.seekHelpArabic,
      missedDoseArabic: included('counseling.arabic')
        ? draft.missedDoseArabic
        : value.missedDoseArabic,
    };
  }
  if (selection.has('Arabic learning') && included('arabic.learning')) {
    value = {
      ...value,
      arabicExplanation: draft.arabicExplanation,
      arabicMechanism: draft.arabicMechanism,
      arabicCounseling: draft.arabicCounseling,
      arabicMemoryStory: draft.arabicMemoryStory,
      arabicImportantNote: draft.arabicImportantNote,
      oneLineSummaryArabic: draft.oneLineSummaryArabic,
    };
  }
  if (selection.has('Adverse effects')) {
    value = {
      ...value,
      commonSideEffects: included('adverse.common')
        ? draft.commonSideEffects
        : value.commonSideEffects,
      seriousSideEffects: included('adverse.serious')
        ? draft.seriousSideEffects
        : value.seriousSideEffects,
      adverseEffectEntriesJSON: included('adverse.common')
        ? JSON.stringify(draft.adverseEffectEntries)
        : value.adverseEffectEntriesJSON,
    };
  }
  if (selection.has('Dosing')) {
    if (included('dosing.regimens')) value.doseRegimensJSON = JSON.stringify(draft.doseRegimens);
    if (included('dosing.clinical')) value.clinicalDosesJSON = JSON.stringify(draft.clinicalDoses);
  }
  if (selection.has('Memorization')) {
    value = {
      ...value,
      mustKnow: included('memorization.mustKnow') ? draft.mustKnow : value.mustKnow,
      flashcards: included('memorization.flashcards') ? draft.flashcards : value.flashcards,
      oneLineSummaryArabic: included('memorization.mustKnow')
        ? draft.oneLineSummaryArabic
        : value.oneLineSummaryArabic,
      patientQuestions:
        !included('memorization.flashcards') || value.patientQuestions.length > 0
          ? value.patientQuestions
          : draft.flashcards.map((card) => card.split('\t')[0] ?? '').filter(Boolean),
    };
  }

  const evidence = readEvidence(value.fieldEvidenceJSON).filter(
    (item) => item.sourceName !== 'Generated with AI',
  );
  const includedSections = new Set(
    availableAIImportFields(draft)
      .filter((field) => selection.has(field.section) && included(field.key))
      .map((field) => field.section),
  );
  for (const section of includedSections) {
    evidence.push({
      id: idFactory(),
      fieldKey: section,
      sourceID: 'generated-with-ai',
      sourceName: 'Generated with AI',
      sourceURL: '',
      quality: 'aiUnverified',
      retrievedAt: swiftReferenceTime(now),
      valueFingerprint: fingerprint({ section, draft }),
    });
  }
  value = {
    ...value,
    importedSourceName: 'Generated with AI',
    sourceURL: '',
    sourceUpdatedAt: now.toISOString(),
    sourceNeedsReview: true,
    sourceMissingFields: aiImportSections.filter(
      (section) => !availableAIImportSections(draft).includes(section),
    ),
    sourceQualityNotes:
      'AI-generated educational draft. Verify every clinical field against a current trusted source and pharmacist supervision.',
    verificationRaw: 'Needs pharmacist verification',
    reviewQuestionsNeedRegeneration: true,
    fieldEvidenceJSON: JSON.stringify(evidence),
    lastKnowledgeRefreshAt: now.toISOString(),
  };
  value.canonicalIngredientKey = canonicalKeyForDrug(value);
  return normalizeDrugConsistency(value);
}
