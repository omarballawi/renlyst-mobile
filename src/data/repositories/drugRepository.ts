import { File } from 'expo-file-system';
import type { SQLiteDatabase } from 'expo-sqlite';
import { Platform } from 'react-native';

import { drugBackupSchema, type DrugBackup } from '@/domain/backup';
import { canonicalKeyForDrug } from '@/domain/drugs/identity';
import { masteryCount } from '@/domain/drugs/mastery';
import { addLocalDays, dateFromLegacy, isoDate } from '@/domain/shared/dates';
import { runExclusiveTransaction } from '@/data/database/transactions';

export type LibraryScope = 'all' | 'due' | 'needsAttention' | 'noPhoto';
export type LibrarySort = 'name' | 'recent' | 'due' | 'mastery';
export type ProfileHistoryPolicy = 'keepHistory' | 'eraseHistory';

export type DrugListOptions = {
  query?: string;
  scope?: LibraryScope;
  sort?: LibrarySort;
  limit?: number;
  now?: Date;
};

export type DrugDeletionImpact = {
  brandCount: number;
  relationshipCount: number;
  reviewCount: number;
  encounterCount: number;
};

export type LibrarySummary = {
  profiles: number;
  brands: number;
  due: number;
  mastered: number;
};

type DrugRow = { payload_json: string };
type CountRow = { count: number };
type SummaryRow = {
  profiles: number;
  due: number;
  mastered: number;
};
type ImageRow = { drug_id: string; uri: string };
type ImageUriRow = { uri: string };
export type StoredDrugImage = { uri: string; width: number; height: number };

