import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';

import { useLibrarySummary } from '@/features/library/queries';
import {
  learningQueryKeys,
  useLearningRepository,
  useLearningSummary,
} from '@/features/learning/queries';
import { useLocale, type AppLanguage } from '@/localization/LocaleProvider';
import {
  AppText,
  Icon,
  PageHeader,
  PressableScale,
  Screen,
  type AppIconName,
} from '@/ui/components';
import { radii, spacing, useTheme, type ThemeMode } from '@/ui/theme';

function SettingRow({
  icon,
  title,
  detail,
  onPress,
}: {
  icon: AppIconName;
  title: string;
  detail: string;
  onPress(): void;
}) {
  const { colors } = useTheme();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={detail}
      onPress={onPress}
      style={[styles.settingRow, { borderBottomColor: colors.line }]}
    >
      <View style={[styles.settingIcon, { backgroundColor: colors.aquaSoft }]}>
        <Icon name={icon} color={colors.aqua} size={21} />
      </View>
      <View style={styles.settingCopy}>
        <AppText variant="bodyStrong" color={colors.ink}>
          {title}
        </AppText>
        <AppText variant="caption" color={colors.mutedInk}>
          {detail}
        </AppText>
      </View>
      <Icon name="chevron" color={colors.mutedInk} size={18} />
    </PressableScale>
  );
}

