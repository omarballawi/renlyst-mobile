# Graph Report - renlyst-mobile  (2026-07-19)

## Corpus Check
- 173 files · ~91,344 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1176 nodes · 3362 edges · 66 communities (63 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 32 edges (avg confidence: 0.74)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a824ce9e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_dose.tsx|dose.tsx]]
- [[_COMMUNITY_trustedSources.ts|trustedSources.ts]]
- [[_COMMUNITY_providerClients.ts|providerClients.ts]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_mergeDuplicateProfiles.ts|mergeDuplicateProfiles.ts]]
- [[_COMMUNITY_notes.tsx|notes.tsx]]
- [[_COMMUNITY_radii|radii]]
- [[_COMMUNITY_backupService.ts|backupService.ts]]
- [[_COMMUNITY_useLocale|useLocale]]
- [[_COMMUNITY_index.tsx|index.tsx]]
- [[_COMMUNITY_useTheme|useTheme]]
- [[_COMMUNITY_index.ts|index.ts]]
- [[_COMMUNITY_backupPersistence.ts|backupPersistence.ts]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_today.tsx|today.tsx]]
- [[_COMMUNITY_schema.ts|schema.ts]]
- [[_COMMUNITY_drugRepository.ts|drugRepository.ts]]
- [[_COMMUNITY_practiceRepository.ts|practiceRepository.ts]]
- [[_COMMUNITY_session.tsx|session.tsx]]
- [[_COMMUNITY_trainingRepository.ts|trainingRepository.ts]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_trusted.tsx|trusted.tsx]]
- [[_COMMUNITY_providerClients.test.ts|providerClients.test.ts]]
- [[_COMMUNITY_diagnosticReport.ts|diagnosticReport.ts]]
- [[_COMMUNITY_practiceEngine.ts|practiceEngine.ts]]
- [[_COMMUNITY_.prettierrc.json|.prettierrc.json]]
- [[_COMMUNITY_DrugBackup|DrugBackup]]
- [[_COMMUNITY_index.ts|index.ts]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_learningRepository.ts|learningRepository.ts]]
- [[_COMMUNITY_reviewScheduler.ts|reviewScheduler.ts]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY__layout.tsx|_layout.tsx]]
- [[_COMMUNITY_eslint.config.js|eslint.config.js]]
- [[_COMMUNITY_generateDeepSeekPracticePack|generateDeepSeekPracticePack]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_embeddedImages.ts|embeddedImages.ts]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_drugBackupSchema|drugBackupSchema]]
- [[_COMMUNITY_DrugBackup|DrugBackup]]
- [[_COMMUNITY_ThemeProvider.tsx|ThemeProvider.tsx]]
- [[_COMMUNITY_parseBackup.ts|parseBackup.ts]]
- [[_COMMUNITY_reviewScheduler.ts|reviewScheduler.ts]]
- [[_COMMUNITY_queries.ts|queries.ts]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_normalizeCredential|normalizeCredential]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_AppCrashBoundary.tsx|AppCrashBoundary.tsx]]
- [[_COMMUNITY_copy.ts|copy.ts]]
- [[_COMMUNITY_imagePipeline.ts|imagePipeline.ts]]
- [[_COMMUNITY_useDrugList|useDrugList]]
- [[_COMMUNITY_confirmedIdentity.ts|confirmedIdentity.ts]]
- [[_COMMUNITY_copy.ts|copy.ts]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_DatabaseProvider.tsx|DatabaseProvider.tsx]]
- [[_COMMUNITY_fetchTrustedSourceDetails|fetchTrustedSourceDetails]]
- [[_COMMUNITY_parseBackup.ts|parseBackup.ts]]
- [[_COMMUNITY_generateDeepSeekPracticePack|generateDeepSeekPracticePack]]
- [[_COMMUNITY_providerClients.test.ts|providerClients.test.ts]]
- [[_COMMUNITY_consistency.ts|consistency.ts]]

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 126 edges
2. `useLocale()` - 59 edges
3. `AppText()` - 47 edges
4. `DrugBackup` - 46 edges
5. `spacing` - 44 edges
6. `radii` - 44 edges
7. `PressableScale()` - 42 edges
8. `dateFromLegacy()` - 41 edges
9. `Icon()` - 39 edges
10. `Screen()` - 38 edges

