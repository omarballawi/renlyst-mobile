# Graph Report - renlyst-mobile  (2026-07-19)

## Corpus Check
- 175 files · ~93,879 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1201 nodes · 3433 edges · 57 communities (52 shown, 5 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 34 edges (avg confidence: 0.73)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `47dbe7dd`
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
- [[_COMMUNITY_copy.ts|copy.ts]]
- [[_COMMUNITY_useDrugList|useDrugList]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_DatabaseProvider.tsx|DatabaseProvider.tsx]]
- [[_COMMUNITY_parseBackup.ts|parseBackup.ts]]

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 126 edges
2. `useLocale()` - 61 edges
3. `DrugBackup` - 47 edges
4. `AppText()` - 47 edges
5. `spacing` - 44 edges
6. `radii` - 44 edges
7. `PressableScale()` - 42 edges
8. `dateFromLegacy()` - 41 edges
9. `Icon()` - 39 edges
10. `Screen()` - 38 edges

## Surprising Connections (you probably didn't know these)
- `CaptureScreen()` --indirect_call--> `drug()`  [INFERRED]
  app/capture.tsx → src/data/repositories/__tests__/trainingAnalytics.test.ts
- `ProfileTopicBar()` --calls--> `useTheme()`  [EXTRACTED]
  app/drug/[id].tsx → src/ui/theme/ThemeProvider.tsx
- `ClinicalRichText()` --calls--> `useTheme()`  [EXTRACTED]
  app/drug/[id].tsx → src/ui/theme/ThemeProvider.tsx
- `TextList()` --calls--> `useTheme()`  [EXTRACTED]
  app/drug/[id].tsx → src/ui/theme/ThemeProvider.tsx
- `Field()` --calls--> `useTheme()`  [EXTRACTED]
  app/drug/[id]/brand/[productID].tsx → src/ui/theme/ThemeProvider.tsx

## Import Cycles
- 3-file cycle: `src/domain/backup/index.ts -> src/domain/backup/mergeDuplicateProfiles.ts -> src/domain/drugs/identity.ts -> src/domain/backup/index.ts`

## Communities (57 total, 5 thin omitted)

### Community 0 - "dose.tsx"
Cohesion: 0.10
Nodes (23): DoseCalculatorScreen(), numberValue(), regimenSummary(), calculateDose(), DoseCalculationResult, DoseCalculatorError, DoseCalculatorErrorCode, DoseFormulaKind (+15 more)

### Community 1 - "trustedSources.ts"
Cohesion: 0.06
Nodes (66): newProfile(), packetText(), sources, styles, TrustedImportScreen(), applyConfirmedIdentity(), ConfirmedDrugIdentity, tradeNamesFromInput() (+58 more)

