export type DatabaseMigration = {
  version: number;
  name: string;
  sql: string;
};

export const DATABASE_SCHEMA_VERSION = 1;

export const databaseMigrations: readonly DatabaseMigration[] = [
  {
    version: 1,
    name: 'initial_offline_parity_store',
    sql: `
      CREATE TABLE IF NOT EXISTS drug_profiles (
        id TEXT PRIMARY KEY NOT NULL,
        scientific_name TEXT NOT NULL,
        canonical_ingredient_key TEXT NOT NULL,
        chapter_raw TEXT NOT NULL DEFAULT '',
        drug_class TEXT NOT NULL DEFAULT '',
        trade_names_search TEXT NOT NULL DEFAULT '',
        arabic_search TEXT NOT NULL DEFAULT '',
        payload_json TEXT NOT NULL,
        date_added TEXT NOT NULL,
        last_seen_date TEXT,
        next_review_date TEXT NOT NULL,
        mastery_score INTEGER NOT NULL DEFAULT 0 CHECK (mastery_score BETWEEN 0 AND 6),
        times_seen INTEGER NOT NULL DEFAULT 0 CHECK (times_seen >= 0),
        is_unknown INTEGER NOT NULL DEFAULT 0 CHECK (is_unknown IN (0, 1)),
        is_confusing INTEGER NOT NULL DEFAULT 0 CHECK (is_confusing IN (0, 1)),
        has_photo INTEGER NOT NULL DEFAULT 0 CHECK (has_photo IN (0, 1)),
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS drug_profiles_due_index
        ON drug_profiles(next_review_date, scientific_name COLLATE NOCASE);
      CREATE INDEX IF NOT EXISTS drug_profiles_recent_index
        ON drug_profiles(last_seen_date DESC, date_added DESC);
      CREATE INDEX IF NOT EXISTS drug_profiles_mastery_index
        ON drug_profiles(mastery_score, scientific_name COLLATE NOCASE);
      CREATE UNIQUE INDEX IF NOT EXISTS drug_profiles_canonical_index
        ON drug_profiles(canonical_ingredient_key);

      /* RENLYST_NATIVE_FTS_START */
      CREATE VIRTUAL TABLE IF NOT EXISTS drug_profiles_fts USING fts5(
        scientific_name,
        trade_names,
        drug_class,
        indications,
        arabic,
        shelf_location,
        content='drug_profiles',
        content_rowid='rowid',
        tokenize='unicode61 remove_diacritics 2'
      );

      CREATE TRIGGER IF NOT EXISTS drug_profiles_after_insert AFTER INSERT ON drug_profiles BEGIN
        INSERT INTO drug_profiles_fts(rowid, scientific_name, trade_names, drug_class, indications, arabic, shelf_location)
        VALUES (
          new.rowid,
          new.scientific_name,
          new.trade_names_search,
          new.drug_class,
          json_extract(new.payload_json, '$.indications'),
          new.arabic_search,
          json_extract(new.payload_json, '$.shelfLocation')
        );
      END;

      CREATE TRIGGER IF NOT EXISTS drug_profiles_after_delete AFTER DELETE ON drug_profiles BEGIN
        INSERT INTO drug_profiles_fts(drug_profiles_fts, rowid, scientific_name, trade_names, drug_class, indications, arabic, shelf_location)
        VALUES ('delete', old.rowid, old.scientific_name, old.trade_names_search, old.drug_class, json_extract(old.payload_json, '$.indications'), old.arabic_search, json_extract(old.payload_json, '$.shelfLocation'));
      END;

      CREATE TRIGGER IF NOT EXISTS drug_profiles_after_update AFTER UPDATE ON drug_profiles BEGIN
        INSERT INTO drug_profiles_fts(drug_profiles_fts, rowid, scientific_name, trade_names, drug_class, indications, arabic, shelf_location)
        VALUES ('delete', old.rowid, old.scientific_name, old.trade_names_search, old.drug_class, json_extract(old.payload_json, '$.indications'), old.arabic_search, json_extract(old.payload_json, '$.shelfLocation'));
        INSERT INTO drug_profiles_fts(rowid, scientific_name, trade_names, drug_class, indications, arabic, shelf_location)
        VALUES (new.rowid, new.scientific_name, new.trade_names_search, new.drug_class, json_extract(new.payload_json, '$.indications'), new.arabic_search, json_extract(new.payload_json, '$.shelfLocation'));
      END;
      /* RENLYST_NATIVE_FTS_END */

      CREATE TABLE IF NOT EXISTS drug_products (
        id TEXT PRIMARY KEY NOT NULL,
        profile_id TEXT REFERENCES drug_profiles(id) ON DELETE CASCADE,
        product_key TEXT NOT NULL,
        trade_name TEXT NOT NULL,
        manufacturer TEXT NOT NULL DEFAULT '',
        marketed_strength_label TEXT NOT NULL DEFAULT '',
        dosage_form TEXT NOT NULL DEFAULT '',
        country TEXT NOT NULL DEFAULT '',
        payload_json TEXT NOT NULL,
        date_added TEXT NOT NULL,
        has_photo INTEGER NOT NULL DEFAULT 0 CHECK (has_photo IN (0, 1)),
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS drug_products_profile_index ON drug_products(profile_id, trade_name COLLATE NOCASE);
      CREATE UNIQUE INDEX IF NOT EXISTS drug_products_key_index ON drug_products(product_key);

      /* RENLYST_NATIVE_FTS_START */
      CREATE VIRTUAL TABLE IF NOT EXISTS drug_products_fts USING fts5(
        trade_name,
        manufacturer,
        strength,
        dosage_form,
        country,
        content='drug_products',
        content_rowid='rowid',
        tokenize='unicode61 remove_diacritics 2'
      );

      CREATE TRIGGER IF NOT EXISTS drug_products_after_insert AFTER INSERT ON drug_products BEGIN
        INSERT INTO drug_products_fts(rowid, trade_name, manufacturer, strength, dosage_form, country)
        VALUES (new.rowid, new.trade_name, new.manufacturer, new.marketed_strength_label, new.dosage_form, new.country);
      END;
      CREATE TRIGGER IF NOT EXISTS drug_products_after_delete AFTER DELETE ON drug_products BEGIN
        INSERT INTO drug_products_fts(drug_products_fts, rowid, trade_name, manufacturer, strength, dosage_form, country)
        VALUES ('delete', old.rowid, old.trade_name, old.manufacturer, old.marketed_strength_label, old.dosage_form, old.country);
      END;
      CREATE TRIGGER IF NOT EXISTS drug_products_after_update AFTER UPDATE ON drug_products BEGIN
        INSERT INTO drug_products_fts(drug_products_fts, rowid, trade_name, manufacturer, strength, dosage_form, country)
        VALUES ('delete', old.rowid, old.trade_name, old.manufacturer, old.marketed_strength_label, old.dosage_form, old.country);
        INSERT INTO drug_products_fts(rowid, trade_name, manufacturer, strength, dosage_form, country)
        VALUES (new.rowid, new.trade_name, new.manufacturer, new.marketed_strength_label, new.dosage_form, new.country);
      END;
      /* RENLYST_NATIVE_FTS_END */

      CREATE TABLE IF NOT EXISTS drug_images (
        id TEXT PRIMARY KEY NOT NULL,
        drug_id TEXT REFERENCES drug_profiles(id) ON DELETE CASCADE,
        product_id TEXT REFERENCES drug_products(id) ON DELETE CASCADE,
        ordinal INTEGER NOT NULL CHECK (ordinal BETWEEN 0 AND 7),
        role TEXT NOT NULL CHECK (role IN ('original', 'card', 'thumbnail')),
        uri TEXT NOT NULL,
        sha256 TEXT NOT NULL,
        byte_size INTEGER NOT NULL CHECK (byte_size >= 0),
        mime_type TEXT NOT NULL,
        width INTEGER,
        height INTEGER,
        created_at TEXT NOT NULL,
        CHECK ((drug_id IS NOT NULL AND product_id IS NULL) OR (drug_id IS NULL AND product_id IS NOT NULL)),
        UNIQUE (drug_id, product_id, ordinal, role)
      );
      CREATE INDEX IF NOT EXISTS drug_images_drug_index ON drug_images(drug_id, ordinal, role);
      CREATE INDEX IF NOT EXISTS drug_images_product_index ON drug_images(product_id, ordinal, role);

      CREATE TABLE IF NOT EXISTS drug_relationships (
        id TEXT PRIMARY KEY NOT NULL,
        relationship_key TEXT NOT NULL,
        kind_raw TEXT NOT NULL,
        severity_raw TEXT NOT NULL,
        source_drug_id TEXT REFERENCES drug_profiles(id) ON DELETE SET NULL,
        target_drug_id TEXT REFERENCES drug_profiles(id) ON DELETE SET NULL,
        payload_json TEXT NOT NULL,
        checked_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS drug_relationships_key_index ON drug_relationships(relationship_key);

      CREATE TABLE IF NOT EXISTS review_logs (
        id TEXT PRIMARY KEY NOT NULL,
        drug_id TEXT REFERENCES drug_profiles(id) ON DELETE SET NULL,
        drug_name_snapshot TEXT NOT NULL,
        date TEXT NOT NULL,
        question_type_raw TEXT NOT NULL,
        rating_raw TEXT NOT NULL,
        was_correct INTEGER NOT NULL CHECK (was_correct IN (0, 1)),
        payload_json TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS review_logs_drug_date_index ON review_logs(drug_id, date DESC);
      CREATE INDEX IF NOT EXISTS review_logs_rating_index ON review_logs(rating_raw, date DESC);

      CREATE TABLE IF NOT EXISTS shift_logs (
        id TEXT PRIMARY KEY NOT NULL,
        date TEXT NOT NULL,
        started_at TEXT NOT NULL,
        ended_at TEXT,
        is_completed INTEGER NOT NULL CHECK (is_completed IN (0, 1)),
        payload_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS shift_logs_date_index ON shift_logs(date DESC);

      CREATE TABLE IF NOT EXISTS encounter_notes (
        id TEXT PRIMARY KEY NOT NULL,
        date TEXT NOT NULL,
        topic TEXT NOT NULL,
        related_drug_id TEXT REFERENCES drug_profiles(id) ON DELETE SET NULL,
        related_drug_name_snapshot TEXT NOT NULL,
        privacy_confirmed INTEGER NOT NULL CHECK (privacy_confirmed IN (0, 1)),
        payload_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS encounter_notes_date_index ON encounter_notes(date DESC);

      CREATE TABLE IF NOT EXISTS training_reports (
        id TEXT PRIMARY KEY NOT NULL,
        period_start TEXT NOT NULL,
        period_end TEXT NOT NULL,
        generated_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        payload_json TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS training_reports_period_index ON training_reports(period_start DESC, period_end DESC);

      CREATE TABLE IF NOT EXISTS learning_profiles (
        id TEXT PRIMARY KEY NOT NULL,
        current_streak INTEGER NOT NULL DEFAULT 0,
        longest_streak INTEGER NOT NULL DEFAULT 0,
        payload_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS daily_activities (
        id TEXT PRIMARY KEY NOT NULL,
        day TEXT NOT NULL,
        sessions_completed INTEGER NOT NULL DEFAULT 0,
        questions_answered INTEGER NOT NULL DEFAULT 0,
        correct_answers INTEGER NOT NULL DEFAULT 0,
        mission_completed INTEGER NOT NULL DEFAULT 0 CHECK (mission_completed IN (0, 1)),
        payload_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS daily_activities_day_index ON daily_activities(day);

      CREATE TABLE IF NOT EXISTS practice_packs (
        id TEXT PRIMARY KEY NOT NULL,
        mode_raw TEXT NOT NULL,
        scope_key TEXT NOT NULL,
        questions_json TEXT NOT NULL,
        generated_at TEXT NOT NULL,
        source_revision TEXT NOT NULL,
        invalidated_at TEXT
      );
      CREATE INDEX IF NOT EXISTS practice_packs_scope_index ON practice_packs(mode_raw, scope_key, invalidated_at);

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY NOT NULL,
        value_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS import_history (
        id TEXT PRIMARY KEY NOT NULL,
        schema_version INTEGER NOT NULL,
        mode TEXT NOT NULL CHECK (mode IN ('merge', 'replace')),
        includes_images INTEGER NOT NULL CHECK (includes_images IN (0, 1)),
        counts_json TEXT NOT NULL,
        source_hash TEXT NOT NULL,
        imported_at TEXT NOT NULL
      );
    `,
  },
] as const;
