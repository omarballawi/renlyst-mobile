# Migration parity contract

The Swift repository at `../pharmashift` is the read-only behavioral and data authority during migration. The React Native application must not import or execute Swift code at runtime.

## Persisted records

- [x] Drug profile: every `DrugBackupDTO` schema-v5 field, nested clinical JSON payload, mastery flag, Arabic field, source field, and unknown future key.
- [x] Brand product: every `DrugProductBackupDTO` field and all package images.
- [x] Drug relationship: kind, severity, management, sources, checked date, and nullable endpoints.
- [x] Review log: snapshot survives profile deletion.
- [x] Shift log: incomplete and completed records.
- [x] Encounter note: privacy confirmation and optional drug relationship.
- [x] Training report: editable generated sections and date range.
- [x] Learning profile: streaks, totals, badges, and reminder preference.
- [x] Daily activity: sessions, questions, correctness, and mission completion.
- [x] Preferences, cached practice packs, reminder configuration, theme/language preferences, and provider configuration.

## Backup compatibility

- [x] Decode complete and lightweight Swift JSON schema versions 1–5.
- [x] Reject malformed and newer schema backups before any write.
- [x] Stage and hash images before starting the database transaction.
- [x] Merge is UUID-idempotent; replace removes records not in the backup.
- [x] Lightweight merge preserves existing local images.
- [x] Export complete and lightweight Swift-compatible schema-v5 JSON.
- [x] Preserve unknown legacy keys for lossless rollback.
- [x] Validate UTF-8 Arabic in backup JSON, CSV, and training report exports.
- [x] Report record counts and image hashes before the user confirms import.
- [x] Never migrate protected provider API keys.

## Functional parity

- [x] Today focus engine, one priority action, weekly rhythm, and recent profiles.
- [x] Library bilingual search; Due, Needs Attention, and No Photo scopes; name/recent/due/mastery sorting.
- [x] Capture known/unknown; camera/library; maximum eight images; crop/pan/zoom/rotation; compression and thumbnails; Save & Open/Later/Another.
- [x] Profile topics: Brands & packages, Uses, Forms & dosing, Safety, Pharmacology, Counseling & Arabic, Sources/notes/mastery.
- [x] Manual brand validation and ingredient inheritance; profile/brand deletion policies.
- [x] Knowledge map, compare, shelf quest, trusted import, and AI generation with field-level exclusions.
- [x] Smart Session plus Scientific→Trade, Trade→Scientific, Class→Examples, Drug→Use, Drug→Warning, Image Quiz, Counseling, Weak Drugs, Due Review, System Practice, Case Practice.
- [x] Exactly five questions per session; Daily Refresh, Mistake Vault, cached AI pack.
- [x] Six mastery checks, classless five-check rule, review scheduling, field-level memory, streaks, badges, daily activities, reminders.
- [x] Shift logs, encounters/privacy validator, report generation/editor/export.
- [x] PK and safety scales, structured adverse effects/interactions/reproductive safety/ADME/dose regimens, educational dose calculator.
- [x] Optional Altibbi, RxNorm, DailyMed, openFDA, OpenRouter package vision, and DeepSeek generation/practice providers.
- [x] Provider failures are actionable and never corrupt local records.

## Experience and release gates

- [ ] Light, dark, English LTR, Arabic RTL, accessibility text sizes, VoiceOver, Reduce Motion, and denied-permission states.
- [x] No placeholder action, empty handler, TODO-only screen, or knowingly omitted workflow.
- [ ] Typecheck, lint, unit, contract, migration, backup round-trip, component, Maestro, stress, and Expo Doctor checks pass. Local quality, component, migration, backup round-trip, stress, and Expo Doctor checks pass; Maestro still needs a device/simulator run.
- [ ] Physical iPhone acceptance pass succeeds with a real complete backup.
- [x] GitHub macOS workflow produces an unsigned IPA that can be installed through AltServer. A hosted macOS build from commit `e87ca65` produced and payload-inspected an unsigned IPA; every release still rebuilds from its final release commit.
- [x] Reproducible CI exports both iOS and Android Hermes bundles before the unsigned iOS packaging job.
- [x] Preview bundle `com.renlyst.app.next` coexists with Swift; production bundle switches only after the complete audit.

