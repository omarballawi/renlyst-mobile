import {
  applyAIDrugDraft,
  availableAIImportFields,
  availableAIImportSections,
  defaultAIImportSelection,
} from '@/domain/drugs/aiImport';
import type { AIDrugDraft } from '@/services/providers/providerClients';
import { makeDrug } from '../fixtures/backup';

const draft: AIDrugDraft = {
  scientificName: 'Furosemide',
  tradeNames: [],
  chapterRaw: 'Cardiovascular',
  drugClass: 'Loop diuretic',
  activeIngredients: ['Furosemide'],
  dosageForms: ['Tablet'],
  strengths: ['40 mg'],
  routes: ['Oral'],
  indications: ['Edema'],
  mechanism: 'Inhibits NKCC2.',
  mechanismKeywords: ['NKCC2'],
  howToTake: 'Take in the morning.',
  foodInstruction: 'With or without food.',
  warnings: ['Monitor electrolytes'],
  contraindications: [],
  interactions: [],
  toxicity: '',
  renalCaution: 'Review renal response.',
  hepaticCaution: '',
  pregnancyCaution: '',
  commonSideEffects: ['Dizziness'],
  seriousSideEffects: [],
  halfLifeText: 'About 2 hours',
  halfLifeHours: 2,
  halfLifeBandRaw: 'Short',
  onsetText: '30–60 minutes',
  onsetMinutes: 45,
  onsetBandRaw: 'Moderate',
  durationText: '6–8 hours',
  durationHours: 7,
  durationBandRaw: 'Medium',
  dosingFrequencyRaw: 'Once daily',
  timesPerDay: 1,
  prodrugStatusRaw: 'Active',
  excretionRouteRaw: 'Renal',
  excretionNotes: 'Renal elimination.',
  counselingSentence: 'Rise slowly.',
  patientQuestions: ['When should I take it?'],
  counselingHowToTakeArabic: 'يؤخذ صباحاً',
  counselingFoodArabic: '',
  patientFeelingsArabic: [],
  seekHelpArabic: [],
  missedDoseArabic: '',
  arabicExplanation: 'مدر للبول',
  arabicMechanism: '',
  arabicCounseling: '',
  arabicMemoryStory: '',
  arabicImportantNote: '',
  mustKnow: ['Monitor electrolytes'],
  flashcards: ['Main use?\tEdema'],
  oneLineSummaryArabic: '',
  doseRegimens: [],
  dosageFormGroups: [],
  clinicalDoses: [],
  interactionEntries: [],
  adverseEffectEntries: [{ name: 'Dizziness', incidence: '', isSerious: false, sourceIDs: [] }],
  prodrugInfo: {
    classification: '',
    administeredCompound: '',
    activeCompound: '',
    activationSite: '',
    activationPathway: '',
    explanation: '',
    sourceIDs: [],
  },
  eliminationInfo: {
    metabolismSite: '',
    metabolismEnzymes: [],
    routes: [],
    dominantPathway: '',
    summary: '',
    sourceIDs: [],
  },
  reproductiveSafety: {
    pregnancy: '',
    lactation: '',
    pregnancyArabicNote: '',
    lactationArabicNote: '',
    sourceIDs: [],
  },
  pharmacologyProfile: {
    mechanismOfAction: 'Inhibits NKCC2.',
    absorption: [],
    distribution: [],
    metabolism: [],
    elimination: ['Renal elimination.'],
    sourceIDs: [],
  },
};

describe('AI profile draft review', () => {
  it('selects only missing areas by default', () => {
    const drug = makeDrug({ indications: [], mechanism: '', warnings: ['Existing warning'] });
    const selection = defaultAIImportSelection(drug, draft);
    expect(selection.has('Uses & mechanism')).toBe(true);
    expect(selection.has('Safety')).toBe(false);
    expect(availableAIImportSections(draft)).toContain('Arabic learning');
  });

  it('applies only selected sections and marks every value unverified', () => {
    const drug = makeDrug({
      indications: ['Existing use'],
      warnings: ['Existing warning'],
      mechanism: '',
      arabicExplanation: '',
    });
    const updated = applyAIDrugDraft(
      drug,
      draft,
      new Set(['Uses & mechanism', 'Arabic learning']),
      new Date('2025-06-15T12:00:00.000Z'),
      () => '22222222-2222-4222-8222-222222222222',
    );
    expect(updated.indications).toEqual(['Edema']);
    expect(updated.mechanism).toBe('Inhibits NKCC2.');
    expect(updated.warnings).toEqual(['Existing warning']);
    expect(updated.arabicExplanation).toBe('مدر للبول');
    expect(updated.importedSourceName).toBe('Generated with AI');
    expect(updated.sourceNeedsReview).toBe(true);
    expect(updated.verificationRaw).toBe('Needs pharmacist verification');
    const evidence = JSON.parse(updated.fieldEvidenceJSON ?? '') as Record<string, unknown>[];
    expect(evidence).toHaveLength(2);
    expect(evidence.every((item) => item.quality === 'aiUnverified')).toBe(true);
    expect(evidence[0]?.retrievedAt).toBe(771_681_600);
  });

  it('keeps excluded local fields while applying the rest of selected AI sections', () => {
    const generated: AIDrugDraft = {
      ...draft,
      tradeNames: ['Generated trade'],
      warnings: ['Generated warning'],
      contraindications: ['Generated contraindication'],
    };
    const updated = applyAIDrugDraft(
      makeDrug({ tradeNames: ['Local trade'], warnings: ['Local warning'], contraindications: [] }),
      generated,
      new Set(['Identity', 'Safety']),
      new Date('2025-06-15T12:00:00.000Z'),
      () => '44444444-4444-4444-8444-444444444444',
      new Set(['identity.tradeNames', 'safety.warnings']),
    );
    expect(updated.tradeNames).toEqual(['Local trade']);
    expect(updated.warnings).toEqual(['Local warning']);
    expect(updated.contraindications).toEqual(['Generated contraindication']);
    expect(availableAIImportFields(generated).map((field) => field.key)).toEqual(
      expect.arrayContaining(['identity.tradeNames', 'safety.warnings']),
    );
  });
});
