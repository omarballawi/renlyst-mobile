import type { SQLiteDatabase } from 'expo-sqlite';

import * as Crypto from 'expo-crypto';

import {
  dailyActivityBackupSchema,
  drugBackupSchema,
  learningProfileBackupSchema,
  reviewBackupSchema,
  type DailyActivityBackup,
  type LearningProfileBackup,
} from '@/domain/backup';
import {
  applyCompletedSession,
  createDailyActivity,
  createLearningProfile,
  type CompletedSession,
} from '@/domain/learning/learningProgress';
import { buildWeeklyActivity, type WeeklyActivityDay } from '@/domain/learning/focusEngine';
import {
  applyReview,
  type QuestionType,
  type ReviewApplication,
  type ReviewRating,
} from '@/domain/learning/reviewScheduler';
import { isoDate } from '@/domain/shared/dates';
import { runExclusiveTransaction } from '@/data/database/transactions';
import { DrugRepository } from './drugRepository';

type PayloadRow = { payload_json: string };

export type LearningSummary = {
  profile: LearningProfileBackup;
  today: DailyActivityBackup | null;
  week: WeeklyActivityDay[];
};

export class LearningRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async recordReview(
    drugID: string,
    rating: ReviewRating,
    questionType: QuestionType,
    caseID: string | null,
  ): Promise<ReviewApplication> {
    const completed: { value: ReviewApplication | null } = { value: null };
    await runExclusiveTransaction(this.db, async (transaction) => {
      const repository = new DrugRepository(transaction);
      const drug = await repository.get(drugID);
      if (!drug) throw new Error('This drug profile is no longer available.');
      const result = applyReview(drug, rating, questionType, new Date(), caseID);
      await repository.save(result.drug);
      await transaction.runAsync(
        `INSERT INTO review_logs (
          id, drug_id, drug_name_snapshot, date, question_type_raw, rating_raw, was_correct, payload_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        result.review.id,
        result.review.drugID,
        result.review.drugNameSnapshot,
        isoDate(result.review.date),
        result.review.questionTypeRaw,
        result.review.ratingRaw,
        result.review.wasCorrect ? 1 : 0,
        JSON.stringify(result.review),
      );
      completed.value = result;
    });
    if (!completed.value) throw new Error('The review transaction did not complete.');
    return completed.value;
  }

  async summary(now = new Date()): Promise<LearningSummary> {
    const profileRow = await this.db.getFirstAsync<PayloadRow>(
      'SELECT payload_json FROM learning_profiles ORDER BY updated_at DESC LIMIT 1',
    );
    const activityRows = await this.db.getAllAsync<PayloadRow>(
      'SELECT payload_json FROM daily_activities',
    );
    const activities = activityRows.map((row) =>
      dailyActivityBackupSchema.parse(JSON.parse(row.payload_json) as unknown),
    );
    const today = activities.find((activity) => {
      const day = new Date(activity.day);
      return (
        !Number.isNaN(day.valueOf()) &&
        day.getFullYear() === now.getFullYear() &&
        day.getMonth() === now.getMonth() &&
        day.getDate() === now.getDate()
      );
    });
    return {
      profile: profileRow
        ? learningProfileBackupSchema.parse(JSON.parse(profileRow.payload_json) as unknown)
        : createLearningProfile('local-learning-profile'),
      today: today ?? null,
      week: buildWeeklyActivity(activities, now),
    };
  }

  async recordCompletedSession(
    session: CompletedSession,
    now = new Date(),
  ): Promise<LearningSummary> {
    const completed: { value: LearningSummary | null } = { value: null };
    await runExclusiveTransaction(this.db, async (transaction) => {
      const profileRow = await transaction.getFirstAsync<PayloadRow>(
        'SELECT payload_json FROM learning_profiles ORDER BY updated_at DESC LIMIT 1',
      );
      const activityRows = await transaction.getAllAsync<PayloadRow>(
        'SELECT payload_json FROM daily_activities',
      );
      const profile = profileRow
        ? learningProfileBackupSchema.parse(JSON.parse(profileRow.payload_json) as unknown)
        : createLearningProfile(Crypto.randomUUID());
      const activities = activityRows.map((row) =>
        dailyActivityBackupSchema.parse(JSON.parse(row.payload_json) as unknown),
      );
      const activity =
        activities.find((candidate) => {
          const day = new Date(candidate.day);
          return (
            !Number.isNaN(day.valueOf()) &&
            day.getFullYear() === now.getFullYear() &&
            day.getMonth() === now.getMonth() &&
            day.getDate() === now.getDate()
          );
        }) ?? createDailyActivity(Crypto.randomUUID(), now);

      const [reviewRows, drugRows] = await Promise.all([
        transaction.getAllAsync<PayloadRow>('SELECT payload_json FROM review_logs'),
        transaction.getAllAsync<PayloadRow>('SELECT payload_json FROM drug_profiles'),
      ]);
      const result = applyCompletedSession(
        profile,
        activity,
        session,
        {
          reviews: reviewRows.map((row) =>
            reviewBackupSchema.parse(JSON.parse(row.payload_json) as unknown),
          ),
          drugs: drugRows.map((row) =>
            drugBackupSchema.parse(JSON.parse(row.payload_json) as unknown),
          ),
        },
        now,
      );
      const updatedAt = now.toISOString();
      await transaction.runAsync(
        `INSERT INTO learning_profiles (id, current_streak, longest_streak, payload_json, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           current_streak = excluded.current_streak,
           longest_streak = excluded.longest_streak,
           payload_json = excluded.payload_json,
           updated_at = excluded.updated_at`,
        result.profile.id,
        result.profile.currentStreak,
        result.profile.longestStreak,
        JSON.stringify(result.profile),
        updatedAt,
      );
      await transaction.runAsync(
        `INSERT INTO daily_activities (
           id, day, sessions_completed, questions_answered, correct_answers,
           mission_completed, payload_json, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           day = excluded.day,
           sessions_completed = excluded.sessions_completed,
           questions_answered = excluded.questions_answered,
           correct_answers = excluded.correct_answers,
           mission_completed = excluded.mission_completed,
           payload_json = excluded.payload_json,
           updated_at = excluded.updated_at`,
        result.activity.id,
        isoDate(result.activity.day),
        result.activity.sessionsCompleted,
        result.activity.questionsAnswered,
        result.activity.correctAnswers,
        result.activity.missionCompleted ? 1 : 0,
        JSON.stringify(result.activity),
        updatedAt,
      );
      completed.value = {
        profile: result.profile,
        today: result.activity,
        week: buildWeeklyActivity(
          [
            ...activities.filter((candidate) => candidate.id !== result.activity.id),
            result.activity,
          ],
          now,
        ),
      };
    });
    if (!completed.value) throw new Error('The learning session transaction did not complete.');
    return completed.value;
  }

  async setWeakDrugRemindersEnabled(enabled: boolean): Promise<LearningProfileBackup> {
    const current = (await this.summary()).profile;
    const profile = { ...current, weakDrugRemindersEnabled: enabled };
    await this.db.runAsync(
      `INSERT INTO learning_profiles (id, current_streak, longest_streak, payload_json, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         current_streak = excluded.current_streak,
         longest_streak = excluded.longest_streak,
         payload_json = excluded.payload_json,
         updated_at = excluded.updated_at`,
      profile.id,
      profile.currentStreak,
      profile.longestStreak,
      JSON.stringify(profile),
      new Date().toISOString(),
    );
    return profile;
  }
}
