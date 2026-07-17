import type {
  DailyActivityBackup,
  DrugBackup,
  LearningProfileBackup,
  ReviewBackup,
} from '@/domain/backup';
import { isMastered } from '@/domain/drugs/mastery';
import { addLocalDays, isSameLocalDay, startOfLocalDay } from '@/domain/shared/dates';

export type CompletedSession = {
  questionCount: number;
  correctCount: number;
};

export type LearningProgressEvidence = {
  reviews: readonly ReviewBackup[];
  drugs: readonly DrugBackup[];
};

export type LearningProgressResult = {
  profile: LearningProfileBackup;
  activity: DailyActivityBackup;
};

export function createLearningProfile(id: string): LearningProfileBackup {
  return {
    id,
    currentStreak: 0,
    longestStreak: 0,
    completedSessions: 0,
    completedQuestions: 0,
    correctAnswers: 0,
    badges: [],
    lastActivityDate: null,
    weakDrugRemindersEnabled: true,
  };
}

export function createDailyActivity(id: string, now: Date): DailyActivityBackup {
  return {
    id,
    day: startOfLocalDay(now).toISOString(),
    sessionsCompleted: 0,
    questionsAnswered: 0,
    correctAnswers: 0,
    missionCompleted: false,
  };
}

function award(badges: string[], badge: string, condition: boolean): void {
  if (condition && !badges.includes(badge)) badges.push(badge);
}

function hasMasteredClass(drugs: readonly DrugBackup[]): boolean {
  const classes = new Map<string, DrugBackup[]>();
  for (const drug of drugs) {
    const key = drug.drugClass.trim().toLocaleLowerCase();
    if (drug.isUnknown || !key) continue;
    const members = classes.get(key) ?? [];
    members.push(drug);
    classes.set(key, members);
  }
  return [...classes.values()].some((members) => members.length > 0 && members.every(isMastered));
}

export function applyCompletedSession(
  sourceProfile: LearningProfileBackup,
  sourceActivity: DailyActivityBackup,
  session: CompletedSession,
  evidence: LearningProgressEvidence,
  now = new Date(),
): LearningProgressResult {
  const profile = structuredClone(sourceProfile);
  const activity = structuredClone(sourceActivity);
  const questionCount = Math.max(0, Math.trunc(session.questionCount));
  const correctCount = Math.min(questionCount, Math.max(0, Math.trunc(session.correctCount)));

  activity.sessionsCompleted += 1;
  activity.questionsAnswered += questionCount;
  activity.correctAnswers += correctCount;
  activity.missionCompleted = activity.sessionsCompleted >= 1;

  const lastActivity = profile.lastActivityDate == null ? null : new Date(profile.lastActivityDate);
  if (lastActivity && !Number.isNaN(lastActivity.valueOf())) {
    const lastDay = startOfLocalDay(lastActivity);
    if (isSameLocalDay(lastDay, now)) {
      if (profile.currentStreak === 0) profile.currentStreak = 1;
    } else if (isSameLocalDay(addLocalDays(lastDay, 1), now)) {
      profile.currentStreak += 1;
    } else {
      profile.currentStreak = 1;
    }
  } else {
    profile.currentStreak = 1;
  }

  profile.longestStreak = Math.max(profile.longestStreak, profile.currentStreak);
  profile.completedSessions += 1;
  profile.completedQuestions += questionCount;
  profile.correctAnswers += correctCount;
  profile.lastActivityDate = now.toISOString();

  award(profile.badges, 'First Five', profile.completedQuestions >= 5);
  award(profile.badges, 'Three Day Streak', profile.currentStreak >= 3);
  award(profile.badges, 'Practice 25', profile.completedQuestions >= 25);
  award(
    profile.badges,
    'Recovered 10 forgotten facts',
    evidence.reviews.filter((review) => review.wasCorrect && review.scoreAfter > review.scoreBefore)
      .length >= 10,
  );
  award(
    profile.badges,
    'Completed 7 counseling practices',
    evidence.reviews.filter(
      (review) => review.wasCorrect && review.questionTypeRaw === 'Counseling',
    ).length >= 7,
  );
  award(
    profile.badges,
    'Solved 5 cases without hints',
    evidence.reviews.filter(
      (review) => review.wasCorrect && review.questionTypeRaw === 'Case practice',
    ).length >= 5,
  );
  award(profile.badges, 'Mastered an entire class', hasMasteredClass(evidence.drugs));

  return { profile, activity };
}
