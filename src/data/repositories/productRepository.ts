import { File } from 'expo-file-system';
import type { SQLiteDatabase } from 'expo-sqlite';

import { drugProductBackupSchema, type DrugProductBackup } from '@/domain/backup';
import { isoDate } from '@/domain/shared/dates';
import { synchronizeTradeNames } from '@/domain/drugs/brands';
import { runExclusiveTransaction } from '@/data/database/transactions';
import { DrugRepository } from './drugRepository';

type ProductRow = { payload_json: string };
type CountRow = { count: number };
type ProductImageRow = ProductRow & { image_uri: string | null };
type ImageUriRow = { uri: string };
type ProductImageSourceRow = {
  uri: string;
  width: number | null;
  height: number | null;
  ordinal: number;
};

export type ProductListItem = {
  product: DrugProductBackup;
  imageUri: string | null;
};

export type ProductImageSource = {
  uri: string;
  width: number;
  height: number;
  ordinal: number;
};

export class ProductRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async get(id: string): Promise<DrugProductBackup | null> {
    const row = await this.db.getFirstAsync<ProductRow>(
      'SELECT payload_json FROM drug_products WHERE id = ?',
      id,
    );
    return row ? drugProductBackupSchema.parse(JSON.parse(row.payload_json) as unknown) : null;
  }

  async listForProfile(profileID: string): Promise<DrugProductBackup[]> {
    const rows = await this.db.getAllAsync<ProductRow>(
      `SELECT payload_json FROM drug_products
       WHERE profile_id = ? ORDER BY date_added ASC, trade_name COLLATE NOCASE ASC`,
      profileID,
    );
    return rows.map((row) =>
      drugProductBackupSchema.parse(JSON.parse(row.payload_json) as unknown),
    );
  }

  async listItemsForProfile(profileID: string): Promise<ProductListItem[]> {
    const rows = await this.db.getAllAsync<ProductImageRow>(
      `SELECT dp.payload_json,
        (SELECT di.uri FROM drug_images di
         WHERE di.product_id = dp.id AND di.ordinal = 0 AND di.role IN ('card', 'original')
         ORDER BY CASE di.role WHEN 'card' THEN 0 ELSE 1 END LIMIT 1) AS image_uri
       FROM drug_products dp
       WHERE dp.profile_id = ?
       ORDER BY dp.date_added ASC, dp.trade_name COLLATE NOCASE ASC`,
      profileID,
    );
    return rows.map((row) => ({
      product: drugProductBackupSchema.parse(JSON.parse(row.payload_json) as unknown),
      imageUri: row.image_uri,
    }));
  }

  async listImageSources(productID: string): Promise<ProductImageSource[]> {
    const rows = await this.db.getAllAsync<ProductImageSourceRow>(
      `SELECT uri, width, height, ordinal FROM drug_images
       WHERE product_id = ? AND role = 'original'
       ORDER BY ordinal ASC`,
      productID,
    );
    return rows.map((row) => ({
      uri: row.uri,
      width: row.width ?? 1600,
      height: row.height ?? 1200,
      ordinal: row.ordinal,
    }));
  }

  async save(product: DrugProductBackup): Promise<void> {
    const parsed = drugProductBackupSchema.parse(product);
    const imageCount = await this.db.getFirstAsync<CountRow>(
      'SELECT COUNT(*) AS count FROM drug_images WHERE product_id = ?',
      parsed.id,
    );
    await this.db.runAsync(
      `INSERT INTO drug_products (
        id, profile_id, product_key, trade_name, manufacturer, marketed_strength_label,
        dosage_form, country, payload_json, date_added, has_photo, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        profile_id = excluded.profile_id,
        product_key = excluded.product_key,
        trade_name = excluded.trade_name,
        manufacturer = excluded.manufacturer,
        marketed_strength_label = excluded.marketed_strength_label,
        dosage_form = excluded.dosage_form,
        country = excluded.country,
        payload_json = excluded.payload_json,
        date_added = excluded.date_added,
        updated_at = excluded.updated_at`,
      parsed.id,
      parsed.profileID,
      parsed.productKey,
      parsed.tradeName,
      parsed.manufacturer,
      parsed.marketedStrengthLabel ?? parsed.strength,
      parsed.dosageForm,
      parsed.country,
      JSON.stringify(parsed),
      isoDate(parsed.dateAdded),
      (imageCount?.count ?? 0) > 0 ? 1 : 0,
      new Date().toISOString(),
    );
  }

  async delete(id: string): Promise<void> {
    await this.db.runAsync('DELETE FROM drug_products WHERE id = ?', id);
  }

  async deleteFromProfile(profileID: string, productID: string): Promise<void> {
    const imageRows = await this.db.getAllAsync<ImageUriRow>(
      'SELECT uri FROM drug_images WHERE product_id = ?',
      productID,
    );
    await runExclusiveTransaction(this.db, async (transaction) => {
      const drugRepository = new DrugRepository(transaction);
      const profile = await drugRepository.get(profileID);
      if (!profile) throw new Error('The ingredient profile is no longer available.');
      await transaction.runAsync('DELETE FROM drug_products WHERE id = ?', productID);
      const remaining = await new ProductRepository(transaction).listForProfile(profileID);
      await drugRepository.save(synchronizeTradeNames(profile, remaining));
      await transaction.runAsync(
        `UPDATE drug_profiles SET has_photo = CASE WHEN EXISTS (
          SELECT 1 FROM drug_images WHERE drug_id = ?
        ) OR EXISTS (
          SELECT 1 FROM drug_images di
          JOIN drug_products dp ON dp.id = di.product_id
          WHERE dp.profile_id = ?
        ) THEN 1 ELSE 0 END WHERE id = ?`,
        profileID,
        profileID,
        profileID,
      );
    });
    for (const row of imageRows) {
      const file = new File(row.uri);
      if (file.exists) file.delete();
    }
  }
}
