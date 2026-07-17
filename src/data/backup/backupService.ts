import * as Crypto from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import {
  parseBackupJson,
  serializeSwiftCompatibleBackup,
  mergeDuplicateProfiles,
  combinedTrainingReportsText,
  drugLibraryCSV,
  type PharmaShiftBackup,
} from '@/domain/backup';
import { repairLegacyProductAuthority } from '@/data/database/legacyLibraryRepair';

import { BackupImageStorage, type StagedBackup } from './imageStorage';
import {
  BackupPersistence,
  type BackupRestoreMode,
  type BackupRestoreSummary,
} from './backupPersistence';

export type BackupImportPreview = {
  backup: PharmaShiftBackup;
  staged: StagedBackup;
  sourceHash: string;
  imageCount: number;
  mergedProfileCount: number;
  mergedProductCount: number;
};

export class BackupService {
  private readonly persistence: BackupPersistence;
  private readonly imageStorage: BackupImageStorage;

  constructor(
    private readonly db: SQLiteDatabase,
    imageStorage = new BackupImageStorage(),
  ) {
    this.persistence = new BackupPersistence(db);
    this.imageStorage = imageStorage;
  }

  async prepareImport(json: string): Promise<BackupImportPreview> {
    const normalized = mergeDuplicateProfiles(parseBackupJson(json));
    const backup = normalized.backup;
    const sourceHash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, json);
    const staged = await this.imageStorage.stage(backup);
    return {
      backup,
      staged,
      sourceHash,
      imageCount: staged.images.length,
      mergedProfileCount: normalized.mergedProfileCount,
      mergedProductCount: normalized.mergedProductCount,
    };
  }

  cancelImport(preview: BackupImportPreview): void {
    this.imageStorage.cleanupStaging(preview.staged);
  }

  async restore(
    preview: BackupImportPreview,
    mode: BackupRestoreMode,
  ): Promise<BackupRestoreSummary> {
    const promoted = await this.imageStorage.promote(preview.staged);
    let result: Awaited<ReturnType<BackupPersistence['restore']>>;
    try {
      result = await this.persistence.restore(
        preview.staged.backup,
        promoted,
        mode,
        preview.sourceHash,
      );
    } catch (error) {
      await this.imageStorage.rollbackPromotion(promoted);
      throw error;
    }
    await repairLegacyProductAuthority(this.db);
    this.imageStorage.deleteUris(result.staleImageUris);
    return result.summary;
  }

  async exportJson(includesImages: boolean): Promise<string> {
    return serializeSwiftCompatibleBackup(await this.persistence.makeBackup(includesImages));
  }

  async exportDrugCSV(): Promise<string> {
    const backup = await this.persistence.makeBackup(false);
    return drugLibraryCSV(backup.drugs, backup.products ?? []);
  }

  async exportTrainingReportsText(): Promise<string> {
    const backup = await this.persistence.makeBackup(false);
    return combinedTrainingReportsText(backup.reports);
  }
}
