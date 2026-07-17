import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import type { DrugBackup } from '@/domain/backup';
import { useDrugList } from '@/features/library/queries';
import { AppText, EmptyState, Icon, PressableScale, Screen } from '@/ui/components';
import { radii, spacing, useTheme } from '@/ui/theme';

function CompareRow({ label, first, second }: { label: string; first: string; second: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.compareRow, { borderBottomColor: colors.line }]}>
      <AppText variant="label" color={colors.aqua} style={styles.compareLabel}>
        {label.toLocaleUpperCase()}
      </AppText>
      <View style={styles.compareValues}>
        <AppText color={first.trim() ? colors.ink : colors.mutedInk} style={styles.compareValue}>
          {first.trim() || 'Not recorded'}
        </AppText>
        <View style={[styles.divider, { backgroundColor: colors.line }]} />
        <AppText color={second.trim() ? colors.ink : colors.mutedInk} style={styles.compareValue}>
          {second.trim() || 'Not recorded'}
        </AppText>
      </View>
    </View>
  );
}

export default function CompareDrugsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const drugs = useDrugList({ scope: 'all', sort: 'name' });
  const [firstID, setFirstID] = useState<string | null>(null);
  const [secondID, setSecondID] = useState<string | null>(null);
  const [slot, setSlot] = useState<'first' | 'second'>('first');
  const first = drugs.data?.find((drug) => drug.id === firstID) ?? null;
  const second = drugs.data?.find((drug) => drug.id === secondID) ?? null;
  const choose = (drug: DrugBackup) => {
    if (slot === 'first') {
      setFirstID(drug.id);
      setSlot('second');
    } else {
      setSecondID(drug.id);
      setSlot('first');
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PressableScale
          accessibilityRole="button"
          onPress={() => router.back()}
          style={[styles.back, { borderColor: colors.line }]}
        >
          <AppText variant="bodyStrong" color={colors.ink}>
            Back
          </AppText>
        </PressableScale>
        <View style={styles.header}>
          <AppText variant="label" color={colors.coral}>
            MEANINGFUL DIFFERENCES
          </AppText>
          <AppText variant="display" color={colors.ink}>
            Compare two drugs
          </AppText>
          <AppText color={colors.mutedInk}>
            Select the first or second slot, then choose a profile below.
          </AppText>
        </View>

        <View style={styles.slots}>
          {(['first', 'second'] as const).map((item) => {
            const selected = item === 'first' ? first : second;
            const active = slot === item;
            return (
              <PressableScale
                key={item}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setSlot(item)}
                style={[
                  styles.slot,
                  {
                    borderColor: active ? colors.coral : colors.line,
                    backgroundColor: active ? colors.surfaceStrong : colors.surface,
                  },
                ]}
              >
                <AppText variant="label" color={active ? colors.coral : colors.mutedInk}>
                  {item.toLocaleUpperCase()}
                </AppText>
                <AppText variant="bodyStrong" color={selected ? colors.ink : colors.mutedInk}>
                  {selected?.scientificName || 'Choose profile'}
                </AppText>
              </PressableScale>
            );
          })}
        </View>

        {first && second ? (
          <View
            style={[
              styles.comparison,
              { backgroundColor: colors.surface, borderColor: colors.line },
            ]}
          >
            <View style={styles.names}>
              <AppText variant="heading" color={colors.ink} style={styles.compareValue}>
                {first.scientificName}
              </AppText>
              <AppText variant="heading" color={colors.ink} style={styles.compareValue}>
                {second.scientificName}
              </AppText>
            </View>
            <CompareRow
              label="Active ingredients"
              first={(first.activeIngredients ?? [first.scientificName]).join(' + ')}
              second={(second.activeIngredients ?? [second.scientificName]).join(' + ')}
            />
            <CompareRow label="Class" first={first.drugClass} second={second.drugClass} />
            <CompareRow
              label="Main use"
              first={first.indications[0] ?? ''}
              second={second.indications[0] ?? ''}
            />
            <CompareRow
              label="Key warning"
              first={first.warnings[0] ?? ''}
              second={second.warnings[0] ?? ''}
            />
          </View>
        ) : null}

        <View style={styles.listHeader}>
          <AppText variant="heading" color={colors.ink}>
            Choose {slot === 'first' ? 'first' : 'second'} profile
          </AppText>
        </View>
        <View style={[styles.list, { borderColor: colors.line }]}>
          {drugs.data?.map((drug) => {
            const selected = drug.id === firstID || drug.id === secondID;
            return (
              <PressableScale
                key={drug.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => choose(drug)}
                style={[styles.drug, { borderBottomColor: colors.line }]}
              >
                <View style={styles.drugCopy}>
                  <AppText variant="bodyStrong" color={colors.ink}>
                    {drug.scientificName || drug.captureLabel}
                  </AppText>
                  <AppText variant="caption" color={colors.mutedInk}>
                    {drug.drugClass || drug.chapterRaw || 'Unclassified'}
                  </AppText>
                </View>
                {selected ? <Icon name="check" color={colors.aqua} size={18} /> : null}
              </PressableScale>
            );
          })}
        </View>
        {!drugs.isLoading && (drugs.data?.length ?? 0) < 2 ? (
          <EmptyState
            icon="practice"
            title="Two profiles are needed"
            body="Capture another known medicine to compare saved facts side by side."
          />
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.section, gap: spacing.xl },
  back: {
    alignSelf: 'flex-start',
    minHeight: 44,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  header: { gap: spacing.xs },
  slots: { flexDirection: 'row', gap: spacing.sm },
  slot: {
    flex: 1,
    minHeight: 82,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  comparison: { borderWidth: 1, borderRadius: radii.lg, padding: spacing.md },
  names: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm },
  compareRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  compareLabel: { textAlign: 'center' },
  compareValues: { flexDirection: 'row', gap: spacing.md },
  compareValue: { flex: 1 },
  divider: { width: StyleSheet.hairlineWidth },
  listHeader: { marginBottom: -spacing.sm },
  list: { borderWidth: 1, borderRadius: radii.lg, paddingHorizontal: spacing.md },
  drug: {
    minHeight: 68,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
  },
  drugCopy: { flex: 1, gap: 2 },
});