## Surprising Connections (you probably didn't know these)
- `ModeRow()` --calls--> `useTheme()`  [EXTRACTED]
  app/(tabs)/practice.tsx → src/ui/theme/ThemeProvider.tsx
- `LearningTool()` --calls--> `useTheme()`  [EXTRACTED]
  app/(tabs)/practice.tsx → src/ui/theme/ThemeProvider.tsx
- `SettingRow()` --calls--> `useTheme()`  [EXTRACTED]
  app/(tabs)/you.tsx → src/ui/theme/ThemeProvider.tsx
- `ChoiceGroup()` --calls--> `useTheme()`  [EXTRACTED]
  app/(tabs)/you.tsx → src/ui/theme/ThemeProvider.tsx
- `LoadingApp()` --calls--> `translateCopy()`  [EXTRACTED]
  app/_layout.tsx → src/localization/copy.ts

## Import Cycles
- 3-file cycle: `src/domain/backup/index.ts -> src/domain/backup/mergeDuplicateProfiles.ts -> src/domain/drugs/identity.ts -> src/domain/backup/index.ts`

## Communities (66 total, 3 thin omitted)

### Community 0 - "dose.tsx"
Cohesion: 0.11
Nodes (26): Choice(), DoseCalculatorScreen(), numberValue(), regimenSummary(), styles, ImportCompleteScreen(), calculateDose(), DoseCalculationResult (+18 more)

### Community 1 - "trustedSources.ts"
Cohesion: 0.10
Nodes (36): altibbiSlug(), buildTrustedPacket(), checkedJSON(), checkedText(), compact(), dailyMedSearchSchema, dailyMedTitle(), decodeHTML() (+28 more)

