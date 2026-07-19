import { Directory, File, Paths } from 'expo-file-system';
import { SaveFormat } from 'expo-image-manipulator';
import type { SQLiteDatabase } from 'expo-sqlite';
import { Platform } from 'react-native';

import type { DrugBackup, DrugProductBackup } from '@/domain/backup';
import { runExclusiveTransaction } from '@/data/database/transactions';
import { DrugRepository, ProductRepository } from '@/data/repositories';
import { sha256Hex } from '@/domain/shared/crypto';
import { persistenceActions } from '@/features/capture/imagePipeline';
import { manipulateImage } from '@/features/capture/manipulateImage';

type ImageOwnerType = 'drug' | 'product';

export type CaptureImageAsset = {
  uri: string;
  width: number;
  height: number;
};

type PreparedCaptureImage = {
  id: string;
  ordinal: number;
  role: 'original' | 'thumbnail';
  uri: string;
  sha256: string;
  byteSize: number;
  width: number;
  height: number;
  created: boolean;
};

async function webImagePayload(uri: string): Promise<{ uri: string; bytes: Uint8Array }> {
  const response = await fetch(uri);
  if (!response.ok) throw new Error('The edited package image could not be read.');
  const blob = await response.blob();
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const dataUri = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('The edited package image could not be encoded.'));
    reader.onload = () =>
      typeof reader.result === 'string'
        ? resolve(reader.result)
        : reject(new Error('The edited package image could not be encoded.'));
    reader.readAsDataURL(blob);
  });
  URL.revokeObjectURL(uri);
  return { uri: dataUri, bytes };
}

async function persistManipulatedImage(
  ownerType: ImageOwnerType,
  ownerID: string,
  ordinal: number,
  role: 'original' | 'thumbnail',
  sourceUri: string,
  sourceWidth: number,
  sourceHeight: number,
): Promise<PreparedCaptureImage> {
  const actions = persistenceActions(sourceWidth, sourceHeight, role);
  const resized = await manipulateImage(sourceUri, actions, {
    compress: role === 'thumbnail' ? 0.72 : 0.82,
    format: SaveFormat.JPEG,
  });
  if (Platform.OS === 'web') {
    const payload = await webImagePayload(resized.uri);
    const sha256 = await sha256Hex(payload.bytes);
    return {
      id: `${ownerType}:${ownerID}:${ordinal}:${role}`,
      ordinal,
      role,
      uri: payload.uri,
      sha256,
      byteSize: payload.bytes.byteLength,
      width: resized.width,
      height: resized.height,
      created: false,
    };
  }
  const temporary = new File(resized.uri);
  const bytes = await temporary.bytes();
  const sha256 = await sha256Hex(bytes);
  const directory = new Directory(Paths.document, 'renlyst', 'images', ownerType, ownerID);
  directory.create({ intermediates: true, idempotent: true });
  const destination = new File(directory, `${ordinal}-${role}-${sha256}.jpg`);
  const created = !destination.exists;
  if (created) await temporary.move(destination);
  else if (temporary.exists) temporary.delete();
  return {
    id: `${ownerType}:${ownerID}:${ordinal}:${role}`,
    ordinal,
    role,
    uri: destination.uri,
    sha256,
    byteSize: bytes.byteLength,
    width: resized.width,
    height: resized.height,
    created,
  };
}

async function prepareImages(
  ownerType: ImageOwnerType,
  ownerID: string,
  assets: readonly CaptureImageAsset[],
  startOrdinal = 0,
): Promise<PreparedCaptureImage[]> {
  if (assets.length > 8) throw new Error('A profile can store at most eight package photos.');
  const prepared: PreparedCaptureImage[] = [];
  try {
    for (const [index, asset] of assets.entries()) {
      const ordinal = startOrdinal + index;
      prepared.push(
        await persistManipulatedImage(
          ownerType,
          ownerID,
          ordinal,
          'original',
          asset.uri,
          asset.width,
          asset.height,
        ),
      );
      prepared.push(
        await persistManipulatedImage(
          ownerType,
          ownerID,
          ordinal,
          'thumbnail',
          asset.uri,
          asset.width,
          asset.height,
        ),
      );
    }
    return prepared;
  } catch (error) {
    rollbackPreparedImages(prepared);
    throw error;
  }
}

function rollbackPreparedImages(images: readonly PreparedCaptureImage[]): void {
  if (Platform.OS === 'web') return;
  for (const image of images) {
    if (!image.created) continue;
    const file = new File(image.uri);
    if (file.exists) file.delete();
  }
}

async function insertPreparedImages(
  transaction: SQLiteDatabase,
  ownerType: ImageOwnerType,
  ownerID: string,
  images: readonly PreparedCaptureImage[],
): Promise<void> {
  for (const image of images) {
    await transaction.runAsync(
      `INSERT INTO drug_images (
        id, drug_id, product_id, ordinal, role, uri, sha256, byte_size, mime_type,
        width, height, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'image/jpeg', ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        uri = excluded.uri, sha256 = excluded.sha256, byte_size = excluded.byte_size,
        width = excluded.width, height = excluded.height`,
      image.id,
      ownerType === 'drug' ? ownerID : null,
      ownerType === 'product' ? ownerID : null,
      image.ordinal,
      image.role,
      image.uri,
      image.sha256,
      image.byteSize,
      image.width,
      image.height,
      new Date().toISOString(),
    );
  }
}

