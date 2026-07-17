import { StyleSheet, View } from 'react-native';

import type { DrugBackup } from '@/domain/backup';
import { masteryCount, requiredMasteryCount } from '@/domain/drugs/mastery';
import { dateFromLegacy } from '@/domain/shared/dates';
import { AppText, Icon, PressableScale } from '@/ui/components';
import { radii, spacing, useTheme } from '@/ui/theme';

type DrugRowProps = { drug: DrugBackup; onPress(): void; now?: Date };

function initials(name: string): string {
  return name.trim().slice(0, 2).toLocaleUpperCase() || '?';
}

export function DrugRow({ drug, onPress, now = new Date() }: DrugRowProps) {
  const { colors } = useTheme();
  const dueDate = dateFromLegacy(drug.nextReviewDate);
  const due = dueDate !== null && dueDate.valueOf() < now.valueOf() + 86_400_000;
  const count = masteryCount(drug);
  const required = requiredMasteryCount(drug);
  const displayName = drug.scientificName.trim() || drug.captureLabel.trim() || 'Unknown medicine';
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${displayName}, mastery ${count} of ${required}${due ? ', due for review' : ''}`}
      accessibilityHint="Opens the drug profile"
      onPress={onPress}
      style={[styles.container, { borderBottomColor: colors.line }]}
    >
      <View
        style={[
          styles.monogram,
          { backgroundColor: drug.isUnknown ? colors.saffronSoft : colors.aquaSoft },
        ]}
      >
        <AppText variant="label" color={drug.isUnknown ? colors.saffron : colors.aqua}>
          {initials(displayName)}
        </AppText>
      </View>
      <View style={styles.copy}>
        <AppText variant="bodyStrong" color={colors.ink} numberOfLines={1}>
          {displayName}
        </AppText>
        <AppText variant="caption" color={colors.mutedInk} numberOfLines={1}>
          {drug.tradeNames[0] ||
            drug.drugClass ||
            (drug.isUnknown ? 'Identity needed' : 'No brand saved')}
        </AppText>
      </View>
      <View style={styles.status}>
        <AppText variant="label" color={due ? colors.saffron : colors.mutedInk}>
          {due ? 'DUE' : `${count}/${required}`}
        </AppText>
        <Icon name="chevron" color={colors.mutedInk} size={18} />
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  monogram: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, gap: 2 },
  status: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
});
