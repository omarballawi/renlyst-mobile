# Graph Report - .  (2026-07-17)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1126 nodes · 3189 edges · 56 communities (52 shown, 4 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 32 edges (avg confidence: 0.74)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e87ca65a`
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
- [[_COMMUNITY_testDeepSeekConnection|testDeepSeekConnection]]
- [[_COMMUNITY_ThemeProvider.tsx|ThemeProvider.tsx]]
- [[_COMMUNITY_BackupPersistence|BackupPersistence]]
- [[_COMMUNITY_dateFromLegacy|dateFromLegacy]]
- [[_COMMUNITY_queries.ts|queries.ts]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_AppCrashBoundary.tsx|AppCrashBoundary.tsx]]
- [[_COMMUNITY_copy.ts|copy.ts]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 55|Community 55]]

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 122 edges
2. `useLocale()` - 51 edges
3. `DrugBackup` - 46 edges
4. `AppText()` - 46 edges
5. `spacing` - 44 edges
6. `radii` - 44 edges
7. `PressableScale()` - 42 edges
8. `dateFromLegacy()` - 41 edges
9. `Icon()` - 38 edges
10. `Screen()` - 38 edges

## Surprising Connections (you probably didn't know these)
- `Chip()` --calls--> `useTheme()`  [EXTRACTED]
  app/(tabs)/library.tsx → src/ui/theme/ThemeProvider.tsx
- `ModeRow()` --calls--> `useTheme()`  [EXTRACTED]
  app/(tabs)/practice.tsx → src/ui/theme/ThemeProvider.tsx
- `LearningTool()` --calls--> `useTheme()`  [EXTRACTED]
  app/(tabs)/practice.tsx → src/ui/theme/ThemeProvider.tsx
- `TodayScreen()` --indirect_call--> `drug()`  [INFERRED]
  app/(tabs)/today.tsx → src/data/repositories/__tests__/trainingAnalytics.test.ts
- `SettingRow()` --calls--> `useTheme()`  [EXTRACTED]
  app/(tabs)/you.tsx → src/ui/theme/ThemeProvider.tsx

## Import Cycles
- 3-file cycle: `src/domain/backup/index.ts -> src/domain/backup/mergeDuplicateProfiles.ts -> src/domain/drugs/identity.ts -> src/domain/backup/index.ts`

## Communities (56 total, 4 thin omitted)

### Community 0 - "dose.tsx"
Cohesion: 0.12
Nodes (25): Choice(), DoseCalculatorScreen(), numberValue(), regimenSummary(), styles, calculateDose(), DoseCalculationResult, DoseCalculatorError (+17 more)

### Community 1 - "trustedSources.ts"
Cohesion: 0.06
Nodes (55): newProfile(), packetText(), TrustedImportScreen(), applyTrustedImport(), availableTrustedImportFields(), availableTrustedImportSections(), commaList(), defaultTrustedImportSelection() (+47 more)

