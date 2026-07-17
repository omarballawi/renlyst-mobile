import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { dateFromLegacy } from '@/domain/shared/dates';
import { useLibrarySummary } from '@/features/library/queries';
import {
  trainingQueryKeys,
  useTrainingDashboard,
  useTrainingRepository,
} from '@/features/training/queries';
import { AppText, Icon, PageHeader, PressableScale, PrimaryButton, Screen } from '@/ui/components';
import { radii, spacing, useTheme } from '@/ui/theme';

const chapters = [
  'Cardiovascular',
  'Respiratory',
  'Endocrine',
  'Musculoskeletal',
  'Eye',
  'Ear/Nose/Oropharynx',
  'Gastrointestinal',
  'Dermatology',
  'Antibiotics',
  'OTC',
  'Vitamins/Supplements',
  'Other',
] as const;

const phases = [
  { title: 'Capture shelf drugs', start: 0, duration: 30 },
  { title: 'Understand selected drugs', start: 30, duration: 60 },
  { title: 'Quiz and review', start: 90, duration: 45 },
  { title: 'Observe with pharmacist', start: 135, duration: 30 },
  { title: 'End-shift reflection', start: 165, duration: 15 },
] as const;

export default function TrainingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const repository = useTrainingRepository();
  const dashboard = useTrainingDashboard();
  const library = useLibrarySummary();
  const [renderedAt] = useState(() => Date.now());
  const [chapter, setChapter] = useState<(typeof chapters)[number]>('Other');
  const start = useMutation({
    mutationFn: () => repository.startShift(chapter),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: trainingQueryKeys.all });
    },
  });

  const active = dashboard.data?.activeShift;
  const started = active ? dateFromLegacy(active.startedAt) : null;
  const elapsed = started ? Math.max(0, (renderedAt - started.valueOf()) / 60_000) : 0;
  const progress = Math.min(1, elapsed / 180);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader
          eyebrow="Supervised practice"
          title={active ? 'Shift in progress.' : 'Train with intention.'}
          subtitle={
            active
              ? 'A flexible three-hour rhythm. Your real counters update from saved work.'
              : 'Capture, understand, review, observe, then leave a useful reflection.'
          }
        />

        {active ? (
          <>
            <View style={[styles.activeCard, { backgroundColor: colors.ink }]}>
              <View style={styles.activeHeader}>
                <View style={styles.activeCopy}>
                  <AppText variant="label" color={colors.aqua}>
                    ACTIVE SHIFT
                  </AppText>
                  <AppText variant="title" color={colors.canvas}>
                    {active.chapterFocusRaw}
                  </AppText>
                  <AppText variant="caption" color={colors.canvas}>
                    3-hour pharmacy mode · flexible guidance
                  </AppText>
                </View>
                <AppText variant="title" color={colors.canvas}>
                  {Math.round(progress * 100)}%
                </AppText>
              </View>
              <View style={[styles.track, { backgroundColor: colors.mutedInk }]}>
                <View
                  style={[
                    styles.fill,
                    { backgroundColor: colors.coral, width: `${progress * 100}%` },
                  ]}
                />
              </View>
              <View style={styles.shiftMetrics}>
                <View>
                  <AppText variant="title" color={colors.canvas}>
                    {dashboard.data?.activeNewDrugs ?? 0}/10
                  </AppText>
                  <AppText variant="caption" color={colors.canvas}>
                    new drugs
                  </AppText>
                </View>
                <View>
                  <AppText variant="title" color={colors.canvas}>
                    {dashboard.data?.activeReviews ?? 0}
                  </AppText>
                  <AppText variant="caption" color={colors.canvas}>
                    reviews
                  </AppText>
                </View>
              </View>
              <View style={styles.phases}>
                {phases.map((phase) => {
                  const complete = elapsed >= phase.start + phase.duration;
                  const current = elapsed >= phase.start && !complete;
                  return (
                    <View key={phase.title} style={styles.phaseRow}>
                      <View
                        style={[
                          styles.phaseDot,
                          { backgroundColor: complete || current ? colors.aqua : colors.mutedInk },
                        ]}
                      />
                      <AppText color={colors.canvas} style={styles.phaseTitle}>
                        {phase.title}
                      </AppText>
                      <AppText variant="caption" color={colors.canvas}>
                        {phase.duration} min
                      </AppText>
                    </View>
                  );
                })}
              </View>
            </View>
            <View style={styles.actions}>
              <PrimaryButton
                label="Add supervised encounter"
                icon="add"
                onPress={() => router.push('/encounter/new')}
              />
              <PressableScale
                accessibilityRole="button"
                onPress={() => router.push('/shift/end')}
                style={[styles.endButton, { borderColor: colors.danger }]}
              >
                <AppText variant="bodyStrong" color={colors.danger}>
                  End shift & reflect
                </AppText>
              </PressableScale>
            </View>
          </>
        ) : (
          <>
            <View style={[styles.mission, { borderColor: colors.line }]}>
              <View style={[styles.missionIcon, { backgroundColor: colors.saffronSoft }]}>
                <Icon name="training" color={colors.coral} size={28} />
              </View>
              <AppText variant="title" color={colors.ink}>
                Today’s training mission
              </AppText>
              <AppText color={colors.mutedInk}>
                Capture 10 shelf drugs, understand the important points, review what is due, and
                finish with a short reflection.
              </AppText>
              <View style={styles.missionNumbers}>
                <View>
                  <AppText variant="heading" color={colors.ink}>
                    {library.data?.due ?? 0}
                  </AppText>
                  <AppText variant="caption" color={colors.mutedInk}>
                    reviews due
                  </AppText>
                </View>
                <View>
                  <AppText variant="heading" color={colors.ink}>
                    {dashboard.data?.completedShifts ?? 0}
                  </AppText>
                  <AppText variant="caption" color={colors.mutedInk}>
                    completed shifts
                  </AppText>
                </View>
              </View>
            </View>
            <View style={styles.chapterSection}>
              <AppText variant="heading" color={colors.ink}>
                Choose today’s focus
              </AppText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chips}
              >
                {chapters.map((value) => {
                  const selected = value === chapter;
                  return (
                    <PressableScale
                      key={value}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => setChapter(value)}
                      style={[
                        styles.chip,
                        {
                          borderColor: selected ? colors.coral : colors.line,
                          backgroundColor: selected ? colors.saffronSoft : colors.surface,
                        },
                      ]}
                    >
                      <AppText variant="caption" color={selected ? colors.coral : colors.ink}>
                        {value}
                      </AppText>
                    </PressableScale>
                  );
                })}
              </ScrollView>
              <PrimaryButton
                label={start.isPending ? 'Starting shift…' : `Start ${chapter} shift`}
                icon="training"
                disabled={start.isPending}
                onPress={() => start.mutate()}
              />
            </View>
          </>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <View>
              <AppText variant="heading" color={colors.ink}>
                Recent encounters
              </AppText>
              <AppText color={colors.mutedInk}>
                Educational notes only. Never patient-identifying data.
              </AppText>
            </View>
            {!active ? (
              <PressableScale
                accessibilityRole="button"
                onPress={() => router.push('/encounter/new')}
              >
                <AppText variant="bodyStrong" color={colors.aqua}>
                  Add
                </AppText>
              </PressableScale>
            ) : null}
          </View>
          {(dashboard.data?.recentEncounters.length ?? 0) === 0 ? (
            <AppText color={colors.mutedInk}>No supervised encounters recorded yet.</AppText>
          ) : (
            dashboard.data?.recentEncounters.map((encounter) => (
              <View
                key={encounter.id}
                style={[styles.encounter, { borderBottomColor: colors.line }]}
              >
                <AppText variant="bodyStrong" color={colors.ink}>
                  {encounter.topic}
                </AppText>
                <AppText variant="caption" color={colors.mutedInk} numberOfLines={2}>
                  {encounter.whatILearned || 'No learning reflection added.'}
                </AppText>
              </View>
            ))
          )}
        </View>

        <PressableScale
          accessibilityRole="button"
          onPress={() => router.push('/reports')}
          style={[styles.reportCard, { backgroundColor: colors.aquaSoft }]}
        >
          <View style={[styles.reportIcon, { backgroundColor: colors.aqua }]}>
            <Icon name="database" color={colors.canvas} />
          </View>
          <View style={styles.reportCopy}>
            <AppText variant="bodyStrong" color={colors.ink}>
              Training reports
            </AppText>
            <AppText variant="caption" color={colors.mutedInk}>
              Generate, edit, and export your placement record.
            </AppText>
          </View>
          <Icon name="chevron" color={colors.aqua} size={18} />
        </PressableScale>
        {start.error ? (
          <View
            accessibilityRole="alert"
            style={[styles.error, { backgroundColor: colors.saffronSoft }]}
          >
            <AppText color={colors.ink}>
              {start.error instanceof Error ? start.error.message : 'The shift could not start.'}
            </AppText>
          </View>
        ) : null}
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
  activeCard: { borderRadius: radii.xl, padding: spacing.xl, gap: spacing.lg },
  activeHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  activeCopy: { flex: 1, gap: spacing.xxs },
  track: { height: 6, borderRadius: radii.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radii.pill },
  shiftMetrics: { flexDirection: 'row', justifyContent: 'space-between', paddingRight: '30%' },
  phases: { gap: spacing.sm },
  phaseRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  phaseDot: { width: 10, height: 10, borderRadius: radii.pill },
  phaseTitle: { flex: 1 },
  actions: { gap: spacing.sm },
  endButton: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mission: { borderWidth: 1, borderRadius: radii.xl, padding: spacing.xl, gap: spacing.md },
  missionIcon: {
    width: 58,
    height: 58,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missionNumbers: { flexDirection: 'row', gap: spacing.xxl },
  chapterSection: { gap: spacing.md },
  chips: { gap: spacing.xs, paddingRight: spacing.lg },
  chip: {
    minHeight: 42,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: { gap: spacing.md },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  encounter: {
    paddingVertical: spacing.sm,
    gap: spacing.xxs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  reportCard: {
    minHeight: 78,
    borderRadius: radii.lg,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  reportIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportCopy: { flex: 1 },
  error: { padding: spacing.md, borderRadius: radii.md },
});
