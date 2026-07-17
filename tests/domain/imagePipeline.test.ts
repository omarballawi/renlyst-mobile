import {
  centerCrop,
  editorResizeActions,
  persistenceActions,
} from '@/features/capture/imagePipeline';

describe('capture image pipeline parity', () => {
  it('downsamples oversized landscape and portrait files before editing', () => {
    expect(editorResizeActions(4_800, 3_600)).toEqual([{ resize: { width: 2_400 } }]);
    expect(editorResizeActions(3_000, 5_000)).toEqual([{ resize: { height: 2_400 } }]);
    expect(editorResizeActions(1_600, 1_200)).toEqual([]);
  });

  it('creates a centered 4:3 card image capped at 1600 pixels', () => {
    const landscape = centerCrop(4_000, 2_000, 4 / 3);
    expect(landscape.width / landscape.height).toBeCloseTo(4 / 3, 6);
    expect(landscape.originX).toBeGreaterThan(0);

    const portrait = centerCrop(2_000, 4_000, 4 / 3);
    expect(portrait.width / portrait.height).toBeCloseTo(4 / 3, 6);
    expect(portrait.originY).toBeGreaterThan(0);

    expect(persistenceActions(4_800, 3_600, 'original')).toEqual([
      { crop: { originX: 0, originY: 0, width: 4_800, height: 3_600 } },
      { resize: { width: 1_600 } },
    ]);
  });

  it('creates the same centered 256 square thumbnail contract as Swift', () => {
    expect(persistenceActions(1_600, 1_200, 'thumbnail')).toEqual([
      { crop: { originX: 200, originY: 0, width: 1_200, height: 1_200 } },
      { resize: { width: 256, height: 256 } },
    ]);
  });
});
