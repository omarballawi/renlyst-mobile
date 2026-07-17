export type LegacyDate = string | number;

const swiftReferenceDateUnixSeconds = 978_307_200;

export function swiftReferenceTime(date: Date): number {
  return date.valueOf() / 1_000 - swiftReferenceDateUnixSeconds;
}

export function dateFromLegacy(value: LegacyDate): Date | null {
  if (typeof value === 'string') {
    const date = new Date(value);
    return Number.isNaN(date.valueOf()) ? null : date;
  }

  const milliseconds =
    value > 10_000_000_000
      ? value
      : value > 1_000_000_000
        ? value * 1_000
        : (value + swiftReferenceDateUnixSeconds) * 1_000;
  const date = new Date(milliseconds);
  return Number.isNaN(date.valueOf()) ? null : date;
}

export function isoDate(value: LegacyDate | null | undefined, fallback = new Date(0)): string {
  return (value == null ? null : dateFromLegacy(value))?.toISOString() ?? fallback.toISOString();
}

export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addLocalDays(date: Date, days: number): Date {
  const result = startOfLocalDay(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function isSameLocalDay(first: Date, second: Date): boolean {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}