function ChoiceGroup<T extends string>({
  label,
  value,
  choices,
  onChange,
}: {
  label: string;
  value: T;
  choices: readonly { value: T; label: string }[];
  onChange(value: T): void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.choiceGroup}>
      <AppText variant="label" color={colors.mutedInk}>
        {label.toLocaleUpperCase()}
      </AppText>
      <View style={[styles.choices, { backgroundColor: colors.surfaceStrong }]}>
        {choices.map((choice) => {
          const selected = choice.value === value;
          return (
            <PressableScale
              key={choice.value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onChange(choice.value)}
              style={[styles.choice, selected && { backgroundColor: colors.surface }]}
            >
              <AppText variant="caption" color={selected ? colors.ink : colors.mutedInk}>
                {choice.label}
              </AppText>
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}

export default function YouScreen() {
  const router = useRouter();
  const theme = useTheme();
  const locale = useLocale();
  const queryClient = useQueryClient();
  const learningRepository = useLearningRepository();
  const summary = useLibrarySummary();
  const learning = useLearningSummary();
  const profile = learning.data?.profile;
  const accuracy =
    profile && profile.completedQuestions > 0
      ? Math.round((profile.correctAnswers / profile.completedQuestions) * 100)
      : 0;
  const reminders = useMutation({
    mutationFn: (enabled: boolean) => learningRepository.setWeakDrugRemindersEnabled(enabled),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: learningQueryKeys.all });
    },
  });

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader
          eyebrow="Your record"
          title="Learning, protected."
          subtitle="Your library, progress, images, and training records stay on this device unless you export them."
        />
        <View style={[styles.record, { backgroundColor: theme.colors.ink }]}>
          <AppText variant="label" color={theme.colors.aqua}>
            LOCAL LEARNING RECORD
          </AppText>
          <View style={styles.recordNumbers}>
            <View>
              <AppText variant="display" color={theme.colors.canvas}>
                {summary.data?.profiles ?? 0}
              </AppText>
              <AppText variant="caption" color={theme.colors.canvas}>
                profiles
              </AppText>
            </View>
            <View>
              <AppText variant="display" color={theme.colors.canvas}>
                {summary.data?.mastered ?? 0}
              </AppText>
              <AppText variant="caption" color={theme.colors.canvas}>
                mastered
              </AppText>
            </View>
            <View>
              <AppText variant="display" color={theme.colors.canvas}>
                {summary.data?.due ?? 0}
              </AppText>
              <AppText variant="caption" color={theme.colors.canvas}>
                due
              </AppText>
            </View>
          </View>
        </View>

        <View style={styles.learningSection}>
          <View style={styles.learningHeading}>
            <View>
              <AppText variant="heading" color={theme.colors.ink}>
                Practice rhythm
              </AppText>
              <AppText color={theme.colors.mutedInk}>
                {learning.data?.today?.missionCompleted
                  ? 'Today’s five are complete.'
                  : 'One five-question session completes today’s mission.'}
              </AppText>
            </View>
            <View
              style={[
                styles.missionMark,
                {
                  backgroundColor: learning.data?.today?.missionCompleted
                    ? theme.colors.aquaSoft
                    : theme.colors.surfaceStrong,
                },
              ]}
            >
              <Icon
                name={learning.data?.today?.missionCompleted ? 'check' : 'practice'}
                color={
                  learning.data?.today?.missionCompleted ? theme.colors.aqua : theme.colors.mutedInk
                }
                size={22}
              />
            </View>
          </View>
          <View style={[styles.learningNumbers, { borderColor: theme.colors.line }]}>
            <View style={styles.learningMetric}>
              <AppText variant="title" color={theme.colors.ink}>
                {profile?.currentStreak ?? 0}
              </AppText>
              <AppText variant="caption" color={theme.colors.mutedInk}>
                day streak
              </AppText>
            </View>
            <View style={styles.learningMetric}>
              <AppText variant="title" color={theme.colors.ink}>
                {profile?.completedSessions ?? 0}
              </AppText>
              <AppText variant="caption" color={theme.colors.mutedInk}>
                sessions
              </AppText>
            </View>
            <View style={styles.learningMetric}>
              <AppText variant="title" color={theme.colors.ink}>
                {accuracy}%
              </AppText>
              <AppText variant="caption" color={theme.colors.mutedInk}>
                accuracy
              </AppText>
            </View>
          </View>
        </View>

        <View>
          <AppText variant="heading" color={theme.colors.ink} style={styles.sectionTitle}>
            Training
          </AppText>
          <SettingRow
            icon="training"
            title="Daily shift"
            detail="Run a supervised three-hour rhythm and record encounters"
            onPress={() => router.push('/(tabs)/training')}
          />
          <SettingRow
            icon="database"
            title="Training reports"
            detail="Review mastery, generate a placement record, and export it"
            onPress={() => router.push('/reports')}
          />
        </View>

        <View>
          <AppText variant="heading" color={theme.colors.ink} style={styles.sectionTitle}>
            Library & data
          </AppText>
          <SettingRow
            icon="search"
            title="Quick search"
            detail="Find a drug, brand, class, system, note, or Arabic text"
            onPress={() => router.push('/search')}
          />
          <SettingRow
            icon="profile"
            title="Providers & protected keys"
            detail="Optional trusted sources, package vision, and generation"
            onPress={() => router.push('/settings/providers')}
          />
          <SettingRow
            icon="database"
            title="Backup & Data"
            detail="Import Swift backups or export a rollback-safe schema-v5 file"
            onPress={() => router.push('/backup')}
          />
          <SettingRow
            icon="warning"
            title="About & safety"
            detail="Purpose, privacy boundaries, and clinical-use guidance"
            onPress={() => router.push('/about')}
          />
        </View>

        <View style={styles.preferences}>
          <AppText variant="heading" color={theme.colors.ink}>
            Learning reminders
          </AppText>
          <View style={[styles.reminderRow, { borderColor: theme.colors.line }]}>
            <View style={styles.reminderCopy}>
              <AppText variant="bodyStrong" color={theme.colors.ink}>
                Show weak-drug reminders
              </AppText>
              <AppText variant="caption" color={theme.colors.mutedInk}>
                Surface incomplete, confusing, and fading profiles inside Renlyst.
              </AppText>
            </View>
            <Switch
              accessibilityLabel={locale.t('Show weak-drug reminders')}
              accessibilityHint={locale.t(
                'Surfaces incomplete, confusing, and fading profiles inside Renlyst.',
              )}
              value={profile?.weakDrugRemindersEnabled ?? true}
              disabled={reminders.isPending}
              onValueChange={(value) => reminders.mutate(value)}
              trackColor={{ true: theme.colors.aqua }}
            />
          </View>
        </View>

        <View style={styles.preferences}>
          <AppText variant="heading" color={theme.colors.ink}>
            Appearance & language
          </AppText>
          <ChoiceGroup<ThemeMode>
            label="Theme"
            value={theme.mode}
            choices={[
              { value: 'system', label: 'System' },
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
            onChange={theme.setMode}
          />
          <ChoiceGroup<AppLanguage>
            label="Language"
            value={locale.language}
            choices={[
              { value: 'en', label: 'English' },
              { value: 'ar', label: 'العربية' },
            ]}
            onChange={locale.setLanguage}
          />
          <AppText variant="caption" color={theme.colors.mutedInk}>
            Arabic applies native shaping and right-to-left layout immediately across the app.
          </AppText>
        </View>

        <View style={[styles.notice, { borderColor: theme.colors.line }]}>
          <AppText variant="bodyStrong" color={theme.colors.ink}>
            Educational use
          </AppText>
          <AppText color={theme.colors.mutedInk}>
            Renlyst supports study and supervised training. Verify clinical decisions against
            current references and local practice.
          </AppText>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.section,
    gap: spacing.xxl,
  },
  record: { borderRadius: radii.xl, padding: spacing.xl, gap: spacing.lg },
  recordNumbers: { flexDirection: 'row', justifyContent: 'space-between' },
  learningSection: { gap: spacing.md },
  learningHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  missionMark: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  learningNumbers: {
    minHeight: 84,
    borderWidth: 1,
    borderRadius: radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  learningMetric: { flex: 1, alignItems: 'center' },
  reminderRow: {
    minHeight: 82,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  reminderCopy: { flex: 1 },
  sectionTitle: { marginBottom: spacing.sm },
  settingRow: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingIcon: {
    width: 46,
    height: 46,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingCopy: { flex: 1 },
  preferences: { gap: spacing.lg },
  choiceGroup: { gap: spacing.xs },
  choices: { flexDirection: 'row', padding: spacing.xxs, borderRadius: radii.md },
  choice: {
    flex: 1,
    minHeight: 44,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notice: { borderWidth: 1, borderRadius: radii.lg, padding: spacing.lg, gap: spacing.xs },
});
