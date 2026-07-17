export function normalizeCredential(value: string): string {
  return value.replace(/\s+/gu, '');
}
