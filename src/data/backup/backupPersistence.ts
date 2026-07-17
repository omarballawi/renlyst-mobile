import { File } from 'expo-file-system';
import type { SQLiteDatabase } from 'expo-sqlite';

import {
  CURRENT_BACKUP_SCHEMA_VERSION,
  dailyActivityBackupSchema,
  drugBackupSchema,
  drugProductBackupSchema,
  drugRelationshipBackupSchema,
  encounterBackupSchema,
  learningProfileBackupSchema,
  reviewBackupSchema,
  shiftBackupSchema,
  trainingReportBackupSchema,
  type BackupRecordCounts,
  type DailyActivityBackup,
  type DrugBackup,
  type DrugProductBackup,
  type DrugRelationshipBackup,
  type EncounterBackup,
  type LearningProfileBackup,
  type PharmaShiftBackup,
  type ReviewBackup,
  type ShiftBackup,
  type TrainingReportBackup,
} from '@/domain/backup';
import { canonicalKeyForDrug, productKey } from '@/domain/drugs/identity';
import { masteryCount } from '@/domain/drugs/mastery';
import { isoDate } from '@/domain/shared/dates';
import { runExclusiveTransaction } from '@/data/database/transactions';

import type { PromotedBackupImage } from './imageStorage';

export type BackupRestoreMode = 'merge' | 'replace';

export type BackupRestoreSummary = {
  mode: BackupRestoreMode;
  counts: BackupRecordCounts;
  imageCount: number;
};

type PayloadRow = { payload_json: string };
type ImageUriRow = { uri: string };
type ImageExportRow = {
  drug_id: string | null;
  product_id: string | null;
  ordinal: number;
  role: 'original' | 'thumbnail';
  uri: string;
};

function bool(value: boolean): number {
  return value ? 1 : 0;
}

function nowISO(): string {
  return new Date().toISOString();
}

function countsFor(backup: PharmaShiftBackup): BackupRecordCounts {
  return {
    drugs: backup.drugs.length,
    reviews: backup.reviews.length,
    shifts: backup.shifts.length,
    encounters: backup.encounters.length,
    reports: backup.reports.length,
    learningProfiles: backup.learningProfiles?.length ?? 0,
    dailyActivities: backup.dailyActivities?.length ?? 0,
  };
}

function arabicSearchText(drug: DrugBackup): string {
  return [
    drug.arabicExplanation,
    drug.arabicMechanism,
    drug.arabicCounseling,
    drug.arabicMemoryStory,
    drug.arabicImportantNote,
    drug.arabicPersonalNotes,
    drug.counselingHowToTakeArabic,
    drug.counselingFoodArabic,
    drug.missedDoseArabic,
    drug.oneLineSummaryArabic,
    ...drug.patientFeelingsArabic,
    ...drug.seekHelpArabic,
  ]
    .filter(Boolean)
    .join(' ');
}

