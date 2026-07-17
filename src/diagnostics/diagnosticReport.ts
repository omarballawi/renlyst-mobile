export const MAX_DIAGNOSTIC_REPORTS = 10;

export type CrashDiagnostic = {
  schemaVersion: 1;
  id: string;
  occurredAt: string;
  appVersion: string;
  buildVersion: string;
  platform: string;
  route: string;
  errorName: string;
  message: string;
  componentStack: string | null;
};

export type CrashDiagnosticInput = {
  id: string;
  occurredAt?: Date;
  appVersion: string;
  buildVersion: string;
  platform: string;
  route: string | null | undefined;
  error: unknown;
  componentStack?: string | null;
};

export type DiagnosticStorage = {
  read(): string | null;
  write(serialized: string): void;
};

const genericMessage = 'A rendering error interrupted the interface.';

function safeErrorName(error: unknown): string {
  const candidate = error instanceof Error ? error.name : 'UnknownError';
  const normalized = candidate.replace(/[^A-Za-z0-9_.-]/gu, '').slice(0, 80);
  return normalized || 'UnknownError';
}

function safeRoute(route: string | null | undefined): string {
  const pathname = (route ?? '/').split(/[?#]/u, 1)[0] || '/';
  return pathname
    .replace(/\/[0-9a-f]{8}-[0-9a-f-]{27,}/giu, '/:id')
    .replace(/\/[^/]{65,}/gu, '/:value')
    .slice(0, 180);
}

function safeComponentStack(componentStack: string | null | undefined): string | null {
  if (!componentStack) return null;

  const lines = componentStack
    .split('\n')
    .map((line) => line.replace(/[\t\r]/gu, ' ').trim())
    .filter(Boolean)
    .slice(0, 24)
    .map((line) => line.slice(0, 160));

  return lines.length > 0 ? lines.join('\n') : null;
}

export function createCrashDiagnostic(input: CrashDiagnosticInput): CrashDiagnostic {
  return {
    schemaVersion: 1,
    id: input.id,
    occurredAt: (input.occurredAt ?? new Date()).toISOString(),
    appVersion: input.appVersion,
    buildVersion: input.buildVersion,
    platform: input.platform,
    route: safeRoute(input.route),
    errorName: safeErrorName(input.error),
    // Do not persist error.message: it may contain private library, search, provider, or encounter data.
    message: genericMessage,
    componentStack: safeComponentStack(input.componentStack),
  };
}

export function parseCrashDiagnostics(serialized: string | null): CrashDiagnostic[] {
  if (!serialized) return [];

  try {
    const parsed: unknown = JSON.parse(serialized);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (report): report is CrashDiagnostic =>
        typeof report === 'object' &&
        report !== null &&
        (report as Partial<CrashDiagnostic>).schemaVersion === 1 &&
        typeof (report as Partial<CrashDiagnostic>).id === 'string' &&
        typeof (report as Partial<CrashDiagnostic>).occurredAt === 'string' &&
        typeof (report as Partial<CrashDiagnostic>).appVersion === 'string' &&
        typeof (report as Partial<CrashDiagnostic>).buildVersion === 'string' &&
        typeof (report as Partial<CrashDiagnostic>).platform === 'string' &&
        typeof (report as Partial<CrashDiagnostic>).route === 'string' &&
        typeof (report as Partial<CrashDiagnostic>).errorName === 'string' &&
        typeof (report as Partial<CrashDiagnostic>).message === 'string' &&
        (typeof (report as Partial<CrashDiagnostic>).componentStack === 'string' ||
          (report as Partial<CrashDiagnostic>).componentStack === null),
    );
  } catch {
    return [];
  }
}

export function appendCrashDiagnostic(
  storage: DiagnosticStorage,
  report: CrashDiagnostic,
): CrashDiagnostic[] {
  const reports = [...parseCrashDiagnostics(storage.read()), report].slice(-MAX_DIAGNOSTIC_REPORTS);
  storage.write(JSON.stringify(reports));
  return reports;
}

export function formatCrashDiagnostic(report: CrashDiagnostic): string {
  return [
    'Renlyst privacy-safe diagnostic report',
    `Occurred: ${report.occurredAt}`,
    `App version: ${report.appVersion} (${report.buildVersion})`,
    `Platform: ${report.platform}`,
    `Route: ${report.route}`,
    `Error class: ${report.errorName}`,
    `Message: ${report.message}`,
    `Component stack: ${report.componentStack ?? 'Unavailable'}`,
    '',
    'This report intentionally excludes drug data, backups, images, searches, encounters, API keys, and provider configuration.',
  ].join('\n');
}
