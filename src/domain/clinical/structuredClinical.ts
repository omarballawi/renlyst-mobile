import { z } from 'zod';

import type { DrugBackup } from '@/domain/backup';

const stringValue = z.string().optional().default('');
const stringArray = z.array(z.string()).optional().default([]);

const interactionSchema = z.object({
  drugName: z.string(),
  category: stringValue,
  effect: stringValue,
  management: stringValue,
  sourceIDs: stringArray,
});
const adverseEffectSchema = z.object({
  name: z.string(),
  incidence: stringValue,
  isSerious: z.boolean().optional().default(false),
  sourceIDs: stringArray,
});
const reproductiveSafetySchema = z.object({
  pregnancy: stringValue,
  lactation: stringValue,
  pregnancyArabicNote: stringValue,
  lactationArabicNote: stringValue,
  sourceIDs: stringArray,
});
const pharmacologyProfileSchema = z.object({
  mechanismOfAction: stringValue,
  absorption: stringArray,
  distribution: stringArray,
  metabolism: stringArray,
  elimination: stringArray,
  sourceIDs: stringArray,
});
const prodrugInfoSchema = z.object({
  classification: stringValue,
  administeredCompound: stringValue,
  activeCompound: stringValue,
  activationSite: stringValue,
  activationPathway: stringValue,
  explanation: stringValue,
  sourceIDs: stringArray,
});
const eliminationRouteSchema = z.object({
  pathway: stringValue,
  percentage: z.number().finite().nullable().optional().default(null),
  detail: stringValue,
});
const eliminationInfoSchema = z.object({
  metabolismSite: stringValue,
  metabolismEnzymes: stringArray,
  routes: z.array(eliminationRouteSchema).optional().default([]),
  dominantPathway: stringValue,
  summary: stringValue,
  sourceIDs: stringArray,
});
const formStrengthSchema = z.object({
  strength: z.string(),
  tradeNames: stringArray,
});
const dosageFormGroupSchema = z.object({
  dosageForm: z.string(),
  strengths: z.array(formStrengthSchema).optional().default([]),
});
const clinicalDoseSchema = z.object({
  indication: z.string(),
  population: z.string(),
  doseText: z.string(),
  route: stringValue,
  frequency: stringValue,
  duration: stringValue,
  adjuncts: stringArray,
  considerations: stringArray,
  sourceIDs: stringArray,
});

export type InteractionCategory =
  'Contraindicated' | 'Serious - Use Alternative' | 'Monitor Closely' | 'Minor' | 'Uncategorized';

export type DrugInteractionEntry = Omit<z.infer<typeof interactionSchema>, 'category'> & {
  category: InteractionCategory;
};
export type AdverseEffectEntry = z.infer<typeof adverseEffectSchema>;
export type ReproductiveSafetyProfile = z.infer<typeof reproductiveSafetySchema>;
export type PharmacologyProfile = z.infer<typeof pharmacologyProfileSchema>;
export type ProdrugInfo = z.infer<typeof prodrugInfoSchema>;
export type EliminationInfo = z.infer<typeof eliminationInfoSchema>;
export type DosageFormGroup = z.infer<typeof dosageFormGroupSchema>;
export type ClinicalDoseEntry = z.infer<typeof clinicalDoseSchema>;

export type StructuredClinicalProfile = {
  interactions: DrugInteractionEntry[];
  adverseEffects: AdverseEffectEntry[];
  reproductiveSafety: ReproductiveSafetyProfile;
  pharmacology: PharmacologyProfile;
  prodrug: ProdrugInfo;
  elimination: EliminationInfo;
  dosageFormGroups: DosageFormGroup[];
  clinicalDoses: ClinicalDoseEntry[];
};