async function upsertDrug(
  db: SQLiteDatabase,
  drug: DrugBackup,
  hasPhoto: boolean,
  replaceImages: boolean,
): Promise<void> {
  const updatedAt = nowISO();
  await db.runAsync(
    `INSERT INTO drug_profiles (
      id, scientific_name, canonical_ingredient_key, chapter_raw, drug_class,
      trade_names_search, arabic_search, payload_json, date_added, last_seen_date,
      next_review_date, mastery_score, times_seen, is_unknown, is_confusing, has_photo, updated_at
    ) VALUES (
      $id, $scientificName, $canonicalKey, $chapterRaw, $drugClass,
      $tradeNames, $arabic, $payload, $dateAdded, $lastSeen,
      $nextReview, $mastery, $timesSeen, $isUnknown, $isConfusing, $hasPhoto, $updatedAt
    ) ON CONFLICT(id) DO UPDATE SET
      scientific_name = excluded.scientific_name,
      canonical_ingredient_key = excluded.canonical_ingredient_key,
      chapter_raw = excluded.chapter_raw,
      drug_class = excluded.drug_class,
      trade_names_search = excluded.trade_names_search,
      arabic_search = excluded.arabic_search,
      payload_json = excluded.payload_json,
      date_added = excluded.date_added,
      last_seen_date = excluded.last_seen_date,
      next_review_date = excluded.next_review_date,
      mastery_score = excluded.mastery_score,
      times_seen = excluded.times_seen,
      is_unknown = excluded.is_unknown,
      is_confusing = excluded.is_confusing,
      has_photo = CASE WHEN $replaceImages = 1 THEN excluded.has_photo ELSE drug_profiles.has_photo END,
      updated_at = excluded.updated_at`,
    {
      $id: drug.id,
      $scientificName: drug.scientificName,
      $canonicalKey: canonicalKeyForDrug(drug),
      $chapterRaw: drug.chapterRaw,
      $drugClass: drug.drugClass,
      $tradeNames: drug.tradeNames.join(' '),
      $arabic: arabicSearchText(drug),
      $payload: JSON.stringify(drug),
      $dateAdded: isoDate(drug.dateAdded),
      $lastSeen: drug.lastSeenDate == null ? null : isoDate(drug.lastSeenDate),
      $nextReview: isoDate(drug.nextReviewDate),
      $mastery: masteryCount(drug),
      $timesSeen: drug.timesSeen,
      $isUnknown: bool(drug.isUnknown),
      $isConfusing: bool(drug.isConfusing),
      $hasPhoto: bool(hasPhoto),
      $replaceImages: bool(replaceImages),
      $updatedAt: updatedAt,
    },
  );
}

async function upsertProduct(
  db: SQLiteDatabase,
  product: DrugProductBackup,
  profileID: string | null,
  ingredientKey: string,
  hasPhoto: boolean,
  replaceImages: boolean,
): Promise<void> {
  const resolvedProductKey = product.productKey.trim() || productKey(product, ingredientKey);
  await db.runAsync(
    `INSERT INTO drug_products (
      id, profile_id, product_key, trade_name, manufacturer, marketed_strength_label,
      dosage_form, country, payload_json, date_added, has_photo, updated_at
    ) VALUES (
      $id, $profileID, $productKey, $tradeName, $manufacturer, $strength,
      $dosageForm, $country, $payload, $dateAdded, $hasPhoto, $updatedAt
    ) ON CONFLICT(id) DO UPDATE SET
      profile_id = excluded.profile_id,
      product_key = excluded.product_key,
      trade_name = excluded.trade_name,
      manufacturer = excluded.manufacturer,
      marketed_strength_label = excluded.marketed_strength_label,
      dosage_form = excluded.dosage_form,
      country = excluded.country,
      payload_json = excluded.payload_json,
      date_added = excluded.date_added,
      has_photo = CASE WHEN $replaceImages = 1 THEN excluded.has_photo ELSE drug_products.has_photo END,
      updated_at = excluded.updated_at`,
    {
      $id: product.id,
      $profileID: profileID,
      $productKey: resolvedProductKey,
      $tradeName: product.tradeName,
      $manufacturer: product.manufacturer,
      $strength: product.marketedStrengthLabel ?? product.strength,
      $dosageForm: product.dosageForm,
      $country: product.country,
      $payload: JSON.stringify({ ...product, productKey: resolvedProductKey, profileID }),
      $dateAdded: isoDate(product.dateAdded),
      $hasPhoto: bool(hasPhoto),
      $replaceImages: bool(replaceImages),
      $updatedAt: nowISO(),
    },
  );
}

async function existingDrugIDs(db: SQLiteDatabase): Promise<Set<string>> {
  const rows = await db.getAllAsync<{ id: string }>('SELECT id FROM drug_profiles');
  return new Set(rows.map((row) => row.id));
}

