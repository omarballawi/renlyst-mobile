import * as Crypto from 'expo-crypto';
import { z } from 'zod';

import type { DrugBackup } from '@/domain/backup';
import { normalizeCredential } from '@/domain/shared/credentials';
import {
  generatePracticeQuestions,
  type PracticeInteraction,
  type PracticeQuestion,
  type QuestionDifficulty,
} from '@/domain/learning/practiceEngine';
import { questionTypes, type QuestionType } from '@/domain/learning/reviewScheduler';

type FetchLike = typeof fetch;

export type ProviderFailureCode =
  'missingCredential' | 'httpFailure' | 'invalidResponse' | 'unavailableModel';

export class ProviderFailure extends Error {
  constructor(
    readonly code: ProviderFailureCode,
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'ProviderFailure';
  }
}

const chatResponseSchema = z.object({
  choices: z.array(
    z.object({
      message: z.object({ content: z.string().nullable() }),
    }),
  ),
});

const aiPracticeItemSchema = z.object({
  sourceDrugID: z.string(),
  prompt: z.string(),
  answer: z.string(),
  choices: z.array(z.string()).optional().default([]),
  explanation: z.string().optional().default(''),
  questionType: z.string(),
});
const aiPracticePayloadSchema = z.object({ questions: z.array(aiPracticeItemSchema) });

const textValue = (value: unknown): string => {
  if (value == null) return '';
  return typeof value === 'string' ? value : String(value);
};