function decode<T>(value: string | null | undefined, schema: z.ZodType<T>): T | null {
  if (!value?.trim()) return null;
  try {
    const result = schema.safeParse(JSON.parse(value) as unknown);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

function interactionCategory(value: string): InteractionCategory {
  const normalized = value.toLocaleLowerCase();
  if (normalized.includes('contraindicated')) return 'Contraindicated';
  if (normalized.includes('serious') || normalized.includes('alternative')) {
    return 'Serious - Use Alternative';
  }
  if (normalized.includes('monitor')) return 'Monitor Closely';
  if (normalized.includes('minor')) return 'Minor';
  return 'Uncategorized';
}

function legacyEliminationPathway(value: string): string {
  switch (value.trim().toLocaleLowerCase()) {
    case 'renal':
      return 'Kidneys / urine';
    case 'hepatic':
      return 'Bile / feces';
    case 'mixed':
      return 'Mixed pathways';
    default:
      return 'Unknown';
  }
}

export function structuredClinicalForDrug(drug: DrugBackup): StructuredClinicalProfile {
  const decodedInteractions = decode(drug.interactionEntriesJSON, z.array(interactionSchema));
  const interactions =
    decodedInteractions && decodedInteractions.length > 0
      ? decodedInteractions
          .filter((entry) => entry.drugName.trim())
          .map((entry) => ({ ...entry, category: interactionCategory(entry.category) }))
      : drug.interactions
          .filter((name) => name.trim())
          .map((drugName) => ({
            drugName,
            category: 'Uncategorized' as const,
            effect: '',
            management: '',
            sourceIDs: [],
          }));
  const decodedAdverse = decode(drug.adverseEffectEntriesJSON, z.array(adverseEffectSchema));
  const adverseEffects =
    decodedAdverse && decodedAdverse.length > 0
      ? decodedAdverse.filter((effect) => effect.name.trim())
      : [
          ...drug.commonSideEffects.map((name) => ({
            name,
            incidence: '',
            isSerious: false,
            sourceIDs: [],
          })),
          ...drug.seriousSideEffects.map((name) => ({
            name,
            incidence: '',
            isSerious: true,
            sourceIDs: [],
          })),
        ];
  const reproductiveSafety =
    decode(drug.reproductiveSafetyJSON, reproductiveSafetySchema) ??
    reproductiveSafetySchema.parse({
      pregnancy: drug.pregnancyCaution,
      pregnancyArabicNote: drug.pregnancyCaution,
    });
  const pharmacology =
    decode(drug.pharmacologyProfileJSON, pharmacologyProfileSchema) ??
    pharmacologyProfileSchema.parse({
      mechanismOfAction: drug.mechanism,
      metabolism: drug.excretionNotes.trim() ? [drug.excretionNotes] : [],
    });
  const legacyClassification = drug.prodrugStatusRaw.toLocaleLowerCase();
  const prodrug =
    decode(drug.prodrugInfoJSON, prodrugInfoSchema) ??
    prodrugInfoSchema.parse({
      classification: legacyClassification.includes('prodrug')
        ? 'Prodrug'
        : legacyClassification.includes('active')
          ? 'Active drug'
          : 'Unknown',
      administeredCompound: drug.scientificName,
    });
  const pathway = legacyEliminationPathway(drug.excretionRouteRaw);
  const elimination =
    decode(drug.eliminationInfoJSON, eliminationInfoSchema) ??
    eliminationInfoSchema.parse({
      routes: drug.excretionNotes.trim()
        ? [{ pathway, percentage: null, detail: drug.excretionNotes }]
        : [],
      dominantPathway: pathway,
      summary: drug.excretionNotes,
    });
  const decodedGroups = decode(drug.dosageFormGroupsJSON, z.array(dosageFormGroupSchema));
  const dosageFormGroups =
    decodedGroups && decodedGroups.length > 0
      ? decodedGroups
      : drug.dosageForms.map((dosageForm) => ({
          dosageForm,
          strengths: drug.strengths.map((strength) => ({ strength, tradeNames: [] })),
        }));

  return {
    interactions,
    adverseEffects,
    reproductiveSafety,
    pharmacology,
    prodrug,
    elimination,
    dosageFormGroups,
    clinicalDoses: decode(drug.clinicalDosesJSON, z.array(clinicalDoseSchema)) ?? [],
  };
}

export function adverseIncidenceLabel(value: string): string {
  const incidence = value.trim();
  if (!incidence) return 'Not established';
  if (incidence.includes('%')) return incidence;
  return Number.isFinite(Number(incidence.replace(',', '.'))) ? `${incidence}%` : incidence;
}
