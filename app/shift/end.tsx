import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import {
  trainingQueryKeys,
  useTrainingDashboard,
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

function lines(value: string): string[] {
  return value
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);
}

function ReflectionField({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText(value: string): void;
  placeholder: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.field}>
      <AppText variant="bodyStrong" color={colors.ink}>
        {label}
      </AppText>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedInk}
        multiline
        textAlignVertical="top"
        style={[
          styles.textArea,
          { color: colors.ink, borderColor: colors.line, backgroundColor: colors.surface },
        ]}
      />
    </View>
  );
}

export default function EndShiftScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const repository = useTrainingRepository();
  const dashboard = useTrainingDashboard();
  const [whatILearned, setWhatILearned] = useState('');
  const [confusingDrugs, setConfusingDrugs] = useState('');
  const [pharmacistQuestions, setPharmacistQuestions] = useState('');
  const [tomorrowReview, setTomorrowReview] = useState('');
  const [notes, setNotes] = useState('');
  const complete = useMutation({
    mutationFn: async () => {
      const active = dashboard.data?.activeShift;
      if (!active) throw new Error('There is no active shift to complete.');
      return repository.completeShift(active.id, {
        whatILearned,
        confusingDrugs: lines(confusingDrugs),
        pharmacistQuestions: lines(pharmacistQuestions),
        tomorrowReview,
        notes,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: trainingQueryKeys.all });
      router.replace('/(tabs)/training');
    },
  });

  if (dashboard.isLoading)
    return (
      <Screen>
        <View style={styles.center}>
          <AppText color={colors.mutedInk}>Opening reflection…</AppText>
        </View>
      </Screen>
    );
  if (!dashboard.data?.activeShift)
    return (
      <Screen safeBottom>
        <View style={styles.empty}>
          <AppText variant="title" color={colors.ink}>
            No active shift.
          </AppText>
          <PrimaryButton
            label="Return to Training"
            onPress={() => router.replace('/(tabs)/training')}
          />
        </View>
      </Screen>
    );

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
              accessibilityLabel="Close shift reflection"
              onPress={() => router.back()}
              style={[styles.close, { borderColor: colors.line }]}
            >
              <AppText variant="heading" color={colors.ink}>
                ×
              </AppText>
            </PressableScale>
            <View style={styles.headerCopy}>
              <AppText variant="label" color={colors.coral}>
                END-SHIFT REFLECTION
              </AppText>
              <AppText variant="title" color={colors.ink}>
                Make today useful tomorrow.
              </AppText>
              <AppText color={colors.mutedInk}>
                Counters will be calculated from the profiles and reviews saved during this shift.
              </AppText>
            </View>
          </View>
          <ReflectionField
            label="What did I learn today?"
            value={whatILearned}
            onChangeText={setWhatILearned}
            placeholder="Key clinical or workflow lessons"
          />
          <ReflectionField
            label="Which drugs confused me?"
            value={confusingDrugs}
            onChangeText={setConfusingDrugs}
            placeholder="One per line"
          />
          <ReflectionField
            label="What did I ask the pharmacist?"
            value={pharmacistQuestions}
            onChangeText={setPharmacistQuestions}
            placeholder="One question per line"
          />
          <ReflectionField
            label="What should I review tomorrow?"
            value={tomorrowReview}
            onChangeText={setTomorrowReview}
            placeholder="A specific next action"
          />
          <ReflectionField
            label="Other notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional"
          />
          {complete.error ? (
            <View
              accessibilityRole="alert"
              style={[styles.error, { backgroundColor: colors.saffronSoft }]}
            >
              <AppText color={colors.ink}>
                {complete.error instanceof Error
                  ? complete.error.message
                  : 'The shift could not be completed.'}
              </AppText>
            </View>
          ) : null}
          <PrimaryButton
            label={complete.isPending ? 'Completing shift…' : 'Complete shift'}
            icon="check"
            disabled={complete.isPending}
            onPress={() => complete.mutate()}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.lg },
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
  field: { gap: spacing.xs },
  textArea: {
    minHeight: 104,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    fontFamily: fonts.body,
    fontSize: 16,
  },
  error: { padding: spacing.md, borderRadius: radii.md },
});
