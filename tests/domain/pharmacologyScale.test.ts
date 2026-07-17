import {
  fallbackPharmacologyPosition,
  formatPharmacologyValue,
  normalizedPharmacologyValue,
  pharmacologyBounds,
  pharmacologyValueAt,
  type PharmacologyScale,
} from '@/domain/clinical/pharmacologyScale';

const scales: readonly PharmacologyScale[] = ['halfLife', 'onset', 'duration'];

describe('pharmacology scale parity', () => {
  it('matches Swift logarithmic mapping, inverse midpoint, and clamping', () => {
    for (const scale of scales) {
      const [lower, upper] = pharmacologyBounds[scale];
      expect(normalizedPharmacologyValue(scale, lower)).toBeCloseTo(0, 4);
      expect(normalizedPharmacologyValue(scale, upper)).toBeCloseTo(1, 4);
      expect(normalizedPharmacologyValue(scale, lower / 10)).toBeCloseTo(0, 4);
      expect(normalizedPharmacologyValue(scale, upper * 10)).toBeCloseTo(1, 4);
      expect(pharmacologyValueAt(scale, 0.5)).toBeCloseTo(Math.sqrt(lower * upper), 3);
    }
  });

  it('matches Swift display units and qualitative fallback positions', () => {
    expect(formatPharmacologyValue('onset', 30)).toBe('30 min');
    expect(formatPharmacologyValue('onset', 90)).toBe('1.5 hr');
    expect(formatPharmacologyValue('halfLife', 0.5)).toBe('30 min');
    expect(formatPharmacologyValue('duration', 72)).toBe('3.0 days');
    expect(fallbackPharmacologyPosition('Very long')).toBe(1);
    expect(fallbackPharmacologyPosition('Moderate')).toBe(0.5);
    expect(fallbackPharmacologyPosition('Fast')).toBe(0.22);
    expect(fallbackPharmacologyPosition('Unknown')).toBe(0);
  });
});
