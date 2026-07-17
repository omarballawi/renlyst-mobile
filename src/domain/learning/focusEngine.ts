import type { DailyActivityBackup, DrugBackup } from '@/domain/backup';
import { isMastered } from '@/domain/drugs/mastery';
import { addLocalDays, dateFromLegacy, startOfLocalDay } from '@/domain/shared/dates';

export type FocusAction = 'addDrug' | 'reviewDue' | 'practiceWeak' | 'finishShift';

export type FocusRecommendation = {
  action: FocusAction;
  title: string;
  subtitle: string;
};

export type WeeklyActivityDay = {
  key: string;
  label: string;
  sessionsCompleted: number;
  questionsAnswered: number;
  missionCompleted: boolean;
  isToday: boolean;
};

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function recommendFocus(
  drugs: readonly DrugBackup[],
  hasActiveShift: boolean,
  now = new Date(),
): FocusRecommendation {
  const known = drugs.filter((drug) => !drug.isUnknown);
  const tomorrow = addLocalDays(now, 1).valueOf();
  const due = known.filter((drug) => {
    const nextReview = dateFromLegacy(drug.nextReviewDate);
    return nextReview !== null && nextReview.valueOf() < tomorrow;
  });
  const weak = known.filter(
    (drug) =>
      drug.confidenceRaw.trim().toLocaleLowerCase() === 'weak' ||
      drug.isConfusing ||
      !isMastered(drug),
  );

  if (known.length === 0) {
    return {
      action: 'addDrug',
      title: 'Add one drug',
      subtitle: 'Start with a package you saw today.',
    };
  }
  if (due.length > 0) {
    return {
      action: 'reviewDue',
      title: `Review ${due.length} due drug${due.length === 1 ? '' : 's'}`,
      subtitle: 'One five-question session. Nothing else.',
    };
  }
  if (weak.length > 0) {
    return {
      action: 'practiceWeak',
      title: 'Practice weak drugs',
      subtitle: 'Strengthen the checks that need attention.',
    };
  }
  if (hasActiveShift) {
    return {
      action: 'finishShift',
      title: 'Finish shift reflection',
      subtitle: 'Capture what you learned before leaving.',
    };
  }
  return {
    action: 'addDrug',
    title: "Add today's drug",
    subtitle: 'Keep your library connected to the shelf.',
  };
}

export function buildWeeklyActivity(
  activities: readonly DailyActivityBackup[],
  now = new Date(),
): WeeklyActivityDay[] {
  const today = startOfLocalDay(now);
  const byDay = new Map<string, DailyActivityBackup>();
  for (const activity of activities) {
    const day = dateFromLegacy(activity.day);
    if (day) byDay.set(localDateKey(day), activity);
  }

  return Array.from({ length: 7 }, (_, index) => {
    const date = addLocalDays(today, index - 6);
    const key = localDateKey(date);
    const activity = byDay.get(key);
    return {
      key,
      label: new Intl.DateTimeFormat('en', { weekday: 'narrow' }).format(date),
      sessionsCompleted: activity?.sessionsCompleted ?? 0,
      questionsAnswered: activity?.questionsAnswered ?? 0,
      missionCompleted: activity?.missionCompleted ?? false,
      isToday: index === 6,
    };
  });
}
