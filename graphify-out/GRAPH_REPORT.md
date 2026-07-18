# Graph Report - renlyst-mobile  (2026-07-18)

## Corpus Check
- 170 files · ~90,964 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1171 nodes · 3345 edges · 53 communities (50 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 32 edges (avg confidence: 0.74)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f62f77fb`
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
- [[_COMMUNITY_ThemeProvider.tsx|ThemeProvider.tsx]]
- [[_COMMUNITY_queries.ts|queries.ts]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_AppCrashBoundary.tsx|AppCrashBoundary.tsx]]
- [[_COMMUNITY_copy.ts|copy.ts]]
- [[_COMMUNITY_copy.ts|copy.ts]]
- [[_COMMUNITY_Community 55|Community 55]]

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
- `TodayScreen()` --indirect_call--> `drug()`  [INFERRED]
  app/(tabs)/today.tsx → src/data/repositories/__tests__/trainingAnalytics.test.ts
- `LoadingApp()` --calls--> `translateCopy()`  [EXTRACTED]
  app/_layout.tsx → src/localization/copy.ts
- `AboutScreen()` --calls--> `useTheme()`  [EXTRACTED]
  app/about.tsx → src/ui/theme/ThemeProvider.tsx
- `CaptureScreen()` --indirect_call--> `drug()`  [INFERRED]
  app/capture.tsx → src/data/repositories/__tests__/trainingAnalytics.test.ts

## Import Cycles
- 3-file cycle: `src/domain/backup/index.ts -> src/domain/backup/mergeDuplicateProfiles.ts -> src/domain/drugs/identity.ts -> src/domain/backup/index.ts`

## Communities (53 total, 3 thin omitted)

### Community 0 - "dose.tsx"
Cohesion: 0.06
Nodes (40): ClinicalRichText(), ClinicalTone, Choice(), DoseCalculatorScreen(), numberValue(), regimenSummary(), styles, masteryItems (+32 more)

### Community 1 - "trustedSources.ts"
Cohesion: 0.06
Nodes (63): newProfile(), packetText(), sources, styles, TrustedImportScreen(), chapters, DrugChapter, quickClasses (+55 more)

### Community 2 - "providerClients.ts"
Cohesion: 0.06
Nodes (32): aiAdverseEffectSchema, aiBoolean, aiDoseRegimenSchema, aiDrugDraftSchema, aiInteractionSchema, aiNumber, aiPracticeItemSchema, aiPracticePayloadSchema (+24 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (45): categoryColor(), categoryOrder, ClinicalSection(), DetailBlock(), EmptyValue(), InteractionRow(), PharmacologyMeter(), relatedProfileID() (+37 more)

### Community 4 - "Community 4"
Cohesion: 0.05
Nodes (44): dependencies, babel-preset-expo, date-fns, expo, expo-clipboard, expo-constants, expo-crypto, expo-document-picker (+36 more)

### Community 5 - "mergeDuplicateProfiles.ts"
Cohesion: 0.11
Nodes (17): BackupHistory, BackupScreen(), emptyHistory, styles, settingKeys, EditorTransform, ImageEditor(), styles (+9 more)

### Community 6 - "notes.tsx"
Cohesion: 0.13
Nodes (27): AIImportScreen(), newProfile(), sectionPreview(), styles, AIImportField, AIImportFieldKey, aiImportFieldKeys, AIImportSection (+19 more)

### Community 7 - "radii"
Cohesion: 0.18
Nodes (21): Chip(), ChipProps, LibraryScreen(), scopes, sorts, styles, PracticeScreen(), styles (+13 more)

### Community 8 - "backupService.ts"
Cohesion: 0.05
Nodes (52): arabicSearchText(), BackupPersistence, BackupRestoreMode, BackupRestoreSummary, countsFor(), existingDrugIDs(), ImageExportRow, ImageUriRow (+44 more)

### Community 9 - "useLocale"
Cohesion: 0.18
Nodes (20): EditBrandScreen(), Field(), styles, ChoiceChip(), styles, DrugPhotosScreen(), styles, ImportCompleteScreen() (+12 more)

### Community 10 - "index.tsx"
Cohesion: 0.17
Nodes (22): NewEncounterScreen(), styles, MasteryRadar(), polygonPoints(), radarLabels, radarPoint(), ReportsScreen(), styles (+14 more)

### Community 11 - "useTheme"
Cohesion: 0.12
Nodes (27): DrugProfileScreen(), KnowledgeMapScreen(), drug(), ReviewBackup, confidenceFor(), isMastered(), masteryCount(), MasteryField (+19 more)

### Community 12 - "index.ts"
Cohesion: 0.24
Nodes (7): PracticeSessionContent(), PracticeSessionScreen(), resolvePracticeMode(), styles, isPracticeMode(), PracticeMode, appHaptics

### Community 13 - "backupPersistence.ts"
Cohesion: 0.22
Nodes (9): Field(), styles, QuickSearchScreen(), styles, AppTextProps, TextVariant, variants, AppTextInput (+1 more)

### Community 14 - "Community 14"
Cohesion: 0.11
Nodes (20): bands, chapters, ChoiceField(), DrugEditorScreen(), editorSchema, EditorSection, editorSections, EditorValues (+12 more)

### Community 15 - "today.tsx"
Cohesion: 0.09
Nodes (32): AboutScreen(), styles, chapters, styles, LibraryToolsScreen(), styles, Tool(), chapters (+24 more)

### Community 16 - "schema.ts"
Cohesion: 0.18
Nodes (12): normalizeCredential(), chatJSON(), errorDetail(), generateDeepSeekDrugDraft(), parseAIDrugDraftPayload(), parsePackageRecognitionPayload(), parseProviderJSON(), ProviderFailure (+4 more)

### Community 17 - "drugRepository.ts"
Cohesion: 0.08
Nodes (18): arabicSearchText(), CountRow, DrugDeletionImpact, DrugListOptions, DrugRepository, DrugRow, ftsQuery(), ImageRow (+10 more)

### Community 18 - "practiceRepository.ts"
Cohesion: 0.23
Nodes (14): AtomicNotesScreen(), addAtomicNote(), AtomicDrugNote, atomicNoteDate(), AtomicNoteField, atomicNoteFields, AtomicNoteKind, atomicNoteKinds (+6 more)

### Community 19 - "session.tsx"
Cohesion: 0.12
Nodes (34): canonicalFor(), DuplicateProfileMergeResult, earliest(), earliestNullable(), latest(), mergeDrug(), mergeDuplicateProfiles(), mergeJSONArrays() (+26 more)

### Community 20 - "trainingRepository.ts"
Cohesion: 0.11
Nodes (16): breakdown(), CountRow, EncounterDraft, PayloadRow, ShiftReflection, summarizeTrainingAnalytics(), TrainingAnalytics, TrainingBreakdown (+8 more)

### Community 21 - "Community 21"
Cohesion: 0.11
Nodes (18): scripts, android, e2e:maestro, export:android, export:ios, format, format:check, ios (+10 more)

### Community 22 - "trusted.tsx"
Cohesion: 0.12
Nodes (9): credentialKeys, credentialOperationTails, credentialRetryDelaysMs, ProviderCredential, ProviderCredentialValues, SettingRow, SettingsRepository, keys (+1 more)

### Community 23 - "providerClients.test.ts"
Cohesion: 0.36
Nodes (9): difficulty(), generateDeepSeekPracticePack(), groundedFacts(), isGrounded(), localFive(), normalized(), providerQuestion(), questionType() (+1 more)

### Community 24 - "diagnosticReport.ts"
Cohesion: 0.26
Nodes (11): appendCrashDiagnostic(), CrashDiagnostic, CrashDiagnosticInput, createCrashDiagnostic(), DiagnosticStorage, parseCrashDiagnostics(), safeComponentStack(), safeErrorName() (+3 more)

### Community 25 - "practiceEngine.ts"
Cohesion: 0.10
Nodes (25): CountRow, ingredientNames(), repairLegacyProductAuthority(), runExclusiveTransaction(), CountRow, ImageUriRow, ProductImageRow, ProductImageSource (+17 more)

### Community 26 - ".prettierrc.json"
Cohesion: 0.40
Nodes (4): printWidth, semi, singleQuote, trailingComma

### Community 27 - "DrugBackup"
Cohesion: 0.11
Nodes (15): AtomicNoteCandidate, CachedPracticePack, DailyRefresh, firstAtomicNote(), libraryRevision(), MistakeVault, PackRow, PayloadRow (+7 more)

### Community 28 - "index.ts"
Cohesion: 0.09
Nodes (19): initializeDatabase(), errorText(), isRetryableDatabaseError(), retryableDatabaseMarkers, retryBusyDatabaseOperation(), DatabaseVersionError, migrateDatabase(), migrationSQLForPlatform() (+11 more)

### Community 29 - "Community 29"
Cohesion: 0.15
Nodes (13): devDependencies, eslint, eslint-config-expo, expo-doctor, jest, jest-expo, prettier, react-test-renderer (+5 more)

### Community 30 - "learningRepository.ts"
Cohesion: 0.13
Nodes (23): LearningRepository, LearningSummary, PayloadRow, DailyActivityBackup, LearningProfileBackup, buildWeeklyActivity(), FocusAction, FocusRecommendation (+15 more)

### Community 31 - "reviewScheduler.ts"
Cohesion: 0.09
Nodes (30): AddHubScreen(), AddRoute(), styles, CaptureScreen(), SaveDestination, styles, AddBrandScreen(), ProductEditor() (+22 more)

### Community 32 - "Community 32"
Cohesion: 0.15
Nodes (12): compilerOptions, exactOptionalPropertyTypes, noFallthroughCasesInSwitch, noImplicitOverride, noUncheckedIndexedAccess, paths, strict, types (+4 more)

### Community 33 - "_layout.tsx"
Cohesion: 0.20
Nodes (6): LoadingApp(), styles, DatabaseProvider(), AppProviders(), AppProvidersProps, ThemeProvider()

### Community 35 - "generateDeepSeekPracticePack"
Cohesion: 0.17
Nodes (23): answerMatches(), caseQuestions(), conciseFact(), counselingFact(), difficultyForMode(), displayName(), firstTradeName(), GeneratePracticeOptions (+15 more)

### Community 36 - "Community 36"
Cohesion: 0.15
Nodes (20): CompareDrugsScreen(), CompareRow(), styles, MistakeVaultScreen(), styles, CachedPracticePackScreen(), styles, DailyRefreshScreen() (+12 more)

### Community 37 - "embeddedImages.ts"
Cohesion: 0.29
Nodes (6): Chapter, chapters, fallbackQuests, ShelfQuestScreen(), styles, targetedQuests

### Community 38 - "Community 38"
Cohesion: 0.17
Nodes (4): DatabaseSync, node:sqlite, StatementResultingChanges, StatementSync

### Community 40 - "drugBackupSchema"
Cohesion: 0.21
Nodes (14): ReportEditor(), sections, styles, combinedTrainingReportsText(), csvHeader, reportDate(), dateFromLegacy(), buildTrainingReport() (+6 more)

### Community 42 - "ThemeProvider.tsx"
Cohesion: 0.31
Nodes (7): ThemeContext, ThemeContextValue, ThemeMode, themeSettingQueryKey, darkColors, lightColors, ThemeColors

### Community 46 - "Community 46"
Cohesion: 0.25
Nodes (7): engines, node, main, name, packageManager, private, version

### Community 48 - "Community 48"
Cohesion: 0.10
Nodes (20): DrugRelationshipItem, RelationshipRepository, RelationshipRow, backupRecordCountsSchema, dailyActivityBackupSchema, dataArray, drugBackupSchema, drugProductBackupSchema (+12 more)

### Community 49 - "AppCrashBoundary.tsx"
Cohesion: 0.29
Nodes (6): AppCrashBoundaryProps, AppCrashBoundaryState, CrashRecovery(), CrashRecoveryProps, styles, formatCrashDiagnostic()

### Community 50 - "copy.ts"
Cohesion: 0.25
Nodes (4): copyFile, nativeAccessibilityTags, root, translatedAttributes

### Community 54 - "copy.ts"
Cohesion: 0.31
Nodes (7): arabicCopy, hasArabicCopy(), normalizedArabicCopy, translateCopy(), translateDynamicCopy(), deviceLanguage(), LocaleProvider()

## Knowledge Gaps
- **384 isolated node(s):** `singleQuote`, `trailingComma`, `printWidth`, `semi`, `icons` (+379 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `reviewScheduler.ts` to `dose.tsx`, `trustedSources.ts`, `Community 3`, `Community 36`, `mergeDuplicateProfiles.ts`, `notes.tsx`, `embeddedImages.ts`, `drugBackupSchema`, `useLocale`, `index.tsx`, `useTheme`, `index.ts`, `backupPersistence.ts`, `Community 14`, `today.tsx`, `radii`, `ThemeProvider.tsx`, `practiceRepository.ts`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **Why does `DrugBackup` connect `DrugBackup` to `dose.tsx`, `trustedSources.ts`, `providerClients.ts`, `Community 3`, `notes.tsx`, `backupService.ts`, `useLocale`, `useTheme`, `today.tsx`, `drugRepository.ts`, `practiceRepository.ts`, `session.tsx`, `trainingRepository.ts`, `practiceEngine.ts`, `index.ts`, `learningRepository.ts`, `reviewScheduler.ts`, `generateDeepSeekPracticePack`, `Community 36`, `drugBackupSchema`, `Community 48`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Why does `dateFromLegacy()` connect `drugBackupSchema` to `dose.tsx`, `generateDeepSeekPracticePack`, `Community 36`, `mergeDuplicateProfiles.ts`, `backupService.ts`, `index.tsx`, `useTheme`, `drugRepository.ts`, `practiceRepository.ts`, `session.tsx`, `DrugBackup`, `learningRepository.ts`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **What connects `singleQuote`, `trailingComma`, `printWidth` to the rest of the system?**
  _384 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dose.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06205673758865248 - nodes in this community are weakly interconnected._
- **Should `trustedSources.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05712050078247261 - nodes in this community are weakly interconnected._
- **Should `providerClients.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06439393939393939 - nodes in this community are weakly interconnected._