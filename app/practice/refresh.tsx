import { useRouter } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { useDailyRefresh } from '@/features/practice/queries';
import { AppText, EmptyState, Icon, PressableScale, Screen } from '@/ui/components';
import { radii, spacing, useTheme } from '@/ui/theme';

export default function DailyRefreshScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const refresh = useDailyRefresh();
  const data = refresh.data;
  const isEmpty = (data?.drugs.length ?? 0) === 0 && !data?.encounter && !data?.atomicNote;

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refresh.isRefetching}
            onRefresh={() => void refresh.refetch()}
            tintColor={colors.coral}
          />
        }
      >
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Back to Practice"
          onPress={() => router.back()}
          style={[styles.back, { borderColor: colors.line }]}
        >
          <AppText variant="bodyStrong" color={colors.ink}>
            Back
          </AppText>
        </PressableScale>
        <View style={styles.header}>
          <AppText variant="label" color={colors.aqua}>
            SMALL, USEFUL RETURNS
          </AppText>
          <AppText variant="display" color={colors.ink}>
            Your Daily Refresh
          </AppText>
          <AppText color={colors.mutedInk}>
            A quiet feed of due knowledge, confusing cards, and lessons from your own shifts.
          </AppText>
        </View>

        {data?.drugs.map((drug) => {
          const name = drug.scientificName || drug.captureLabel || 'Unknown medicine';
          const fact = drug.mustKnow[0] || drug.warnings[0] || 'Review this card today.';
          return (
            <PressableScale
              key={drug.id}
              accessibilityRole="button"
              accessibilityLabel={`Open ${name}`}
              onPress={() => router.push(`/drug/${drug.id}`)}
              style={[
                styles.drugCard,
                { backgroundColor: colors.surface, borderColor: colors.line },
              ]}
            >
              <View style={[styles.monogram, { backgroundColor: colors.aquaSoft }]}>
                <AppText variant="label" color={colors.aqua}>
                  {name.slice(0, 2).toLocaleUpperCase()}
                </AppText>
              </View>
              <View style={styles.cardCopy}>
                <AppText variant="bodyStrong" color={colors.ink}>
                  {name}
                </AppText>
                <AppText variant="caption" color={colors.mutedInk} numberOfLines={2}>
                  {fact}
                </AppText>
              </View>
              <Icon name="chevron" color={colors.aqua} size={17} />
            </PressableScale>
          );
        })}

        {data?.encounter ? (
          <View style={[styles.note, { backgroundColor: colors.saffronSoft }]}>
            <AppText variant="label" color={colors.saffron}>
              RESURFACED SHIFT NOTE
            </AppText>
            <AppText variant="bodyStrong" color={colors.ink}>
              {data.encounter.topic}
            </AppText>
            <AppText color={colors.ink} numberOfLines={5}>
              {data.encounter.whatILearned ||
                data.encounter.whatHappened ||
                data.encounter.pharmacistNote}
            </AppText>
          </View>
        ) : null}

        {data?.atomicNote ? (
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={`Open ${data.atomicNote.drugName}`}
            onPress={() => router.push(`/drug/${data.atomicNote!.drugID}`)}
            style={[styles.note, { backgroundColor: colors.aquaSoft }]}
          >
            <AppText variant="label" color={colors.aqua}>
              FROM YOUR {data.atomicNote.kind.toLocaleUpperCase()}
            </AppText>
            <AppText color={colors.ink}>{data.atomicNote.text}</AppText>
            <AppText variant="caption" color={colors.mutedInk}>
              {data.atomicNote.drugName} · {data.atomicNote.linkedField}
            </AppText>
          </PressableScale>
        ) : null}

        {isEmpty ? (
          <EmptyState
            icon="check"
            title="All refreshed"
            body="Complete a few cards and privacy-safe shift notes; Renlyst will resurface them here later."
          />
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.section, gap: spacing.lg },
  back: {
    alignSelf: 'flex-start',
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderRadius: radii.pill,
    justifyContent: 'center',
  },
  header: { gap: spacing.xs, marginBottom: spacing.sm },
  drugCard: {
    minHeight: 86,
    padding: spacing.sm,
    borderWidth: 1,
    borderRadius: radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  monogram: {
    width: 52,
    height: 52,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCopy: { flex: 1, gap: 2 },
  note: { padding: spacing.lg, borderRadius: radii.lg, gap: spacing.xs },
});
