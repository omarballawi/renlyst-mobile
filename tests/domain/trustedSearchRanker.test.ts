import {
  rankTrustedSearchResults,
  type TrustedDrugSearchResult,
} from '@/services/drugSources/trustedSources';

it('prioritizes a matching active ingredient and dosage form', () => {
  const results: TrustedDrugSearchResult[] = [
    {
      id: 'tablet',
      displayName: 'Omeprazole tablet',
      activeIngredient: 'Omeprazole',
      dosageForm: 'Tablet',
      sourceName: 'DailyMed',
      lastUpdatedText: null,
    },
    {
      id: 'capsule',
      displayName: 'Omeprazole capsule',
      activeIngredient: 'Omeprazole',
      dosageForm: 'Capsule',
      sourceName: 'DailyMed',
      lastUpdatedText: null,
    },
  ];

  expect(
    rankTrustedSearchResults(results, {
      scientificName: 'Omeprazole',
      tradeNames: ['Gasec'],
      strength: '20 mg',
      dosageForm: 'Capsule',
    })[0]?.id,
  ).toBe('capsule');
});
