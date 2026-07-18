import { useRouter } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { isMastered } from '@/domain/drugs/mastery';
import { recommendFocus, type FocusAction } from '@/domain/learning/focusEngine';
import { useLearningSummary } from '@/features/learning/queries';
import { DrugRow } from '@/features/library/DrugRow';
import { useDrugList, useLibrarySummary, usePrimaryImageUris } from '@/features/library/queries';
import { LearningPath } from '@/features/today/LearningPath';
import { useTrainingDashboard } from '@/features/training/queries';
import { useLocale } from '@/localization/LocaleProvider';
import {
  AppText,
  DrugThumbnail,
  EmptyState,
  Icon,
  MotionReveal,
  PageHeader,
  PrimaryButton,
  Screen,
} from '@/ui/components';
import { radii, spacing, useTheme } from '@/ui/theme';

const focusButtons: Record<FocusAction, { label: string; route: string }> = {
  addDrug: { label: 'Add a drug', route: '/add' },
  reviewDue: { label: 'Start due review', route: '/practice/session?mode=Due%20Review' },
  practiceWeak: { label: 'Practice weak drugs', route: '/practice/session?mode=Weak%20Drugs' },
  finishShift: { label: 'Finish reflection', route: '/shift/end' },
};

export default function TodayScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { language, t } = useLocale();
  const summary = useLibrarySummary();
  const focus = useDrugList({ scope: 'needsAttention', sort: 'due', limit: 4 });
  const recent = useDrugList({ scope: 'all', sort: 'recent' });
  const images = usePrimaryImageUris();
  const learning = useLearningSummary();
  const training = useTrainingDashboard();
  const refreshing =
    summary.isRefetching ||
    focus.isRefetching ||
    recent.isRefetching ||
    images.isRefetching ||
    learning.isRefetching ||
    training.isRefetching;
  const refetch = () =>
    void Promise.all([
      summary.refetch(),
      focus.refetch(),
      recent.refetch(),
      images.refetch(),
      learning.refetch(),
      training.refetch(),
    ]);
  const hasProfiles = (summary.data?.profiles ?? 0) > 0;
  const recommendation = recent.data
    ? recommendFocus(recent.data, training.data?.activeShift != null)
    : null;
  const focusButton = recommendation ? focusButtons[recommendation.action] : null;
  const recentProfiles = recent.data?.slice(0, 3) ?? [];
  const focusDrug = focus.data?.[0] ?? recentProfiles[0];
  const weakCount =
    recent.data?.filter(
      (drug) =>
        !drug.isUnknown &&
        (drug.confidenceRaw.trim().toLocaleLowerCase() === 'weak' ||
          drug.isConfusing ||
          !isMastered(drug)),
    ).length ?? 0;
  const showWeakReminder =
    (learning.data?.profile.weakDrugRemindersEnabled ?? true) && weakCount > 0;

  return (
    <Screen testID="today-screen">
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refetch} tintColor={colors.coral} />
        }
      >
        <PageHeader
          eyebrow="Renlyst"
          title="Make today stick."
          subtitle="One useful step now beats a crowded study plan later."
          addTestID="today-add"
          onAdd={() => router.push('/add')}
        />

        {hasProfiles ? (
          <>
            <MotionReveal direction="up">
              <View style={[styles.focus, { backgroundColor: colors.ink }]}>
                <View style={styles.focusLead}>
                  <View style={styles.focusCopy}>
                    <View style={styles.focusEyebrow}>
                      <View style={[styles.focusIcon, { backgroundColor: colors.aquaSoft }]}>
                        <Icon
                          name={recommendation?.action === 'addDrug' ? 'camera' : 'practice'}
                          color={colors.aqua}
                          size={19}
                        />
                      </View>
                      <AppText variant="label" color={colors.aqua}>
                        {`TODAY'S FOCUS`}
                      </AppText>
                    </View>
                    <AppText variant="title" color={colors.canvas} style={styles.focusTitle}>
                      {recommendation?.title ?? 'Choose one useful next step'}
                    </AppText>
                    <AppText color={colors.canvas} style={styles.focusBody}>
                      {recommendation?.subtitle ?? 'Your learning queue is being prepared.'}
                    </AppText>
                  </View>
                  {focusDrug && recommendation?.action !== 'addDrug' ? (
                    <DrugThumbnail
                      id={focusDrug.id}
                      name={focusDrug.scientificName || focusDrug.captureLabel}
                      uri={images.data?.[focusDrug.id]}
                      unknown={focusDrug.isUnknown}
                      size={78}
                    />
                  ) : null}
                </View>
                {focusButton ? (
                  <PrimaryButton
                    label={focusButton.label}
                    icon={recommendation?.action === 'addDrug' ? 'camera' : 'practice'}
                    onPress={() => router.push(focusButton.route)}
                  />
                ) : null}
              </View>
            </MotionReveal>

            {showWeakReminder ? (
              <MotionReveal direction="up">
                <View
                  accessibilityLabel={t(`${weakCount} weak drugs need attention`)}
                  style={[styles.reminder, { backgroundColor: colors.saffronSoft }]}
                >
                  <View style={[styles.reminderIcon, { backgroundColor: colors.canvas }]}>
                    <Icon name="warning" color={colors.saffron} size={20} />
                  </View>
                  <View style={styles.reminderCopy}>
                    <AppText variant="bodyStrong" color={colors.ink}>
                      {weakCount} weak {weakCount === 1 ? 'drug needs' : 'drugs need'} a short
                      return
                    </AppText>
                    <AppText variant="caption" color={colors.mutedInk}>
                      Your reminder is on. A focused five is enough for today.
                    </AppText>
                  </View>
                </View>
              </MotionReveal>
            ) : null}

            <View style={styles.sectionHeader}>
              <AppText variant="heading" color={colors.ink}>
                Seven-day rhythm
              </AppText>
              <AppText color={colors.mutedInk}>Consistency without streak pressure.</AppText>
            </View>
            <View
              accessibilityLabel={t('Practice activity for the last seven days')}
              style={[styles.week, { backgroundColor: colors.surface, borderColor: colors.line }]}
            >
              {(learning.data?.week ?? []).map((day) => {
                const barHeight = Math.min(38, 7 + day.questionsAnswered * 2.4);
                const dayLabel = new Intl.DateTimeFormat(language, { weekday: 'narrow' }).format(
                  new Date(`${day.key}T12:00:00`),
                );
                return (
                  <View
                    key={day.key}
                    accessibilityLabel={t(`${day.label}: ${day.questionsAnswered} questions`)}
                    style={styles.day}
                  >
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.bar,
                          {
                            height: barHeight,
                            backgroundColor: day.missionCompleted
                              ? colors.coral
                              : day.questionsAnswered > 0
                                ? colors.aqua
                                : colors.surfaceStrong,
                          },
                        ]}
                      />
                    </View>
                    <AppText variant="label" color={day.isToday ? colors.coral : colors.mutedInk}>
                      {dayLabel}
                    </AppText>
                  </View>
                );
              })}
            </View>

            <View style={styles.sectionHeader}>
              <AppText variant="heading" color={colors.ink}>
                Your knowledge path
              </AppText>
              <AppText color={colors.mutedInk}>Real mastery, ordered by need.</AppText>
            </View>
            <LearningPath
              drugs={focus.data ?? []}
              imageUris={images.data ?? {}}
              onDrugPress={(id) => router.push(`/drug/${id}`)}
              onCapture={() => router.push('/capture')}
            />

            <View
              style={[
                styles.rhythm,
                { borderTopColor: colors.line, borderBottomColor: colors.line },
              ]}
            >
              <View>
                <AppText variant="label" color={colors.mutedInk}>
                  PROFILES
                </AppText>
                <AppText variant="heading" color={colors.ink}>
                  {summary.data?.profiles ?? 0}
                </AppText>
              </View>
              <View>
                <AppText variant="label" color={colors.mutedInk}>
                  BRANDS
                </AppText>
                <AppText variant="heading" color={colors.ink}>
                  {summary.data?.brands ?? 0}
                </AppText>
              </View>
              <View>
                <AppText variant="label" color={colors.mutedInk}>
                  MASTERED
                </AppText>
                <AppText variant="heading" color={colors.ink}>
                  {summary.data?.mastered ?? 0}
                </AppText>
              </View>
            </View>

            {recentProfiles.length > 0 ? (
              <View>
                <View style={styles.sectionHeader}>
                  <AppText variant="heading" color={colors.ink}>
                    Recently handled
                  </AppText>
                  <AppText color={colors.mutedInk}>
                    Return to the evidence while the shelf context is fresh.
                  </AppText>
                </View>
                <View style={styles.recentList}>
                  {recentProfiles.map((drug) => (
                    <DrugRow
                      key={drug.id}
                      drug={drug}
                      imageUri={images.data?.[drug.id]}
                      onPress={() => router.push(`/drug/${drug.id}`)}
                    />
                  ))}
                </View>
              </View>
            ) : null}
          </>
        ) : (
          <View style={styles.emptyWrap}>
            <EmptyState
              icon="camera"
              title="Your first package starts the path"
              body="Capture a known medicine or save it as unknown. You can complete the clinical profile when you have time."
            />
            <PrimaryButton
              label="Capture first package"
              icon="camera"
              onPress={() => router.push('/add')}
            />
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.section,
    gap: spacing.xxl,
  },
  focus: { borderRadius: radii.xl, padding: spacing.xl, gap: spacing.md },
  focusLead: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  focusCopy: { flex: 1, flexShrink: 1, minWidth: 0, gap: spacing.sm },
  focusEyebrow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  focusIcon: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusTitle: { maxWidth: 360 },
  focusBody: { maxWidth: 430 },
  sectionHeader: { gap: spacing.xxs },
  reminder: {
    borderRadius: radii.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  reminderIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderCopy: { flex: 1, gap: 2 },
  week: {
    minHeight: 112,
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  day: { minWidth: 28, alignItems: 'center', gap: spacing.xs },
  barTrack: { height: 40, justifyContent: 'flex-end' },
  bar: { width: 10, minHeight: 7, borderRadius: radii.pill },
  rhythm: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recentList: { marginTop: spacing.sm },
  emptyWrap: { gap: spacing.md },
});