async function replaceDelete(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    DELETE FROM drug_images;
    DELETE FROM drug_relationships;
    DELETE FROM drug_products;
    DELETE FROM review_logs;
    DELETE FROM shift_logs;
    DELETE FROM encounter_notes;
    DELETE FROM training_reports;
    DELETE FROM learning_profiles;
    DELETE FROM daily_activities;
    DELETE FROM drug_profiles;
  `);
}

async function insertImages(
  db: SQLiteDatabase,
  images: readonly PromotedBackupImage[],
): Promise<void> {
  for (const image of images) {
    await db.runAsync(
      `INSERT INTO drug_images (
        id, drug_id, product_id, ordinal, role, uri, sha256, byte_size, mime_type, created_at
      ) VALUES (
        $id, $drugID, $productID, $ordinal, $role, $uri, $sha256, $byteSize, $mimeType, $createdAt
      ) ON CONFLICT(id) DO UPDATE SET
        uri = excluded.uri,
        sha256 = excluded.sha256,
        byte_size = excluded.byte_size,
        mime_type = excluded.mime_type`,
      {
        $id: image.id,
        $drugID: image.ownerType === 'drug' ? image.ownerID : null,
        $productID: image.ownerType === 'product' ? image.ownerID : null,
        $ordinal: image.ordinal,
        $role: image.role,
        $uri: image.finalUri,
        $sha256: image.sha256,
        $byteSize: image.byteSize,
        $mimeType: image.mimeType,
        $createdAt: nowISO(),
      },
    );
  }
}

async function upsertRelationships(
  db: SQLiteDatabase,
  relationships: readonly DrugRelationshipBackup[],
  validDrugIDs: ReadonlySet<string>,
): Promise<void> {
  for (const relationship of relationships) {
    await db.runAsync(
      `INSERT INTO drug_relationships (
        id, relationship_key, kind_raw, severity_raw, source_drug_id, target_drug_id,
        payload_json, checked_at, updated_at
      ) VALUES ($id, $key, $kind, $severity, $sourceID, $targetID, $payload, $checkedAt, $updatedAt)
      ON CONFLICT(id) DO UPDATE SET
        relationship_key = excluded.relationship_key,
        kind_raw = excluded.kind_raw,
        severity_raw = excluded.severity_raw,
        source_drug_id = excluded.source_drug_id,
        target_drug_id = excluded.target_drug_id,
        payload_json = excluded.payload_json,
        checked_at = excluded.checked_at,
        updated_at = excluded.updated_at`,
      {
        $id: relationship.id,
        $key: relationship.relationshipKey,
        $kind: relationship.kindRaw,
        $severity: relationship.severityRaw,
        $sourceID:
          relationship.sourceDrugID && validDrugIDs.has(relationship.sourceDrugID)
            ? relationship.sourceDrugID
            : null,
        $targetID:
          relationship.targetDrugID && validDrugIDs.has(relationship.targetDrugID)
            ? relationship.targetDrugID
            : null,
        $payload: JSON.stringify(relationship),
        $checkedAt: isoDate(relationship.checkedAt),
        $updatedAt: nowISO(),
      },
    );
  }
}

async function upsertReviews(
  db: SQLiteDatabase,
  reviews: readonly ReviewBackup[],
  validDrugIDs: ReadonlySet<string>,
): Promise<void> {
  for (const review of reviews) {
    const drugID = review.drugID && validDrugIDs.has(review.drugID) ? review.drugID : null;
    await db.runAsync(
      `INSERT INTO review_logs (
        id, drug_id, drug_name_snapshot, date, question_type_raw, rating_raw, was_correct, payload_json
      ) VALUES ($id, $drugID, $snapshot, $date, $questionType, $rating, $correct, $payload)
      ON CONFLICT(id) DO UPDATE SET
        drug_id = excluded.drug_id,
        drug_name_snapshot = excluded.drug_name_snapshot,
        date = excluded.date,
        question_type_raw = excluded.question_type_raw,
        rating_raw = excluded.rating_raw,
        was_correct = excluded.was_correct,
        payload_json = excluded.payload_json`,
      {
        $id: review.id,
        $drugID: drugID,
        $snapshot: review.drugNameSnapshot,
        $date: isoDate(review.date),
        $questionType: review.questionTypeRaw,
        $rating: review.ratingRaw,
        $correct: bool(review.wasCorrect),
        $payload: JSON.stringify({ ...review, drugID }),
      },
    );
  }
}

async function upsertShifts(db: SQLiteDatabase, shifts: readonly ShiftBackup[]): Promise<void> {
  for (const shift of shifts) {
    await db.runAsync(
      `INSERT INTO shift_logs (id, date, started_at, ended_at, is_completed, payload_json, updated_at)
      VALUES ($id, $date, $startedAt, $endedAt, $completed, $payload, $updatedAt)
      ON CONFLICT(id) DO UPDATE SET
        date = excluded.date, started_at = excluded.started_at, ended_at = excluded.ended_at,
        is_completed = excluded.is_completed, payload_json = excluded.payload_json, updated_at = excluded.updated_at`,
      {
        $id: shift.id,
        $date: isoDate(shift.date),
        $startedAt: isoDate(shift.startedAt),
        $endedAt: shift.endedAt == null ? null : isoDate(shift.endedAt),
        $completed: bool(shift.isCompleted),
        $payload: JSON.stringify(shift),
        $updatedAt: nowISO(),
      },
    );
  }
}

async function upsertEncounters(
  db: SQLiteDatabase,
  encounters: readonly EncounterBackup[],
  validDrugIDs: ReadonlySet<string>,
): Promise<void> {
  for (const encounter of encounters) {
    const relatedID =
      encounter.relatedDrugID && validDrugIDs.has(encounter.relatedDrugID)
        ? encounter.relatedDrugID
        : null;
    await db.runAsync(
      `INSERT INTO encounter_notes (
        id, date, topic, related_drug_id, related_drug_name_snapshot, privacy_confirmed, payload_json, updated_at
      ) VALUES ($id, $date, $topic, $drugID, $snapshot, $confirmed, $payload, $updatedAt)
      ON CONFLICT(id) DO UPDATE SET
        date = excluded.date, topic = excluded.topic, related_drug_id = excluded.related_drug_id,
        related_drug_name_snapshot = excluded.related_drug_name_snapshot,
        privacy_confirmed = excluded.privacy_confirmed, payload_json = excluded.payload_json,
        updated_at = excluded.updated_at`,
      {
        $id: encounter.id,
        $date: isoDate(encounter.date),
        $topic: encounter.topic,
        $drugID: relatedID,
        $snapshot: encounter.relatedDrugNameSnapshot,
        $confirmed: bool(encounter.privacyConfirmed),
        $payload: JSON.stringify({ ...encounter, relatedDrugID: relatedID }),
        $updatedAt: nowISO(),
      },
    );
  }
}

async function upsertReports(
  db: SQLiteDatabase,
  reports: readonly TrainingReportBackup[],
): Promise<void> {
  for (const report of reports) {
    await db.runAsync(
      `INSERT INTO training_reports (id, period_start, period_end, generated_at, updated_at, payload_json)
      VALUES ($id, $start, $end, $generated, $updated, $payload)
      ON CONFLICT(id) DO UPDATE SET
        period_start = excluded.period_start, period_end = excluded.period_end,
        generated_at = excluded.generated_at, updated_at = excluded.updated_at,
        payload_json = excluded.payload_json`,
      {
        $id: report.id,
        $start: isoDate(report.periodStart),
        $end: isoDate(report.periodEnd),
        $generated: isoDate(report.generatedAt),
        $updated: isoDate(report.updatedAt),
        $payload: JSON.stringify(report),
      },
    );
  }
}

async function upsertLearningProfiles(
  db: SQLiteDatabase,
  profiles: readonly LearningProfileBackup[],
): Promise<void> {
  for (const profile of profiles) {
    await db.runAsync(
      `INSERT INTO learning_profiles (id, current_streak, longest_streak, payload_json, updated_at)
      VALUES ($id, $current, $longest, $payload, $updatedAt)
      ON CONFLICT(id) DO UPDATE SET
        current_streak = excluded.current_streak, longest_streak = excluded.longest_streak,
        payload_json = excluded.payload_json, updated_at = excluded.updated_at`,
      {
        $id: profile.id,
        $current: profile.currentStreak,
        $longest: profile.longestStreak,
        $payload: JSON.stringify(profile),
        $updatedAt: nowISO(),
      },
    );
  }
}

async function upsertDailyActivities(
  db: SQLiteDatabase,
  activities: readonly DailyActivityBackup[],
): Promise<void> {
  for (const activity of activities) {
    await db.runAsync(
      `INSERT INTO daily_activities (
        id, day, sessions_completed, questions_answered, correct_answers, mission_completed, payload_json, updated_at
      ) VALUES ($id, $day, $sessions, $questions, $correct, $mission, $payload, $updatedAt)
      ON CONFLICT(id) DO UPDATE SET
        day = excluded.day, sessions_completed = excluded.sessions_completed,
        questions_answered = excluded.questions_answered, correct_answers = excluded.correct_answers,
        mission_completed = excluded.mission_completed, payload_json = excluded.payload_json,
        updated_at = excluded.updated_at`,
      {
        $id: activity.id,
        $day: isoDate(activity.day),
        $sessions: activity.sessionsCompleted,
        $questions: activity.questionsAnswered,
        $correct: activity.correctAnswers,
        $mission: bool(activity.missionCompleted),
        $payload: JSON.stringify(activity),
        $updatedAt: nowISO(),
      },
    );
  }
}

export class BackupPersistence {
  constructor(private readonly db: SQLiteDatabase) {}

  async restore(
    backup: PharmaShiftBackup,
    images: readonly PromotedBackupImage[],
    mode: BackupRestoreMode,
    sourceHash: string,
  ): Promise<{ summary: BackupRestoreSummary; staleImageUris: string[] }> {
    const previousImages = await this.db.getAllAsync<ImageUriRow>('SELECT uri FROM drug_images');

    await runExclusiveTransaction(this.db, async (transaction) => {
      if (mode === 'replace') await replaceDelete(transaction);

      const imageOwnerKeys = new Set(images.map((image) => `${image.ownerType}:${image.ownerID}`));
      for (const drug of backup.drugs) {
        await upsertDrug(
          transaction,
          drug,
          imageOwnerKeys.has(`drug:${drug.id}`),
          backup.includesImages,
        );
      }

      const validDrugIDs = await existingDrugIDs(transaction);
      for (const product of backup.products ?? []) {
        const profileID =
          product.profileID && validDrugIDs.has(product.profileID) ? product.profileID : null;
        const linkedDrug = profileID
          ? backup.drugs.find((drug) => drug.id === profileID)
          : undefined;
        const ingredientKey = linkedDrug ? canonicalKeyForDrug(linkedDrug) : `orphan:${product.id}`;
        await upsertProduct(
          transaction,
          product,
          profileID,
          ingredientKey,
          imageOwnerKeys.has(`product:${product.id}`),
          backup.includesImages,
        );
      }

      if (backup.includesImages) {
        for (const drug of backup.drugs) {
          await transaction.runAsync('DELETE FROM drug_images WHERE drug_id = ?', drug.id);
        }
        for (const product of backup.products ?? []) {
          await transaction.runAsync('DELETE FROM drug_images WHERE product_id = ?', product.id);
        }
        await insertImages(transaction, images);
        await transaction.execAsync(`
          UPDATE drug_profiles
          SET has_photo = CASE WHEN EXISTS (
            SELECT 1 FROM drug_images di
            LEFT JOIN drug_products dp ON dp.id = di.product_id
            WHERE di.drug_id = drug_profiles.id OR dp.profile_id = drug_profiles.id
          ) THEN 1 ELSE 0 END;
        `);
      }

      await upsertRelationships(transaction, backup.relationships ?? [], validDrugIDs);
      await upsertReviews(transaction, backup.reviews, validDrugIDs);
      await upsertShifts(transaction, backup.shifts);
      await upsertEncounters(transaction, backup.encounters, validDrugIDs);
      await upsertReports(transaction, backup.reports);
      await upsertLearningProfiles(transaction, backup.learningProfiles ?? []);
      await upsertDailyActivities(transaction, backup.dailyActivities ?? []);
      await transaction.runAsync(
        `INSERT INTO import_history (
          id, schema_version, mode, includes_images, counts_json, source_hash, imported_at
        ) VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?, ?)`,
        backup.schemaVersion,
        mode,
        bool(backup.includesImages),
        JSON.stringify(countsFor(backup)),
        sourceHash,
        nowISO(),
      );
    });

    const referenced = new Set(
      (await this.db.getAllAsync<ImageUriRow>('SELECT uri FROM drug_images')).map((row) => row.uri),
    );
    const staleImageUris = previousImages
      .map((row) => row.uri)
      .filter((uri) => !referenced.has(uri));
    return {
      summary: { mode, counts: countsFor(backup), imageCount: images.length },
      staleImageUris,
    };
  }

  async makeBackup(includesImages: boolean): Promise<PharmaShiftBackup> {
    const parseRows = async <T>(
      table: string,
      parser: { parse(value: unknown): T },
    ): Promise<T[]> => {
      const rows = await this.db.getAllAsync<PayloadRow>(`SELECT payload_json FROM ${table}`);
      return rows.map((row) => parser.parse(JSON.parse(row.payload_json) as unknown));
    };

    const drugs = await parseRows('drug_profiles', drugBackupSchema);
    const products = await parseRows('drug_products', drugProductBackupSchema);
    const relationships = await parseRows('drug_relationships', drugRelationshipBackupSchema);
    const reviews = await parseRows('review_logs', reviewBackupSchema);
    const shifts = await parseRows('shift_logs', shiftBackupSchema);
    const encounters = await parseRows('encounter_notes', encounterBackupSchema);
    const reports = await parseRows('training_reports', trainingReportBackupSchema);
    const learningProfiles = await parseRows('learning_profiles', learningProfileBackupSchema);
    const dailyActivities = await parseRows('daily_activities', dailyActivityBackupSchema);

    if (includesImages) {
      const images = await this.db.getAllAsync<ImageExportRow>(
        'SELECT drug_id, product_id, ordinal, role, uri FROM drug_images ORDER BY ordinal, role',
      );
      await this.rehydrateImages(drugs, products, images);
    }

    const backup: PharmaShiftBackup = {
      schemaVersion: CURRENT_BACKUP_SCHEMA_VERSION,
      exportedAt: nowISO(),
      counts: {
        drugs: drugs.length,
        reviews: reviews.length,
        shifts: shifts.length,
        encounters: encounters.length,
        reports: reports.length,
        learningProfiles: learningProfiles.length,
        dailyActivities: dailyActivities.length,
      },
      includesImages,
      drugs,
      reviews,
      shifts,
      encounters,
      reports,
      learningProfiles,
      dailyActivities,
      products,
      relationships,
    };
    return backup;
  }

  private async rehydrateImages(
    drugs: DrugBackup[],
    products: DrugProductBackup[],
    images: readonly ImageExportRow[],
  ): Promise<void> {
    const drugByID = new Map(drugs.map((drug) => [drug.id, drug]));
    const productByID = new Map(products.map((product) => [product.id, product]));
    for (const image of images) {
      const record = image.drug_id
        ? drugByID.get(image.drug_id)
        : image.product_id
          ? productByID.get(image.product_id)
          : undefined;
      if (!record) continue;
      const file = new File(image.uri);
      if (!file.exists) continue;
      const base64 = await file.base64();
      if (image.ordinal === 0 && image.role === 'original') record.imageData = base64;
      else if (image.ordinal === 0 && image.role === 'thumbnail') record.thumbnailData = base64;
      else if (image.role === 'original') record.additionalImageData[image.ordinal - 1] = base64;
      else record.additionalThumbnailData[image.ordinal - 1] = base64;
    }
    for (const record of [...drugs, ...products]) {
      record.additionalImageData = record.additionalImageData.filter(Boolean);
      record.additionalThumbnailData = record.additionalThumbnailData.filter(Boolean);
    }
  }
}
