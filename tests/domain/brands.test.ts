import {
  BrandMutationError,
  brandDraftFor,
  createCapturedBrandProduct,
  createBrandProduct,
  parseIngredientComponents,
  synchronizeTradeNames,
  updateBrandProduct,
} from '@/domain/drugs/brands';
import { makeDrug } from '../fixtures/backup';

describe('brand product parity', () => {
  it('requires both a printed brand name and package evidence', () => {
    const drug = makeDrug({ tradeNames: [] });
    expect(() =>
      createBrandProduct({
        id: 'product',
        drug,
        draft: brandDraftFor(drug),
        hasPhoto: false,
      }),
    ).toThrow(new BrandMutationError('brandNameRequired'));

    expect(() =>
      createBrandProduct({
        id: 'product',
        drug,
        draft: { ...brandDraftFor(drug), tradeName: 'Lasix' },
        hasPhoto: false,
      }),
    ).toThrow(new BrandMutationError('packagePhotoRequired'));
  });

  it('allows photo-free package metadata only through fast capture', () => {
    const drug = makeDrug({ tradeNames: [] });
    const product = createCapturedBrandProduct({
      id: 'captured-product',
      drug,
      draft: { ...brandDraftFor(drug), tradeName: 'Lasix' },
      hasPhoto: false,
    });
    expect(product.tradeName).toBe('Lasix');
    expect(product.sourceName).toBe('Manual capture');
  });

  it('creates package metadata without changing ingredient knowledge', () => {
    const drug = makeDrug({
      scientificName: 'Amoxicillin + Clavulanate',
      activeIngredients: ['Amoxicillin', 'Clavulanate'],
      tradeNames: [],
      mechanism: 'Existing knowledge',
      warnings: ['Existing warning'],
    });
    const draft = brandDraftFor(drug);
    draft.tradeName = 'Augmentin';
    draft.manufacturer = 'GSK';
    draft.marketedStrengthLabel = '625 mg';
    draft.dosageForm = 'Tablet';
    draft.ingredientComponents = [
      { name: 'Amoxicillin', displayStrength: '500 mg' },
      { name: 'Clavulanate', displayStrength: '125 mg' },
    ];
    const product = createBrandProduct({ id: 'product', drug, draft, hasPhoto: true });
    const synchronized = synchronizeTradeNames(drug, [product]);

    expect(product.tradeName).toBe('Augmentin');
    expect(JSON.parse(product.ingredientComponentsJSON ?? '')).toEqual(draft.ingredientComponents);
    expect(synchronized.tradeNames).toEqual(['Augmentin']);
    expect(synchronized.mechanism).toBe('Existing knowledge');
    expect(synchronized.warnings).toEqual(['Existing warning']);
    expect(drug.tradeNames).toEqual([]);
  });

  it('rejects duplicate package identities', () => {
    const drug = makeDrug({ tradeNames: [] });
    const draft = { ...brandDraftFor(drug), tradeName: 'Lasix' };
    const product = createBrandProduct({ id: 'first', drug, draft, hasPhoto: true });
    expect(() =>
      createBrandProduct({
        id: 'second',
        drug,
        draft,
        hasPhoto: true,
        existingProducts: [product],
      }),
    ).toThrow(new BrandMutationError('duplicateBrand'));
  });
});

describe('brand product editing', () => {
  it('preserves structured component details and timestamps product-specific leaflets', () => {
    const drug = makeDrug({
      activeIngredients: ['Amoxicillin', 'Clavulanate'],
      canonicalIngredientKey: 'ingredient:amoxicillin+clavulanate',
    });
    const product = createBrandProduct({
      id: 'product',
      drug,
      draft: {
        ...brandDraftFor(drug),
        tradeName: 'Augmentin',
        ingredientComponents: [
          { name: 'Amoxicillin', displayStrength: '500 mg' },
          { name: 'Clavulanate', displayStrength: '125 mg' },
        ],
      },
      hasPhoto: true,
    });
    const components = parseIngredientComponents(product.ingredientComponentsJSON, drug);
    components[0] = {
      ...components[0]!,
      saltForm: 'trihydrate',
      strengthValue: 500,
      strengthUnit: 'mg',
    };
    const now = new Date('2025-06-18T09:00:00Z');
    const edited = updateBrandProduct({
      product,
      drug,
      draft: {
        tradeName: 'Augmentin',
        manufacturer: 'GSK',
        marketedStrengthLabel: '625 mg',
        ingredientComponents: components,
        dosageForm: 'Tablet',
        route: 'Oral',
        country: 'Iraq',
        shelfLocation: 'A-2',
        leafletText: 'Take exactly as directed.',
      },
      now,
    });

    expect(edited.leafletUpdatedAt).toBe(now.toISOString());
    expect(edited.strength).toBe('625 mg');
    expect(parseIngredientComponents(edited.ingredientComponentsJSON, drug)[0]).toMatchObject({
      saltForm: 'trihydrate',
      strengthValue: 500,
      strengthUnit: 'mg',
    });
  });

  it('falls back from malformed component JSON and rejects a duplicate edited package key', () => {
    const drug = makeDrug();
    expect(parseIngredientComponents('{broken', drug)[0]?.name).toBe('Furosemide');
    const first = createBrandProduct({
      id: 'first',
      drug,
      draft: { ...brandDraftFor(drug), tradeName: 'Lasix' },
      hasPhoto: true,
    });
    const second = { ...first, id: 'second', tradeName: 'Other', productKey: 'other' };
    expect(() =>
      updateBrandProduct({
        product: second,
        drug,
        draft: {
          ...brandDraftFor(drug),
          tradeName: 'Lasix',
          ingredientComponents: parseIngredientComponents(first.ingredientComponentsJSON, drug),
          leafletText: '',
        },
        existingProducts: [first, second],
      }),
    ).toThrow(BrandMutationError);
  });
});
