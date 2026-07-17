import {
  adverseIncidenceLabel,
  structuredClinicalForDrug,
} from '@/domain/clinical/structuredClinical';
import { makeDrug } from '../fixtures/backup';

describe('structured clinical schema parity', () => {
  it('decodes interaction categories, adverse incidence, reproductive safety, and ADME', () => {
    const profile = structuredClinicalForDrug(
      makeDrug({
        interactionEntriesJSON: JSON.stringify([
          {
            drugName: 'Lithium',
            category: 'serious use an alternative',
            effect: 'May increase lithium exposure',
            management: 'Monitor levels',
          },
        ]),
        adverseEffectEntriesJSON: JSON.stringify([
          { name: 'Dizziness', incidence: '12', isSerious: false },
        ]),
        reproductiveSafetyJSON: JSON.stringify({
          pregnancy: 'Use only when justified',
          lactation: 'Monitor the infant',
          pregnancyArabicNote: 'ملاحظة الحمل',
        }),
        pharmacologyProfileJSON: JSON.stringify({
          mechanismOfAction: 'Blocks NKCC2',
          absorption: ['Oral absorption is variable'],
          distribution: [],
          metabolism: ['Limited hepatic metabolism'],
          elimination: ['Mostly renal'],
        }),
        prodrugInfoJSON: JSON.stringify({
          classification: 'Active drug',
          administeredCompound: 'Furosemide',
        }),
        eliminationInfoJSON: JSON.stringify({
          metabolismSite: 'Kidney',
          metabolismEnzymes: [],
          routes: [{ pathway: 'Kidneys / urine', percentage: 70, detail: 'Unchanged' }],
          dominantPathway: 'Kidneys / urine',
          summary: 'Predominantly renal',
        }),
      }),
    );

    expect(profile.interactions[0]).toMatchObject({
      drugName: 'Lithium',
      category: 'Serious - Use Alternative',
    });
    expect(adverseIncidenceLabel(profile.adverseEffects[0]?.incidence ?? '')).toBe('12%');
    expect(profile.reproductiveSafety.lactation).toBe('Monitor the infant');
    expect(profile.pharmacology.absorption).toEqual(['Oral absorption is variable']);
    expect(profile.elimination.routes[0]).toMatchObject({ percentage: 70 });
  });

  it('matches Swift legacy fallbacks when structured JSON is absent or malformed', () => {
    const profile = structuredClinicalForDrug(
      makeDrug({
        interactions: ['Digoxin'],
        commonSideEffects: ['Dizziness'],
        seriousSideEffects: ['Ototoxicity'],
        interactionEntriesJSON: '{broken',
        adverseEffectEntriesJSON: '',
        reproductiveSafetyJSON: '',
        pharmacologyProfileJSON: '',
        prodrugInfoJSON: '',
        eliminationInfoJSON: '',
        dosageFormGroupsJSON: '',
        excretionRouteRaw: 'Renal',
        pregnancyCaution: 'Avoid unless benefit justifies risk.',
      }),
    );

    expect(profile.interactions[0]?.category).toBe('Uncategorized');
    expect(profile.adverseEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Dizziness', isSerious: false }),
        expect.objectContaining({ name: 'Ototoxicity', isSerious: true }),
      ]),
    );
    expect(profile.reproductiveSafety.pregnancy).toBe('Avoid unless benefit justifies risk.');
    expect(profile.pharmacology.mechanismOfAction).toBe(makeDrug().mechanism);
    expect(profile.prodrug.classification).toBe('Active drug');
    expect(profile.elimination.dominantPathway).toBe('Kidneys / urine');
    expect(profile.dosageFormGroups[0]).toMatchObject({ dosageForm: 'Tablet' });
  });

  it('formats incidence values exactly once', () => {
    expect(adverseIncidenceLabel('')).toBe('Not established');
    expect(adverseIncidenceLabel('5%')).toBe('5%');
    expect(adverseIncidenceLabel('2,5')).toBe('2,5%');
    expect(adverseIncidenceLabel('rare')).toBe('rare');
  });
});