const aiString = z.preprocess(textValue, z.string());
const aiStrings = z.preprocess(
  (value) => (Array.isArray(value) ? value.map(textValue).filter((item) => item.trim()) : []),
  z.array(z.string()),
);
const aiNumber = z.preprocess((value) => {
  if (value == null || value === '') return null;
  const parsed =
    typeof value === 'number' ? value : Number(textValue(value).trim().replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}, z.number().finite().nullable());
const aiBoolean = z.preprocess((value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  return textValue(value).trim().toLocaleLowerCase() === 'true';
}, z.boolean());

function normalizedToken(value: unknown): string {
  return textValue(value).trim().toLocaleLowerCase().replace(/[_-]+/gu, ' ').replace(/\s+/gu, ' ');
}

function enumWithFallback<const Values extends readonly [string, ...string[]]>(
  values: Values,
  fallback: Values[number],
) {
  const lookup = new Map(values.map((value) => [normalizedToken(value), value]));
  return z.preprocess((value) => lookup.get(normalizedToken(value)) ?? fallback, z.enum(values));
}

const recognitionSchema = z
  .object({
    scientificName: aiString,
    tradeNames: aiStrings,
    manufacturer: aiString,
    marketedStrengthLabel: aiString,
    ingredientComponents: z
      .array(
        z.object({
          name: aiString,
          displayStrength: aiString,
        }),
      )
      .optional()
      .default([]),
    dosageForm: aiString,
    route: aiString,
    country: aiString,
    packageText: aiString,
    confidence: z.enum(['low', 'medium', 'high']).optional().default('low'),
  })
  .transform((value) => {
    const ingredients = value.ingredientComponents
      .map((component) => ({
        name: component.name.trim(),
        displayStrength: component.displayStrength.trim(),
      }))
      .filter((component) => component.name);
    return {
      ...value,
      scientificName:
        value.scientificName.trim() || ingredients.map((component) => component.name).join(' + '),
      tradeNames: value.tradeNames.map((item) => item.trim()).filter(Boolean),
      ingredientComponents: ingredients,
    };
  });

const populationSchema = z.preprocess(
  (value) => {
    const normalized = normalizedToken(value);
    if (normalized.includes('child') || normalized.includes('pediatric')) return 'Child';
    if (normalized.includes('older') || normalized.includes('geriatric')) return 'Older adult';
    if (normalized.includes('special')) return 'Special population';
    return 'Adult';
  },
  z.enum(['Adult', 'Child', 'Older adult', 'Special population']),
);
const formulaSchema = z.preprocess(
  (value) => {
    const normalized = normalizedToken(value).replace(/per/gu, '/');
    if (normalized.includes('m²') || normalized.includes('m2') || normalized.includes('square')) {
      return 'mg/m²';
    }
    if (normalized.includes('kg') && normalized.includes('day')) return 'mg/kg/day';
    if (normalized.includes('kg') && normalized.includes('dose')) return 'mg/kg/dose';
    return 'Fixed dose';
  },
  z.enum(['Fixed dose', 'mg/kg/dose', 'mg/kg/day', 'mg/m²']),
);
const aiDoseRegimenSchema = z.looseObject({
  indication: aiString,
  population: populationSchema,
  formula: formulaSchema,
  route: aiString,
  minimumAgeMonths: aiNumber,
  maximumAgeMonths: aiNumber,
  minimumWeightKG: aiNumber,
  maximumWeightKG: aiNumber,
  sexRestriction: z.preprocess(
    (value) => {
      const normalized = normalizedToken(value);
      if (normalized === 'female') return 'Female';
      if (normalized === 'male') return 'Male';
      return null;
    },
    z.enum(['Female', 'Male']).nullable(),
  ),
  fixedDoseMG: aiNumber,
  amountPerKG: aiNumber,
  amountPerSquareMeter: aiNumber,
  dividedDoses: aiNumber,
  intervalHours: aiNumber,
  maximumSingleDoseMG: aiNumber,
  maximumDailyDoseMG: aiNumber,
  durationText: aiString,
  renalAdjustment: aiString,
  hepaticAdjustment: aiString,
  requiresMeasuredWeight: aiBoolean,
  sourceIDs: aiStrings,
});
const aiInteractionSchema = z.looseObject({
  drugName: aiString,
  category: aiString,
  effect: aiString,
  management: aiString,
  sourceIDs: aiStrings,
});
const aiAdverseEffectSchema = z.looseObject({
  name: aiString,
  incidence: aiString,
  isSerious: aiBoolean,
  sourceIDs: aiStrings,
});
const dosageFormGroupSchema = z.looseObject({
  dosageForm: aiString,
  strengths: z
    .array(z.looseObject({ strength: aiString, tradeNames: aiStrings }))
    .optional()
    .default([]),
});
const clinicalDoseSchema = z.looseObject({
  indication: aiString,
  population: aiString,
  doseText: aiString,
  route: aiString,
  frequency: aiString,
  duration: aiString,
  adjuncts: aiStrings,
  considerations: aiStrings,
  sourceIDs: aiStrings,
});
const prodrugInfoSchema = z.looseObject({
  classification: aiString,
  administeredCompound: aiString,
  activeCompound: aiString,
  activationSite: aiString,
  activationPathway: aiString,
  explanation: aiString,
  sourceIDs: aiStrings,
});
const eliminationInfoSchema = z.looseObject({
  metabolismSite: aiString,
  metabolismEnzymes: aiStrings,
  routes: z
    .array(
      z.looseObject({
        pathway: aiString,
        percentage: aiNumber,
        detail: aiString,
      }),
    )
    .optional()
    .default([]),
  dominantPathway: aiString,
  summary: aiString,
  sourceIDs: aiStrings,
});
const ingredientNamesSchema = z.preprocess(
  (value) =>
    Array.isArray(value)
      ? value
          .map((item) => {
            if (item && typeof item === 'object' && 'name' in item) {
              return textValue((item as { name?: unknown }).name);
            }
            return textValue(item);
          })
          .filter((item) => item.trim())
      : [],
  z.array(z.string()),
);
const chapterSchema = enumWithFallback(
  [
    'Cardiovascular',
    'Respiratory',
    'Endocrine',
    'Musculoskeletal',
    'Eye',
    'Ear/Nose/Oropharynx',
    'Gastrointestinal',
    'Dermatology',
    'Antibiotics',
    'OTC',
    'Vitamins/Supplements',
    'Other',
  ] as const,
  'Other',
);
const halfLifeBandSchema = enumWithFallback(
  ['Unknown', 'Short', 'Medium', 'Long', 'Very long'] as const,
  'Unknown',
);
const onsetBandSchema = enumWithFallback(
  ['Unknown', 'Fast', 'Moderate', 'Slow'] as const,
  'Unknown',
);
const frequencySchema = enumWithFallback(
  [
    'Unknown',
    'Once daily',
    'Twice daily',
    'Three times daily',
    'Four times daily',
    'PRN',
    'Other',
  ] as const,
  'Unknown',
);
const prodrugStatusSchema = enumWithFallback(['Unknown', 'Active', 'Prodrug'] as const, 'Unknown');
const excretionRouteSchema = enumWithFallback(
  ['Unknown', 'Renal', 'Hepatic', 'Mixed'] as const,
  'Unknown',
);

const aiDrugDraftSchema = z
  .looseObject({
    scientificName: aiString,
    tradeNames: aiStrings,
    chapterRaw: chapterSchema,
    drugClass: aiString,
    activeIngredients: ingredientNamesSchema,
    dosageForms: aiStrings,
    strengths: aiStrings,
    routes: aiStrings,
    indications: aiStrings,
    mechanism: aiString,
    mechanismKeywords: aiStrings,
    howToTake: aiString,
    foodInstruction: aiString,
    warnings: aiStrings,
    contraindications: aiStrings,
    interactions: aiStrings,
    toxicity: aiString,
    renalCaution: aiString,
    hepaticCaution: aiString,
    pregnancyCaution: aiString,
    commonSideEffects: aiStrings,
    seriousSideEffects: aiStrings,
    halfLifeText: aiString,
    halfLifeHours: aiNumber,
    halfLifeBandRaw: halfLifeBandSchema,
    onsetText: aiString,
    onsetMinutes: aiNumber,
    onsetBandRaw: onsetBandSchema,
    durationText: aiString,
    durationHours: aiNumber,
    durationBandRaw: halfLifeBandSchema,
    dosingFrequencyRaw: frequencySchema,
    timesPerDay: aiNumber,
    prodrugStatusRaw: prodrugStatusSchema,
    excretionRouteRaw: excretionRouteSchema,
    excretionNotes: aiString,
    counselingSentence: aiString,
    patientQuestions: aiStrings,
    counselingHowToTakeArabic: aiString,
    counselingFoodArabic: aiString,
    patientFeelingsArabic: aiStrings,
    seekHelpArabic: aiStrings,
    missedDoseArabic: aiString,
    arabicExplanation: aiString,
    arabicMechanism: aiString,
    arabicCounseling: aiString,
    arabicMemoryStory: aiString,
    arabicImportantNote: aiString,
    mustKnow: aiStrings,
    flashcards: aiStrings,
    oneLineSummaryArabic: aiString,
    doseRegimens: z.array(aiDoseRegimenSchema).optional().default([]),
    dosageFormGroups: z.array(dosageFormGroupSchema).optional().default([]),
    clinicalDoses: z.array(clinicalDoseSchema).optional().default([]),
    interactionEntries: z.array(aiInteractionSchema).optional().default([]),
    adverseEffectEntries: z.array(aiAdverseEffectSchema).optional().default([]),
    prodrugInfo: prodrugInfoSchema.optional().default({
      classification: '',
      administeredCompound: '',
      activeCompound: '',
      activationSite: '',
      activationPathway: '',
      explanation: '',
      sourceIDs: [],
    }),
    eliminationInfo: eliminationInfoSchema.optional().default({
      metabolismSite: '',
      metabolismEnzymes: [],
      routes: [],
      dominantPathway: '',
      summary: '',
      sourceIDs: [],
    }),
    reproductiveSafety: z
      .looseObject({
        pregnancy: aiString,
        lactation: aiString,
        pregnancyArabicNote: aiString,
        lactationArabicNote: aiString,
        sourceIDs: aiStrings,
      })
      .optional()
      .default({
        pregnancy: '',
        lactation: '',
        pregnancyArabicNote: '',
        lactationArabicNote: '',
        sourceIDs: [],
      }),
    pharmacologyProfile: z
      .looseObject({
        mechanismOfAction: aiString,
        absorption: aiStrings,
        distribution: aiStrings,
        metabolism: aiStrings,
        elimination: aiStrings,
        sourceIDs: aiStrings,
      })
      .optional()
      .default({
        mechanismOfAction: '',
        absorption: [],
        distribution: [],
        metabolism: [],
        elimination: [],
        sourceIDs: [],
      }),
  })
  .transform((draft) => {
    const derivedAdverse = draft.commonSideEffects.flatMap((item) => {
      const match = item.trim().match(/^(.*?)\s*\(([\d.,]+\s*%)\)\s*$/u);
      if (!match?.[1] || !match[2]) return [];
      return [
        {
          name: match[1].trim(),
          incidence: match[2].replace(/\s+/gu, ''),
          isSerious: false,
          sourceIDs: [],
        },
      ];
    });
    return {
      ...draft,
      doseRegimens: draft.doseRegimens.map((item) => ({ ...item, sourceIDs: [] })),
      clinicalDoses: draft.clinicalDoses.map((item) => ({ ...item, sourceIDs: [] })),
      interactionEntries: draft.interactionEntries.map((item) => ({ ...item, sourceIDs: [] })),
      adverseEffectEntries: (draft.adverseEffectEntries.length > 0
        ? draft.adverseEffectEntries
        : derivedAdverse
      ).map((item) => ({ ...item, sourceIDs: [] })),
      reproductiveSafety: { ...draft.reproductiveSafety, sourceIDs: [] },
      pharmacologyProfile: { ...draft.pharmacologyProfile, sourceIDs: [] },
      prodrugInfo: { ...draft.prodrugInfo, sourceIDs: [] },
      eliminationInfo: { ...draft.eliminationInfo, sourceIDs: [] },
    };
  });

export type PackageRecognition = z.infer<typeof recognitionSchema>;
export type AIDrugDraft = z.infer<typeof aiDrugDraftSchema>;
export type VisionDrugDraft = {
  packageRecognition: PackageRecognition;
  drugDraft: AIDrugDraft;
};

export function parsePackageRecognitionPayload(payload: unknown): PackageRecognition {
  return recognitionSchema.parse(payload);
}

export function parseAIDrugDraftPayload(payload: unknown): AIDrugDraft {
  return aiDrugDraftSchema.parse(payload);
}

export type ProviderPracticePackResult = {
  questions: PracticeQuestion[];
  source: 'deepSeek' | 'local';
  warning: string | null;
};

function normalized(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase('en-US')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function groundedFacts(drug: DrugBackup): string[] {
  return [
    drug.scientificName,
    ...(drug.activeIngredients ?? []),
    ...drug.tradeNames,
    drug.drugClass,
    ...drug.indications,
    ...drug.warnings,
    ...drug.contraindications,
    drug.counselingSentence,
    drug.howToTake,
    drug.foodInstruction,
  ].filter((value) => value.trim());
}

function isGrounded(answer: string, drug: DrugBackup): boolean {
  const target = normalized(answer);
  return Boolean(target) && groundedFacts(drug).some((fact) => normalized(fact) === target);
}

function uniqueChoices(values: readonly string[]): string[] {
  return values
    .map((value) => value.trim())
    .filter((value) => value.length > 0 && value.length <= 64)
    .filter(
      (value, index, all) =>
        all.findIndex((candidate) => normalized(candidate) === normalized(value)) === index,
    )
    .slice(0, 4);
}

function difficulty(type: QuestionType): QuestionDifficulty {
  return type === 'Warning' || type === 'Counseling' || type === 'Case practice'
    ? 'Apply'
    : 'Foundation';
}

function questionType(value: string): QuestionType {
  return questionTypes.find((type) => normalized(type) === normalized(value)) ?? 'Use';
}

function providerQuestion(
  item: z.infer<typeof aiPracticeItemSchema>,
  drug: DrugBackup,
  _index: number,
): PracticeQuestion | null {
  const prompt = item.prompt.trim();
  const answer = item.answer.trim();
  const explanation = item.explanation.trim() || answer;
  const promptWords = prompt.split(/\s+/u).filter(Boolean).length;
  if (
    !prompt ||
    promptWords > 18 ||
    prompt.length > 120 ||
    answer.length > 160 ||
    explanation.length > 240 ||
    /\b(?:see section|references?|package insert|no information is available)\b/iu.test(answer) ||
    !isGrounded(answer, drug)
  )
    return null;
  const type = questionType(item.questionType);
  let choices = uniqueChoices(item.choices);
  let interaction: PracticeInteraction = 'recall';
  if (type === 'Scientific name' || type === 'Trade name') {
    choices = [];
    interaction = 'textEntry';
  } else if (
    type === 'Use' &&
    choices.length >= 3 &&
    choices.some((choice) => normalized(choice) === normalized(answer))
  ) {
    interaction = 'multipleChoice';
  } else {
    choices = [];
  }
  return {
    id: Crypto.randomUUID(),
    drugID: drug.id,
    drugName: drug.scientificName || drug.captureLabel || 'Unknown medicine',
    prompt,
    correctAnswer: answer,
    acceptedAnswers: [answer],
    choices,
    explanation,
    questionType: type,
    interaction,
    imageUri: null,
    caseID: null,
    difficulty: difficulty(type),
    learningObjective: 'Recall a grounded fact from this saved profile',
    sourceField: type,
  };
}

async function errorDetail(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (body && typeof body === 'object') {
      const record = body as Record<string, unknown>;
      if (typeof record.message === 'string') return record.message;
      if (record.error && typeof record.error === 'object') {
        const message = (record.error as Record<string, unknown>).message;
        if (typeof message === 'string') return message;
      }
    }
  } catch {
    return '';
  }
  return '';
}

export function parseProviderJSON(content: string): unknown {
  const trimmed = content
    .trim()
    .replace(/^```(?:json)?\s*/iu, '')
    .replace(/\s*```$/u, '')
    .trim();
  const start = trimmed.indexOf('{');
  if (start < 0) throw new Error('No JSON object was found.');
  const stack: string[] = [];
  let inString = false;
  let escaped = false;
  for (let index = start; index < trimmed.length; index += 1) {
    const character = trimmed[index]!;
    if (inString) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === '"') inString = false;
      continue;
    }
    if (character === '"') {
      inString = true;
      continue;
    }
    if (character === '{' || character === '[') stack.push(character);
    else if (character === '}' || character === ']') {
      stack.pop();
      if (stack.length === 0) return JSON.parse(trimmed.slice(start, index + 1)) as unknown;
    }
  }

  let repaired = trimmed.slice(start).trimEnd();
  if (inString) repaired += '"';
  repaired = repaired.replace(/,\s*$/u, '');
  if (/:\s*$/u.test(repaired)) repaired += 'null';
  for (const opening of stack.reverse()) repaired += opening === '{' ? '}' : ']';
  return JSON.parse(repaired) as unknown;
}

