import { z } from 'zod';

export const CURRENT_BACKUP_SCHEMA_VERSION = 5 as const;

const identifier = z.string().trim().min(1);
const legacyDate = z.union([z.string().trim().min(1), z.number().finite()]);
const nullableDate = legacyDate.nullable().optional().default(null);
const stringValue = z.string().optional().default('');
const stringArray = z.array(z.string()).optional().default([]);
const optionalString = z.string().nullable().optional().default(null);
const optionalNumber = z.number().finite().nullable().optional().default(null);
const optionalData = z.string().nullable().optional().default(null);
const dataArray = z.array(z.string()).optional().default([]);

export const backupRecordCountsSchema = z.looseObject({
  drugs: z.number().int().nonnegative().optional().default(0),
  reviews: z.number().int().nonnegative().optional().default(0),
  shifts: z.number().int().nonnegative().optional().default(0),
  encounters: z.number().int().nonnegative().optional().default(0),
  reports: z.number().int().nonnegative().optional().default(0),
  learningProfiles: z.number().int().nonnegative().optional().default(0),
  dailyActivities: z.number().int().nonnegative().optional().default(0),
});

export const drugBackupSchema = z.looseObject({
  id: identifier,
  scientificName: z.string(),
  tradeNames: stringArray,
  chapterRaw: stringValue,
  drugClass: stringValue,
  dosageForms: stringArray,
  strengths: stringArray,
  indications: stringArray,
  howToTake: stringValue,
  foodInstruction: stringValue,
  commonSideEffects: stringArray,
  warnings: stringArray,
  counselingSentence: stringValue,
  patientQuestions: stringArray,
  shelfLocation: stringValue,
  imageData: optionalData,
  thumbnailData: optionalData,
  additionalImageData: dataArray,
  additionalThumbnailData: dataArray,
  confidenceRaw: z.string().optional().default('Weak'),
  timesSeen: z.number().int().nonnegative().optional().default(0),
  dateAdded: legacyDate,
  lastSeenDate: nullableDate,
  lastReviewed: nullableDate,
  nextReviewDate: legacyDate,
  masteryScientificName: z.boolean().optional().default(false),
  masteryTradeName: z.boolean().optional().default(false),
  masteryClass: z.boolean().optional().default(false),
  masteryUse: z.boolean().optional().default(false),
  masteryWarning: z.boolean().optional().default(false),
  masteryCounseling: z.boolean().optional().default(false),
  notes: stringValue,
  captureLabel: stringValue,
  isUnknown: z.boolean().optional().default(false),
  isConfusing: z.boolean().optional().default(false),
  correctStreak: z.number().int().nonnegative().optional().default(0),
  safetyFlagsRaw: stringArray,
  starterSeedID: optionalString,
  sourceNote: stringValue,
  verificationRaw: z.string().optional().default('Personal entry'),
  routes: stringArray,
  mechanism: stringValue,
  mechanismKeywords: stringArray,
  contraindications: stringArray,
  interactions: stringArray,
  toxicity: stringValue,
  halfLifeText: stringValue,
  halfLifeHours: optionalNumber,
  halfLifeBandRaw: z.string().optional().default('Unknown'),
  onsetText: stringValue,
  onsetMinutes: optionalNumber,
  onsetBandRaw: z.string().optional().default('Unknown'),
  durationText: stringValue,
  durationHours: optionalNumber,
  durationBandRaw: z.string().optional().default('Unknown'),
  dosingFrequencyRaw: z.string().optional().default('Unknown'),
  timesPerDay: z.number().int().nonnegative().nullable().optional().default(null),
  prodrugStatusRaw: z.string().optional().default('Unknown'),
  excretionRouteRaw: z.string().optional().default('Unknown'),
  excretionNotes: stringValue,
  pkMemoryLineArabic: stringValue,
  renalCaution: stringValue,
  hepaticCaution: stringValue,
  pregnancyCaution: stringValue,
  contraindicationSeverityRaw: z.string().optional().default('Unknown'),
  toxicitySeverityRaw: z.string().optional().default('Unknown'),
  warningSeverityRaw: z.string().optional().default('Unknown'),
  interactionSeverityRaw: z.string().optional().default('Unknown'),
  renalSeverityRaw: z.string().optional().default('Unknown'),
  hepaticSeverityRaw: z.string().optional().default('Unknown'),
  pregnancySeverityRaw: z.string().optional().default('Unknown'),
  arabicExplanation: stringValue,
  arabicMechanism: stringValue,
  arabicCounseling: stringValue,
  arabicMemoryStory: stringValue,
  arabicImportantNote: stringValue,
  arabicPersonalNotes: stringValue,
  counselingHowToTakeArabic: stringValue,
  counselingFoodArabic: stringValue,
  patientFeelingsArabic: stringArray,
  seekHelpArabic: stringArray,
  missedDoseArabic: stringValue,
  seriousSideEffects: stringArray,
  mustKnow: stringArray,
  flashcards: stringArray,
  oneLineSummaryArabic: stringValue,
  sourceNeedsReview: z.boolean().optional().default(false),
  sourceMissingFields: stringArray,
  sourceQualityNotes: stringValue,
  trustedSourceWasTruncated: z.boolean().optional().default(false),
  sourceURL: stringValue,
  importedSourceName: stringValue,
  sourceUpdatedAt: nullableDate,
  reviewQuestionsJSON: stringValue,
  memoryItemsJSON: stringValue,
  atomicNotesJSON: stringValue,
  reviewQuestionsNeedRegeneration: z.boolean().optional().default(false),
  canonicalIngredientKey: optionalString,
  activeIngredients: z.array(z.string()).nullable().optional().default(null),
  rxNormConceptIDs: z.array(z.string()).nullable().optional().default(null),
  doseRegimensJSON: optionalString,
  prodrugInfoJSON: optionalString,
  eliminationInfoJSON: optionalString,
  fieldEvidenceJSON: optionalString,
  dosageFormGroupsJSON: optionalString,
  clinicalDosesJSON: optionalString,
  interactionEntriesJSON: optionalString,
  adverseEffectEntriesJSON: optionalString,
  reproductiveSafetyJSON: optionalString,
  pharmacologyProfileJSON: optionalString,
  lastKnowledgeRefreshAt: nullableDate,
});

