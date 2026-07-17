import { buildWeeklyActivity, recommendFocus } from '@/domain/learning/focusEngine';
import { makeDrug } from '../fixtures/backup';

const now = new Date(2025, 5, 15, 10);
const mastered = {
  masteryScientificName: true,
  masteryTradeName: true,
  masteryClass: true,
  masteryUse: true,
  masteryWarning: true,
  masteryCounseling: true,
};

describe('today focus parity', () => {
  it('follows the exact Swift priority order', () => {
    expect(recommendFocus([], false, now).action).toBe('addDrug');
    expect(recommendFocus([makeDrug({ isUnknown: true })], false, now).action).toBe('addDrug');

    const due = makeDrug({ nextReviewDate: new Date(2025, 5, 15, 23).toISOString() });
    expect(recommendFocus([due], true, now)).toMatchObject({
      action: 'reviewDue',
      title: 'Review 1 due drug',
    });

    const weak = makeDrug({ nextReviewDate: new Date(2025, 5, 20).toISOString() });
    expect(recommendFocus([weak], true, now).action).toBe('practiceWeak');

    const complete = makeDrug({
      ...mastered,
      confidenceRaw: 'Mastered',
      nextReviewDate: new Date(2025, 5, 20).toISOString(),
    });
    expect(recommendFocus([complete], true, now).action).toBe('finishShift');
    expect(recommendFocus([complete], false, now)).toMatchObject({
      action: 'addDrug',
      title: "Add today's drug",
    });
  });

  it('uses tomorrow as a strict due boundary and pluralizes counts', () => {
    const first = makeDrug({
      id: 'first',
      ...mastered,
      confidenceRaw: 'Mastered',
      nextReviewDate: new Date(2025, 5, 16, 0).toISOString(),
    });
    const second = makeDrug({
      id: 'second',
      nextReviewDate: new Date(2025, 5, 15, 20).toISOString(),
    });
    expect(recommendFocus([first], false, now).action).toBe('addDrug');
    expect(recommendFocus([second, { ...second, id: 'third' }], false, now).title).toBe(
      'Review 2 due drugs',
    );
  });
});

describe('weekly activity', () => {
  it('fills local-day gaps and preserves the latest seven days', () => {
    const week = buildWeeklyActivity(
      [
        {
          id: 'activity',
          day: new Date(2025, 5, 13, 22).toISOString(),
          sessionsCompleted: 2,
          questionsAnswered: 10,
          correctAnswers: 8,
          missionCompleted: true,
        },
      ],
      now,
    );

    expect(week).toHaveLength(7);
    expect(week[4]).toMatchObject({
      key: '2025-06-13',
      sessionsCompleted: 2,
      questionsAnswered: 10,
      missionCompleted: true,
    });
    expect(week[6]).toMatchObject({ key: '2025-06-15', isToday: true });
    expect(week.filter((day) => day.sessionsCompleted === 0)).toHaveLength(6);
  });
});
