import { File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

import {
  appendCrashDiagnostic,
  type CrashDiagnostic,
  parseCrashDiagnostics,
  type DiagnosticStorage,
} from './diagnosticReport';

const diagnosticFile =
  Platform.OS === 'web' ? null : new File(Paths.document, 'renlyst-diagnostics-v1.json');
let memoryDiagnostic: string | null = null;

const fileStorage: DiagnosticStorage = {
  read: () => {
    if (!diagnosticFile) return memoryDiagnostic;
    return diagnosticFile.exists ? diagnosticFile.textSync() : null;
  },
  write: (serialized) => {
    if (!diagnosticFile) {
      memoryDiagnostic = serialized;
      return;
    }
    if (!diagnosticFile.exists) {
      diagnosticFile.create({ intermediates: true });
    }
    diagnosticFile.write(serialized);
  },
};

export function readCrashDiagnostics(): CrashDiagnostic[] {
  try {
    return parseCrashDiagnostics(fileStorage.read());
  } catch {
    return [];
  }
}

export function saveCrashDiagnostic(report: CrashDiagnostic): CrashDiagnostic[] {
  try {
    return appendCrashDiagnostic(fileStorage, report);
  } catch {
    // A failure to persist a diagnostic must never turn a recoverable render failure into a loop.
    return [];
  }
}