async function chatJSON({
  endpoint,
  apiKey,
  model,
  prompt,
  fetcher,
  maxTokens = 1100,
  system = 'Return valid JSON only. Never add clinical facts that are absent from the user input.',
}: {
  endpoint: string;
  apiKey: string;
  model: string;
  prompt: string;
  fetcher: FetchLike;
  maxTokens?: number;
  system?: string;
}): Promise<unknown> {
  const normalizedKey = normalizeCredential(apiKey);
  if (!normalizedKey) {
    throw new ProviderFailure('missingCredential', 'Add the provider API key in Settings first.');
  }
  const response = await fetcher(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${normalizedKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model.trim(),
      messages: [
        {
          role: 'system',
          content: system,
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: maxTokens,
    }),
  });
  if (!response.ok) {
    const detail = await errorDetail(response);
    throw new ProviderFailure(
      'httpFailure',
      `Provider request failed (HTTP ${response.status})${detail ? `: ${detail}` : '.'}`,
      response.status,
    );
  }
  const envelope = chatResponseSchema.safeParse(await response.json());
  const content = envelope.success ? envelope.data.choices[0]?.message.content?.trim() : '';
  if (!content)
    throw new ProviderFailure('invalidResponse', 'The provider returned no usable JSON.');
  try {
    return parseProviderJSON(content);
  } catch {
    throw new ProviderFailure('invalidResponse', 'The provider response was not valid JSON.');
  }
}

