import { applyReview, adjustMemoryGrade } from '@/domain/learning/reviewScheduler';
import { makeDrug } from '@/../tests/fixtures/backup';

describe('review scheduling parity', () => {
  const now = new Date('2025-06-15T12:00:00Z');

  it('wrong clears field mastery and schedules tomorrow', () => {
    const source = makeDrug({ masteryWarning: true, correctStreak: 2 });
    const result = applyReview(source, 'Wrong', 'Warning', now);
    expect(result.drug.masteryWarning).toBe(false);
    expect(result.drug.correctStreak).toBe(0);
    expect(result.intervalDays).toBe(1);
    expect(result.review.wasCorrect).toBe(false);
  });

  it('correct answers progress through seven, fourteen, and thirty days', () => {
    const first = applyReview(makeDrug(), 'Correct', 'Class', now);
    const second = applyReview(first.drug, 'Correct', 'Use', now);
    const third = applyReview(second.drug, 'Correct', 'Warning', now);
    expect([first.intervalDays, second.intervalDays, third.intervalDays]).toEqual([7, 14, 30]);
  });

  it('partly correct preserves mastery and reports a three-day fallback', () => {
    const result = applyReview(makeDrug({ masteryUse: true }), 'Partly correct', 'Use', now);
    expect(result.drug.masteryUse).toBe(true);
    expect(result.intervalDays).toBe(3);
  });

  it('easy field grading increases the due interval and strength', () => {
    const reviewed = applyReview(makeDrug(), 'Correct', 'Warning', now);
    const originalDue = new Date(reviewed.drug.nextReviewDate).valueOf();
    const adjusted = adjustMemoryGrade(reviewed.drug, 'Warning', 'Easy', now);
    expect(new Date(adjusted.drug.nextReviewDate).valueOf()).toBeGreaterThan(originalDue);
    expect(adjusted.intervalDays).toBeGreaterThanOrEqual(7);
  });
});
