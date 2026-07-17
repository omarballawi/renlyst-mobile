import {
  appendCrashDiagnostic,
  createCrashDiagnostic,
  formatCrashDiagnostic,
  MAX_DIAGNOSTIC_REPORTS,
  type DiagnosticStorage,
} from '@/diagnostics/diagnosticReport';

function createMemoryStorage(): DiagnosticStorage & { value: string | null } {
  return {
    value: null,
    read() {
      return this.value;
    },
    write(serialized) {
      this.value = serialized;
    },
  };
}

describe('privacy-safe crash diagnostics', () => {
  it('never persists a raw exception message or a route query', () => {
    const report = createCrashDiagnostic({
      id: 'report-1',
      occurredAt: new Date('2026-07-17T12:00:00.000Z'),
      appVersion: '0.1.0',
      buildVersion: '1',
      platform: 'ios',
      route: '/drug/abc?search=metformin&providerKey=secret',
      error: new Error('Metformin note and sk-live-secret must never leave the device'),
      componentStack: '\n    in DrugDetail\n    in RootNavigator',
    });

    expect(report.message).toBe('A rendering error interrupted the interface.');
    expect(report.route).toBe('/drug/abc');
    expect(JSON.stringify(report)).not.toContain('Metformin');
    expect(JSON.stringify(report)).not.toContain('sk-live-secret');
  });

  it('keeps only the most recent ten reports', () => {
    const storage = createMemoryStorage();

    for (let index = 0; index < MAX_DIAGNOSTIC_REPORTS + 2; index += 1) {
      appendCrashDiagnostic(
        storage,
        createCrashDiagnostic({
          id: `report-${index}`,
          appVersion: '0.1.0',
          buildVersion: '1',
          platform: 'android',
          route: '/',
          error: new Error('private data'),
        }),
      );
    }

    expect(JSON.parse(storage.value ?? '[]')).toHaveLength(MAX_DIAGNOSTIC_REPORTS);
    expect(storage.value).toContain('report-11');
    expect(storage.value).not.toContain('report-0');
  });

  it('formats only the approved diagnostic fields for copying', () => {
    const report = createCrashDiagnostic({
      id: 'report-3',
      occurredAt: new Date('2026-07-17T12:00:00.000Z'),
      appVersion: '0.1.0',
      buildVersion: '1',
      platform: 'ios',
      route: '/',
      error: new TypeError('patient note'),
    });

    expect(formatCrashDiagnostic(report)).toContain('Error class: TypeError');
    expect(formatCrashDiagnostic(report)).not.toContain('patient note');
  });
});
