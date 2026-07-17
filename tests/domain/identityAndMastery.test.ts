import { canonicalIngredientKey, normalizeIdentity } from '@/domain/drugs/identity';
import { isMastered, masteryCount, requiredMasteryCount } from '@/domain/drugs/mastery';
import { containsObviousIdentifier } from '@/domain/privacy/privacyValidator';
import { makeDrug } from '@/../tests/fixtures/backup';

describe('drug identity and mastery invariants', () => {
  it('deduplicates case, width, punctuation, and diacritics while preserving combinations', () => {
    expect(normalizeIdentity('  FURÓSEMIDE  ')).toBe('furosemide');
    expect(canonicalIngredientKey(['Amoxicillin', 'Clavulanate'])).toBe(
      'ingredient:amoxicillin+clavulanate',
    );
    expect(canonicalIngredientKey(['Clavulanate', 'amoxicillin'])).toBe(
      'ingredient:amoxicillin+clavulanate',
    );
    expect(canonicalIngredientKey(['Amoxicillin'])).not.toBe(
      canonicalIngredientKey(['Amoxicillin', 'Clavulanate']),
    );
  });

  it('uses five required checks for a classless drug and six otherwise', () => {
    const classless = makeDrug({
      drugClass: '',
      masteryScientificName: true,
      masteryTradeName: true,
      masteryUse: true,
      masteryWarning: true,
      masteryCounseling: true,
    });
    expect(masteryCount(classless)).toBe(5);
    expect(requiredMasteryCount(classless)).toBe(5);
    expect(isMastered(classless)).toBe(true);

    const classified = makeDrug({ ...classless, drugClass: 'Loop diuretic' });
    expect(requiredMasteryCount(classified)).toBe(6);
    expect(isMastered(classified)).toBe(false);
  });

  it('detects obvious Iraqi phone numbers and email addresses without flagging ordinary notes', () => {
    expect(containsObviousIdentifier('Call 07701234567')).toBe(true);
    expect(containsObviousIdentifier('student@example.com')).toBe(true);
    expect(containsObviousIdentifier('Observed inhaler counseling under supervision')).toBe(false);
  });
});
