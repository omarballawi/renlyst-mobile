import { drugBackupSchema } from '@/domain/backup';
import { memoryAnchorsFor } from '@/domain/drugs/memoryAnchors';

function profile() {
  return drugBackupSchema.parse({
    id: 'drug-1',
    scientificName: 'Metformin',
    dateAdded: '2026-01-01T00:00:00.000Z',
    nextReviewDate: '2026-01-01T00:00:00.000Z',
    mustKnow: ['Take with food', 'Take with food'],
    indications: ['Type 2 diabetes'],
    warnings: ['Hold around contrast when clinically indicated'],
    mechanism: 'Reduces hepatic glucose output',
  });
}

describe('memoryAnchorsFor', () => {
  it('returns three unique anchors in Swift priority order', () => {
    const anchors = memoryAnchorsFor(profile());
    expect(anchors).toHaveLength(3);
    expect(anchors.map((anchor) => anchor.kind)).toEqual(['mustKnow', 'use', 'safety']);
  });

  it('uses explicit empty slots rather than invented facts', () => {
    const anchors = memoryAnchorsFor(
      drugBackupSchema.parse({
        id: 'drug-2',
        scientificName: 'Unknown',
        dateAdded: '2026-01-01T00:00:00.000Z',
        nextReviewDate: '2026-01-01T00:00:00.000Z',
      }),
    );
    expect(anchors).toHaveLength(3);
    expect(anchors.every((anchor) => anchor.kind === 'empty' && anchor.content === null)).toBe(
      true,
    );
  });
});