### Community 2 - "providerClients.ts"
Cohesion: 0.06
Nodes (32): aiAdverseEffectSchema, aiBoolean, aiDoseRegimenSchema, aiDrugDraftSchema, aiInteractionSchema, aiNumber, aiPracticeItemSchema, aiPracticePayloadSchema (+24 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (45): categoryColor(), categoryOrder, ClinicalSection(), DetailBlock(), EmptyValue(), InteractionRow(), PharmacologyMeter(), relatedProfileID() (+37 more)

### Community 4 - "Community 4"
Cohesion: 0.04
Nodes (46): dependencies, babel-preset-expo, date-fns, expo, expo-clipboard, expo-constants, expo-crypto, expo-document-picker (+38 more)

### Community 5 - "mergeDuplicateProfiles.ts"
Cohesion: 0.07
Nodes (52): CaptureScreen(), AddBrandScreen(), ProductEditor(), CountRow, ingredientNames(), repairLegacyProductAuthority(), CountRow, ImageUriRow (+44 more)

### Community 6 - "notes.tsx"
Cohesion: 0.08
Nodes (42): AtomicNotesScreen(), ChoiceChip(), styles, AIImportScreen(), newProfile(), sectionPreview(), AIImportField, AIImportFieldKey (+34 more)

### Community 7 - "radii"
Cohesion: 0.12
Nodes (20): AboutScreen(), styles, chapters, styles, LibraryToolsScreen(), styles, Tool(), EmptyState() (+12 more)

### Community 8 - "backupService.ts"
Cohesion: 0.17
Nodes (11): BackupRestoreMode, BackupRestoreSummary, BackupImportPreview, BackupImageStorage, bytesToHex(), extensionFor(), mimeTypeFor(), safeSegment() (+3 more)

### Community 9 - "useLocale"
Cohesion: 0.13
Nodes (19): BackupHistory, BackupScreen(), emptyHistory, styles, ToggleField(), icons, TabLayout(), AnimatedImage (+11 more)

### Community 10 - "index.tsx"
Cohesion: 0.12
Nodes (28): NewEncounterScreen(), NoteField(), styles, ReportEditor(), ReportEditorScreen(), sections, styles, MasteryRadar() (+20 more)

### Community 11 - "useTheme"
Cohesion: 0.10
Nodes (28): AddHubScreen(), AddRoute(), styles, Field(), CompareDrugsScreen(), CompareRow(), styles, Chapter (+20 more)

### Community 12 - "index.ts"
Cohesion: 0.16
Nodes (16): Field(), styles, styles, Chip(), ChipProps, scopes, sorts, styles (+8 more)

### Community 13 - "backupPersistence.ts"
Cohesion: 0.21
Nodes (20): arabicSearchText(), countsFor(), existingDrugIDs(), ImageExportRow, ImageUriRow, insertImages(), nowISO(), PayloadRow (+12 more)

### Community 14 - "Community 14"
Cohesion: 0.11
Nodes (20): bands, chapters, ChoiceField(), DrugEditorScreen(), editorSchema, EditorSection, editorSections, EditorValues (+12 more)

### Community 15 - "today.tsx"
Cohesion: 0.18
Nodes (16): LibraryScreen(), LearningTool(), ModeRow(), PracticeScreen(), styles, focusButtons, styles, TodayScreen() (+8 more)

### Community 16 - "schema.ts"
Cohesion: 0.11
Nodes (19): BackupValidationError, BackupValidationIssue, countsFor(), issuePath(), parseBackupJson(), serializeSwiftCompatibleBackup(), BackupRecordCounts, backupRecordCountsSchema (+11 more)

### Community 17 - "drugRepository.ts"
Cohesion: 0.08
Nodes (18): arabicSearchText(), CountRow, DrugDeletionImpact, DrugListOptions, DrugRepository, DrugRow, ftsQuery(), ImageRow (+10 more)

### Community 18 - "practiceRepository.ts"
Cohesion: 0.12
Nodes (13): AtomicNoteCandidate, CachedPracticePack, DailyRefresh, firstAtomicNote(), libraryRevision(), MistakeVault, PackRow, PayloadRow (+5 more)

### Community 19 - "session.tsx"
Cohesion: 0.15
Nodes (17): MistakeVaultScreen(), styles, CachedPracticePackScreen(), styles, DailyRefreshScreen(), styles, PracticeSessionContent(), PracticeSessionScreen() (+9 more)

### Community 20 - "trainingRepository.ts"
Cohesion: 0.14
Nodes (12): breakdown(), CountRow, EncounterDraft, PayloadRow, ShiftReflection, summarizeTrainingAnalytics(), TrainingAnalytics, TrainingDashboard (+4 more)

### Community 21 - "Community 21"
Cohesion: 0.11
Nodes (18): scripts, android, e2e:maestro, export:android, export:ios, format, format:check, ios (+10 more)

### Community 22 - "trusted.tsx"
Cohesion: 0.13
Nodes (18): SaveDestination, styles, styles, sources, styles, credentialKeys, defaultProviderConfiguration, ProviderConfiguration (+10 more)

### Community 23 - "providerClients.test.ts"
Cohesion: 0.22
Nodes (9): normalizeCredential(), chatJSON(), errorDetail(), generateDeepSeekDrugDraft(), parseAIDrugDraftPayload(), parsePackageRecognitionPayload(), parseProviderJSON(), ProviderFailure (+1 more)

### Community 24 - "diagnosticReport.ts"
Cohesion: 0.21
Nodes (14): appendCrashDiagnostic(), CrashDiagnostic, CrashDiagnosticInput, createCrashDiagnostic(), DiagnosticStorage, formatCrashDiagnostic(), parseCrashDiagnostics(), safeComponentStack() (+6 more)

### Community 25 - "practiceEngine.ts"
Cohesion: 0.19
Nodes (16): answerMatches(), caseQuestions(), difficulty(), displayName(), firstTradeName(), GeneratePracticeOptions, generatePracticeQuestions(), normalized() (+8 more)

### Community 26 - ".prettierrc.json"
Cohesion: 0.40
Nodes (4): printWidth, semi, singleQuote, trailingComma

### Community 27 - "DrugBackup"
Cohesion: 0.24
Nodes (13): DrugBackup, CaptureService, digestHex(), ImageOwnerType, insertPreparedImages(), persistManipulatedImage(), PreparedCaptureImage, prepareImages() (+5 more)

### Community 28 - "index.ts"
Cohesion: 0.09
Nodes (18): DatabaseVersionError, migrateDatabase(), migrationSQLForPlatform(), pendingMigrations(), UserVersionRow, DatabaseMigration, databaseMigrations, runExclusiveTransaction() (+10 more)

### Community 29 - "Community 29"
Cohesion: 0.15
Nodes (13): devDependencies, eslint, eslint-config-expo, expo-doctor, jest, jest-expo, prettier, react-test-renderer (+5 more)

### Community 30 - "learningRepository.ts"
Cohesion: 0.13
Nodes (25): LearningRepository, LearningSummary, PayloadRow, DailyActivityBackup, dailyActivityBackupSchema, LearningProfileBackup, learningProfileBackupSchema, reviewBackupSchema (+17 more)

### Community 31 - "reviewScheduler.ts"
Cohesion: 0.13
Nodes (24): DrugProfileScreen(), KnowledgeMapScreen(), ReviewBackup, confidenceFor(), masteryCount(), MasteryField, masteryFields, requiredMasteryCount() (+16 more)

### Community 32 - "Community 32"
Cohesion: 0.15
Nodes (12): compilerOptions, exactOptionalPropertyTypes, noFallthroughCasesInSwitch, noImplicitOverride, noUncheckedIndexedAccess, paths, strict, types (+4 more)

### Community 33 - "_layout.tsx"
Cohesion: 0.18
Nodes (9): LoadingApp(), styles, DatabaseProvider(), CrashRecovery(), translateCopy(), deviceLanguage(), LocaleProvider(), AppProviders() (+1 more)

### Community 35 - "generateDeepSeekPracticePack"
Cohesion: 0.36
Nodes (9): difficulty(), generateDeepSeekPracticePack(), groundedFacts(), isGrounded(), localFive(), normalized(), providerQuestion(), questionType() (+1 more)

### Community 36 - "Community 36"
Cohesion: 0.32
Nodes (3): TrainingRepository, ShiftBackup, TrainingReportBackup

### Community 37 - "embeddedImages.ts"
Cohesion: 0.32
Nodes (7): BackupImageOwner, BackupImageRole, EmbeddedBackupImage, ExtractedBackupImages, extractEmbeddedImages(), extractRecordImages(), withoutEmbeddedImages()

### Community 38 - "Community 38"
Cohesion: 0.17
Nodes (4): DatabaseSync, node:sqlite, StatementResultingChanges, StatementSync

### Community 40 - "drugBackupSchema"
Cohesion: 0.19
Nodes (8): BackupService, combinedTrainingReportsText(), csvEscape(), csvHeader, drugLibraryCSV(), reportDate(), drugBackupSchema, trainingReportBackupSchema

### Community 41 - "testDeepSeekConnection"
Cohesion: 0.67
Nodes (4): ProviderSettingsEditor(), testDeepSeekConnection(), testModelList(), testOpenRouterConnection()

### Community 42 - "ThemeProvider.tsx"
Cohesion: 0.27
Nodes (8): ThemeContext, ThemeContextValue, ThemeMode, ThemeProvider(), themeSettingQueryKey, darkColors, lightColors, ThemeColors

### Community 44 - "dateFromLegacy"
Cohesion: 0.21
Nodes (14): drug(), isMastered(), recommendFocus(), hasMasteredClass(), dateFromLegacy(), buildTrainingReport(), groupedCounts(), inPeriod() (+6 more)

### Community 45 - "queries.ts"
Cohesion: 0.15
Nodes (24): EditBrandScreen(), styles, masteryItems, DrugPhotosScreen(), styles, Section(), SectionProps, styles (+16 more)

### Community 46 - "Community 46"
Cohesion: 0.25
Nodes (7): engines, node, main, name, packageManager, private, version

### Community 48 - "Community 48"
Cohesion: 0.25
Nodes (5): DrugRelationshipItem, RelationshipRepository, RelationshipRow, DrugRelationshipBackup, drugRelationshipBackupSchema

### Community 49 - "AppCrashBoundary.tsx"
Cohesion: 0.33
Nodes (4): AppCrashBoundaryProps, AppCrashBoundaryState, CrashRecoveryProps, styles

### Community 50 - "copy.ts"
Cohesion: 0.16
Nodes (9): arabicCopy, hasArabicCopy(), normalizedArabicCopy, translateDynamicCopy(), AppLanguage, copyFile, nativeAccessibilityTags, root (+1 more)

## Knowledge Gaps
- **373 isolated node(s):** `singleQuote`, `trailingComma`, `printWidth`, `semi`, `icons` (+368 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `useTheme` to `dose.tsx`, `trustedSources.ts`, `Community 3`, `mergeDuplicateProfiles.ts`, `notes.tsx`, `radii`, `useLocale`, `index.tsx`, `testDeepSeekConnection`, `index.ts`, `queries.ts`, `Community 14`, `today.tsx`, `ThemeProvider.tsx`, `session.tsx`, `trusted.tsx`, `reviewScheduler.ts`?**
  _High betweenness centrality (0.098) - this node is a cross-community bridge._
- **Why does `DrugBackup` connect `DrugBackup` to `dose.tsx`, `trustedSources.ts`, `providerClients.ts`, `Community 3`, `mergeDuplicateProfiles.ts`, `notes.tsx`, `useTheme`, `index.ts`, `backupPersistence.ts`, `schema.ts`, `drugRepository.ts`, `practiceRepository.ts`, `trainingRepository.ts`, `trusted.tsx`, `practiceEngine.ts`, `index.ts`, `learningRepository.ts`, `reviewScheduler.ts`, `embeddedImages.ts`, `drugBackupSchema`, `BackupPersistence`, `dateFromLegacy`, `queries.ts`, `Community 48`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Why does `dateFromLegacy()` connect `dateFromLegacy` to `mergeDuplicateProfiles.ts`, `notes.tsx`, `drugBackupSchema`, `useLocale`, `index.tsx`, `index.ts`, `queries.ts`, `backupPersistence.ts`, `drugRepository.ts`, `practiceRepository.ts`, `session.tsx`, `practiceEngine.ts`, `learningRepository.ts`, `reviewScheduler.ts`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **What connects `singleQuote`, `trailingComma`, `printWidth` to the rest of the system?**
  _373 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dose.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11576354679802955 - nodes in this community are weakly interconnected._
- **Should `trustedSources.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06284153005464481 - nodes in this community are weakly interconnected._
- **Should `providerClients.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06439393939393939 - nodes in this community are weakly interconnected._