### Community 2 - "providerClients.ts"
Cohesion: 0.05
Nodes (60): ProviderSettingsEditor(), PracticeInteraction, QuestionDifficulty, normalizeCredential(), aiAdverseEffectSchema, aiBoolean, aiDoseRegimenSchema, aiDrugDraftSchema (+52 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (45): categoryColor(), categoryOrder, ClinicalSection(), DetailBlock(), EmptyValue(), InteractionRow(), PharmacologyMeter(), relatedProfileID() (+37 more)

### Community 4 - "Community 4"
Cohesion: 0.04
Nodes (46): dependencies, babel-preset-expo, date-fns, expo, expo-audio, expo-clipboard, expo-constants, expo-crypto (+38 more)

### Community 5 - "mergeDuplicateProfiles.ts"
Cohesion: 0.11
Nodes (27): AboutScreen(), styles, Field(), styles, Field(), ProductEditor(), styles, styles (+19 more)

### Community 6 - "notes.tsx"
Cohesion: 0.11
Nodes (20): bands, chapters, ChoiceField(), DrugEditorScreen(), editorSchema, EditorSection, editorSections, EditorValues (+12 more)

### Community 7 - "radii"
Cohesion: 0.10
Nodes (32): ImportCompleteScreen(), styles, CompareDrugsScreen(), CompareRow(), styles, Chapter, chapters, fallbackQuests (+24 more)

### Community 8 - "backupService.ts"
Cohesion: 0.21
Nodes (20): arabicSearchText(), countsFor(), existingDrugIDs(), ImageExportRow, ImageUriRow, insertImages(), nowISO(), PayloadRow (+12 more)

### Community 9 - "useLocale"
Cohesion: 0.16
Nodes (9): CountRow, ImageUriRow, ProductImageRow, ProductImageSource, ProductImageSourceRow, ProductListItem, ProductRepository, ProductRow (+1 more)

### Community 10 - "index.tsx"
Cohesion: 0.14
Nodes (25): NewEncounterScreen(), NoteField(), styles, ReportEditorScreen(), sections, styles, MasteryRadar(), polygonPoints() (+17 more)

### Community 11 - "useTheme"
Cohesion: 0.20
Nodes (18): DrugProfileScreen(), KnowledgeMapScreen(), focusButtons, styles, TodayScreen(), drug(), confidenceFor(), isMastered() (+10 more)

### Community 12 - "index.ts"
Cohesion: 0.10
Nodes (31): AddHubScreen(), AddRoute(), styles, Choice(), ToggleField(), Section(), Breakdown(), ReflectionField() (+23 more)

### Community 13 - "backupPersistence.ts"
Cohesion: 0.23
Nodes (16): AtomicNotesScreen(), ChoiceChip(), styles, addAtomicNote(), AtomicDrugNote, atomicNoteDate(), AtomicNoteField, atomicNoteFields (+8 more)

### Community 14 - "Community 14"
Cohesion: 0.15
Nodes (14): BackupImageStorage, extensionFor(), mimeTypeFor(), safeSegment(), StagedBackupImage, BackupImageOwner, BackupImageRole, EmbeddedBackupImage (+6 more)

### Community 15 - "today.tsx"
Cohesion: 0.23
Nodes (3): databaseWithSchema(), NodeSQLiteDatabase, statementArguments()

### Community 16 - "schema.ts"
Cohesion: 0.17
Nodes (21): AIImportScreen(), imageDataUrl(), newProfile(), sectionPreview(), styles, AIImportField, AIImportFieldKey, aiImportFieldKeys (+13 more)

### Community 17 - "drugRepository.ts"
Cohesion: 0.08
Nodes (18): arabicSearchText(), CountRow, DrugDeletionImpact, DrugListOptions, DrugRepository, DrugRow, ftsQuery(), ImageRow (+10 more)

### Community 18 - "practiceRepository.ts"
Cohesion: 0.33
Nodes (6): databaseOpenOptions, initializeDatabase(), errorText(), isRetryableDatabaseError(), retryableDatabaseMarkers, retryBusyDatabaseOperation()

### Community 19 - "session.tsx"
Cohesion: 0.11
Nodes (38): CaptureScreen(), AddBrandScreen(), canonicalFor(), DuplicateProfileMergeResult, earliest(), earliestNullable(), latest(), mergeDrug() (+30 more)

### Community 20 - "trainingRepository.ts"
Cohesion: 0.11
Nodes (15): breakdown(), CountRow, EncounterDraft, PayloadRow, ShiftReflection, summarizeTrainingAnalytics(), TrainingAnalytics, TrainingBreakdown (+7 more)

### Community 21 - "Community 21"
Cohesion: 0.05
Nodes (38): devDependencies, eslint, eslint-config-expo, expo-doctor, jest, jest-expo, prettier, react-test-renderer (+30 more)

### Community 22 - "trusted.tsx"
Cohesion: 0.13
Nodes (15): ProviderSettingsScreen(), credentialKeys, credentialOperationTails, credentialRetryDelaysMs, defaultProviderConfiguration, normalizeProviderConfiguration(), normalizeProviderSettingsSnapshot(), objectValue() (+7 more)

### Community 23 - "providerClients.test.ts"
Cohesion: 0.26
Nodes (10): adjustMemoryGrade(), applyReview(), initialMemoryItems(), masteryFieldForQuestion, MemoryItemState, MemoryReviewGrade, QuestionType, readMemoryItems() (+2 more)

### Community 24 - "diagnosticReport.ts"
Cohesion: 0.16
Nodes (18): AppCrashBoundaryProps, AppCrashBoundaryState, CrashRecovery(), CrashRecoveryProps, styles, appendCrashDiagnostic(), CrashDiagnostic, CrashDiagnosticInput (+10 more)

### Community 25 - "practiceEngine.ts"
Cohesion: 0.60
Nodes (5): EditBrandScreen(), useProduct(), useProductImageSources(), useProductRepository(), useProducts()

### Community 26 - ".prettierrc.json"
Cohesion: 0.40
Nodes (4): printWidth, semi, singleQuote, trailingComma

### Community 27 - "DrugBackup"
Cohesion: 0.10
Nodes (15): AtomicNoteCandidate, CachedPracticePack, DailyRefresh, firstAtomicNote(), libraryRevision(), MistakeVault, PackRow, PayloadRow (+7 more)

### Community 28 - "index.ts"
Cohesion: 0.18
Nodes (13): CountRow, ingredientNames(), repairLegacyProductAuthority(), DatabaseVersionError, migrateDatabase(), migrationSQLForPlatform(), pendingMigrations(), UserVersionRow (+5 more)

### Community 30 - "learningRepository.ts"
Cohesion: 0.15
Nodes (22): LearningRepository, LearningSummary, PayloadRow, DailyActivityBackup, LearningProfileBackup, buildWeeklyActivity(), FocusAction, FocusRecommendation (+14 more)

### Community 31 - "reviewScheduler.ts"
Cohesion: 0.12
Nodes (21): SaveDestination, styles, styles, styles, ProtectedField(), providerSettingsQueryKey, styles, ToggleRow() (+13 more)

### Community 32 - "Community 32"
Cohesion: 0.15
Nodes (12): compilerOptions, exactOptionalPropertyTypes, noFallthroughCasesInSwitch, noImplicitOverride, noUncheckedIndexedAccess, paths, strict, types (+4 more)

### Community 33 - "_layout.tsx"
Cohesion: 0.16
Nodes (9): LoadingApp(), styles, DatabaseProvider(), translateCopy(), deviceLanguage(), LocaleProvider(), AppProviders(), AppProvidersProps (+1 more)

### Community 35 - "generateDeepSeekPracticePack"
Cohesion: 0.20
Nodes (21): answerMatches(), caseQuestions(), conciseFact(), counselingFact(), difficultyForMode(), displayName(), firstTradeName(), GeneratePracticeOptions (+13 more)

### Community 36 - "Community 36"
Cohesion: 0.16
Nodes (8): defaultFeedbackPreferences, FeedbackPreferences, SettingsRepository, FeedbackContext, FeedbackContextValue, FeedbackProvider(), play(), appHaptics

### Community 37 - "embeddedImages.ts"
Cohesion: 0.67
Nodes (4): DrugPhotosScreen(), useDrug(), useDrugImageSources(), useDrugRepository()

### Community 38 - "Community 38"
Cohesion: 0.17
Nodes (4): DatabaseSync, node:sqlite, StatementResultingChanges, StatementSync

### Community 40 - "drugBackupSchema"
Cohesion: 0.11
Nodes (21): chapters, styles, LibraryToolsScreen(), styles, Tool(), chapters, styles, icons (+13 more)

### Community 41 - "DrugBackup"
Cohesion: 0.25
Nodes (13): DrugBackup, CaptureService, ImageOwnerType, insertPreparedImages(), persistManipulatedImage(), PreparedCaptureImage, prepareImages(), rollbackPreparedImages() (+5 more)

### Community 42 - "ThemeProvider.tsx"
Cohesion: 0.27
Nodes (8): settingKeys, ThemeContext, ThemeContextValue, ThemeMode, themeSettingQueryKey, darkColors, lightColors, ThemeColors

### Community 43 - "parseBackup.ts"
Cohesion: 0.17
Nodes (12): BackupValidationError, BackupValidationIssue, countsFor(), issuePath(), parseBackupJson(), serializeSwiftCompatibleBackup(), BackupRecordCounts, CURRENT_BACKUP_SCHEMA_VERSION (+4 more)

### Community 44 - "reviewScheduler.ts"
Cohesion: 0.12
Nodes (15): ClinicalRichText(), ClinicalTone, masteryItems, ProfileTopic, ProfileTopicBar(), profileTopics, SectionProps, styles (+7 more)

### Community 45 - "queries.ts"
Cohesion: 0.20
Nodes (11): BackupHistory, BackupScreen(), emptyHistory, styles, PracticeSessionContent(), PracticeSessionScreen(), resolvePracticeMode(), styles (+3 more)

### Community 48 - "Community 48"
Cohesion: 0.09
Nodes (22): DrugRelationshipItem, RelationshipRepository, RelationshipRow, backupRecordCountsSchema, dailyActivityBackupSchema, dataArray, drugBackupSchema, drugProductBackupSchema (+14 more)

### Community 50 - "copy.ts"
Cohesion: 0.16
Nodes (9): arabicCopy, hasArabicCopy(), normalizedArabicCopy, translateDynamicCopy(), AppLanguage, copyFile, nativeAccessibilityTags, root (+1 more)

### Community 52 - "useDrugList"
Cohesion: 0.30
Nodes (10): ReportEditor(), dateFromLegacy(), buildTrainingReport(), groupedCounts(), inPeriod(), masteredByChapter(), ReportEvidence, splitLines() (+2 more)

### Community 63 - "parseBackup.ts"
Cohesion: 0.13
Nodes (11): BackupPersistence, BackupRestoreMode, BackupRestoreSummary, BackupImportPreview, BackupService, StagedBackup, combinedTrainingReportsText(), csvEscape() (+3 more)

## Knowledge Gaps
- **393 isolated node(s):** `singleQuote`, `trailingComma`, `printWidth`, `semi`, `icons` (+388 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `DrugBackup` connect `DrugBackup` to `dose.tsx`, `trustedSources.ts`, `providerClients.ts`, `Community 3`, `mergeDuplicateProfiles.ts`, `radii`, `backupService.ts`, `useTheme`, `backupPersistence.ts`, `Community 14`, `schema.ts`, `drugRepository.ts`, `session.tsx`, `trainingRepository.ts`, `providerClients.test.ts`, `DrugBackup`, `index.ts`, `learningRepository.ts`, `reviewScheduler.ts`, `generateDeepSeekPracticePack`, `parseBackup.ts`, `reviewScheduler.ts`, `Community 48`, `useDrugList`, `parseBackup.ts`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **Why does `useTheme()` connect `index.ts` to `dose.tsx`, `trustedSources.ts`, `providerClients.ts`, `Community 3`, `mergeDuplicateProfiles.ts`, `notes.tsx`, `radii`, `index.tsx`, `useTheme`, `backupPersistence.ts`, `schema.ts`, `session.tsx`, `trusted.tsx`, `practiceEngine.ts`, `reviewScheduler.ts`, `embeddedImages.ts`, `drugBackupSchema`, `ThemeProvider.tsx`, `reviewScheduler.ts`, `queries.ts`, `useDrugList`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **Why does `spacing` connect `drugBackupSchema` to `trustedSources.ts`, `Community 3`, `mergeDuplicateProfiles.ts`, `notes.tsx`, `radii`, `index.tsx`, `useTheme`, `index.ts`, `queries.ts`, `reviewScheduler.ts`, `backupPersistence.ts`, `schema.ts`, `ThemeProvider.tsx`, `diagnosticReport.ts`, `reviewScheduler.ts`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **What connects `singleQuote`, `trailingComma`, `printWidth` to the rest of the system?**
  _393 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dose.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10461538461538461 - nodes in this community are weakly interconnected._
- **Should `trustedSources.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05570745044429255 - nodes in this community are weakly interconnected._
- **Should `providerClients.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05314685314685315 - nodes in this community are weakly interconnected._