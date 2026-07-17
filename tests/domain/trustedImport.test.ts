import {
  applyTrustedImport,
  availableTrustedImportFields,
  availableTrustedImportSections,
  defaultTrustedImportSelection,
} from '@/domain/drugs/trustedImport';
import { buildTrustedPacket, parseDailyMedSPL } from '@/services/drugSources/trustedSources';
import { makeDrug } from '../fixtures/backup';

describe('trusted source extraction', () => {
  it('maps DailyMed SPL section codes, forms, routes, and generic names', () => {
    const xml = `
      <document>
        <component><structuredBody>
          <component><section>
            <code code="34067-9" />
            <text><paragraph>For treatment of edema.</paragraph></text>
          </section></component>
          <component><section>
            <code code="34073-7" />
            <text><paragraph>Monitor with interacting medicines.</paragraph></text>
          </section></component>
        </structuredBody></component>
        <manufacturedProduct>
          <formCode displayName="Tablet" />
          <routeCode displayName="Oral" />
          <genericMedicine><name>Furosemide</name></genericMedicine>
        </manufacturedProduct>
      </document>`;

    const packet = parseDailyMedSPL(xml, 'set-id', 'Jun 15, 2025');
    expect(packet.indicationsText).toContain('For treatment of edema.');
    expect(packet.interactionsText).toContain('Monitor with interacting medicines.');
    expect(packet.dosageFormsText).toBe('Tablet');
    expect(packet.routeText).toBe('Oral');
    expect(packet.activeIngredientText).toBe('Furosemide');
    expect(packet.sourceURL).toContain('set-id');
  });

  it('trims oversized source sections and reports that fact', () => {
    const packet = buildTrustedPacket({
      sourceName: 'openFDA',
      sourceURL: 'https://example.test/label',
      sections: { warnings: `${'Long warning sentence. '.repeat(200)}Finish.` },
    });
    expect(packet.warningsText.length).toBeLessThanOrEqual(1_800);
    expect(packet.isTruncated).toBe(true);
  });
});

describe('trusted import review and application', () => {
  const packet = buildTrustedPacket({
    sourceName: 'DailyMed',
    sourceURL: 'https://example.test/label',
    sections: {
      indications: 'Official indication text.',
      dosage: 'Official dosage and administration text.',
      warnings: 'Official warning text.',
      contraindications: 'Official contraindication text.',
      interactions: 'Official interaction text.',
      pharmacokinetics: 'Official clinical pharmacology text.',
      pregnancy: 'Official pregnancy text.',
    },
    dosageForms: ['Tablet'],
    routes: ['Oral'],
    activeIngredients: ['Furosemide'],
  });

  it('defaults only missing profile areas to selected', () => {
    const drug = makeDrug({
      indications: [],
      warnings: ['Personal warning'],
      contraindications: [],
      howToTake: '',
      pharmacologyProfileJSON: '',
      pregnancyCaution: '',
    });
    const selection = defaultTrustedImportSelection(drug, packet);
    expect(selection.has('Uses')).toBe(true);
    expect(selection.has('Dosage')).toBe(true);
    expect(selection.has('Safety')).toBe(false);
    expect(selection.has('Pharmacology')).toBe(true);
    expect(availableTrustedImportSections(packet)).toContain('Interactions');
  });

  it('updates only selected fields and stores Swift-compatible evidence', () => {
    const drug = makeDrug({
      indications: ['Personal use'],
      warnings: ['Personal warning'],
      interactions: ['Personal interaction'],
    });
    const updated = applyTrustedImport(
      drug,
      packet,
      new Set(['Uses', 'Safety']),
      new Date('2025-06-15T12:00:00.000Z'),
      () => '22222222-2222-4222-8222-222222222222',
    );

    expect(updated.indications).toEqual(['Official indication text.']);
    expect(updated.warnings).toEqual(['Official warning text.']);
    expect(updated.interactions).toEqual(['Personal interaction']);
    expect(updated.importedSourceName).toBe('DailyMed');
    expect(updated.verificationRaw).toBe('Needs pharmacist verification');
    expect(updated.reviewQuestionsNeedRegeneration).toBe(true);
    const evidence = JSON.parse(updated.fieldEvidenceJSON ?? '') as Record<string, unknown>[];
    expect(evidence.map((item) => item.fieldKey)).toEqual([
      'uses',
      'contraindications',
      'warnings',
    ]);
    expect(evidence[0]?.retrievedAt).toBe(771_681_600);
    expect(evidence[0]?.quality).toBe('officialLabel');
  });

  it('respects Swift field-level exclusions inside a selected section', () => {
    const drug = makeDrug({
      warnings: ['Keep this local warning'],
      contraindications: [],
    });
    const updated = applyTrustedImport(
      drug,
      packet,
      new Set(['Safety']),
      new Date('2025-06-15T12:00:00.000Z'),
      () => '33333333-3333-4333-8333-333333333333',
      new Set(['safety.warnings']),
    );
    expect(updated.warnings).toEqual(['Keep this local warning']);
    expect(updated.contraindications).toEqual(['Official contraindication text.']);
    expect(availableTrustedImportFields(packet).map((field) => field.key)).toEqual(
      expect.arrayContaining(['safety.warnings', 'safety.contraindications']),
    );
  });
});