function bool(value: boolean): number {
  return value ? 1 : 0;
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

function ftsQuery(value: string): string {
  return value
    .trim()
    .split(/\s+/u)
    .filter(Boolean)
    .map((token) => `"${token.replaceAll('"', '""')}"*`)
    .join(' AND ');
}

const sortSQL: Record<LibrarySort, string> = {
  name: 'dp.scientific_name COLLATE NOCASE ASC',
  recent: 'COALESCE(dp.last_seen_date, dp.date_added) DESC, dp.scientific_name COLLATE NOCASE ASC',
  due: 'dp.next_review_date ASC, dp.scientific_name COLLATE NOCASE ASC',
  mastery: 'dp.mastery_score ASC, dp.next_review_date ASC, dp.scientific_name COLLATE NOCASE ASC',
};

export class DrugRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async get(id: string): Promise<DrugBackup | null> {
    const row = await this.db.getFirstAsync<DrugRow>(
      'SELECT payload_json FROM drug_profiles WHERE id = ?',
      id,
    );
    return row ? drugBackupSchema.parse(JSON.parse(row.payload_json) as unknown) : null;
  }

  async markSeen(id: string, now = new Date()): Promise<boolean> {
    const drug = await this.get(id);
    if (!drug) return false;
    const lastSeen = drug.lastSeenDate == null ? null : dateFromLegacy(drug.lastSeenDate);
    if (lastSeen && sameLocalDay(lastSeen, now)) return false;
    const updated = { ...drug, lastSeenDate: now.toISOString(), timesSeen: drug.timesSeen + 1 };
    await this.db.runAsync(
      `UPDATE drug_profiles
       SET payload_json = ?, last_seen_date = ?, times_seen = ?, updated_at = ?
       WHERE id = ?`,
      JSON.stringify(updated),
      now.toISOString(),
      updated.timesSeen,
      now.toISOString(),
      id,
    );
    return true;
  }

  async list(options: DrugListOptions = {}): Promise<DrugBackup[]> {
    const query = options.query?.trim() ?? '';
    const scope = options.scope ?? 'all';
    const sort = options.sort ?? 'name';
    const tomorrow = addLocalDays(options.now ?? new Date(), 1).toISOString();
    const where: string[] = [];
    const parameters: Record<string, string | number> = { $limit: options.limit ?? 10_000 };

    if (query) {
      if (Platform.OS === 'web') {
        where.push(`(
          lower(dp.payload_json) LIKE $contains
          OR dp.id IN (
            SELECT profile_id FROM drug_products
            WHERE profile_id IS NOT NULL AND lower(payload_json) LIKE $contains
          )
        )`);
      } else {
        where.push(`(
          dp.rowid IN (SELECT rowid FROM drug_profiles_fts WHERE drug_profiles_fts MATCH $query)
          OR lower(dp.payload_json) LIKE $contains
          OR dp.id IN (
            SELECT profile_id FROM drug_products
            WHERE profile_id IS NOT NULL
              AND (
                rowid IN (SELECT rowid FROM drug_products_fts WHERE drug_products_fts MATCH $query)
                OR lower(payload_json) LIKE $contains
              )
          )
        )`);
        parameters.$query = ftsQuery(query);
      }
      parameters.$contains = `%${query.toLocaleLowerCase()}%`;
    }

    if (scope === 'due') {
      where.push('dp.next_review_date < $tomorrow');
      parameters.$tomorrow = tomorrow;
    }
    if (scope === 'needsAttention') {
      where.push(`(
        dp.is_unknown = 1 OR dp.is_confusing = 1
        OR dp.mastery_score < CASE WHEN trim(dp.drug_class) = '' THEN 5 ELSE 6 END
      )`);
    }
    if (scope === 'noPhoto') where.push('dp.has_photo = 0');

    const rows = await this.db.getAllAsync<DrugRow>(
      `SELECT dp.payload_json
       FROM drug_profiles dp
       ${where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY ${sortSQL[sort]}
       LIMIT $limit`,
      parameters,
    );
    return rows.map((row) => drugBackupSchema.parse(JSON.parse(row.payload_json) as unknown));
  }

  async summary(now = new Date()): Promise<LibrarySummary> {
    const tomorrow = addLocalDays(now, 1).toISOString();
    const profileRow = await this.db.getFirstAsync<SummaryRow>(
      `SELECT
        COUNT(*) AS profiles,
        COALESCE(SUM(CASE WHEN next_review_date < ? THEN 1 ELSE 0 END), 0) AS due,
        COALESCE(SUM(CASE WHEN mastery_score >= CASE WHEN trim(drug_class) = '' THEN 5 ELSE 6 END THEN 1 ELSE 0 END), 0) AS mastered
       FROM drug_profiles`,
      tomorrow,
    );
    const brandRow = await this.db.getFirstAsync<CountRow>(
      'SELECT COUNT(*) AS count FROM drug_products',
    );
    return {
      profiles: profileRow?.profiles ?? 0,
      brands: brandRow?.count ?? 0,
      due: profileRow?.due ?? 0,
      mastered: profileRow?.mastered ?? 0,
    };
  }

  async primaryImageUris(): Promise<Record<string, string>> {
    const rows = await this.db.getAllAsync<ImageRow>(
      `SELECT drug_id, uri FROM (
         SELECT di.drug_id, di.uri, 0 AS owner_priority,
           CASE di.role WHEN 'card' THEN 0 ELSE 1 END AS role_priority
         FROM drug_images di
         WHERE di.drug_id IS NOT NULL AND di.ordinal = 0 AND di.role IN ('original', 'card')
         UNION ALL
         SELECT dp.profile_id AS drug_id, di.uri, 1 AS owner_priority,
           CASE di.role WHEN 'card' THEN 0 ELSE 1 END AS role_priority
         FROM drug_images di
         JOIN drug_products dp ON dp.id = di.product_id
         WHERE dp.profile_id IS NOT NULL AND di.ordinal = 0 AND di.role IN ('original', 'card')
       )
       ORDER BY owner_priority, role_priority`,
    );
    const result: Record<string, string> = {};
    for (const row of rows) result[row.drug_id] ??= row.uri;
    return result;
  }

  async listImageSources(drugID: string): Promise<StoredDrugImage[]> {
    return this.db.getAllAsync<StoredDrugImage>(
      `SELECT uri, COALESCE(width, 1) AS width, COALESCE(height, 1) AS height
       FROM drug_images
       WHERE drug_id = ? AND role = 'original'
       ORDER BY ordinal`,
      drugID,
    );
  }

  async save(drug: DrugBackup): Promise<void> {
    const parsed = drugBackupSchema.parse(drug);
    const existingPhoto = await this.db.getFirstAsync<CountRow>(
      'SELECT COUNT(*) AS count FROM drug_images WHERE drug_id = ?',
      parsed.id,
    );
    await this.db.runAsync(
      `INSERT INTO drug_profiles (
        id, scientific_name, canonical_ingredient_key, chapter_raw, drug_class,
        trade_names_search, arabic_search, payload_json, date_added, last_seen_date,
        next_review_date, mastery_score, times_seen, is_unknown, is_confusing, has_photo, updated_at
      ) VALUES (
        $id, $name, $key, $chapter, $class, $trades, $arabic, $payload, $added,
        $seen, $due, $mastery, $timesSeen, $unknown, $confusing, $photo, $updated
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
        updated_at = excluded.updated_at`,
      {
        $id: parsed.id,
        $name: parsed.scientificName,
        $key: canonicalKeyForDrug(parsed),
        $chapter: parsed.chapterRaw,
        $class: parsed.drugClass,
        $trades: parsed.tradeNames.join(' '),
        $arabic: arabicSearchText(parsed),
        $payload: JSON.stringify(parsed),
        $added: isoDate(parsed.dateAdded),
        $seen: parsed.lastSeenDate == null ? null : isoDate(parsed.lastSeenDate),
        $due: isoDate(parsed.nextReviewDate),
        $mastery: masteryCount(parsed),
        $timesSeen: parsed.timesSeen,
        $unknown: bool(parsed.isUnknown),
        $confusing: bool(parsed.isConfusing),
        $photo: bool((existingPhoto?.count ?? 0) > 0),
        $updated: new Date().toISOString(),
      },
    );
    await this.invalidatePracticePacks();
  }

  async deletionImpact(id: string): Promise<DrugDeletionImpact> {
    const [brands, relationships, reviews, encounters] = await Promise.all([
      this.db.getFirstAsync<CountRow>(
        'SELECT COUNT(*) AS count FROM drug_products WHERE profile_id = ?',
        id,
      ),
      this.db.getFirstAsync<CountRow>(
        'SELECT COUNT(*) AS count FROM drug_relationships WHERE source_drug_id = ? OR target_drug_id = ?',
        id,
        id,
      ),
      this.db.getFirstAsync<CountRow>(
        'SELECT COUNT(*) AS count FROM review_logs WHERE drug_id = ?',
        id,
      ),
      this.db.getFirstAsync<CountRow>(
        'SELECT COUNT(*) AS count FROM encounter_notes WHERE related_drug_id = ?',
        id,
      ),
    ]);
    return {
      brandCount: brands?.count ?? 0,
      relationshipCount: relationships?.count ?? 0,
      reviewCount: reviews?.count ?? 0,
      encounterCount: encounters?.count ?? 0,
    };
  }

  async deleteProfile(id: string, policy: ProfileHistoryPolicy): Promise<void> {
    const imageRows = await this.db.getAllAsync<ImageUriRow>(
      `SELECT di.uri FROM drug_images di
       LEFT JOIN drug_products dp ON dp.id = di.product_id
       WHERE di.drug_id = ? OR dp.profile_id = ?`,
      id,
      id,
    );
    await runExclusiveTransaction(this.db, async (transaction) => {
      await transaction.runAsync(
        'DELETE FROM drug_relationships WHERE source_drug_id = ? OR target_drug_id = ?',
        id,
        id,
      );
      if (policy === 'eraseHistory') {
        await transaction.runAsync('DELETE FROM review_logs WHERE drug_id = ?', id);
        await transaction.runAsync('DELETE FROM encounter_notes WHERE related_drug_id = ?', id);
      } else {
        await transaction.runAsync(
          `UPDATE review_logs
           SET drug_id = NULL, payload_json = json_set(payload_json, '$.drugID', NULL)
           WHERE drug_id = ?`,
          id,
        );
        await transaction.runAsync(
          `UPDATE encounter_notes
           SET related_drug_id = NULL,
               payload_json = json_set(payload_json, '$.relatedDrugID', NULL),
               updated_at = ?
           WHERE related_drug_id = ?`,
          new Date().toISOString(),
          id,
        );
      }
      await transaction.runAsync('DELETE FROM drug_profiles WHERE id = ?', id);
      await transaction.runAsync(
        'UPDATE practice_packs SET invalidated_at = ? WHERE invalidated_at IS NULL',
        new Date().toISOString(),
      );
    });
    for (const row of imageRows) {
      const file = new File(row.uri);
      if (file.exists) file.delete();
    }
  }

  async invalidatePracticePacks(): Promise<void> {
    await this.db.runAsync(
      'UPDATE practice_packs SET invalidated_at = ? WHERE invalidated_at IS NULL',
      new Date().toISOString(),
    );
  }
}

export function sameLocalDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}