export async function generateDeepSeekDrugDraft({
  confirmedScientificName,
  confirmedIdentity,
  packageText = '',
  apiKey,
  model,
  fetcher = fetch,
}: {
  confirmedScientificName: string;
  confirmedIdentity?: {
    tradeNames: readonly string[];
    strength: string;
    dosageForm: string;
    route: string;
    chapterRaw: AIDrugDraft['chapterRaw'] | '';
    drugClass: string;
  };
  packageText?: string;
  apiKey: string;
  model: string;
  fetcher?: FetchLike;
}): Promise<AIDrugDraft> {
  const name = confirmedScientificName.trim();
  if (!name) throw new Error('Confirm the active ingredient before generating a draft.');
  const confirmedContext = confirmedIdentity
    ? JSON.stringify({
        tradeNames: confirmedIdentity.tradeNames.map((value) => value.trim()).filter(Boolean),
        strength: confirmedIdentity.strength.trim(),
        dosageForm: confirmedIdentity.dosageForm.trim(),
        route: confirmedIdentity.route.trim(),
        chapterRaw: confirmedIdentity.chapterRaw,
        drugClass: confirmedIdentity.drugClass.trim(),
      })
    : '{}';
  const prompt = `Build a complete educational pharmacy study-card draft for the confirmed active ingredient "${name}". Keep scientificName exactly "${name}". Student-confirmed package context is authoritative when non-empty: ${confirmedContext}. Return one JSON object using the requested keys. Never claim pharmacist verification. Do not invent sourceIDs or citations; every sourceIDs array must be empty. Use empty strings or arrays when uncertain. Separate package strengths from indication-specific dose regimens. Dose regimens must be indication- and population-specific and use only these formula values: Fixed dose, mg/kg/dose, mg/kg/day, mg/m². Preserve every active ingredient. Put Arabic learning and counseling content in the Arabic fields. Include clinically meaningful interactionEntries with categories Contraindicated, Serious - Use Alternative, Monitor Closely, Minor, or Uncategorized. Common adverse-effect incidence must include a percentage only when reliably known; otherwise leave incidence empty. The shape is:
{"scientificName":"","tradeNames":[],"chapterRaw":"Other","drugClass":"","activeIngredients":[],"dosageForms":[],"strengths":[],"routes":[],"indications":[],"mechanism":"","mechanismKeywords":[],"howToTake":"","foodInstruction":"","warnings":[],"contraindications":[],"interactions":[],"toxicity":"","renalCaution":"","hepaticCaution":"","pregnancyCaution":"","commonSideEffects":[],"seriousSideEffects":[],"halfLifeText":"","halfLifeHours":null,"halfLifeBandRaw":"Unknown","onsetText":"","onsetMinutes":null,"onsetBandRaw":"Unknown","durationText":"","durationHours":null,"durationBandRaw":"Unknown","dosingFrequencyRaw":"Unknown","timesPerDay":null,"prodrugStatusRaw":"Unknown","excretionRouteRaw":"Unknown","excretionNotes":"","counselingSentence":"","patientQuestions":[],"counselingHowToTakeArabic":"","counselingFoodArabic":"","patientFeelingsArabic":[],"seekHelpArabic":[],"missedDoseArabic":"","arabicExplanation":"","arabicMechanism":"","arabicCounseling":"","arabicMemoryStory":"","arabicImportantNote":"","mustKnow":[],"flashcards":[],"oneLineSummaryArabic":"","doseRegimens":[],"dosageFormGroups":[],"clinicalDoses":[],"interactionEntries":[],"adverseEffectEntries":[],"prodrugInfo":{},"eliminationInfo":{},"reproductiveSafety":{},"pharmacologyProfile":{}}.
Visible package text, if any, is identity evidence only and must not be treated as a clinical source:
${packageText.trim().slice(0, 3000) || '(none)'}`;
  const payload = await chatJSON({
    endpoint: 'https://api.deepseek.com/chat/completions',
    apiKey,
    model,
    prompt,
    fetcher,
    maxTokens: 7_000,
    system:
      'Return valid JSON only. This is an unverified educational draft for pharmacist review. Do not invent citations, source identifiers, or patient-specific advice.',
  });
  const draft = parseAIDrugDraftPayload(payload);
  const confirmedTrades =
    confirmedIdentity?.tradeNames.map((value) => value.trim()).filter(Boolean) ?? [];
  return {
    ...draft,
    scientificName: name,
    tradeNames: confirmedTrades.length > 0 ? confirmedTrades : draft.tradeNames,
    strengths: confirmedIdentity?.strength.trim()
      ? [confirmedIdentity.strength.trim()]
      : draft.strengths,
    dosageForms: confirmedIdentity?.dosageForm.trim()
      ? [confirmedIdentity.dosageForm.trim()]
      : draft.dosageForms,
    routes: confirmedIdentity?.route.trim() ? [confirmedIdentity.route.trim()] : draft.routes,
    chapterRaw: confirmedIdentity?.chapterRaw || draft.chapterRaw,
    drugClass: confirmedIdentity?.drugClass.trim() || draft.drugClass,
  };
}

