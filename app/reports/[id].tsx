import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import DateTimePicker from '@react-native-community/datetimepicker';
import { File, Paths } from 'expo-file-system';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import type { TrainingReportBackup } from '@/domain/backup';
import { dateFromLegacy } from '@/domain/shared/dates';
import { trainingReportText } from '@/domain/training/reportBuilder';
import {
  trainingQueryKeys,
  useTrainingReport,
  useTrainingRepository,
} from '@/features/training/queries';
import {
  AppText,
  AppTextInput as TextInput,
  PressableScale,
  PrimaryButton,
  Screen,
} from '@/ui/components';
import { fonts, radii, spacing, useTheme } from '@/ui/theme';

const sections: readonly { field: keyof TrainingReportBackup; label: string }[] = [
  { field: 'trainingSummary', label: 'Training period summary' },
  { field: 'skillsLearned', label: 'Skills learned' },
  { field: 'categoriesStudied', label: 'Drug categories studied' },
  { field: 'dosageFormsSeen', label: 'Common dosage forms seen' },
  { field: 'counselingPoints', label: 'Important counseling points' },
  { field: 'pharmacistQuestions', label: 'Pharmacist questions asked' },
  { field: 'challenges', label: 'Challenges faced' },
  { field: 'notesAndRecommendations', label: 'Notes and recommendations' },
  { field: 'masteredDrugs', label: 'Mastered drugs by chapter' },
];

function ReportEditor({ initialReport }: { initialReport: TrainingReportBackup }) {
  const router = useRouter();
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const repository = useTrainingRepository();
  const [report, setReport] = useState(initialReport);
  const periodStart = dateFromLegacy(report.periodStart) ?? new Date();
  const periodEnd = dateFromLegacy(report.periodEnd) ?? new Date();
  const [shareError, setShareError] = useState<string | null>(null);
  const save = useMutation({
    mutationFn: async () => {
      const updated = { ...report, updatedAt: new Date().toISOString() };
      await repository.saveReport(updated);
      return updated;
    },
    onSuccess: async (updated) => {
      setReport(updated);
      queryClient.setQueryData(trainingQueryKeys.report(updated.id), updated);
      await queryClient.invalidateQueries({ queryKey: trainingQueryKeys.dashboard() });
    },
  });

  const share = async () => {
    try {
      const updated = { ...report, updatedAt: new Date().toISOString() };
      await repository.saveReport(updated);
      setReport(updated);
      const file = new File(Paths.cache, `renlyst-training-report-${updated.id}.txt`);
      file.write(trainingReportText(updated));
      if (!(await Sharing.isAvailableAsync()))
        throw new Error('Sharing is not available on this device.');
      await Sharing.shareAsync(file.uri, {
        mimeType: 'text/plain',
        dialogTitle: 'Share Renlyst Training Report',
      });
      await queryClient.invalidateQueries({ queryKey: trainingQueryKeys.all });
    } catch (reason) {
      setShareError(reason instanceof Error ? reason.message : 'The report could not be shared.');
    }
  };

  return (
    <Screen safeBottom>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Close report editor"
              onPress={() => router.back()}
              style={[styles.close, { borderColor: colors.line }]}
            >
              <AppText variant="heading" color={colors.ink}>
                ‹
              </AppText>
            </PressableScale>
            <View style={styles.headerCopy}>
              <AppText variant="label" color={colors.aqua}>
                EDITABLE RECORD
              </AppText>
              <AppText variant="title" color={colors.ink}>
                Training report.
              </AppText>
              <AppText color={colors.mutedInk}>
                Review every generated section before you export it.
              </AppText>
            </View>
          </View>
          <View style={[styles.period, { borderColor: colors.line }]}>
            <AppText variant="heading" color={colors.ink}>
              Training period
            </AppText>
            <View style={styles.dateRow}>
              <View style={styles.dateField}>
                <AppText variant="caption" color={colors.mutedInk}>
                  FROM
                </AppText>
                <DateTimePicker
                  value={periodStart}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'compact' : 'default'}
                  maximumDate={periodEnd}
                  onChange={(_, value) => {
                    if (value)
                      setReport((current) => ({ ...current, periodStart: value.toISOString() }));
                  }}
                  accentColor={colors.aqua}
                />
              </View>
              <View style={styles.dateField}>
                <AppText variant="caption" color={colors.mutedInk}>
                  TO
                </AppText>
                <DateTimePicker
                  value={periodEnd}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'compact' : 'default'}
                  minimumDate={periodStart}
                  onChange={(_, value) => {
                    if (value)
                      setReport((current) => ({ ...current, periodEnd: value.toISOString() }));
                  }}
                  accentColor={colors.aqua}
                />
              </View>
            </View>
          </View>
          {sections.map(({ field, label }) => (
            <View key={field} style={styles.section}>
              <AppText variant="bodyStrong" color={colors.ink}>
                {label}
              </AppText>
              <TextInput
                accessibilityLabel={label}
                value={String(report[field] ?? '')}
                onChangeText={(value) => setReport((current) => ({ ...current, [field]: value }))}
                multiline
                textAlignVertical="top"
                style={[
                  styles.textArea,
                  { color: colors.ink, borderColor: colors.line, backgroundColor: colors.surface },
                ]}
              />
            </View>
          ))}
          {save.error || shareError ? (
            <View
              accessibilityRole="alert"
              style={[styles.error, { backgroundColor: colors.saffronSoft }]}
            >
              <AppText color={colors.ink}>
                {shareError ??
                  (save.error instanceof Error
                    ? save.error.message
                    : 'The report could not be saved.')}
              </AppText>
            </View>
          ) : null}
          <View style={styles.actions}>
            <PrimaryButton
              label={save.isPending ? 'Saving report…' : 'Save report'}
              icon="check"
              disabled={save.isPending}
              onPress={() => save.mutate()}
            />
            <PressableScale
              accessibilityRole="button"
              onPress={() => void share()}
              style={[styles.shareButton, { borderColor: colors.aqua }]}
            >
              <AppText variant="bodyStrong" color={colors.aqua}>
                Export UTF-8 text file
              </AppText>
            </PressableScale>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

export default function ReportEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const report = useTrainingReport(id);
  if (report.isLoading)
    return (
      <Screen>
        <View style={styles.center}>
          <AppText color={colors.mutedInk}>Opening report…</AppText>
        </View>
      </Screen>
    );
  if (!report.data)
    return (
      <Screen>
        <View style={styles.center}>
          <AppText color={colors.mutedInk}>Report not found.</AppText>
        </View>
      </Screen>
    );
  return <ReportEditor key={report.data.id} initialReport={report.data} />;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.lg, paddingBottom: spacing.section, gap: spacing.xl },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  close: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: { flex: 1, gap: spacing.xs },
  period: { borderWidth: 1, borderRadius: radii.lg, padding: spacing.md, gap: spacing.md },
  dateRow: { flexDirection: 'row', gap: spacing.sm },
  dateField: { flex: 1, gap: spacing.xs },
  section: { gap: spacing.xs },
  textArea: {
    minHeight: 120,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    fontFamily: fonts.body,
    fontSize: 16,
  },
  actions: { gap: spacing.sm },
  shareButton: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: { padding: spacing.md, borderRadius: radii.md },
});
