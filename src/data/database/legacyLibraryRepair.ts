import * as Crypto from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import { drugProductBackupSchema, type DrugBackup } from '@/domain/backup';
import { synchronizeTradeNames } from '@/domain/drugs/brands';
import { canonicalKeyForDrug, productKey } from '@/domain/drugs/identity';
import { DrugRepository, ProductRepository } from '@/data/repositories';
import { runExclusiveTransaction } from './transactions';

type CountRow = { count: number };

function ingredientNames(drug: DrugBackup): string[] {
  const active = drug.activeIngredients?.filter((name) => name.trim()) ?? [];
  return active.length > 0 ? active : [drug.scientificName].filter((name) => name.trim());
}

export async function repairLegacyProductAuthority(db: SQLiteDatabase): Promise<void> {
  await runExclusiveTransaction(db, async (transaction) => {
    const drugRepository = new DrugRepository(transaction);
    const productRepository = new ProductRepository(transaction);
    const drugs = await drugRepository.list({ sort: 'recent' });
    for (const drug of drugs) {
      const products = await productRepository.listForProfile(drug.id);
      const productKeys = new Set(products.map((product) => product.productKey));
      const created = [];
      const ingredients = ingredientNames(drug);
      for (const tradeName of drug.tradeNames) {
        const name = tradeName.trim();
        if (!name) continue;
        const strength = drug.strengths[0] ?? '';
        const dosageForm = drug.dosageForms[0] ?? '';
        const key = productKey(
          { tradeName: name, manufacturer: '', strength, dosageForm },
          canonicalKeyForDrug(drug),
        );
        if (productKeys.has(key)) continue;
        const product = drugProductBackupSchema.parse({
          id: Crypto.randomUUID(),
          profileID: drug.id,
          productKey: key,
          tradeName: name,
          manufacturer: '',
          strength,
          marketedStrengthLabel: strength,
          ingredientComponentsJSON: JSON.stringify(
            ingredients.map((ingredient) => ({
              name: ingredient,
              displayStrength: ingredients.length === 1 ? strength : '',
            })),
          ),
          dosageForm,
          route: drug.routes[0] ?? '',
          country: '',
          shelfLocation: drug.shelfLocation,
          imageData: null,
          additionalImageData: [],
          thumbnailData: null,
          additionalThumbnailData: [],
          leafletText: '',
          leafletUpdatedAt: null,
          sourceName: 'Legacy trade-name migration',
          sourceURL: '',
          dateAdded: drug.dateAdded,
        });
        await productRepository.save(product);
        products.push(product);
        created.push(product);
        productKeys.add(key);
      }

      if (created.length > 0) {
        const directImages = await transaction.getFirstAsync<CountRow>(
          'SELECT COUNT(*) AS count FROM drug_images WHERE drug_id = ?',
          drug.id,
        );
        if ((directImages?.count ?? 0) > 0 && products.length === created.length) {
          const first = created[0];
          if (first) {
            await transaction.runAsync(
              'UPDATE drug_images SET drug_id = NULL, product_id = ? WHERE drug_id = ?',
              first.id,
              drug.id,
            );
            await transaction.runAsync(
              'UPDATE drug_products SET has_photo = 1 WHERE id = ?',
              first.id,
            );
          }
        }
        await drugRepository.save(synchronizeTradeNames(drug, products));
      }
    }
  });
}
