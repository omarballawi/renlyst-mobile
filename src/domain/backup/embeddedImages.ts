import type { DrugBackup, DrugProductBackup, PharmaShiftBackup } from './schema';

export type BackupImageOwner = 'drug' | 'product';
export type BackupImageRole = 'original' | 'thumbnail';

export type EmbeddedBackupImage = {
  ownerType: BackupImageOwner;
  ownerID: string;
  ordinal: number;
  role: BackupImageRole;
  base64: string;
};

export type ExtractedBackupImages = {
  backup: PharmaShiftBackup;
  images: EmbeddedBackupImage[];
};

function extractRecordImages(
  ownerType: BackupImageOwner,
  record: DrugBackup | DrugProductBackup,
): EmbeddedBackupImage[] {
  const images: EmbeddedBackupImage[] = [];
  if (record.imageData) {
    images.push({
      ownerType,
      ownerID: record.id,
      ordinal: 0,
      role: 'original',
      base64: record.imageData,
    });
  }
  if (record.thumbnailData) {
    images.push({
      ownerType,
      ownerID: record.id,
      ordinal: 0,
      role: 'thumbnail',
      base64: record.thumbnailData,
    });
  }
  record.additionalImageData.forEach((base64, index) => {
    images.push({ ownerType, ownerID: record.id, ordinal: index + 1, role: 'original', base64 });
  });
  record.additionalThumbnailData.forEach((base64, index) => {
    images.push({ ownerType, ownerID: record.id, ordinal: index + 1, role: 'thumbnail', base64 });
  });
  return images;
}

function withoutEmbeddedImages<T extends DrugBackup | DrugProductBackup>(record: T): T {
  return {
    ...record,
    imageData: null,
    thumbnailData: null,
    additionalImageData: [],
    additionalThumbnailData: [],
  };
}

export function extractEmbeddedImages(source: PharmaShiftBackup): ExtractedBackupImages {
  const backup = structuredClone(source);
  const images = backup.includesImages
    ? [
        ...backup.drugs.flatMap((drug) => extractRecordImages('drug', drug)),
        ...(backup.products ?? []).flatMap((product) => extractRecordImages('product', product)),
      ]
    : [];

  return {
    backup: {
      ...backup,
      drugs: backup.drugs.map(withoutEmbeddedImages),
      products: (backup.products ?? []).map(withoutEmbeddedImages),
    },
    images,
  };
}
