import { mergeDuplicateProfiles } from '@/domain/backup';
import { makeBackup, makeDrug } from '../fixtures/backup';

describe('legacy duplicate profile repair', () => {
  it('keeps the oldest ingredient owner and remaps every dependent record', () => {
    const ownerID = '11111111-1111-4111-8111-111111111111';
    const duplicateID = '22222222-2222-4222-8222-222222222222';
    const otherID = '33333333-3333-4333-8333-333333333333';
    const owner = makeDrug({
      id: ownerID,
      scientificName: 'Furosemide',
      activeIngredients: ['Furosemide'],
      dateAdded: '2024-01-01T00:00:00Z',
      tradeNames: ['Lasix'],
      notes: 'Owner note',
      imageData: 'owner-image',
      timesSeen: 2,
    });
    const duplicate = makeDrug({
      id: duplicateID,
      scientificName: '  FUROSEMIDE  ',
      activeIngredients: [' furosemide '],
      dateAdded: '2025-01-01T00:00:00Z',
      tradeNames: ['Frusid'],
      notes: 'Duplicate note',
      imageData: 'duplicate-image',
      timesSeen: 3,
      masteryUse: true,
      atomicNotesJSON: JSON.stringify([{ id: 'note', text: 'Remember this' }]),
    });
    const other = makeDrug({
      id: otherID,
      scientificName: 'Metformin',
      activeIngredients: ['Metformin'],
      rxNormConceptIDs: [],
      dateAdded: '2025-02-01T00:00:00Z',
    });
    const backup = makeBackup({
      drugs: [duplicate, other, owner],
      products: [
        {
          id: 'product-owner',
          profileID: ownerID,
          productKey: 'legacy-one',
          tradeName: 'Lasix',
          manufacturer: '',
          strength: '40 mg',
          marketedStrengthLabel: '40 mg',
          ingredientComponentsJSON: '',
          dosageForm: 'Tablet',
          route: 'Oral',
          country: '',
          shelfLocation: '',
          imageData: 'product-image-one',
          additionalImageData: [],
          thumbnailData: null,
          additionalThumbnailData: [],
          leafletText: '',
          leafletUpdatedAt: null,
          sourceName: '',
          sourceURL: '',
          dateAdded: '2024-01-01T00:00:00Z',
        },
        {
          id: 'product-duplicate',
          profileID: duplicateID,
          productKey: 'legacy-two',
          tradeName: 'Lasix',
          manufacturer: '',
          strength: '40 mg',
          marketedStrengthLabel: '40 mg',
          ingredientComponentsJSON: '',
          dosageForm: 'Tablet',
          route: 'Oral',
          country: '',
          shelfLocation: '',
          imageData: 'product-image-two',
          additionalImageData: [],
          thumbnailData: null,
          additionalThumbnailData: [],
          leafletText: 'Second leaflet',
          leafletUpdatedAt: '2025-01-01T00:00:00Z',
          sourceName: '',
          sourceURL: '',
          dateAdded: '2025-01-01T00:00:00Z',
        },
      ],
      relationships: [
        {
          id: 'relationship',
          relationshipKey: 'legacy-key',
          kindRaw: 'Interaction',
          severityRaw: 'Medium',
          summary: 'Monitor together.',
          managementNote: '',
          sourceURLs: ['https://example.test'],
          checkedAt: '2025-01-01T00:00:00Z',
          sourceDrugID: duplicateID,
          targetDrugID: otherID,
        },
      ],
      reviews: [
        {
          id: 'review',
          drugID: duplicateID,
          drugNameSnapshot: 'Furosemide',
          date: '2025-01-01T00:00:00Z',
          questionTypeRaw: 'Use',
          ratingRaw: 'Correct',
          wasCorrect: true,
          scoreBefore: 0,
          scoreAfter: 1,
          caseID: null,
        },
      ],
      encounters: [
        {
          id: 'encounter',
          date: '2025-01-01T00:00:00Z',
          topic: 'Counseling',
          relatedDrugID: duplicateID,
          relatedDrugNameSnapshot: 'Furosemide',
          whatHappened: '',
          whatILearned: '',
          pharmacistNote: '',
          privacyConfirmed: true,
        },
      ],
    });

    const result = mergeDuplicateProfiles(backup);
    expect(result.mergedProfileCount).toBe(1);
    expect(result.mergedProductCount).toBe(1);
    expect(result.backup.drugs).toHaveLength(2);
    const merged = result.backup.drugs.find((drug) => drug.id === ownerID)!;
    expect(merged.tradeNames).toEqual(['Lasix', 'Frusid']);
    expect(merged.notes).toBe('Owner note\n\nDuplicate note');
    expect(merged.timesSeen).toBe(5);
    expect(merged.masteryUse).toBe(true);
    expect(merged.imageData).toBe('owner-image');
    expect(merged.additionalImageData).toEqual(['duplicate-image']);
    expect(result.backup.products).toHaveLength(1);
    expect(result.backup.products?.[0]?.profileID).toBe(ownerID);
    expect(result.backup.products?.[0]?.additionalImageData).toEqual(['product-image-two']);
    expect(result.backup.relationships?.[0]).toMatchObject({
      sourceDrugID: ownerID,
      targetDrugID: otherID,
    });
    expect(result.backup.reviews[0]?.drugID).toBe(ownerID);
    expect(result.backup.encounters[0]?.relatedDrugID).toBe(ownerID);
  });
});