function ingredientIdentity(values: readonly string[]): string[] {
  return values.map(normalized).filter(Boolean).sort();
}

function packageIngredientNames(recognition: PackageRecognition): string[] {
  const components = recognition.ingredientComponents.map((component) => component.name);
  if (components.length > 0) return components;
  return recognition.scientificName
    .split(/\s*\+\s*/u)
    .map((value) => value.trim())
    .filter(Boolean);
}

function assertMatchingPackageIdentity(
  recognition: PackageRecognition,
  expectedScientificName?: string,
  expectedIngredients: readonly string[] = [],
): void {
  if (!expectedScientificName?.trim()) return;
  const expected = ingredientIdentity(
    expectedIngredients.length > 0 ? expectedIngredients : [expectedScientificName],
  );
  const recognized = ingredientIdentity(packageIngredientNames(recognition));
  const overlaps = expected.some((item) =>
    recognized.some(
      (candidate) =>
        candidate === item || candidate.startsWith(`${item} `) || item.startsWith(`${candidate} `),
    ),
  );
  if (!overlaps) {
    throw new Error(
      `This package appears to contain ${recognition.scientificName || 'a different ingredient'}, not ${expectedScientificName}. Use a matching package image.`,
    );
  }
}

export async function generateGeminiVisionDrugDraft({
  dataUrls,
  apiKey,
  model,
  expectedScientificName,
  expectedIngredients = [],
  fetcher = fetch,
}: {
  dataUrls: readonly string[];
  apiKey: string;
  model: string;
  expectedScientificName?: string;
  expectedIngredients?: readonly string[];
  fetcher?: FetchLike;
}): Promise<VisionDrugDraft> {
  const packageRecognition = await recognizePackageWithOpenRouter({
    dataUrls,
    apiKey,
    model,
    fetcher,
  });
  if (!packageRecognition.scientificName.trim()) {
    throw new Error(
      'Gemini could not read an active ingredient from this package. Add a clearer front or ingredient-panel photo.',
    );
  }
  assertMatchingPackageIdentity(packageRecognition, expectedScientificName, expectedIngredients);

  const confirmedName = expectedScientificName?.trim() || packageRecognition.scientificName.trim();
  const identity = {
    scientificName: confirmedName,
    tradeNames: packageRecognition.tradeNames,
    manufacturer: packageRecognition.manufacturer,
    strengths: packageRecognition.marketedStrengthLabel
      ? [packageRecognition.marketedStrengthLabel]
      : [],
    activeIngredients: packageIngredientNames(packageRecognition),
    dosageForms: packageRecognition.dosageForm ? [packageRecognition.dosageForm] : [],
    routes: packageRecognition.route ? [packageRecognition.route] : [],
    country: packageRecognition.country,
    visiblePackageText: packageRecognition.packageText.slice(0, 3_000),
  };
  const prompt = `Create a complete educational pharmacy profile draft for the medicine identity extracted from its package image. The following package identity is authoritative: ${JSON.stringify(identity)}. Keep scientificName exactly "${confirmedName}". Return one JSON object with this shape:
{"scientificName":"","tradeNames":[],"chapterRaw":"Other","drugClass":"","activeIngredients":[],"dosageForms":[],"strengths":[],"routes":[],"indications":[],"mechanism":"","mechanismKeywords":[],"howToTake":"","foodInstruction":"","warnings":[],"contraindications":[],"interactions":[],"toxicity":"","renalCaution":"","hepaticCaution":"","pregnancyCaution":"","commonSideEffects":[],"seriousSideEffects":[],"halfLifeText":"","halfLifeHours":null,"halfLifeBandRaw":"Unknown","onsetText":"","onsetMinutes":null,"onsetBandRaw":"Unknown","durationText":"","durationHours":null,"durationBandRaw":"Unknown","dosingFrequencyRaw":"Unknown","timesPerDay":null,"prodrugStatusRaw":"Unknown","excretionRouteRaw":"Unknown","excretionNotes":"","counselingSentence":"","patientQuestions":[],"counselingHowToTakeArabic":"","counselingFoodArabic":"","patientFeelingsArabic":[],"seekHelpArabic":[],"missedDoseArabic":"","arabicExplanation":"","arabicMechanism":"","arabicCounseling":"","arabicMemoryStory":"","arabicImportantNote":"","mustKnow":[],"flashcards":[],"oneLineSummaryArabic":"","doseRegimens":[],"dosageFormGroups":[],"clinicalDoses":[],"interactionEntries":[],"adverseEffectEntries":[],"prodrugInfo":{},"eliminationInfo":{},"reproductiveSafety":{},"pharmacologyProfile":{}}.
Use clear Modern Standard Arabic in every Arabic field when the underlying fact is available; do not transliterate English sentences. Never claim pharmacist verification. Do not invent sourceIDs or citations; all sourceIDs arrays must be empty. Use empty strings or arrays when uncertain. Separate package strengths from indication-specific dosing. Dose regimens must be indication- and population-specific and use only Fixed dose, mg/kg/dose, mg/kg/day, or mg/m². Preserve every active ingredient. Include clinically meaningful interaction and adverse-effect entries, but include incidence percentages only when reliably known. This is general educational content, never patient-specific advice.`;
  const payload = await chatJSON({
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    apiKey,
    model,
    prompt,
    fetcher,
    maxTokens: 7_000,
    system:
      'Return valid JSON only. This is an unverified educational draft for pharmacist review. Keep package identity facts unchanged and never invent citations.',
  });
  const parsed = parseAIDrugDraftPayload(payload);
  return {
    packageRecognition,
    drugDraft: {
      ...parsed,
      scientificName: confirmedName,
      tradeNames:
        packageRecognition.tradeNames.length > 0
          ? packageRecognition.tradeNames
          : parsed.tradeNames,
      activeIngredients:
        identity.activeIngredients.length > 0
          ? identity.activeIngredients
          : parsed.activeIngredients,
      strengths: identity.strengths.length > 0 ? identity.strengths : parsed.strengths,
      dosageForms: identity.dosageForms.length > 0 ? identity.dosageForms : parsed.dosageForms,
      routes: identity.routes.length > 0 ? identity.routes : parsed.routes,
    },
  };
}

