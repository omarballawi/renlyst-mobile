import type { Action } from 'expo-image-manipulator';

export const editorMaxDimension = 2_400;
export const storedMaxDimension = 1_600;
export const thumbnailDimension = 256;

export function editorResizeActions(
  width: number,
  height: number,
  maxDimension = editorMaxDimension,
): Action[] {
  if (Math.max(width, height) <= maxDimension) return [];
  return [
    {
      resize: width >= height ? { width: maxDimension } : { height: maxDimension },
    },
  ];
}

export function centerCrop(
  width: number,
  height: number,
  targetRatio: number,
): { originX: number; originY: number; width: number; height: number } {
  const safeWidth = Math.max(1, width);
  const safeHeight = Math.max(1, height);
  if (safeWidth / safeHeight > targetRatio) {
    const cropWidth = safeHeight * targetRatio;
    return {
      originX: (safeWidth - cropWidth) / 2,
      originY: 0,
      width: cropWidth,
      height: safeHeight,
    };
  }
  const cropHeight = safeWidth / targetRatio;
  return {
    originX: 0,
    originY: (safeHeight - cropHeight) / 2,
    width: safeWidth,
    height: cropHeight,
  };
}

export function persistenceActions(
  width: number,
  height: number,
  role: 'original' | 'thumbnail',
): Action[] {
  if (role === 'thumbnail') {
    const crop = centerCrop(width, height, 1);
    return [{ crop }, { resize: { width: thumbnailDimension, height: thumbnailDimension } }];
  }

  const crop = centerCrop(width, height, 4 / 3);
  return [{ crop }, { resize: { width: Math.min(storedMaxDimension, crop.width) } }];
}
