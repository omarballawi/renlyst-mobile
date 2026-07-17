import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import {
  practiceModeDetails,
  practiceModes,
  type PracticeMode,
} from '@/domain/learning/practiceEngine';
import { useLearningSummary } from '@/features/learning/queries';
import { useLibrarySummary } from '@/features/library/queries';
import {
  AppText,
  EmptyState,
  Icon,
  PageHeader,
  PressableScale,
  PrimaryButton,
  Screen,
} from '@/ui/components';
import { radii, spacing, useTheme } from '@/ui/theme';

function ModeRow({ mode, onPress }: { mode: PracticeMode; onPress(): void }) {
  const { colors } = useTheme();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={mode}
      accessibilityHint={practiceModeDetails[mode]}
      onPress={onPress}
      style={[styles.mode, { borderBottomColor: colors.line }]}
    >
      <View
        style={[
          styles.modeIcon,
          { backgroundColor: mode === 'Smart Session' ? colors.saffronSoft : colors.aquaSoft },
        ]}
      >
        <Icon
          name={mode === 'Image Quiz' ? 'image' : mode.includes('Warning') ? 'warning' : 'practice'}
          color={mode === 'Smart Session' ? colors.saffron : colors.aqua}
          size={22}
        />
      </View>
      <View style={styles.modeCopy}>
        <AppText variant="bodyStrong" color={colors.ink}>
          {mode}
        </AppText>
        <AppText variant="caption" color={colors.mutedInk}>
          {practiceModeDetails[mode]}
        </AppText>
      </View>
      <Icon name="chevron" color={colors.mutedInk} size={18} />
    </PressableScale>
  );
}

function LearningTool({
  title,
  detail,
  icon,
  tone,
  onPress,
}: {
  title: string;
  detail: string;
  icon: 'clock' | 'database' | 'warning';
  tone: 'aqua' | 'saffron' | 'coral';
  onPress(): void;
}) {
  const { colors } = useTheme();
  const color = tone === 'aqua' ? colors.aqua : tone === 'saffron' ? colors.saffron : colors.coral;
  const background =
    tone === 'aqua'
      ? colors.aquaSoft
      : tone === 'saffron'
        ? colors.saffronSoft
        : colors.surfaceStrong;
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={detail}
      onPress={onPress}
      style={[styles.tool, { backgroundColor: background }]}
    >
      <View style={[styles.toolIcon, { backgroundColor: colors.surface }]}>
        <Icon name={icon} color={color} size={20} />
      </View>
      <View style={styles.toolCopy}>
        <AppText variant="bodyStrong" color={colors.ink}>
          {title}
        </AppText>
        <AppText variant="caption" color={colors.mutedInk}>
          {detail}
        </AppText>
      </View>
      <Icon name="chevron" color={color} size={17} />
    </PressableScale>
  );
}