function localFive(drugs: readonly DrugBackup[]): PracticeQuestion[] {
  return generatePracticeQuestions({ mode: 'Smart Session', drugs });
}

export async function generateDeepSeekPracticePack({
  drugs,
  apiKey,
  model,
  fetcher = fetch,
}: {
  drugs: readonly DrugBackup[];
  apiKey: string;
  model: string;
  fetcher?: FetchLike;
}): Promise<ProviderPracticePackResult> {
  const candidates = drugs
    .filter((drug) => !drug.isUnknown && drug.scientificName.trim())
    .sort((first, second) => {
      const weak = Number(first.confidenceRaw !== 'Weak') - Number(second.confidenceRaw !== 'Weak');
      return (
        weak || new Date(first.nextReviewDate).valueOf() - new Date(second.nextReviewDate).valueOf()
      );
    })
    .slice(0, 8);
  const local = localFive(candidates);
  if (local.length !== 5) {
    throw new Error('Add at least one known profile with enough saved facts.');
  }
  if (!normalizeCredential(apiKey)) return { questions: local, source: 'local', warning: null };
  const snapshots = candidates
    .map(
      (drug) =>
        `id=${drug.id}; name=${drug.scientificName}; trade=${drug.tradeNames.join(',')}; class=${drug.drugClass}; use=${drug.indications.slice(0, 2).join(' | ')}; warning=${drug.warnings.slice(0, 2).join(' | ')}; counsel=${drug.counselingSentence}`,
    )
    .join('\n');
  const prompt = `Create exactly five useful active-recall pharmacy questions using only the local facts below. Prioritize identity, main use, safety, and patient counseling; exclude trivia, citations, and administrative facts. Each prompt must be one sentence, at most 18 words, and at most 120 characters. Each answer must be at most 160 characters and express one idea. Each explanation must be at most 240 characters. Use different profiles and learning objectives when the saved evidence allows it. Difficulty follows the objective: identity and use are foundation; safety and counseling are application. Scientific name and Trade name questions require typed spelling. Multiple-choice Use questions need 3 or 4 unique concise choices including the exact answer. Output JSON in this shape: {"questions":[{"sourceDrugID":"","prompt":"","answer":"","choices":[],"explanation":"","questionType":"Use"}]}.\nLibrary:\n${snapshots}`;

  try {
    const payload = aiPracticePayloadSchema.parse(
      await chatJSON({
        endpoint: 'https://api.deepseek.com/chat/completions',
        apiKey,
        model,
        prompt,
        fetcher,
      }),
    );
    const byID = new Map(candidates.map((drug) => [drug.id, drug]));
    const generatedPairs = new Set<string>();
    const generated = payload.questions.flatMap((item, index) => {
      const drug = byID.get(item.sourceDrugID);
      const question = drug ? providerQuestion(item, drug, index) : null;
      if (!question) return [];
      const pair = `${question.drugID}:${question.questionType}`;
      if (generatedPairs.has(pair)) return [];
      generatedPairs.add(pair);
      return [question];
    });
    const seen = new Set(generated.map((question) => normalized(question.prompt)));
    for (const question of local) {
      if (generated.length >= 5) break;
      if (seen.has(normalized(question.prompt))) continue;
      generated.push({ ...question, difficulty: difficulty(question.questionType) });
      seen.add(normalized(question.prompt));
    }
    return { questions: generated.slice(0, 5), source: 'deepSeek', warning: null };
  } catch (error) {
    return {
      questions: local,
      source: 'local',
      warning:
        error instanceof Error
          ? `DeepSeek was unavailable, so Renlyst saved a local grounded five instead. ${error.message}`
          : 'DeepSeek was unavailable, so Renlyst saved a local grounded five instead.',
    };
  }
}