### Community 2 - "providerClients.ts"
Cohesion: 0.06
Nodes (34): PracticeInteraction, QuestionDifficulty, aiAdverseEffectSchema, aiBoolean, aiDoseRegimenSchema, aiDrugDraftSchema, aiInteractionSchema, aiNumber (+26 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (45): categoryColor(), categoryOrder, ClinicalSection(), DetailBlock(), EmptyValue(), InteractionRow(), PharmacologyMeter(), relatedProfileID() (+37 more)

### Community 4 - "Community 4"
Cohesion: 0.04
Nodes (45): dependencies, babel-preset-expo, date-fns, expo, expo-clipboard, expo-constants, expo-crypto, expo-document-picker (+37 more)

### Community 5 - "mergeDuplicateProfiles.ts"
Cohesion: 0.11
Nodes (31): AboutScreen(), styles, BackupHistory, BackupScreen(), emptyHistory, styles, styles, styles (+23 more)

### Community 6 - "notes.tsx"
Cohesion: 0.10
Nodes (21): bands, chapters, ChoiceField(), DrugEditorScreen(), editorSchema, EditorSection, editorSections, EditorValues (+13 more)

### Community 7 - "radii"
Cohesion: 0.14
Nodes (25): NewEncounterScreen(), CompareDrugsScreen(), styles, chapters, KnowledgeMapScreen(), styles, ShelfQuestScreen(), MistakeVaultScreen() (+17 more)

### Community 8 - "backupService.ts"
Cohesion: 0.21
Nodes (20): arabicSearchText(), countsFor(), existingDrugIDs(), ImageExportRow, ImageUriRow, insertImages(), nowISO(), PayloadRow (+12 more)

### Community 9 - "useLocale"
Cohesion: 0.22
Nodes (12): applyTrustedImport(), availableTrustedImportSections(), commaList(), defaultTrustedImportSelection(), FieldEvidence, fingerprint(), readEvidence(), sourceID() (+4 more)

### Community 10 - "index.tsx"
Cohesion: 0.15
Nodes (23): ReportEditorScreen(), sections, styles, MasteryRadar(), polygonPoints(), radarLabels, radarPoint(), ReportsScreen() (+15 more)

### Community 11 - "useTheme"
Cohesion: 0.40
Nodes (8): confidenceFor(), isMastered(), masteryCount(), requiredMasteryCount(), DrugRow(), DrugRowProps, styles, LearningPath()

### Community 12 - "index.ts"
Cohesion: 0.13
Nodes (16): AddHubScreen(), AddRoute(), styles, Field(), Field(), CompareRow(), LibraryToolsScreen(), styles (+8 more)

### Community 13 - "backupPersistence.ts"
Cohesion: 0.25
Nodes (15): AtomicNotesScreen(), ChoiceChip(), styles, addAtomicNote(), AtomicDrugNote, atomicNoteDate(), AtomicNoteField, atomicNoteFields (+7 more)

### Community 14 - "Community 14"
Cohesion: 0.15
Nodes (14): BackupImageStorage, extensionFor(), mimeTypeFor(), safeSegment(), StagedBackupImage, BackupImageOwner, BackupImageRole, EmbeddedBackupImage (+6 more)

### Community 15 - "today.tsx"
Cohesion: 0.67
Nodes (4): ProviderSettingsEditor(), testDeepSeekConnection(), testModelList(), testOpenRouterConnection()

### Community 16 - "schema.ts"
Cohesion: 0.17
Nodes (22): AIImportScreen(), newProfile(), sectionPreview(), styles, AIImportField, AIImportFieldKey, aiImportFieldKeys, AIImportSection (+14 more)

### Community 17 - "drugRepository.ts"
Cohesion: 0.08
Nodes (18): arabicSearchText(), CountRow, DrugDeletionImpact, DrugListOptions, DrugRepository, DrugRow, ftsQuery(), ImageRow (+10 more)

### Community 18 - "practiceRepository.ts"
Cohesion: 0.27
Nodes (7): combinedTrainingReportsText(), csvEscape(), csvHeader, drugLibraryCSV(), reportDate(), drugBackupSchema, trainingReportBackupSchema

### Community 19 - "session.tsx"
Cohesion: 0.07
Nodes (52): CaptureScreen(), AddBrandScreen(), ProductEditor(), CountRow, ingredientNames(), repairLegacyProductAuthority(), CountRow, ImageUriRow (+44 more)

### Community 20 - "trainingRepository.ts"
Cohesion: 0.16
Nodes (11): breakdown(), CountRow, EncounterDraft, PayloadRow, ShiftReflection, summarizeTrainingAnalytics(), TrainingAnalytics, TrainingDashboard (+3 more)

### Community 21 - "Community 21"
Cohesion: 0.11
Nodes (18): scripts, android, e2e:maestro, export:android, export:ios, format, format:check, ios (+10 more)

### Community 22 - "trusted.tsx"
Cohesion: 0.10
Nodes (17): ProtectedField(), providerSettingsQueryKey, ProviderSettingsScreen(), styles, ToggleRow(), credentialKeys, credentialOperationTails, credentialRetryDelaysMs (+9 more)

### Community 23 - "providerClients.test.ts"
Cohesion: 0.16
Nodes (15): LearningRepository, LearningSummary, PayloadRow, LearningProfileBackup, adjustMemoryGrade(), applyReview(), initialMemoryItems(), masteryFieldForQuestion (+7 more)

### Community 24 - "diagnosticReport.ts"
Cohesion: 0.26
Nodes (11): appendCrashDiagnostic(), CrashDiagnostic, CrashDiagnosticInput, createCrashDiagnostic(), DiagnosticStorage, parseCrashDiagnostics(), safeComponentStack(), safeErrorName() (+3 more)

### Community 25 - "practiceEngine.ts"
Cohesion: 0.26
Nodes (12): EditBrandScreen(), DrugProfileScreen(), DrugPhotosScreen(), useDrug(), useDrugImageSources(), useDrugRepository(), useProduct(), useProductImageSources() (+4 more)

### Community 26 - ".prettierrc.json"
Cohesion: 0.40
Nodes (4): printWidth, semi, singleQuote, trailingComma

### Community 27 - "DrugBackup"
Cohesion: 0.12
Nodes (13): AtomicNoteCandidate, CachedPracticePack, DailyRefresh, firstAtomicNote(), libraryRevision(), MistakeVault, PackRow, PayloadRow (+5 more)

### Community 28 - "index.ts"
Cohesion: 0.09
Nodes (18): databaseOpenOptions, initializeDatabase(), errorText(), isRetryableDatabaseError(), retryableDatabaseMarkers, retryBusyDatabaseOperation(), DatabaseVersionError, migrateDatabase() (+10 more)

### Community 29 - "Community 29"
Cohesion: 0.15
Nodes (13): devDependencies, eslint, eslint-config-expo, expo-doctor, jest, jest-expo, prettier, react-test-renderer (+5 more)

### Community 30 - "learningRepository.ts"
Cohesion: 0.14
Nodes (22): DailyActivityBackup, buildWeeklyActivity(), FocusAction, FocusRecommendation, localDateKey(), recommendFocus(), WeeklyActivityDay, applyCompletedSession() (+14 more)

### Community 31 - "reviewScheduler.ts"
Cohesion: 0.16
Nodes (16): SaveDestination, styles, NoteField(), styles, styles, ChipProps, scopes, sorts (+8 more)

### Community 32 - "Community 32"
Cohesion: 0.15
Nodes (12): compilerOptions, exactOptionalPropertyTypes, noFallthroughCasesInSwitch, noImplicitOverride, noUncheckedIndexedAccess, paths, strict, types (+4 more)

### Community 33 - "_layout.tsx"
Cohesion: 0.20
Nodes (6): LoadingApp(), styles, DatabaseProvider(), AppProviders(), AppProvidersProps, ThemeProvider()

### Community 35 - "generateDeepSeekPracticePack"
Cohesion: 0.20
Nodes (21): answerMatches(), caseQuestions(), conciseFact(), counselingFact(), difficultyForMode(), displayName(), firstTradeName(), GeneratePracticeOptions (+13 more)

### Community 36 - "Community 36"
Cohesion: 0.16
Nodes (14): CachedPracticePackScreen(), styles, DailyRefreshScreen(), styles, PracticeSessionContent(), PracticeSessionScreen(), resolvePracticeMode(), styles (+6 more)

### Community 37 - "embeddedImages.ts"
Cohesion: 0.14
Nodes (14): styles, Chapter, chapters, fallbackQuests, styles, targetedQuests, LearningPathProps, offsets (+6 more)

### Community 38 - "Community 38"
Cohesion: 0.17
Nodes (4): DatabaseSync, node:sqlite, StatementResultingChanges, StatementSync

### Community 40 - "drugBackupSchema"
Cohesion: 0.12
Nodes (19): icons, AppTextProps, TextVariant, variants, EmptyStateProps, styles, AppIconName, Icon() (+11 more)

### Community 41 - "DrugBackup"
Cohesion: 0.21
Nodes (14): DrugBackup, CaptureService, ImageOwnerType, insertPreparedImages(), persistManipulatedImage(), PreparedCaptureImage, prepareImages(), rollbackPreparedImages() (+6 more)

### Community 42 - "ThemeProvider.tsx"
Cohesion: 0.31
Nodes (7): ThemeContext, ThemeContextValue, ThemeMode, themeSettingQueryKey, darkColors, lightColors, ThemeColors

### Community 43 - "parseBackup.ts"
Cohesion: 0.47
Nodes (3): fullBackup(), makeBackup(), makeDrug()

### Community 44 - "reviewScheduler.ts"
Cohesion: 0.13
Nodes (14): ClinicalRichText(), ClinicalTone, masteryItems, ProfileTopic, ProfileTopicBar(), profileTopics, Section(), SectionProps (+6 more)

### Community 45 - "queries.ts"
Cohesion: 0.39
Nodes (7): ChoiceGroup(), SettingRow(), styles, YouScreen(), learningQueryKeys, useLearningRepository(), useLearningSummary()

### Community 46 - "Community 46"
Cohesion: 0.25
Nodes (7): engines, node, main, name, packageManager, private, version

### Community 47 - "normalizeCredential"
Cohesion: 0.48
Nodes (5): normalizeCredential(), chatJSON(), errorDetail(), parseProviderJSON(), recognizePackageWithOpenRouter()

### Community 48 - "Community 48"
Cohesion: 0.11
Nodes (20): BackupValidationError, BackupValidationIssue, BackupRecordCounts, backupRecordCountsSchema, CURRENT_BACKUP_SCHEMA_VERSION, dailyActivityBackupSchema, dataArray, encounterBackupSchema (+12 more)

### Community 49 - "AppCrashBoundary.tsx"
Cohesion: 0.29
Nodes (6): AppCrashBoundaryProps, AppCrashBoundaryState, CrashRecovery(), CrashRecoveryProps, styles, formatCrashDiagnostic()

### Community 50 - "copy.ts"
Cohesion: 0.25
Nodes (4): copyFile, nativeAccessibilityTags, root, translatedAttributes

### Community 51 - "imagePipeline.ts"
Cohesion: 0.25
Nodes (5): DrugRelationshipItem, RelationshipRepository, RelationshipRow, DrugRelationshipBackup, drugRelationshipBackupSchema

### Community 52 - "useDrugList"
Cohesion: 0.30
Nodes (10): ReportEditor(), dateFromLegacy(), buildTrainingReport(), groupedCounts(), inPeriod(), masteredByChapter(), ReportEvidence, splitLines() (+2 more)

### Community 53 - "confirmedIdentity.ts"
Cohesion: 0.22
Nodes (13): newProfile(), packetText(), sources, styles, TrustedImportScreen(), applyConfirmedIdentity(), ConfirmedDrugIdentity, tradeNamesFromInput() (+5 more)

### Community 54 - "copy.ts"
Cohesion: 0.31
Nodes (7): arabicCopy, hasArabicCopy(), normalizedArabicCopy, translateCopy(), translateDynamicCopy(), deviceLanguage(), LocaleProvider()

### Community 61 - "fetchTrustedSourceDetails"
Cohesion: 0.32
Nodes (3): TrainingRepository, ShiftBackup, TrainingReportBackup

### Community 63 - "parseBackup.ts"
Cohesion: 0.13
Nodes (10): BackupPersistence, BackupRestoreMode, BackupRestoreSummary, BackupImportPreview, BackupService, StagedBackup, countsFor(), issuePath() (+2 more)

### Community 64 - "generateDeepSeekPracticePack"
Cohesion: 0.36
Nodes (9): difficulty(), generateDeepSeekPracticePack(), groundedFacts(), isGrounded(), localFive(), normalized(), providerQuestion(), questionType() (+1 more)

### Community 65 - "providerClients.test.ts"
Cohesion: 0.33
Nodes (4): generateDeepSeekDrugDraft(), parseAIDrugDraftPayload(), parsePackageRecognitionPayload(), ProviderFailure

### Community 66 - "consistency.ts"
Cohesion: 0.53
Nodes (4): normalizeDrugConsistency(), normalizedValue(), TargetUnit, unknown()

## Knowledge Gaps
- **385 isolated node(s):** `singleQuote`, `trailingComma`, `printWidth`, `semi`, `icons` (+380 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `DrugBackup` connect `DrugBackup` to `dose.tsx`, `providerClients.ts`, `Community 3`, `mergeDuplicateProfiles.ts`, `radii`, `backupService.ts`, `useLocale`, `useTheme`, `backupPersistence.ts`, `Community 14`, `schema.ts`, `drugRepository.ts`, `practiceRepository.ts`, `session.tsx`, `trainingRepository.ts`, `providerClients.test.ts`, `DrugBackup`, `learningRepository.ts`, `reviewScheduler.ts`, `generateDeepSeekPracticePack`, `embeddedImages.ts`, `parseBackup.ts`, `reviewScheduler.ts`, `Community 48`, `imagePipeline.ts`, `useDrugList`, `confirmedIdentity.ts`, `parseBackup.ts`, `consistency.ts`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Why does `useTheme()` connect `index.ts` to `dose.tsx`, `Community 3`, `mergeDuplicateProfiles.ts`, `notes.tsx`, `radii`, `index.tsx`, `useTheme`, `backupPersistence.ts`, `today.tsx`, `schema.ts`, `session.tsx`, `trusted.tsx`, `practiceEngine.ts`, `reviewScheduler.ts`, `Community 36`, `embeddedImages.ts`, `drugBackupSchema`, `ThemeProvider.tsx`, `reviewScheduler.ts`, `queries.ts`, `useDrugList`, `confirmedIdentity.ts`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Why does `dateFromLegacy()` connect `useDrugList` to `generateDeepSeekPracticePack`, `mergeDuplicateProfiles.ts`, `radii`, `backupService.ts`, `index.tsx`, `useTheme`, `reviewScheduler.ts`, `backupPersistence.ts`, `drugRepository.ts`, `practiceRepository.ts`, `session.tsx`, `providerClients.test.ts`, `practiceEngine.ts`, `DrugBackup`, `learningRepository.ts`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **What connects `singleQuote`, `trailingComma`, `printWidth` to the rest of the system?**
  _385 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dose.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1103448275862069 - nodes in this community are weakly interconnected._
- **Should `trustedSources.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09851551956815115 - nodes in this community are weakly interconnected._
- **Should `providerClients.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06050420168067227 - nodes in this community are weakly interconnected._