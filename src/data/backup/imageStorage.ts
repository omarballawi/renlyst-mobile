import * as Crypto from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';

import {
  extractEmbeddedImages,
  type EmbeddedBackupImage,
  type PharmaShiftBackup,
} from '@/domain/backup';

export type StagedBackupImage = Omit<EmbeddedBackupImage, 'base64'> & {
  id: string;
  temporaryUri: string;
  finalUri: string;
  sha256: string;
  byteSize: number;
  mimeType: string;
};

export type StagedBackup = {
  backup: PharmaShiftBackup;
  images: StagedBackupImage[];
  stagingDirectoryUri: string;
};

export type PromotedBackupImage = Omit<StagedBackupImage, 'temporaryUri'> & {
  created: boolean;
};

function bytesToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function mimeTypeFor(bytes: Uint8Array): string {
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return 'image/png';
  }
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
    return 'image/webp';
  }
  return 'image/jpeg';
}

function extensionFor(mimeType: string): string {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  return 'jpg';
}

function safeSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9-]/g, '_');
}

export class BackupImageStorage {
  async stage(source: PharmaShiftBackup): Promise<StagedBackup> {
    const extracted = extractEmbeddedImages(source);
    const batchID = Crypto.randomUUID();
    const stagingDirectory = new Directory(Paths.cache, 'renlyst-imports', batchID);
    stagingDirectory.create({ intermediates: true, idempotent: true });
    const images: StagedBackupImage[] = [];

    try {
      for (const [index, embedded] of extracted.images.entries()) {
        const temporary = new File(stagingDirectory, `${index}.image`);
        temporary.create({ intermediates: true, overwrite: true });
        temporary.write(embedded.base64, { encoding: 'base64' });
        const bytes = await temporary.bytes();
        const digest = await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, bytes);
        const sha256 = bytesToHex(digest);
        const mimeType = mimeTypeFor(bytes);
        const ownerDirectory = new Directory(
          Paths.document,
          'renlyst',
          'images',
          embedded.ownerType,
          safeSegment(embedded.ownerID),
        );
        const fileName = `${embedded.ordinal}-${embedded.role}-${sha256}.${extensionFor(mimeType)}`;
        const finalFile = new File(ownerDirectory, fileName);
        const { base64: _base64, ...metadata } = embedded;
        images.push({
          ...metadata,
          id: `${embedded.ownerType}:${embedded.ownerID}:${embedded.ordinal}:${embedded.role}`,
          temporaryUri: temporary.uri,
          finalUri: finalFile.uri,
          sha256,
          byteSize: bytes.byteLength,
          mimeType,
        } as StagedBackupImage);
      }
      return { backup: extracted.backup, images, stagingDirectoryUri: stagingDirectory.uri };
    } catch (error) {
      if (stagingDirectory.exists) stagingDirectory.delete();
      throw error;
    }
  }

  async promote(staged: StagedBackup): Promise<PromotedBackupImage[]> {
    const promoted: PromotedBackupImage[] = [];
    try {
      for (const image of staged.images) {
        const temporary = new File(image.temporaryUri);
        if (!temporary.exists) throw new Error(`A staged backup image is missing: ${image.id}`);
        const bytes = await temporary.bytes();
        const digest = await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, bytes);
        if (bytesToHex(digest) !== image.sha256) {
          throw new Error(`A staged backup image failed its integrity check: ${image.id}`);
        }
        const destination = new File(image.finalUri);
        destination.parentDirectory.create({ intermediates: true, idempotent: true });
        const created = !destination.exists;
        if (created) {
          await temporary.move(destination);
        } else if (temporary.exists) {
          temporary.delete();
        }
        const { temporaryUri: _temporaryUri, ...persisted } = image;
        promoted.push({ ...persisted, created });
      }
      this.cleanupStaging(staged);
      return promoted;
    } catch (error) {
      await this.rollbackPromotion(promoted);
      this.cleanupStaging(staged);
      throw error;
    }
  }

  cleanupStaging(staged: StagedBackup): void {
    const stagingDirectory = new Directory(staged.stagingDirectoryUri);
    if (stagingDirectory.exists) stagingDirectory.delete();
  }

  async rollbackPromotion(images: readonly PromotedBackupImage[]): Promise<void> {
    for (const image of images) {
      if (!image.created) continue;
      const file = new File(image.finalUri);
      if (file.exists) file.delete();
    }
  }

  deleteUris(uris: readonly string[]): void {
    for (const uri of uris) {
      const file = new File(uri);
      if (file.exists) file.delete();
    }
  }
}