export async function recognizePackageWithOpenRouter({
  dataUrls,
  apiKey,
  model,
  fetcher = fetch,
}: {
  dataUrls: readonly string[];
  apiKey: string;
  model: string;
  fetcher?: FetchLike;
}): Promise<PackageRecognition> {
  const normalizedKey = normalizeCredential(apiKey);
  if (!normalizedKey) {
    throw new ProviderFailure(
      'missingCredential',
      'Add your OpenRouter API key in Settings before recognizing a package.',
    );
  }
  if (dataUrls.length === 0) throw new Error('Add a package photo first.');
  const response = await fetcher('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${normalizedKey}`,
      'Content-Type': 'application/json',
      'X-OpenRouter-Title': 'Renlyst',
    },
    body: JSON.stringify({
      model: model.trim(),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Read only visible medicine package facts. Do not provide dosing or medical advice. Return JSON with scientificName, tradeNames, manufacturer, marketedStrengthLabel, ingredientComponents [{name,displayStrength}], dosageForm, route, country, packageText, and confidence low|medium|high.',
            },
            ...dataUrls.slice(0, 4).map((url) => ({
              type: 'image_url',
              image_url: { url },
            })),
          ],
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
      max_tokens: 900,
    }),
  });
  if (!response.ok) {
    const detail = await errorDetail(response);
    throw new ProviderFailure(
      'httpFailure',
      `OpenRouter recognition failed (HTTP ${response.status})${detail ? `: ${detail}` : '.'}`,
      response.status,
    );
  }
  const envelope = chatResponseSchema.safeParse(await response.json());
  const content = envelope.success ? envelope.data.choices[0]?.message.content?.trim() : '';
  if (!content)
    throw new ProviderFailure('invalidResponse', 'OpenRouter returned no package facts.');
  try {
    return parsePackageRecognitionPayload(parseProviderJSON(content));
  } catch {
    throw new ProviderFailure('invalidResponse', 'OpenRouter returned invalid package JSON.');
  }
}

