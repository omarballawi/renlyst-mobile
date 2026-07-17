import { sameLocalDay } from '@/data/repositories/drugRepository';

describe('profile seen policy', () => {
  it('increments only when the local calendar day changes', () => {
    expect(sameLocalDay(new Date(2026, 6, 17, 1), new Date(2026, 6, 17, 23))).toBe(true);
    expect(sameLocalDay(new Date(2026, 6, 17, 23), new Date(2026, 6, 18, 0))).toBe(false);
  });
});