export const drugProductBackupSchema = z.looseObject({
  id: identifier,
  profileID: identifier.nullable().optional().default(null),
  productKey: stringValue,
  tradeName: z.string().trim().min(1),
  manufacturer: stringValue,
  strength: stringValue,
  marketedStrengthLabel: optionalString,
  ingredientComponentsJSON: optionalString,
  dosageForm: stringValue,
  route: stringValue,
  country: stringValue,
  shelfLocation: stringValue,
  imageData: optionalData,
  additionalImageData: dataArray,
  thumbnailData: optionalData,
  additionalThumbnailData: dataArray,
  leafletText: stringValue,
  leafletUpdatedAt: nullableDate,
  sourceName: stringValue,
  sourceURL: stringValue,
  dateAdded: legacyDate,
});

export const drugRelationshipBackupSchema = z.looseObject({
  id: identifier,
  relationshipKey: stringValue,
  kindRaw: stringValue,
  severityRaw: stringValue,
  summary: stringValue,
  managementNote: stringValue,
  sourceURLs: stringArray,
  checkedAt: legacyDate,
  sourceDrugID: identifier.nullable().optional().default(null),
  targetDrugID: identifier.nullable().optional().default(null),
});

export const reviewBackupSchema = z.looseObject({
  id: identifier,
  drugID: identifier.nullable().optional().default(null),
  drugNameSnapshot: stringValue,
  date: legacyDate,
  questionTypeRaw: stringValue,
  ratingRaw: stringValue,
  wasCorrect: z.boolean().optional().default(false),
  scoreBefore: z.number().int().optional().default(0),
  scoreAfter: z.number().int().optional().default(0),
  caseID: optionalString,
});

export const shiftBackupSchema = z.looseObject({
  id: identifier,
  date: legacyDate,
  startedAt: legacyDate,
  endedAt: nullableDate,
  chapterFocusRaw: stringValue,
  newDrugsAdded: z.number().int().nonnegative().optional().default(0),
  reviewsCompleted: z.number().int().nonnegative().optional().default(0),
  pharmacistQuestions: stringArray,
  whatILearned: stringValue,
  confusingDrugs: stringArray,
  notes: stringValue,
  tomorrowReview: stringValue,
  isCompleted: z.boolean().optional().default(false),
});

