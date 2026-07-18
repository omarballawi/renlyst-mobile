# Graph Report - renlyst-mobile  (2026-07-19)

## Corpus Check
- 172 files · ~91,029 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1174 nodes · 3349 edges · 62 communities (59 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 32 edges (avg confidence: 0.74)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d3086c90`
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

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 126 edges
2. `useLocale()` - 57 edges
3. `AppText()` - 47 edges
4. `DrugBackup` - 46 edges
5. `spacing` - 44 edges
6. `radii` - 44 edges
7. `PressableScale()` - 42 edges
8. `dateFromLegacy()` - 41 edges
9. `Icon()` - 39 edges
10. `Screen()` - 38 edges

## Surprising Connections (you probably didn't know these)
- `Chip()` --calls--> `useTheme()`  [EXTRACTED]
  app/(tabs)/library.tsx → src/ui/theme/ThemeProvider.tsx
- `ModeRow()` --calls--> `useTheme()`  [EXTRACTED]
  app/(tabs)/practice.tsx → src/ui/theme/ThemeProvider.tsx
- `LearningTool()` --calls--> `useTheme()`  [EXTRACTED]
  app/(tabs)/practice.tsx → src/ui/theme/ThemeProvider.tsx
- `SettingRow()` --calls--> `useTheme()`  [EXTRACTED]
  app/(tabs)/you.tsx → src/ui/theme/ThemeProvider.tsx
- `ChoiceGroup()` --calls--> `useTheme()`  [EXTRACTED]
  app/(tabs)/you.tsx → src/ui/theme/ThemeProvider.tsx

## Import Cycles
- 3-file cycle: `src/domain/backup/index.ts -> src/domain/backup/mergeDuplicateProfiles.ts -> src/domain/drugs/identity.ts -> src/domain/backup/index.ts`

## Communities (62 total, 3 thin omitted)

### Community 0 - "dose.tsx"
Cohesion: 0.12
Nodes (25): Choice(), DoseCalculatorScreen(), numberValue(), regimenSummary(), styles, calculateDose(), DoseCalculationResult, DoseCalculatorError (+17 more)

### Community 1 - "trustedSources.ts"
Cohesion: 0.11
Nodes (27): altibbiSlug(), checkedJSON(), checkedText(), dailyMedSearchSchema, dailyMedTitle(), decodeHTML(), escapeOpenFDA(), FetchLike (+19 more)

### Community 2 - "providerClients.ts"
Cohesion: 0.06
Nodes (42): PracticeInteraction, QuestionDifficulty, aiAdverseEffectSchema, aiBoolean, aiDoseRegimenSchema, aiDrugDraftSchema, aiInteractionSchema, aiNumber (+34 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (45): categoryColor(), categoryOrder, ClinicalSection(), DetailBlock(), EmptyValue(), InteractionRow(), PharmacologyMeter(), relatedProfileID() (+37 more)

### Community 4 - "Community 4"
Cohesion: 0.04
Nodes (45): dependencies, babel-preset-expo, date-fns, expo, expo-clipboard, expo-constants, expo-crypto, expo-document-picker (+37 more)

### Community 5 - "mergeDuplicateProfiles.ts"
Cohesion: 0.11
Nodes (26): BackupHistory, BackupScreen(), emptyHistory, styles, styles, settingKeys, EditorTransform, ImageEditor() (+18 more)

### Community 6 - "notes.tsx"
Cohesion: 0.10
Nodes (21): bands, chapters, ChoiceField(), DrugEditorScreen(), editorSchema, EditorSection, editorSections, EditorValues (+13 more)

### Community 7 - "radii"
Cohesion: 0.22
Nodes (13): LibraryScreen(), LearningTool(), ModeRow(), PracticeScreen(), styles, ChoiceGroup(), SettingRow(), styles (+5 more)

### Community 8 - "backupService.ts"
Cohesion: 0.21
Nodes (20): arabicSearchText(), countsFor(), existingDrugIDs(), ImageExportRow, ImageUriRow, insertImages(), nowISO(), PayloadRow (+12 more)

### Community 9 - "useLocale"
Cohesion: 0.13
Nodes (24): newProfile(), packetText(), sources, styles, TrustedImportScreen(), applyTrustedImport(), availableTrustedImportFields(), availableTrustedImportSections() (+16 more)

### Community 10 - "index.tsx"
Cohesion: 0.12
Nodes (26): NewEncounterScreen(), NoteField(), styles, ReportEditorScreen(), sections, styles, Breakdown(), MasteryRadar() (+18 more)

### Community 11 - "useTheme"
Cohesion: 0.11
Nodes (23): CompareDrugsScreen(), chapters, KnowledgeMapScreen(), styles, Chip(), ChipProps, scopes, sorts (+15 more)

### Community 12 - "index.ts"
Cohesion: 0.27
Nodes (6): PracticeSessionContent(), PracticeSessionScreen(), resolvePracticeMode(), styles, isPracticeMode(), appHaptics

### Community 13 - "backupPersistence.ts"
Cohesion: 0.06
Nodes (64): CaptureScreen(), AddBrandScreen(), Field(), styles, EditBrandScreen(), Field(), ProductEditor(), styles (+56 more)

### Community 14 - "Community 14"
Cohesion: 0.09
Nodes (20): BackupPersistence, BackupRestoreMode, BackupRestoreSummary, BackupImportPreview, BackupService, BackupImageStorage, extensionFor(), mimeTypeFor() (+12 more)

### Community 15 - "today.tsx"
Cohesion: 0.13
Nodes (24): AboutScreen(), styles, AddHubScreen(), AddRoute(), styles, LibraryToolsScreen(), styles, Tool() (+16 more)

### Community 16 - "schema.ts"
Cohesion: 0.20
Nodes (19): AIImportScreen(), newProfile(), sectionPreview(), styles, AIImportField, AIImportFieldKey, aiImportFieldKeys, AIImportSection (+11 more)

### Community 17 - "drugRepository.ts"
Cohesion: 0.11
Nodes (16): CountRow, DrugDeletionImpact, DrugListOptions, DrugRow, ftsQuery(), ImageRow, ImageUriRow, LibraryScope (+8 more)

### Community 18 - "practiceRepository.ts"
Cohesion: 0.38
Nodes (5): combinedTrainingReportsText(), csvEscape(), csvHeader, drugLibraryCSV(), reportDate()

### Community 19 - "session.tsx"
Cohesion: 0.19
Nodes (24): ReportEditor(), canonicalFor(), DuplicateProfileMergeResult, earliest(), earliestNullable(), latest(), mergeDrug(), mergeDuplicateProfiles() (+16 more)

### Community 20 - "trainingRepository.ts"
Cohesion: 0.09
Nodes (23): breakdown(), CountRow, EncounterDraft, PayloadRow, ShiftReflection, summarizeTrainingAnalytics(), TrainingAnalytics, TrainingBreakdown (+15 more)

### Community 21 - "Community 21"
Cohesion: 0.11
Nodes (18): scripts, android, e2e:maestro, export:android, export:ios, format, format:check, ios (+10 more)

### Community 22 - "trusted.tsx"
Cohesion: 0.11
Nodes (11): credentialKeys, credentialOperationTails, credentialRetryDelaysMs, defaultProviderConfiguration, ProviderConfiguration, ProviderCredential, ProviderCredentialValues, SettingRow (+3 more)

### Community 23 - "providerClients.test.ts"
Cohesion: 0.16
Nodes (12): LearningRepository, LearningSummary, PayloadRow, dailyActivityBackupSchema, LearningProfileBackup, learningProfileBackupSchema, reviewBackupSchema, CompletedSession (+4 more)

### Community 24 - "diagnosticReport.ts"
Cohesion: 0.26
Nodes (11): appendCrashDiagnostic(), CrashDiagnostic, CrashDiagnosticInput, createCrashDiagnostic(), DiagnosticStorage, parseCrashDiagnostics(), safeComponentStack(), safeErrorName() (+3 more)

### Community 25 - "practiceEngine.ts"
Cohesion: 0.16
Nodes (9): CountRow, ImageUriRow, ProductImageRow, ProductImageSource, ProductImageSourceRow, ProductListItem, ProductRepository, ProductRow (+1 more)

### Community 26 - ".prettierrc.json"
Cohesion: 0.40
Nodes (4): printWidth, semi, singleQuote, trailingComma

### Community 27 - "DrugBackup"
Cohesion: 0.11
Nodes (14): AtomicNoteCandidate, CachedPracticePack, DailyRefresh, firstAtomicNote(), libraryRevision(), MistakeVault, PackRow, PayloadRow (+6 more)

### Community 28 - "index.ts"
Cohesion: 0.19
Nodes (12): CountRow, ingredientNames(), repairLegacyProductAuthority(), DatabaseVersionError, migrateDatabase(), migrationSQLForPlatform(), pendingMigrations(), UserVersionRow (+4 more)

### Community 29 - "Community 29"
Cohesion: 0.15
Nodes (13): devDependencies, eslint, eslint-config-expo, expo-doctor, jest, jest-expo, prettier, react-test-renderer (+5 more)

### Community 30 - "learningRepository.ts"
Cohesion: 0.17
Nodes (18): DailyActivityBackup, ReviewBackup, buildWeeklyActivity(), FocusAction, FocusRecommendation, localDateKey(), WeeklyActivityDay, applyCompletedSession() (+10 more)

### Community 31 - "reviewScheduler.ts"
Cohesion: 0.18
Nodes (14): SaveDestination, styles, styles, chapters, DrugChapter, quickClasses, styles, PackageRecognition (+6 more)

### Community 32 - "Community 32"
Cohesion: 0.15
Nodes (12): compilerOptions, exactOptionalPropertyTypes, noFallthroughCasesInSwitch, noImplicitOverride, noUncheckedIndexedAccess, paths, strict, types (+4 more)

### Community 33 - "_layout.tsx"
Cohesion: 0.18
Nodes (7): LoadingApp(), styles, DatabaseProvider(), deviceLanguage(), LocaleProvider(), AppProviders(), AppProvidersProps

### Community 35 - "generateDeepSeekPracticePack"
Cohesion: 0.18
Nodes (22): answerMatches(), caseQuestions(), conciseFact(), counselingFact(), difficultyForMode(), displayName(), firstTradeName(), GeneratePracticeOptions (+14 more)

### Community 36 - "Community 36"
Cohesion: 0.14
Nodes (21): ImportCompleteScreen(), styles, CompareRow(), styles, MistakeVaultScreen(), styles, CachedPracticePackScreen(), styles (+13 more)

### Community 38 - "Community 38"
Cohesion: 0.17
Nodes (4): DatabaseSync, node:sqlite, StatementResultingChanges, StatementSync

### Community 40 - "drugBackupSchema"
Cohesion: 0.20
Nodes (10): icons, TabLayout(), EmptyStateProps, styles, AppIconName, Icon(), iconMap, IconProps (+2 more)

### Community 41 - "DrugBackup"
Cohesion: 0.29
Nodes (11): DrugBackup, CaptureImageAsset, CaptureService, ImageOwnerType, insertPreparedImages(), persistManipulatedImage(), PreparedCaptureImage, prepareImages() (+3 more)

### Community 42 - "ThemeProvider.tsx"
Cohesion: 0.27
Nodes (8): ThemeContext, ThemeContextValue, ThemeMode, ThemeProvider(), themeSettingQueryKey, darkColors, lightColors, ThemeColors

### Community 43 - "parseBackup.ts"
Cohesion: 0.26
Nodes (6): BackupValidationError, fullBackup(), mastered, now, makeBackup(), makeDrug()

### Community 44 - "reviewScheduler.ts"
Cohesion: 0.29
Nodes (10): confidenceFor(), masteryCount(), MasteryField, adjustMemoryGrade(), applyReview(), initialMemoryItems(), masteryFieldForQuestion, MemoryItemState (+2 more)

### Community 45 - "queries.ts"
Cohesion: 0.23
Nodes (3): databaseWithSchema(), NodeSQLiteDatabase, statementArguments()

### Community 46 - "Community 46"
Cohesion: 0.25
Nodes (7): engines, node, main, name, packageManager, private, version

### Community 47 - "normalizeCredential"
Cohesion: 0.22
Nodes (9): normalizeCredential(), chatJSON(), errorDetail(), generateDeepSeekDrugDraft(), parseAIDrugDraftPayload(), parsePackageRecognitionPayload(), parseProviderJSON(), ProviderFailure (+1 more)

### Community 48 - "Community 48"
Cohesion: 0.08
Nodes (26): DrugRelationshipItem, RelationshipRepository, RelationshipRow, BackupValidationIssue, countsFor(), issuePath(), parseBackupJson(), serializeSwiftCompatibleBackup() (+18 more)

### Community 49 - "AppCrashBoundary.tsx"
Cohesion: 0.16
Nodes (8): AppCrashBoundary, AppCrashBoundaryProps, AppCrashBoundaryState, CrashRecovery(), CrashRecoveryProps, styles, formatCrashDiagnostic(), saveCrashDiagnostic()

### Community 50 - "copy.ts"
Cohesion: 0.25
Nodes (4): copyFile, nativeAccessibilityTags, root, translatedAttributes

### Community 51 - "imagePipeline.ts"
Cohesion: 0.80
Nodes (3): centerCrop(), editorResizeActions(), persistenceActions()

### Community 52 - "useDrugList"
Cohesion: 0.18
Nodes (11): Chapter, chapters, fallbackQuests, ShelfQuestScreen(), styles, targetedQuests, chapters, styles (+3 more)

### Community 53 - "confirmedIdentity.ts"
Cohesion: 0.30
Nodes (8): applyConfirmedIdentity(), ConfirmedDrugIdentity, tradeNamesFromInput(), unique(), normalizeDrugConsistency(), normalizedValue(), TargetUnit, unknown()

### Community 54 - "copy.ts"
Cohesion: 0.36
Nodes (6): arabicCopy, hasArabicCopy(), normalizedArabicCopy, translateCopy(), translateDynamicCopy(), AppLanguage

### Community 60 - "DatabaseProvider.tsx"
Cohesion: 0.33
Nodes (6): databaseOpenOptions, initializeDatabase(), errorText(), isRetryableDatabaseError(), retryableDatabaseMarkers, retryBusyDatabaseOperation()

### Community 61 - "fetchTrustedSourceDetails"
Cohesion: 0.36
Nodes (9): buildTrustedPacket(), compact(), fetchTrustedSourceDetails(), firstAttribute(), nodeText(), openFDAPacket(), parseDailyMedSPL(), walkXML() (+1 more)

## Knowledge Gaps
- **385 isolated node(s):** `singleQuote`, `trailingComma`, `printWidth`, `semi`, `icons` (+380 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `today.tsx` to `dose.tsx`, `Community 3`, `Community 36`, `mergeDuplicateProfiles.ts`, `notes.tsx`, `radii`, `drugBackupSchema`, `useLocale`, `index.tsx`, `useTheme`, `index.ts`, `backupPersistence.ts`, `ThemeProvider.tsx`, `schema.ts`, `session.tsx`, `useDrugList`, `reviewScheduler.ts`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **Why does `DrugBackup` connect `DrugBackup` to `dose.tsx`, `providerClients.ts`, `Community 3`, `backupService.ts`, `useLocale`, `useTheme`, `backupPersistence.ts`, `Community 14`, `schema.ts`, `drugRepository.ts`, `practiceRepository.ts`, `session.tsx`, `trainingRepository.ts`, `DrugBackup`, `index.ts`, `learningRepository.ts`, `reviewScheduler.ts`, `generateDeepSeekPracticePack`, `Community 36`, `embeddedImages.ts`, `parseBackup.ts`, `reviewScheduler.ts`, `Community 48`, `confirmedIdentity.ts`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Why does `dateFromLegacy()` connect `session.tsx` to `generateDeepSeekPracticePack`, `Community 36`, `mergeDuplicateProfiles.ts`, `embeddedImages.ts`, `backupService.ts`, `index.tsx`, `useTheme`, `reviewScheduler.ts`, `backupPersistence.ts`, `drugRepository.ts`, `practiceRepository.ts`, `trainingRepository.ts`, `DrugBackup`, `learningRepository.ts`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **What connects `singleQuote`, `trailingComma`, `printWidth` to the rest of the system?**
  _385 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dose.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11576354679802955 - nodes in this community are weakly interconnected._
- **Should `trustedSources.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10804597701149425 - nodes in this community are weakly interconnected._
- **Should `providerClients.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06312292358803986 - nodes in this community are weakly interconnected._