async function updatePhotoCaches(transaction: SQLiteDatabase, drugID: string): Promise<void> {
  await transaction.runAsync(
    `UPDATE drug_profiles SET has_photo = CASE WHEN EXISTS (
       SELECT 1 FROM drug_images WHERE drug_id = ?
     ) OR EXISTS (
       SELECT 1 FROM drug_images di
       JOIN drug_products dp ON dp.id = di.product_id
       WHERE dp.profile_id = ?
     ) THEN 1 ELSE 0 END WHERE id = ?`,
    drugID,
    drugID,
    drugID,
  );
}

export class CaptureService {
  constructor(private readonly db: SQLiteDatabase) {}

  async save(
    drug: DrugBackup,
    assets: readonly CaptureImageAsset[],
    product?: DrugProductBackup,
  ): Promise<void> {
    const ownerType: ImageOwnerType = product ? 'product' : 'drug';
    const ownerID = product?.id ?? drug.id;
    const images = await prepareImages(ownerType, ownerID, assets);
    try {
      await runExclusiveTransaction(this.db, async (transaction) => {
        const repository = new DrugRepository(transaction);
        await repository.save(drug);
        if (product) await new ProductRepository(transaction).save(product);
        await insertPreparedImages(transaction, ownerType, ownerID, images);
        await updatePhotoCaches(transaction, drug.id);
        if (product) {
          await transaction.runAsync(
            'UPDATE drug_products SET has_photo = ? WHERE id = ?',
            assets.length > 0 ? 1 : 0,
            product.id,
          );
        }
      });
    } catch (error) {
      rollbackPreparedImages(images);
      throw error;
    }
  }

  async appendDrugImages(drug: DrugBackup, assets: readonly CaptureImageAsset[]): Promise<void> {
    if (assets.length === 0) {
      await new DrugRepository(this.db).save(drug);
      return;
    }
    const total = await this.db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) AS count FROM drug_images di
       WHERE di.role = 'original' AND (
         di.drug_id = ? OR di.product_id IN (
           SELECT id FROM drug_products WHERE profile_id = ?
         )
       )`,
      drug.id,
      drug.id,
    );
    if ((total?.count ?? 0) + assets.length > 8) {
      throw new Error('A profile can store at most eight package photos.');
    }
    const last = await this.db.getFirstAsync<{ ordinal: number | null }>(
      `SELECT MAX(ordinal) AS ordinal FROM drug_images
       WHERE drug_id = ? AND role = 'original'`,
      drug.id,
    );
    const images = await prepareImages('drug', drug.id, assets, (last?.ordinal ?? -1) + 1);
    try {
      await runExclusiveTransaction(this.db, async (transaction) => {
        await new DrugRepository(transaction).save(drug);
        await insertPreparedImages(transaction, 'drug', drug.id, images);
        await updatePhotoCaches(transaction, drug.id);
      });
    } catch (error) {
      rollbackPreparedImages(images);
      throw error;
    }
  }

  async replaceProduct(
    drug: DrugBackup,
    product: DrugProductBackup,
    assets: readonly CaptureImageAsset[],
  ): Promise<void> {
    const oldRows = await this.db.getAllAsync<{ uri: string }>(
      'SELECT uri FROM drug_images WHERE product_id = ?',
      product.id,
    );
    const images = await prepareImages('product', product.id, assets);
    try {
      await runExclusiveTransaction(this.db, async (transaction) => {
        await new DrugRepository(transaction).save(drug);
        await new ProductRepository(transaction).save(product);
        await transaction.runAsync('DELETE FROM drug_images WHERE product_id = ?', product.id);
        await insertPreparedImages(transaction, 'product', product.id, images);
        await transaction.runAsync(
          'UPDATE drug_products SET has_photo = ? WHERE id = ?',
          assets.length > 0 ? 1 : 0,
          product.id,
        );
        await updatePhotoCaches(transaction, drug.id);
      });
    } catch (error) {
      rollbackPreparedImages(images);
      throw error;
    }

    if (Platform.OS !== 'web') {
      const retained = new Set(images.map((image) => image.uri));
      for (const row of oldRows) {
        if (retained.has(row.uri)) continue;
        const file = new File(row.uri);
        if (file.exists) file.delete();
      }
    }
  }

  async replaceDrug(drug: DrugBackup, assets: readonly CaptureImageAsset[]): Promise<void> {
    const oldRows = await this.db.getAllAsync<{ uri: string }>(
      'SELECT uri FROM drug_images WHERE drug_id = ?',
      drug.id,
    );
    const images = await prepareImages('drug', drug.id, assets);
    try {
      await runExclusiveTransaction(this.db, async (transaction) => {
        await new DrugRepository(transaction).save(drug);
        await transaction.runAsync('DELETE FROM drug_images WHERE drug_id = ?', drug.id);
        await insertPreparedImages(transaction, 'drug', drug.id, images);
        await updatePhotoCaches(transaction, drug.id);
      });
    } catch (error) {
      rollbackPreparedImages(images);
      throw error;
    }

    if (Platform.OS !== 'web') {
      const retained = new Set(images.map((image) => image.uri));
      for (const row of oldRows) {
        if (retained.has(row.uri)) continue;
        const file = new File(row.uri);
        if (file.exists) file.delete();
      }
    }
  }
}
