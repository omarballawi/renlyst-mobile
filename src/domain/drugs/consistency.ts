import type { DrugBackup } from '@/domain/backup';

type TargetUnit = 'minutes' | 'hours';

function normalizedValue(text: string, targetUnit: TargetUnit): number | null {
  const numbers = [...text.matchAll(/\d+(?:\.\d+)?/gu)]
    .slice(0, 2)
    .map((match) => Number(match[0]))
    .filter(Number.isFinite);
  if (numbers.length === 0) return null;
  let value = numbers.reduce((total, item) => total + item, 0) / numbers.length;
  const lower = text.toLocaleLowerCase();
  if (targetUnit === 'minutes') {
    if (lower.includes('hour') || lower.includes(' hr')) value *= 60;
    else if (lower.includes('day')) value *= 1_440;
  } else if (lower.includes('minute') || lower.includes(' min')) value /= 60;
  else if (lower.includes('day')) value *= 24;
  return value;
}

function unknown(value: string): boolean {
  return !value.trim() || value.trim().toLocaleLowerCase() === 'unknown';
}

export function normalizeDrugConsistency(drug: DrugBackup): DrugBackup {
  const value = {
    ...drug,
    routes: drug.routes.map((route) =>
      route.trim().toLocaleLowerCase() === 'orak' ? 'Oral' : route,
    ),
  };
  value.halfLifeHours ??= normalizedValue(value.halfLifeText, 'hours');
  value.onsetMinutes ??= normalizedValue(value.onsetText, 'minutes');
  value.durationHours ??= normalizedValue(value.durationText, 'hours');

  if (value.halfLifeHours != null && unknown(value.halfLifeBandRaw)) {
    value.halfLifeBandRaw =
      value.halfLifeHours < 6
        ? 'Short'
        : value.halfLifeHours < 24
          ? 'Medium'
          : value.halfLifeHours < 72
            ? 'Long'
            : 'Very long';
  }
  if (value.onsetMinutes != null && unknown(value.onsetBandRaw)) {
    value.onsetBandRaw =
      value.onsetMinutes <= 60 ? 'Fast' : value.onsetMinutes <= 240 ? 'Moderate' : 'Slow';
  }
  if (value.durationHours != null && unknown(value.durationBandRaw)) {
    value.durationBandRaw =
      value.durationHours < 8 ? 'Short' : value.durationHours <= 24 ? 'Medium' : 'Long';
  }
  if (value.timesPerDay == null) {
    value.timesPerDay =
      {
        'once daily': 1,
        'twice daily': 2,
        'three times daily': 3,
        'four times daily': 4,
      }[value.dosingFrequencyRaw.trim().toLocaleLowerCase()] ?? null;
  }
  return value;
}
