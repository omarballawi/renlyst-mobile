# Graph Report - renlyst-mobile  (2026-07-18)

## Corpus Check
- 169 files · ~90,530 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1168 nodes · 3336 edges · 58 communities (55 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 32 edges (avg confidence: 0.74)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4ea00ada`
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
- [[_COMMUNITY_imagePipeline.ts|imagePipeline.ts]]
- [[_COMMUNITY_copy.ts|copy.ts]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_consistency.ts|consistency.ts]]

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
- `TodayScreen()` --indirect_call--> `drug()`  [INFERRED]
  app/(tabs)/today.tsx → src/data/repositories/__tests__/trainingAnalytics.test.ts
- `LoadingApp()` --calls--> `translateCopy()`  [EXTRACTED]
  app/_layout.tsx → src/localization/copy.ts
- `AboutScreen()` --calls--> `useTheme()`  [EXTRACTED]
  app/about.tsx → src/ui/theme/ThemeProvider.tsx
- `AddRoute()` --calls--> `useTheme()`  [EXTRACTED]
  app/add.tsx → src/ui/theme/ThemeProvider.tsx
- `AddHubScreen()` --calls--> `useTheme()`  [EXTRACTED]
  app/add.tsx → src/ui/theme/ThemeProvider.tsx

## Import Cycles
- 3-file cycle: `src/domain/backup/index.ts -> src/domain/backup/mergeDuplicateProfiles.ts -> src/domain/drugs/identity.ts -> src/domain/backup/index.ts`

## Communities (58 total, 3 thin omitted)

### Community 0 - "dose.tsx"
Cohesion: 0.06
Nodes (39): ClinicalRichText(), ClinicalTone, Choice(), DoseCalculatorScreen(), numberValue(), regimenSummary(), styles, masteryItems (+31 more)

### Community 1 - "trustedSources.ts"
Cohesion: 0.09
Nodes (37): altibbiSlug(), buildTrustedPacket(), checkedJSON(), checkedText(), compact(), dailyMedSearchSchema, dailyMedTitle(), decodeHTML() (+29 more)

### Community 2 - "providerClients.ts"
Cohesion: 0.06
Nodes (34): PracticeInteraction, QuestionDifficulty, aiAdverseEffectSchema, aiBoolean, aiDoseRegimenSchema, aiDrugDraftSchema, aiInteractionSchema, aiNumber (+26 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (45): categoryColor(), categoryOrder, ClinicalSection(), DetailBlock(), EmptyValue(), InteractionRow(), PharmacologyMeter(), relatedProfileID() (+37 more)

### Community 4 - "Community 4"
Cohesion: 0.04
Nodes (46): dependencies, babel-preset-expo, date-fns, expo, expo-clipboard, expo-constants, expo-crypto, expo-document-picker (+38 more)

### Community 5 - "mergeDuplicateProfiles.ts"
Cohesion: 0.16
Nodes (19): CaptureScreen(), AddBrandScreen(), ProductEditor(), brandDraftFor(), BrandMutationError, BrandMutationErrorCode, BrandProductDraft, BrandProductEditDraft (+11 more)

### Community 6 - "notes.tsx"
Cohesion: 0.20
Nodes (19): AIImportScreen(), newProfile(), sectionPreview(), styles, AIImportField, AIImportFieldKey, aiImportFieldKeys, AIImportSection (+11 more)

### Community 7 - "radii"
Cohesion: 0.08
Nodes (33): BackupHistory, BackupScreen(), emptyHistory, styles, ToggleField(), Section(), icons, TabLayout() (+25 more)

### Community 8 - "backupService.ts"
Cohesion: 0.14
Nodes (15): BackupImageStorage, extensionFor(), mimeTypeFor(), safeSegment(), StagedBackupImage, BackupImageOwner, BackupImageRole, EmbeddedBackupImage (+7 more)

### Community 9 - "useLocale"
Cohesion: 0.19
Nodes (16): Field(), styles, EditBrandScreen(), Field(), styles, styles, CaptureImageAsset, AnimatedImage (+8 more)

### Community 10 - "index.tsx"
Cohesion: 0.14
Nodes (25): ReportEditorScreen(), sections, styles, Breakdown(), MasteryRadar(), polygonPoints(), radarLabels, radarPoint() (+17 more)

### Community 11 - "useTheme"
Cohesion: 0.08
Nodes (38): AboutScreen(), styles, NewEncounterScreen(), ImportCompleteScreen(), styles, CompareDrugsScreen(), CompareRow(), styles (+30 more)

### Community 12 - "index.ts"
Cohesion: 0.13
Nodes (22): SaveDestination, styles, NoteField(), styles, CachedPracticePackScreen(), styles, ProtectedField(), ProviderSettingsEditor() (+14 more)

### Community 13 - "backupPersistence.ts"
Cohesion: 0.21
Nodes (20): arabicSearchText(), countsFor(), existingDrugIDs(), ImageExportRow, ImageUriRow, insertImages(), nowISO(), PayloadRow (+12 more)

### Community 14 - "Community 14"
Cohesion: 0.11
Nodes (20): bands, chapters, ChoiceField(), DrugEditorScreen(), editorSchema, EditorSection, editorSections, EditorValues (+12 more)

### Community 15 - "today.tsx"
Cohesion: 0.15
Nodes (26): Chip(), ChipProps, LibraryScreen(), scopes, sorts, styles, LearningTool(), ModeRow() (+18 more)

### Community 16 - "schema.ts"
Cohesion: 0.19
Nodes (9): BackupValidationError, BackupValidationIssue, countsFor(), issuePath(), parseBackupJson(), serializeSwiftCompatibleBackup(), BackupRecordCounts, CURRENT_BACKUP_SCHEMA_VERSION (+1 more)

### Community 17 - "drugRepository.ts"
Cohesion: 0.08
Nodes (18): arabicSearchText(), CountRow, DrugDeletionImpact, DrugListOptions, DrugRepository, DrugRow, ftsQuery(), ImageRow (+10 more)

### Community 18 - "practiceRepository.ts"
Cohesion: 0.19
Nodes (20): AtomicNotesScreen(), ChoiceChip(), styles, DrugPhotosScreen(), addAtomicNote(), AtomicDrugNote, atomicNoteDate(), AtomicNoteField (+12 more)

### Community 19 - "session.tsx"
Cohesion: 0.30
Nodes (14): DuplicateProfileMergeResult, earliest(), earliestNullable(), latest(), mergeDrug(), mergeDuplicateProfiles(), mergeJSONArrays(), mergeProduct() (+6 more)

### Community 20 - "trainingRepository.ts"
Cohesion: 0.12
Nodes (14): breakdown(), CountRow, EncounterDraft, PayloadRow, ShiftReflection, summarizeTrainingAnalytics(), TrainingAnalytics, TrainingDashboard (+6 more)

### Community 21 - "Community 21"
Cohesion: 0.11
Nodes (18): scripts, android, e2e:maestro, export:android, export:ios, format, format:check, ios (+10 more)

### Community 22 - "trusted.tsx"
Cohesion: 0.20
Nodes (7): credentialKeys, credentialOperationTails, ProviderCredential, ProviderCredentialValues, SettingRow, keys, mockCredentialValues

### Community 23 - "providerClients.test.ts"
Cohesion: 0.15
Nodes (22): newProfile(), packetText(), sources, styles, TrustedImportScreen(), applyTrustedImport(), availableTrustedImportFields(), availableTrustedImportSections() (+14 more)

### Community 24 - "diagnosticReport.ts"
Cohesion: 0.23
Nodes (12): appendCrashDiagnostic(), CrashDiagnostic, CrashDiagnosticInput, createCrashDiagnostic(), DiagnosticStorage, parseCrashDiagnostics(), safeComponentStack(), safeErrorName() (+4 more)

### Community 25 - "practiceEngine.ts"
Cohesion: 0.16
Nodes (9): CountRow, ImageUriRow, ProductImageRow, ProductImageSource, ProductImageSourceRow, ProductListItem, ProductRepository, ProductRow (+1 more)

### Community 26 - ".prettierrc.json"
Cohesion: 0.40
Nodes (4): printWidth, semi, singleQuote, trailingComma

### Community 27 - "DrugBackup"
Cohesion: 0.25
Nodes (11): runExclusiveTransaction(), DrugBackup, CaptureService, ImageOwnerType, insertPreparedImages(), persistManipulatedImage(), PreparedCaptureImage, prepareImages() (+3 more)

### Community 28 - "index.ts"
Cohesion: 0.11
Nodes (16): initializeDatabase(), errorText(), isRetryableDatabaseError(), retryableDatabaseMarkers, retryBusyDatabaseOperation(), DatabaseVersionError, migrateDatabase(), migrationSQLForPlatform() (+8 more)

### Community 29 - "Community 29"
Cohesion: 0.15
Nodes (13): devDependencies, eslint, eslint-config-expo, expo-doctor, jest, jest-expo, prettier, react-test-renderer (+5 more)

### Community 30 - "learningRepository.ts"
Cohesion: 0.06
Nodes (66): DrugProfileScreen(), KnowledgeMapScreen(), ReportEditor(), LearningRepository, LearningSummary, PayloadRow, AtomicNoteCandidate, CachedPracticePack (+58 more)

### Community 31 - "reviewScheduler.ts"
Cohesion: 0.17
Nodes (9): AddHubScreen(), AddRoute(), styles, LibraryToolsScreen(), styles, Tool(), EmptyStateProps, styles (+1 more)

### Community 32 - "Community 32"
Cohesion: 0.15
Nodes (12): compilerOptions, exactOptionalPropertyTypes, noFallthroughCasesInSwitch, noImplicitOverride, noUncheckedIndexedAccess, paths, strict, types (+4 more)

### Community 33 - "_layout.tsx"
Cohesion: 0.20
Nodes (6): LoadingApp(), styles, DatabaseProvider(), AppProviders(), AppProvidersProps, ThemeProvider()

### Community 35 - "generateDeepSeekPracticePack"
Cohesion: 0.08
Nodes (36): PracticeSessionContent(), PracticeSessionScreen(), resolvePracticeMode(), styles, libraryRevision(), PracticeRepository, answerMatches(), caseQuestions() (+28 more)

### Community 36 - "Community 36"
Cohesion: 0.35
Nodes (10): CountRow, ingredientNames(), repairLegacyProductAuthority(), canonicalFor(), createProduct(), normalizedComponents(), canonicalIngredientKey(), canonicalKeyForDrug() (+2 more)

### Community 37 - "embeddedImages.ts"
Cohesion: 0.47
Nodes (3): fullBackup(), makeBackup(), makeDrug()

### Community 38 - "Community 38"
Cohesion: 0.17
Nodes (4): DatabaseSync, node:sqlite, StatementResultingChanges, StatementSync

### Community 40 - "drugBackupSchema"
Cohesion: 0.13
Nodes (11): BackupPersistence, BackupRestoreMode, BackupRestoreSummary, BackupImportPreview, BackupService, StagedBackup, combinedTrainingReportsText(), csvEscape() (+3 more)

### Community 41 - "testDeepSeekConnection"
Cohesion: 0.36
Nodes (9): difficulty(), generateDeepSeekPracticePack(), groundedFacts(), isGrounded(), localFive(), normalized(), providerQuestion(), questionType() (+1 more)

### Community 42 - "ThemeProvider.tsx"
Cohesion: 0.19
Nodes (8): SettingsRepository, ThemeContext, ThemeContextValue, ThemeMode, themeSettingQueryKey, darkColors, lightColors, ThemeColors

### Community 43 - "BackupPersistence"
Cohesion: 0.22
Nodes (7): generateDeepSeekDrugDraft(), parseAIDrugDraftPayload(), parsePackageRecognitionPayload(), ProviderFailure, testDeepSeekConnection(), testModelList(), testOpenRouterConnection()

### Community 44 - "dateFromLegacy"
Cohesion: 0.48
Nodes (5): normalizeCredential(), chatJSON(), errorDetail(), parseProviderJSON(), recognizePackageWithOpenRouter()

### Community 46 - "Community 46"
Cohesion: 0.25
Nodes (7): engines, node, main, name, packageManager, private, version

### Community 48 - "Community 48"
Cohesion: 0.09
Nodes (22): DrugRelationshipItem, RelationshipRepository, RelationshipRow, backupRecordCountsSchema, dailyActivityBackupSchema, dataArray, drugBackupSchema, drugProductBackupSchema (+14 more)

### Community 49 - "AppCrashBoundary.tsx"
Cohesion: 0.29
Nodes (6): AppCrashBoundaryProps, AppCrashBoundaryState, CrashRecovery(), CrashRecoveryProps, styles, formatCrashDiagnostic()

### Community 50 - "copy.ts"
Cohesion: 0.25
Nodes (4): copyFile, nativeAccessibilityTags, root, translatedAttributes

### Community 51 - "imagePipeline.ts"
Cohesion: 0.80
Nodes (3): centerCrop(), editorResizeActions(), persistenceActions()

### Community 54 - "copy.ts"
Cohesion: 0.31
Nodes (7): arabicCopy, hasArabicCopy(), normalizedArabicCopy, translateCopy(), translateDynamicCopy(), deviceLanguage(), LocaleProvider()

### Community 62 - "consistency.ts"
Cohesion: 0.30
Nodes (8): applyConfirmedIdentity(), ConfirmedDrugIdentity, tradeNamesFromInput(), unique(), normalizeDrugConsistency(), normalizedValue(), TargetUnit, unknown()

## Knowledge Gaps
- **385 isolated node(s):** `singleQuote`, `trailingComma`, `printWidth`, `semi`, `icons` (+380 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `today.tsx` to `dose.tsx`, `Community 3`, `generateDeepSeekPracticePack`, `mergeDuplicateProfiles.ts`, `notes.tsx`, `radii`, `useLocale`, `index.tsx`, `useTheme`, `index.ts`, `ThemeProvider.tsx`, `Community 14`, `practiceRepository.ts`, `providerClients.test.ts`, `learningRepository.ts`, `reviewScheduler.ts`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Why does `DrugBackup` connect `DrugBackup` to `dose.tsx`, `providerClients.ts`, `Community 3`, `mergeDuplicateProfiles.ts`, `notes.tsx`, `radii`, `backupService.ts`, `useLocale`, `useTheme`, `index.ts`, `backupPersistence.ts`, `drugRepository.ts`, `practiceRepository.ts`, `session.tsx`, `trainingRepository.ts`, `providerClients.test.ts`, `learningRepository.ts`, `generateDeepSeekPracticePack`, `Community 36`, `embeddedImages.ts`, `drugBackupSchema`, `Community 48`, `consistency.ts`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Why does `dateFromLegacy()` connect `learningRepository.ts` to `dose.tsx`, `generateDeepSeekPracticePack`, `radii`, `drugBackupSchema`, `index.tsx`, `useTheme`, `backupPersistence.ts`, `today.tsx`, `drugRepository.ts`, `practiceRepository.ts`, `session.tsx`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **What connects `singleQuote`, `trailingComma`, `printWidth` to the rest of the system?**
  _385 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dose.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06382978723404255 - nodes in this community are weakly interconnected._
- **Should `trustedSources.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09487179487179487 - nodes in this community are weakly interconnected._
- **Should `providerClients.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06050420168067227 - nodes in this community are weakly interconnected._