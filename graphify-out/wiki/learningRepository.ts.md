# learningRepository.ts

> 34 nodes · cohesion 0.13

## Key Concepts

- **learningRepository.ts** (30 connections) — `src/data/repositories/learningRepository.ts`
- **dates.ts** (30 connections) — `src/domain/shared/dates.ts`
- **learningProgress.ts** (21 connections) — `src/domain/learning/learningProgress.ts`
- **addLocalDays()** (20 connections) — `src/domain/shared/dates.ts`
- **focusEngine.ts** (18 connections) — `src/domain/learning/focusEngine.ts`
- **startOfLocalDay()** (11 connections) — `src/domain/shared/dates.ts`
- **.recordCompletedSession()** (9 connections) — `src/data/repositories/learningRepository.ts`
- **buildWeeklyActivity()** (9 connections) — `src/domain/learning/focusEngine.ts`
- **applyCompletedSession()** (9 connections) — `src/domain/learning/learningProgress.ts`
- **LearningRepository** (8 connections) — `src/data/repositories/learningRepository.ts`
- **reviewBackupSchema** (6 connections) — `src/domain/backup/schema.ts`
- **learningProgress.test.ts** (6 connections) — `tests/domain/learningProgress.test.ts`
- **DailyActivityBackup** (5 connections) — `src/domain/backup/schema.ts`
- **LearningProfileBackup** (5 connections) — `src/domain/backup/schema.ts`
- **createDailyActivity()** (5 connections) — `src/domain/learning/learningProgress.ts`
- **createLearningProfile()** (5 connections) — `src/domain/learning/learningProgress.ts`
- **.summary()** (4 connections) — `src/data/repositories/learningRepository.ts`
- **dailyActivityBackupSchema** (4 connections) — `src/domain/backup/schema.ts`
- **learningProfileBackupSchema** (4 connections) — `src/domain/backup/schema.ts`
- **isDue()** (4 connections) — `src/domain/learning/reviewScheduler.ts`
- **.setWeakDrugRemindersEnabled()** (3 connections) — `src/data/repositories/learningRepository.ts`
- **CompletedSession** (3 connections) — `src/domain/learning/learningProgress.ts`
- **isSameLocalDay()** (3 connections) — `src/domain/shared/dates.ts`
- **FocusAction** (2 connections) — `src/domain/learning/focusEngine.ts`
- **localDateKey()** (2 connections) — `src/domain/learning/focusEngine.ts`
- *... and 9 more nodes in this community*

## Relationships

- [dateFromLegacy](dateFromLegacy.md) (17 shared connections)
- [reviewScheduler.ts](reviewScheduler.ts.md) (15 shared connections)
- [index.ts](index.ts.md) (12 shared connections)
- [backupPersistence.ts](backupPersistence.ts.md) (9 shared connections)
- [drugRepository.ts](drugRepository.ts.md) (6 shared connections)
- [schema.ts](schema.ts.md) (5 shared connections)
- [mergeDuplicateProfiles.ts](mergeDuplicateProfiles.ts.md) (4 shared connections)
- [practiceRepository.ts](practiceRepository.ts.md) (4 shared connections)
- [today.tsx](today.tsx.md) (3 shared connections)
- [index.tsx](index.tsx.md) (3 shared connections)
- [notes.tsx](notes.tsx.md) (3 shared connections)
- [practiceEngine.ts](practiceEngine.ts.md) (3 shared connections)

## Source Files

- `src/data/repositories/learningRepository.ts`
- `src/domain/backup/schema.ts`
- `src/domain/learning/focusEngine.ts`
- `src/domain/learning/learningProgress.ts`
- `src/domain/learning/reviewScheduler.ts`
- `src/domain/shared/dates.ts`
- `tests/domain/learningProgress.test.ts`

## Audit Trail

- EXTRACTED: 237 (100%)
- INFERRED: 1 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*