export const encounterBackupSchema = z.looseObject({
  id: identifier,
  date: legacyDate,
  topic: stringValue,
  relatedDrugID: identifier.nullable().optional().default(null),
  relatedDrugNameSnapshot: stringValue,
  whatHappened: stringValue,
  whatILearned: stringValue,
  pharmacistNote: stringValue,
  privacyConfirmed: z.boolean().optional().default(false),
});

export const trainingReportBackupSchema = z.looseObject({
  id: identifier,
  periodStart: legacyDate,
  periodEnd: legacyDate,
  generatedAt: legacyDate,
  updatedAt: legacyDate,
  trainingSummary: stringValue,
  skillsLearned: stringValue,
  categoriesStudied: stringValue,
  dosageFormsSeen: stringValue,
  counselingPoints: stringValue,
  pharmacistQuestions: stringValue,
  challenges: stringValue,
  notesAndRecommendations: stringValue,
  masteredDrugs: stringValue,
});

export const learningProfileBackupSchema = z.looseObject({
  id: identifier,
  currentStreak: z.number().int().nonnegative().optional().default(0),
  longestStreak: z.number().int().nonnegative().optional().default(0),
  completedSessions: z.number().int().nonnegative().optional().default(0),
  completedQuestions: z.number().int().nonnegative().optional().default(0),
  correctAnswers: z.number().int().nonnegative().optional().default(0),
  badges: stringArray,
  lastActivityDate: nullableDate,
  weakDrugRemindersEnabled: z.boolean().optional().default(false),
});

export const dailyActivityBackupSchema = z.looseObject({
  id: identifier,
  day: legacyDate,
  sessionsCompleted: z.number().int().nonnegative().optional().default(0),
  questionsAnswered: z.number().int().nonnegative().optional().default(0),
  correctAnswers: z.number().int().nonnegative().optional().default(0),
  missionCompleted: z.boolean().optional().default(false),
});

export const pharmaShiftBackupSchema = z.looseObject({
  schemaVersion: z.number().int().min(1).max(CURRENT_BACKUP_SCHEMA_VERSION),
  exportedAt: legacyDate,
  counts: backupRecordCountsSchema.optional().default({
    drugs: 0,
    reviews: 0,
    shifts: 0,
    encounters: 0,
    reports: 0,
    learningProfiles: 0,
    dailyActivities: 0,
  }),
  includesImages: z.boolean().optional().default(false),
  drugs: z.array(drugBackupSchema).optional().default([]),
  reviews: z.array(reviewBackupSchema).optional().default([]),
  shifts: z.array(shiftBackupSchema).optional().default([]),
  encounters: z.array(encounterBackupSchema).optional().default([]),
  reports: z.array(trainingReportBackupSchema).optional().default([]),
  learningProfiles: z.array(learningProfileBackupSchema).nullable().optional().default([]),
  dailyActivities: z.array(dailyActivityBackupSchema).nullable().optional().default([]),
  products: z.array(drugProductBackupSchema).nullable().optional().default([]),
  relationships: z.array(drugRelationshipBackupSchema).nullable().optional().default([]),
});

export type BackupRecordCounts = z.infer<typeof backupRecordCountsSchema>;
export type DrugBackup = z.infer<typeof drugBackupSchema>;
export type DrugProductBackup = z.infer<typeof drugProductBackupSchema>;
export type DrugRelationshipBackup = z.infer<typeof drugRelationshipBackupSchema>;
export type ReviewBackup = z.infer<typeof reviewBackupSchema>;
export type ShiftBackup = z.infer<typeof shiftBackupSchema>;
export type EncounterBackup = z.infer<typeof encounterBackupSchema>;
export type TrainingReportBackup = z.infer<typeof trainingReportBackupSchema>;
export type LearningProfileBackup = z.infer<typeof learningProfileBackupSchema>;
export type DailyActivityBackup = z.infer<typeof dailyActivityBackupSchema>;
export type PharmaShiftBackup = z.infer<typeof pharmaShiftBackupSchema>;
