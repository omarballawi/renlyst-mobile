export type PharmacologyScale = 'halfLife' | 'onset' | 'duration';

export const pharmacologyBounds: Readonly<
  Record<PharmacologyScale, readonly [lower: number, upper: number]>
> = {
  halfLife: [0.25, 168],
  onset: [1, 1_440],
  duration: [0.25, 168],
};

function clamped(value: number, lower: number, upper: number): number {
  return Math.min(upper, Math.max(lower, value));
}

export function normalizedPharmacologyValue(scale: PharmacologyScale, value: number): number {
  const [lower, upper] = pharmacologyBounds[scale];
  const safe = clamped(value, lower, upper);
  return (Math.log(safe) - Math.log(lower)) / (Math.log(upper) - Math.log(lower));
}

export function pharmacologyValueAt(scale: PharmacologyScale, position: number): number {
  const [lower, upper] = pharmacologyBounds[scale];
  const safe = clamped(position, 0, 1);
  return Math.exp(Math.log(lower) + safe * (Math.log(upper) - Math.log(lower)));
}

export function formatPharmacologyValue(scale: PharmacologyScale, value: number): string {
  if (scale === 'onset') {
    return value >= 60 ? `${(value / 60).toFixed(1)} hr` : `${value.toFixed(0)} min`;
  }
  if (value < 1) return `${(value * 60).toFixed(0)} min`;
  if (value >= 48) return `${(value / 24).toFixed(1)} days`;
  return `${value.toFixed(1)} hr`;
}

export function fallbackPharmacologyPosition(value: string): number {
  const normalized = value.toLocaleLowerCase();
  if (normalized.includes('very')) return 1;
  if (normalized.includes('long') || normalized.includes('slow')) return 0.82;
  if (normalized.includes('medium') || normalized.includes('moderate')) return 0.5;
  if (normalized.includes('short') || normalized.includes('fast')) return 0.22;
  return 0;
}
