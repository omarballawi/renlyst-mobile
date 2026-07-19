import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useSQLiteContext } from 'expo-sqlite';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { BackupService, type BackupImportPreview, type BackupRestoreMode } from '@/data/backup';
import { settingKeys, SettingsRepository } from '@/data/repositories';
import { dateFromLegacy } from '@/domain/shared/dates';
import { drugQueryKeys } from '@/features/library/queries';
import { useLocale } from '@/localization/LocaleProvider';
import { AppText, Icon, PressableScale, PrimaryButton, Screen } from '@/ui/components';
import { radii, spacing, useTheme } from '@/ui/theme';
import { useFeedback } from '@/ui/feedback/FeedbackProvider';

type BackupHistory = {
  lastExportAt: string | null;
  lastExportKind: string;
  lastRestoreAt: string | null;
};

const emptyHistory: BackupHistory = {
  lastExportAt: null,
  lastExportKind: '',
  lastRestoreAt: null,
};

export default function BackupScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const { t } = useLocale();
  const feedback = useFeedback();
  const serviceRef = useRef(new BackupService(db));
  const [preview, setPreview] = useState<BackupImportPreview | null>(null);
  const [mode, setMode] = useState<BackupRestoreMode>('merge');
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showIntegrity, setShowIntegrity] = useState(false);
  const [history, setHistory] = useState<BackupHistory>(emptyHistory);

  useEffect(() => {
    let active = true;
    void new SettingsRepository(db)
      .get<BackupHistory>(settingKeys.backupHistory, emptyHistory)
      .then((value) => {
        if (active) setHistory({ ...emptyHistory, ...value });
      });
    return () => {
      active = false;
    };
  }, [db]);

  const recordHistory = (change: Partial<BackupHistory>) => {
    setHistory((current) => {
      const next = { ...current, ...change };
      void new SettingsRepository(db).set(settingKeys.backupHistory, next);
      return next;
    });
  };

  useEffect(() => {
    const service = serviceRef.current;
    return () => {
      if (preview) service.cancelImport(preview);
    };
  }, [preview]);

  const chooseBackup = async () => {
    setBusy('Reading backup…');
    setError(null);
    setMessage(null);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/json', 'text/plain'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled) return;
      if (preview) serviceRef.current.cancelImport(preview);
      const json = await new File(result.assets[0]!.uri).text();
      setPreview(await serviceRef.current.prepareImport(json));
      setShowIntegrity(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The backup could not be read.');
    } finally {
      setBusy(null);
    }
  };

  const restore = async () => {
    if (!preview) return;
    setBusy(mode === 'merge' ? 'Merging records…' : 'Replacing local records…');
    setError(null);
    try {
      const summary = await serviceRef.current.restore(preview, mode);
      setPreview(null);
      await queryClient.invalidateQueries({ queryKey: drugQueryKeys.all });
      setMessage(
        `Imported ${summary.counts.drugs} profiles, ${summary.counts.reviews} reviews, and ${summary.imageCount} images.`,
      );
      recordHistory({ lastRestoreAt: new Date().toISOString() });
      feedback.backupCompleted();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'No records were changed because the restore failed.',
      );
    } finally {
      setBusy(null);
    }
  };

  const requestRestore = () => {
    if (mode === 'merge') {
      void restore();
      return;
    }
    Alert.alert(
      t('Replace all current Renlyst data?'),
      t(
        'Backed-up record types not present in this snapshot will be removed. This cannot be undone unless you have another backup.',
      ),
      [
        { text: t('Cancel'), style: 'cancel' },
        {
          text: t('Replace all data'),
          style: 'destructive',
          onPress: () => {
            feedback.destructiveConfirmed();
            void restore();
          },
        },
      ],
    );
  };

  const exportBackup = async (includesImages: boolean) => {
    setBusy(includesImages ? 'Building complete backup…' : 'Building lightweight backup…');
    setError(null);
    setMessage(null);
    try {
      const json = await serviceRef.current.exportJson(includesImages);
      const stamp = new Date().toISOString().slice(0, 10);
      const file = new File(
        Paths.cache,
        `Renlyst-${includesImages ? 'complete' : 'lightweight'}-${stamp}.json`,
      );
      file.create({ intermediates: true, overwrite: true });
      file.write(json);
      if (!(await Sharing.isAvailableAsync()))
        throw new Error('Sharing is not available on this device.');
      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/json',
        UTI: 'public.json',
        dialogTitle: 'Export Renlyst backup',
      });
      setMessage('Schema-v5 backup created. Provider API keys were not included.');
      recordHistory({
        lastExportAt: new Date().toISOString(),
        lastExportKind: includesImages ? 'Complete JSON' : 'Lightweight JSON',
      });
      feedback.backupCompleted();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The backup could not be exported.');
    } finally {
      setBusy(null);
    }
  };

  const exportPortableText = async (kind: 'csv' | 'report') => {
    setBusy(kind === 'csv' ? 'Building drug library CSV…' : 'Building training report export…');
    setError(null);
    setMessage(null);
    try {
      const stamp = new Date().toISOString().slice(0, 10);
      const isCSV = kind === 'csv';
      const body = isCSV
        ? await serviceRef.current.exportDrugCSV()
        : await serviceRef.current.exportTrainingReportsText();
      const file = new File(
        Paths.cache,
        isCSV ? `Renlyst-Drug-Library-${stamp}.csv` : `Renlyst-Training-Reports-${stamp}.txt`,
      );
      file.create({ intermediates: true, overwrite: true });
      file.write(body);
      if (!(await Sharing.isAvailableAsync()))
        throw new Error('Sharing is not available on this device.');
      await Sharing.shareAsync(file.uri, {
        mimeType: isCSV ? 'text/csv' : 'text/plain',
        dialogTitle: isCSV ? 'Export Renlyst drug library' : 'Export Renlyst training reports',
      });
      setMessage(isCSV ? 'UTF-8 drug library CSV created.' : 'UTF-8 training report text created.');
      recordHistory({
        lastExportAt: new Date().toISOString(),
        lastExportKind: isCSV ? 'Drug library CSV' : 'Training reports',
      });
      feedback.backupCompleted();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The text export could not be created.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen safeBottom>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => router.back()}
            style={[styles.back, { borderColor: colors.line }]}
          >
            <AppText variant="heading" color={colors.ink}>
              ‹
            </AppText>
          </PressableScale>
          <View style={styles.headerCopy}>
            <AppText variant="label" color={colors.aqua}>
              BACKUP & DATA
            </AppText>
            <AppText variant="title" color={colors.ink}>
              Own every record.
            </AppText>
          </View>
        </View>
        <AppText color={colors.mutedInk}>
          Complete backups include package images. Lightweight backups are smaller and preserve
          existing local images when merged.
        </AppText>

        {history.lastExportAt || history.lastRestoreAt ? (
          <View style={[styles.history, { borderColor: colors.line }]}>
            <AppText variant="label" color={colors.mutedInk}>
              LOCAL HISTORY
            </AppText>
            {history.lastExportAt ? (
              <View style={styles.metadataRow}>
                <AppText color={colors.ink}>Last export</AppText>
                <AppText variant="caption" color={colors.mutedInk} style={styles.historyValue}>
                  {history.lastExportKind} · {new Date(history.lastExportAt).toLocaleString()}
                </AppText>
              </View>
            ) : null}
            {history.lastRestoreAt ? (
              <View style={styles.metadataRow}>
                <AppText color={colors.ink}>Last restore</AppText>
                <AppText variant="caption" color={colors.mutedInk} style={styles.historyValue}>
                  {new Date(history.lastRestoreAt).toLocaleString()}
                </AppText>
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={[styles.block, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <View style={[styles.blockIcon, { backgroundColor: colors.aquaSoft }]}>
            <Icon name="database" color={colors.aqua} size={25} />
          </View>
          <AppText variant="heading" color={colors.ink}>
            Export rollback backup
          </AppText>
          <AppText color={colors.mutedInk}>
            Both exports use the Swift-compatible schema-v5 contract and preserve Arabic as UTF-8.
          </AppText>
          <PrimaryButton
            label="Export complete backup"
            icon="image"
            disabled={Boolean(busy)}
            onPress={() => void exportBackup(true)}
          />
          <PressableScale
            accessibilityRole="button"
            disabled={Boolean(busy)}
            onPress={() => void exportBackup(false)}
            style={[styles.secondary, { borderColor: colors.line }]}
          >
            <AppText variant="bodyStrong" color={colors.ink}>
              Export lightweight backup
            </AppText>
          </PressableScale>
        </View>

        <View style={[styles.block, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <View style={[styles.blockIcon, { backgroundColor: colors.aquaSoft }]}>
            <Icon name="database" color={colors.aqua} size={25} />
          </View>
          <AppText variant="heading" color={colors.ink}>
            Portable exports
          </AppText>
          <AppText color={colors.mutedInk}>
            Create UTF-8 files for spreadsheets or a combined placement record. Arabic text is
            preserved.
          </AppText>
          <PrimaryButton
            label="Export drug library CSV"
            icon="database"
            disabled={Boolean(busy)}
            onPress={() => void exportPortableText('csv')}
          />
          <PressableScale
            accessibilityRole="button"
            disabled={Boolean(busy)}
            onPress={() => void exportPortableText('report')}
            style={[styles.secondary, { borderColor: colors.line }]}
          >
            <AppText variant="bodyStrong" color={colors.ink}>
              Export all training reports
            </AppText>
          </PressableScale>
        </View>

        <View style={[styles.block, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <View style={[styles.blockIcon, { backgroundColor: colors.saffronSoft }]}>
            <Icon name="database" color={colors.saffron} size={25} />
          </View>
          <AppText variant="heading" color={colors.ink}>
            Import Swift or Renlyst JSON
          </AppText>
          <AppText color={colors.mutedInk}>
            Schemas 1–5 are validated fully before any database write. Newer and malformed files are
            rejected unchanged.
          </AppText>
          <PrimaryButton
            label="Choose backup file"
            icon="database"
            disabled={Boolean(busy)}
            onPress={() => void chooseBackup()}
          />
        </View>

        {preview ? (
          <View
            style={[styles.preview, { borderColor: colors.aqua, backgroundColor: colors.aquaSoft }]}
          >
            <AppText variant="label" color={colors.aqua}>
              READY TO IMPORT
            </AppText>
            <AppText variant="heading" color={colors.ink}>
              Schema {preview.backup.schemaVersion} ·{' '}
              {preview.backup.includesImages ? 'complete' : 'lightweight'}
            </AppText>
            <View style={[styles.metadata, { borderColor: colors.line }]}>
              <View style={styles.metadataRow}>
                <AppText variant="caption" color={colors.mutedInk}>
                  EXPORTED
                </AppText>
                <AppText variant="bodyStrong" color={colors.ink}>
                  {dateFromLegacy(preview.backup.exportedAt)?.toLocaleString() ?? 'Unknown'}
                </AppText>
              </View>
              <View style={styles.metadataRow}>
                <AppText variant="caption" color={colors.mutedInk}>
                  TOTAL RECORDS
                </AppText>
                <AppText variant="bodyStrong" color={colors.ink}>
                  {preview.backup.counts.drugs +
                    preview.backup.counts.reviews +
                    preview.backup.counts.shifts +
                    preview.backup.counts.encounters +
                    preview.backup.counts.reports +
                    preview.backup.counts.learningProfiles +
                    preview.backup.counts.dailyActivities}
                </AppText>
              </View>
            </View>
            <View style={styles.counts}>
              {[
                ['Profiles', preview.backup.counts.drugs],
                ['Reviews', preview.backup.counts.reviews],
                ['Shifts', preview.backup.counts.shifts],
                ['Encounters', preview.backup.counts.encounters],
                ['Reports', preview.backup.counts.reports],
                ['Learning profiles', preview.backup.counts.learningProfiles],
                ['Daily activity', preview.backup.counts.dailyActivities],
                ['Images', preview.imageCount],
              ].map(([label, value]) => (
                <View key={label} style={[styles.countItem, { backgroundColor: colors.surface }]}>
                  <AppText variant="heading" color={colors.ink}>
                    {value}
                  </AppText>
                  <AppText variant="caption" color={colors.mutedInk}>
                    {label}
                  </AppText>
                </View>
              ))}
            </View>
            {preview.mergedProfileCount > 0 || preview.mergedProductCount > 0 ? (
              <View style={[styles.repairNotice, { backgroundColor: colors.surface }]}>
                <Icon name="check" color={colors.aqua} size={18} />
                <AppText variant="caption" color={colors.ink} style={styles.noticeCopy}>
                  Repaired {preview.mergedProfileCount} duplicate profile
                  {preview.mergedProfileCount === 1 ? '' : 's'} and {preview.mergedProductCount}{' '}
                  duplicate package{preview.mergedProductCount === 1 ? '' : 's'} before import.
                </AppText>
              </View>
            ) : null}
            <View style={[styles.integrity, { borderColor: colors.line }]}>
              <PressableScale
                accessibilityRole="button"
                accessibilityState={{ expanded: showIntegrity }}
                accessibilityHint="Shows the source file hash and every staged image hash"
                onPress={() => setShowIntegrity((value) => !value)}
                style={styles.integrityHeader}
              >
                <View style={styles.integrityCopy}>
                  <AppText variant="bodyStrong" color={colors.ink}>
                    Integrity evidence
                  </AppText>
                  <AppText variant="caption" color={colors.mutedInk}>
                    SHA-256 source and staged image hashes
                  </AppText>
                </View>
                <AppText variant="bodyStrong" color={colors.aqua}>
                  {showIntegrity ? 'Hide' : 'Inspect'}
                </AppText>
              </PressableScale>
              {showIntegrity ? (
                <View style={[styles.hashes, { borderTopColor: colors.line }]}>
                  <View style={styles.hashRow}>
                    <AppText variant="label" color={colors.mutedInk}>
                      SOURCE JSON
                    </AppText>
                    <AppText selectable variant="caption" color={colors.ink}>
                      {preview.sourceHash}
                    </AppText>
                  </View>
                  {preview.staged.images.length === 0 ? (
                    <AppText variant="caption" color={colors.mutedInk}>
                      No embedded image payloads to stage.
                    </AppText>
                  ) : (
                    preview.staged.images.map((image, index) => (
                      <View key={image.id} style={styles.hashRow}>
                        <AppText variant="label" color={colors.mutedInk}>
                          IMAGE {index + 1} · {image.ownerType} · {image.byteSize.toLocaleString()}{' '}
                          B
                        </AppText>
                        <AppText selectable variant="caption" color={colors.ink}>
                          {image.sha256}
                        </AppText>
                      </View>
                    ))
                  )}
                  <AppText variant="caption" color={colors.mutedInk}>
                    Every staged image is hashed again immediately before it is promoted into app
                    storage.
                  </AppText>
                </View>
              ) : null}
            </View>
            <View style={[styles.mode, { backgroundColor: colors.surfaceStrong }]}>
              {(['merge', 'replace'] as const).map((value) => (
                <PressableScale
                  key={value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: mode === value }}
                  onPress={() => setMode(value)}
                  style={[styles.modeChoice, mode === value && { backgroundColor: colors.surface }]}
                >
                  <AppText
                    variant="bodyStrong"
                    color={mode === value ? colors.ink : colors.mutedInk}
                  >
                    {value === 'merge' ? 'Merge' : 'Replace'}
                  </AppText>
                </PressableScale>
              ))}
            </View>
            <AppText variant="caption" color={colors.mutedInk}>
              {mode === 'merge'
                ? 'Updates matching UUIDs and keeps records not in this file.'
                : 'Removes backed-up record types that are not in this file. App preferences and protected keys remain local.'}
            </AppText>
            <PrimaryButton
              label={mode === 'merge' ? 'Merge verified backup' : 'Replace with verified backup'}
              icon="check"
              disabled={Boolean(busy)}
              onPress={requestRestore}
            />
            <PressableScale
              accessibilityRole="button"
              onPress={() => {
                serviceRef.current.cancelImport(preview);
                setPreview(null);
              }}
            >
              <AppText variant="bodyStrong" color={colors.danger}>
                Cancel import
              </AppText>
            </PressableScale>
          </View>
        ) : null}

        {busy ? (
          <View
            accessibilityRole="progressbar"
            style={[styles.notice, { backgroundColor: colors.saffronSoft }]}
          >
            <AppText color={colors.ink}>{busy}</AppText>
          </View>
        ) : null}
        {message ? (
          <View
            accessibilityLiveRegion="polite"
            style={[styles.notice, { backgroundColor: colors.aquaSoft }]}
          >
            <AppText color={colors.ink}>{message}</AppText>
          </View>
        ) : null}
        {error ? (
          <View
            accessibilityRole="alert"
            style={[styles.notice, { backgroundColor: colors.saffronSoft }]}
          >
            <Icon name="warning" color={colors.saffron} />
            <AppText color={colors.ink} style={styles.noticeCopy}>
              {error}
            </AppText>
          </View>
        ) : null}

        <View style={[styles.security, { borderTopColor: colors.line }]}>
          <AppText variant="bodyStrong" color={colors.ink}>
            Protected credentials stay behind
          </AppText>
          <AppText color={colors.mutedInk}>
            DeepSeek and OpenRouter keys must be entered again on a new installation. They are never
            written into an export.
          </AppText>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.section, gap: spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  back: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: { flex: 1 },
  history: { borderWidth: 1, borderRadius: radii.lg, padding: spacing.md, gap: spacing.sm },
  historyValue: { flex: 1, textAlign: 'right' },
  block: { borderWidth: 1, borderRadius: radii.lg, padding: spacing.lg, gap: spacing.md },
  blockIcon: {
    width: 50,
    height: 50,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondary: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  preview: { borderWidth: 1, borderRadius: radii.lg, padding: spacing.lg, gap: spacing.md },
  metadata: { borderWidth: 1, borderRadius: radii.md, padding: spacing.md, gap: spacing.sm },
  metadataRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  counts: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  countItem: {
    minWidth: '46%',
    flexGrow: 1,
    borderRadius: radii.md,
    padding: spacing.sm,
  },
  repairNotice: {
    padding: spacing.sm,
    borderRadius: radii.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  integrity: { borderWidth: 1, borderRadius: radii.md, overflow: 'hidden' },
  integrityHeader: {
    minHeight: 64,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  integrityCopy: { flex: 1 },
  hashes: { borderTopWidth: StyleSheet.hairlineWidth, padding: spacing.md, gap: spacing.md },
  hashRow: { gap: spacing.xxs },
  mode: { flexDirection: 'row', padding: spacing.xxs, borderRadius: radii.md },
  modeChoice: {
    flex: 1,
    minHeight: 44,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
  },
  noticeCopy: { flex: 1 },
  security: { borderTopWidth: 1, paddingTop: spacing.lg, gap: spacing.xs },
});
