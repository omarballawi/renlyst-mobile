import { extractEmbeddedImages } from '@/domain/backup';
import { makeBackup, makeDrug } from '@/../tests/fixtures/backup';

describe('embedded Swift image extraction', () => {
  it('maps primary and additional images to stable owner/ordinal/role positions', () => {
    const backup = makeBackup({
      includesImages: true,
      drugs: [
        makeDrug({
          imageData: 'full-0',
          thumbnailData: 'thumb-0',
          additionalImageData: ['full-1', 'full-2'],
          additionalThumbnailData: ['thumb-1', 'thumb-2'],
        }),
      ],
    });
    const extracted = extractEmbeddedImages(backup);
    expect(extracted.images.map((image) => [image.ordinal, image.role, image.base64])).toEqual([
      [0, 'original', 'full-0'],
      [0, 'thumbnail', 'thumb-0'],
      [1, 'original', 'full-1'],
      [2, 'original', 'full-2'],
      [1, 'thumbnail', 'thumb-1'],
      [2, 'thumbnail', 'thumb-2'],
    ]);
    expect(extracted.backup.drugs[0]?.imageData).toBeNull();
    expect(extracted.backup.drugs[0]?.additionalImageData).toEqual([]);
  });

  it('does not stage image-shaped values from a lightweight backup', () => {
    const backup = makeBackup({
      includesImages: false,
      drugs: [makeDrug({ imageData: 'unexpected' })],
    });
    const extracted = extractEmbeddedImages(backup);
    expect(extracted.images).toEqual([]);
    expect(extracted.backup.drugs[0]?.imageData).toBeNull();
  });
});
