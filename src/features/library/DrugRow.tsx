import { StyleSheet, View } from 'react-native';

import type { DrugBackup } from '@/domain/backup';
import { masteryCount, requiredMasteryCount } from '@/domain/drugs/mastery';
import { dateFromLegacy } from '@/domain/shared/dates';
import { AppText, DrugThumbnail, Icon, PressableScale } from '@/ui/components';
import { spacing, useTheme } from '@/ui/theme';

type DrugRowProps = {
  drug: DrugBackup;
  imageUri?: string | null | undefined;
  onPress(): void;
  now?: Date;
};

export function DrugRow({ drug, imageUri, onPress, now = new Date() }: DrugRowProps) {
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
      <DrugThumbnail id={drug.id} name={displayName} uri={imageUri} unknown={drug.isUnknown} />
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
  copy: { flex: 1, flexShrink: 1, minWidth: 0, gap: 2 },
  status: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
});
