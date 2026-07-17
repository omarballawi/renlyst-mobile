import {
  applyCompletedSession,
  createDailyActivity,
  createLearningProfile,
} from '@/domain/learning/learningProgress';
import { makeDrug } from '../fixtures/backup';

describe('learning progress parity', () => {
  const session = { questionCount: 5, correctCount: 4 };

  it('keeps same-day streaks stable, increments consecutive days, and resets gaps', () => {
    const firstDay = new Date(2025, 5, 15, 10);
    let profile = createLearningProfile('profile');
    let result = applyCompletedSession(
      profile,
      createDailyActivity('day-1', firstDay),
      session,
      { reviews: [], drugs: [] },
      firstDay,
    );
    expect(result.profile.currentStreak).toBe(1);
    expect(result.profile.badges).toContain('First Five');

    result = applyCompletedSession(
      result.profile,
      result.activity,
      session,
      { reviews: [], drugs: [] },
      new Date(2025, 5, 15, 16),
    );
    expect(result.profile.currentStreak).toBe(1);
    expect(result.activity.sessionsCompleted).toBe(2);

    result = applyCompletedSession(
      result.profile,
      createDailyActivity('day-2', new Date(2025, 5, 16, 9)),
      session,
      { reviews: [], drugs: [] },
      new Date(2025, 5, 16, 9),
    );
    expect(result.profile.currentStreak).toBe(2);

    result = applyCompletedSession(
      result.profile,
      createDailyActivity('day-3', new Date(2025, 5, 20, 9)),
      session,
      { reviews: [], drugs: [] },
      new Date(2025, 5, 20, 9),
    );
    expect(result.profile.currentStreak).toBe(1);
    expect(result.profile.longestStreak).toBe(2);
  });

  it('awards evidence badges without duplicates', () => {
    const now = new Date(2025, 5, 15, 10);
    const mastered = makeDrug({
      masteryScientificName: true,
      masteryTradeName: true,
      masteryClass: true,
      masteryUse: true,
      masteryWarning: true,
      masteryCounseling: true,
    });
    const reviews = Array.from({ length: 10 }, (_, index) => ({
      id: `review-${index}`,
      drugID: mastered.id,
      drugNameSnapshot: mastered.scientificName,
      date: now.toISOString(),
      questionTypeRaw: index < 7 ? 'Counseling' : 'Use',
      ratingRaw: 'Correct',
      wasCorrect: true,
      scoreBefore: 1,
      scoreAfter: 2,
      caseID: null,
    }));
    const result = applyCompletedSession(
      { ...createLearningProfile('profile'), completedQuestions: 20 },
      createDailyActivity('day', now),
      session,
      { reviews, drugs: [mastered] },
      now,
    );

    expect(result.profile.badges).toEqual(
      expect.arrayContaining([
        'First Five',
        'Practice 25',
        'Recovered 10 forgotten facts',
        'Completed 7 counseling practices',
        'Mastered an entire class',
      ]),
    );
    expect(new Set(result.profile.badges).size).toBe(result.profile.badges.length);
    expect(result.activity.missionCompleted).toBe(true);
  });
});