## Current evidence

- 2026-07-18: TypeScript, zero-warning ESLint, 38 Jest suites / 113 tests, Prettier, and Expo Doctor 20/20 passed. Regression coverage exercises the native-safe typed-array SHA-256 bridge, retry-only-on-lock database startup, protected-key rollback, useful Smart Session constraints, and Arabic catalog/dynamic copy.
- 2026-07-18: persisted 430 × 932 narrow-width browser acceptance flows saved and opened profiles from real cropped package photos, surfaced them throughout Today, Library, search, compare, knowledge map, shelf quest, practice, encounters, import completion, relationships, and clinical views, and completed a grounded five-question Smart Session after a guarded rapid double activation. A separate exact 440 × 956 iPhone 16 Pro Max audit kept Arabic Today and You within the viewport with no horizontally escaping element; all runs completed without an alert or uncaught error.
- 2026-07-18: fresh release exports produced a 6.3 MB iOS Hermes bundle from 2,402 modules and a 6.4 MB Android Hermes bundle from 2,488 modules. The unsigned-iOS workflow creates and verifies a SHA-256 sidecar beside every IPA artifact.
- 2026-07-18: five Maestro flows cover startup/navigation/RTL, capture and search, real photo-library crop/hash/save/reopen, five-question rapid-tap practice, and protected-key persistence. The macOS workflow now builds a self-contained Release simulator app and runs these flows before packaging the unsigned device IPA; this expanded native gate still requires its first hosted run from the finalized commit.

- 2026-07-17: TypeScript, zero-warning ESLint, 36 Jest suites / 106 tests, Prettier, and Expo Doctor 20/20 passed. The added coverage verifies ArrayBuffer-backed SHA-256 input, evidence-based five-question Smart Sessions, unique drug/fact pairs before repetition, short grounded answers, dynamic Arabic copy, and Arabic catalog completeness.
- 2026-07-17: A single-client Expo web preview passed dark/light themes, English LTR, Arabic RTL, tab accessibility names, and Today/Library/Practice/You navigation with no current runtime errors. A 430 × 932 narrow-phone stress viewport showed no horizontal overflow; Arabic page headers, Today composition, learning record, training rows, and protected-settings recovery remained inside the viewport. The preview uses Metro WebAssembly assets, a web-safe SQLite transaction path, a non-FTS search fallback, memory-only web crash diagnostics, and vector-icon fallbacks without changing native SQLite or native symbols.
- 2026-07-17: the real SQLite adapter passed migration, transaction rollback, search, deletion-policy, complete/lightweight backup round-trip, and 1,000-profile persistence/search/export integration tests.
- 2026-07-17: the complete SQLite backup round-trip now asserts every field of every persisted Swift record family (profile, product, relationship, review, shift, encounter, report, learning profile, and daily activity), alongside Arabic, unknown future fields, and image references.
- 2026-07-17: Arabic catalog and native accessibility coverage tests pass for static and dynamic interface copy.
- 2026-07-17: `expo export --platform ios --clear` produced a fresh 6.2 MB Hermes bundle from 2,395 modules.
- 2026-07-17: `expo export --platform android --clear` produced a fresh 6.4 MB Hermes bundle from 2,481 modules.
- 2026-07-17: `pnpm run release:verify` passed the complete quality suite and emitted both the iOS and Android bundle artifacts used by CI.
- 2026-07-17: GitHub Actions run `29602770663` completed successfully and its `renlyst-next-unsigned-ipa` artifact was downloaded and inspected. The IPA contains `Payload/RenlystNext.app/Info.plist`; it is unsigned and requires sideloading.
- 2026-07-17: root recovery now records at most ten local, redacted crash diagnostics. The report excludes raw exception text and all library, backup, image, provider, search, and encounter data. It offers retry, return-home, copy, and a manual GitHub issue-form action; no report uploads automatically.
- Five Maestro flows are present, including real-photo capture, five-question rapid-tap, and protected-key persistence regressions, but the expanded suite still requires its first simulator/device run.
- Remaining acceptance gates are large-text/VoiceOver/Reduce Motion and denied-permission device passes, the expanded Maestro run, and a real Swift backup on an iPhone. The public preview release must also be rebuilt and reverified from its finalized release commit.
