import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { dateFromLegacy } from '@/domain/shared/dates';
import { useMistakeVault } from '@/features/practice/queries';
import { AppText, EmptyState, PrimaryButton, PressableScale, Screen } from '@/ui/components';
import { radii, spacing, useTheme } from '@/ui/theme';

export default function MistakeVaultScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const vault = useMistakeVault();
  const data = vault.data;

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={vault.isRefetching}
            onRefresh={() => void vault.refetch()}
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
          <AppText variant="label" color={colors.saffron}>
            USEFUL FRICTION
          </AppText>
          <AppText variant="display" color={colors.ink}>
            Mistake Vault
          </AppText>
          <AppText color={colors.mutedInk}>
            Missed facts collect here automatically and return in weak-drug sessions.
          </AppText>
        </View>

        {data?.biggestWeakness ? (
          <View style={[styles.weakness, { backgroundColor: colors.saffronSoft }]}>
            <AppText variant="label" color={colors.saffron}>
              BIGGEST WEAKNESS
            </AppText>
            <AppText variant="title" color={colors.ink}>
              {data.biggestWeakness}
            </AppText>
            <AppText variant="caption" color={colors.mutedInk}>
              {data.biggestWeaknessCount} misses recorded in the latest twenty
            </AppText>
            <PrimaryButton
              label="Replay weak facts"
              icon="practice"
              onPress={() => router.push('/practice/session?mode=Weak%20Drugs')}
            />
          </View>
        ) : null}

        {data?.mistakes.map((mistake) => {
          const date = dateFromLegacy(mistake.date);
          return (
            <View
              key={mistake.id}
              style={[
                styles.mistake,
                { backgroundColor: colors.surface, borderColor: colors.line },
              ]}
            >
              <View style={styles.mistakeHeader}>
                <AppText variant="bodyStrong" color={colors.ink} style={styles.mistakeName}>
                  {mistake.drugNameSnapshot || 'Deleted profile'}
                </AppText>
                <AppText variant="label" color={colors.saffron}>
                  {mistake.questionTypeRaw.toLocaleUpperCase()}
                </AppText>
              </View>
              <AppText variant="caption" color={colors.mutedInk}>
                Needs another pass
                {date ? ` · ${formatDistanceToNow(date, { addSuffix: true })}` : ''}
              </AppText>
            </View>
          );
        })}

        {!vault.isLoading && (data?.mistakes.length ?? 0) === 0 ? (
          <EmptyState
            icon="database"
            title="Vault is empty"
            body="Missed facts will appear here after a practice answer is rated Wrong."
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
  weakness: { borderRadius: radii.xl, padding: spacing.xl, gap: spacing.sm },
  mistake: { borderWidth: 1, borderRadius: radii.md, padding: spacing.md, gap: spacing.xs },
  mistakeHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  mistakeName: { flex: 1 },
});