export default function PracticeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const summary = useLibrarySummary();
  const learning = useLearningSummary();
  const hasProfiles = (summary.data?.profiles ?? 0) > 0;
  const profile = learning.data?.profile;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader
          eyebrow="Active recall"
          title="Five questions."
          subtitle="Every session is short enough to start and focused enough to matter."
          onAdd={() => router.push('/add')}
        />
        {hasProfiles ? (
          <>
            <View style={[styles.progressSummary, { borderColor: colors.line }]}>
              <View style={styles.progressMetric}>
                <AppText variant="title" color={colors.ink}>
                  {summary.data?.due ?? 0}
                </AppText>
                <AppText variant="caption" color={colors.mutedInk}>
                  due
                </AppText>
              </View>
              <View style={[styles.progressDivider, { backgroundColor: colors.line }]} />
              <View style={styles.progressMetric}>
                <AppText variant="title" color={colors.ink}>
                  {profile?.currentStreak ?? 0}
                </AppText>
                <AppText variant="caption" color={colors.mutedInk}>
                  day streak
                </AppText>
              </View>
              <View style={[styles.progressDivider, { backgroundColor: colors.line }]} />
              <View style={styles.progressMetric}>
                <AppText variant="title" color={colors.ink}>
                  {profile?.completedSessions ?? 0}
                </AppText>
                <AppText variant="caption" color={colors.mutedInk}>
                  sessions
                </AppText>
              </View>
            </View>
            <View style={[styles.smart, { backgroundColor: colors.ink }]}>
              <AppText variant="label" color={colors.aqua}>
                {learning.data?.today?.missionCompleted ? 'TODAY COMPLETE' : 'DAILY REFRESH'}
              </AppText>
              <AppText variant="title" color={colors.canvas}>
                Let Renlyst choose the useful five.
              </AppText>
              <AppText color={colors.canvas} style={styles.smartBody}>
                Due dates, incomplete mastery, safety, counseling, and your own package photos shape
                the mix.
              </AppText>
              <PrimaryButton
                label="Start Smart Session"
                icon="practice"
                onPress={() => router.push('/practice/session?mode=Smart%20Session')}
              />
            </View>
            <View style={styles.sectionTitle}>
              <AppText variant="heading" color={colors.ink}>
                Learning tools
              </AppText>
              <AppText color={colors.mutedInk}>
                Resurface, repair, or save a useful five for offline practice.
              </AppText>
            </View>
            <View style={styles.tools}>
              <LearningTool
                title="Daily Refresh"
                detail="Due cards, confusing facts, and your own notes"
                icon="clock"
                tone="aqua"
                onPress={() => router.push('/practice/refresh')}
              />
              <LearningTool
                title="Mistake Vault"
                detail="See missed facts and replay your weak topics"
                icon="warning"
                tone="saffron"
                onPress={() => router.push('/practice/mistakes')}
              />
              <LearningTool
                title="Offline five"
                detail="A cached, grounded pack that works without a connection"
                icon="database"
                tone="coral"
                onPress={() => router.push('/practice/pack')}
              />
            </View>
            <View style={styles.sectionTitle}>
              <AppText variant="heading" color={colors.ink}>
                Choose a mode
              </AppText>
              <AppText color={colors.mutedInk}>
                Each mode still produces exactly five questions.
              </AppText>
            </View>
            <View>
              {practiceModes
                .filter((mode) => mode !== 'Smart Session')
                .map((mode) => (
                  <ModeRow
                    key={mode}
                    mode={mode}
                    onPress={() =>
                      router.push(
                        mode === 'System Practice'
                          ? '/practice/systems'
                          : `/practice/session?mode=${encodeURIComponent(mode)}`,
                      )
                    }
                  />
                ))}
            </View>
            {(profile?.badges.length ?? 0) > 0 ? (
              <View style={styles.badges}>
                <AppText variant="heading" color={colors.ink}>
                  Earned milestones
                </AppText>
                <View style={styles.badgeWrap}>
                  {profile?.badges.map((badge) => (
                    <View
                      key={badge}
                      style={[styles.badge, { backgroundColor: colors.saffronSoft }]}
                    >
                      <AppText variant="caption" color={colors.ink}>
                        {badge}
                      </AppText>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </>
        ) : (
          <View style={styles.empty}>
            <EmptyState
              icon="practice"
              title="Practice needs one known profile"
              body="Capture a package and save its active ingredient. Unknown packages remain safely in the library but do not create misleading questions."
            />
            <PrimaryButton
              label="Capture a known package"
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
    padding: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.section,
    gap: spacing.xxl,
  },
  progressSummary: {
    minHeight: 88,
    borderWidth: 1,
    borderRadius: radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  progressMetric: { flex: 1, alignItems: 'center' },
  progressDivider: { width: StyleSheet.hairlineWidth, height: 40 },
  smart: { padding: spacing.xl, borderRadius: radii.xl, gap: spacing.md },
  smartBody: { opacity: 0.82 },
  sectionTitle: { gap: spacing.xxs },
  tools: { gap: spacing.sm },
  tool: {
    minHeight: 78,
    borderRadius: radii.lg,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  toolIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolCopy: { flex: 1, gap: 2 },
  mode: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modeIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeCopy: { flex: 1, gap: 2 },
  badges: { gap: spacing.sm },
  badgeWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  badge: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
  },
  empty: { gap: spacing.md },
});