async function testModelList({
  endpoint,
  apiKey,
  model,
  provider,
  fetcher,
}: {
  endpoint: string;
  apiKey: string;
  model: string;
  provider: string;
  fetcher: FetchLike;
}): Promise<string> {
  const normalizedKey = normalizeCredential(apiKey);
  if (!normalizedKey)
    throw new ProviderFailure('missingCredential', `Add a ${provider} API key first.`);
  const response = await fetcher(endpoint, {
    headers: { Authorization: `Bearer ${normalizedKey}`, 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw new ProviderFailure(
      'httpFailure',
      `${provider} connection failed (HTTP ${response.status}). Check the key and try again.`,
      response.status,
    );
  }
  const payload = z
    .object({ data: z.array(z.object({ id: z.string() })) })
    .safeParse(await response.json());
  if (!payload.success)
    throw new ProviderFailure('invalidResponse', `${provider} returned an invalid model list.`);
  if (model.trim() && !payload.data.data.some((entry) => entry.id === model.trim())) {
    throw new ProviderFailure(
      'unavailableModel',
      `${provider} is reachable, but model ${model.trim()} is not currently available.`,
    );
  }
  return `${provider} is ready with ${model.trim()}.`;
}

export function testDeepSeekConnection(
  apiKey: string,
  model: string,
  fetcher: FetchLike = fetch,
): Promise<string> {
  return testModelList({
    endpoint: 'https://api.deepseek.com/models',
    apiKey,
    model,
    provider: 'DeepSeek',
    fetcher,
  });
}

export function testOpenRouterConnection(
  apiKey: string,
  model: string,
  fetcher: FetchLike = fetch,
): Promise<string> {
  return testModelList({
    endpoint: 'https://openrouter.ai/api/v1/models',
    apiKey,
    model,
    provider: 'OpenRouter',
    fetcher,
  });
}
