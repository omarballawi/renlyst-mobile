import { z } from 'zod';

import {
  CURRENT_BACKUP_SCHEMA_VERSION,
  pharmaShiftBackupSchema,
  type BackupRecordCounts,
  type PharmaShiftBackup,
} from './schema';

export type BackupValidationIssue = {
  path: string;
  message: string;
};

export class BackupValidationError extends Error {
  readonly issues: BackupValidationIssue[];

  constructor(message: string, issues: BackupValidationIssue[] = []) {
    super(message);
    this.name = 'BackupValidationError';
    this.issues = issues;
  }
}

function countsFor(backup: PharmaShiftBackup): BackupRecordCounts {
  return {
    drugs: backup.drugs.length,
    reviews: backup.reviews.length,
    shifts: backup.shifts.length,
    encounters: backup.encounters.length,
    reports: backup.reports.length,
    learningProfiles: backup.learningProfiles?.length ?? 0,
    dailyActivities: backup.dailyActivities?.length ?? 0,
  };
}

function issuePath(issue: z.core.$ZodIssue): string {
  return issue.path.length === 0 ? 'backup' : issue.path.map(String).join('.');
}

export function parseBackupJson(json: string): PharmaShiftBackup {
  let decoded: unknown;
  try {
    decoded = JSON.parse(json) as unknown;
  } catch {
    throw new BackupValidationError('This file is not valid JSON. No data was changed.');
  }

  const result = pharmaShiftBackupSchema.safeParse(decoded);
  if (!result.success) {
    const newerSchemaVersion =
      typeof decoded === 'object' &&
      decoded !== null &&
      'schemaVersion' in decoded &&
      typeof decoded.schemaVersion === 'number' &&
      decoded.schemaVersion > CURRENT_BACKUP_SCHEMA_VERSION
        ? decoded.schemaVersion
        : null;

    if (newerSchemaVersion !== null) {
      throw new BackupValidationError(
        `This backup uses schema ${newerSchemaVersion}. Renlyst supports schemas 1–${CURRENT_BACKUP_SCHEMA_VERSION}. No data was changed.`,
      );
    }

    throw new BackupValidationError(
      'This backup is incomplete or malformed. No data was changed.',
      result.error.issues.map((issue) => ({ path: issuePath(issue), message: issue.message })),
    );
  }

  const backup = result.data;
  return {
    ...backup,
    counts: countsFor(backup),
    learningProfiles: backup.learningProfiles ?? [],
    dailyActivities: backup.dailyActivities ?? [],
    products: backup.products ?? [],
    relationships: backup.relationships ?? [],
  };
}

export function serializeSwiftCompatibleBackup(backup: PharmaShiftBackup): string {
  const normalized = pharmaShiftBackupSchema.parse({
    ...backup,
    schemaVersion: CURRENT_BACKUP_SCHEMA_VERSION,
    counts: countsFor(backup),
  });

  return JSON.stringify(normalized, null, 2);
}
