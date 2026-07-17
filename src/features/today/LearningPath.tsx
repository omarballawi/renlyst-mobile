import { StyleSheet, View } from 'react-native';

import type { DrugBackup } from '@/domain/backup';
import { masteryCount, requiredMasteryCount } from '@/domain/drugs/mastery';
import { useLocale } from '@/localization/LocaleProvider';
import { AppText, Icon, PressableScale } from '@/ui/components';
import { radii, spacing, useTheme } from '@/ui/theme';

type LearningPathProps = {
  drugs: readonly DrugBackup[];
  onDrugPress(id: string): void;
  onCapture(): void;
};

const offsets = [0, 42, 12, 54, 20] as const;

export function LearningPath({ drugs, onDrugPress, onCapture }: LearningPathProps) {
  const { colors } = useTheme();
  const { t } = useLocale();
  const nodes = drugs.slice(0, 4);
  return (
    <View accessibilityLabel={t('Five-step learning path')} style={styles.container}>
      <View style={[styles.rail, { backgroundColor: colors.line }]} />
      {nodes.map((drug, index) => {
        const count = masteryCount(drug);
        const required = requiredMasteryCount(drug);
        const name = drug.scientificName || drug.captureLabel || 'Unknown medicine';
        return (
          <PressableScale
            key={drug.id}
            accessibilityRole="button"
            accessibilityLabel={`${name}, ${count} of ${required} mastery checks`}
            onPress={() => onDrugPress(drug.id)}
            style={[styles.nodeRow, { marginLeft: offsets[index] ?? 0 }]}
          >
            <View
              style={[
                styles.node,
                {
                  backgroundColor: index === 0 ? colors.coral : colors.surface,
                  borderColor: index === 0 ? colors.coral : colors.line,
                },
              ]}
            >
              {index === 0 ? (
                <Icon name="arrow" color={colors.coralText} size={21} />
              ) : (
                <AppText variant="label" color={colors.ink}>
                  {count}/{required}
                </AppText>
              )}
            </View>
            <View style={styles.nodeCopy}>
              <AppText variant="bodyStrong" color={colors.ink} numberOfLines={1}>
                {name}
              </AppText>
              <AppText variant="caption" color={colors.mutedInk}>
                {index === 0 ? 'Your next useful review' : 'Continue building mastery'}
              </AppText>
            </View>
          </PressableScale>
        );
      })}
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel="Capture the next medicine package"
        onPress={onCapture}
        style={[styles.nodeRow, { marginLeft: offsets[nodes.length] ?? 0 }]}
      >
        <View
          style={[
            styles.node,
            styles.openNode,
            { borderColor: colors.aqua, backgroundColor: colors.canvas },
          ]}
        >
          <Icon name="add" color={colors.aqua} size={20} />
        </View>
        <View style={styles.nodeCopy}>
          <AppText variant="bodyStrong" color={colors.ink}>
            Add what you saw today
          </AppText>
          <AppText variant="caption" color={colors.mutedInk}>
            A photo is enough to begin
          </AppText>
        </View>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative', gap: spacing.sm, paddingVertical: spacing.xs },
  rail: { position: 'absolute', left: 31, top: 36, bottom: 36, width: 2, borderRadius: radii.pill },
  nodeRow: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    maxWidth: '88%',
  },
  node: {
    width: 62,
    height: 62,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openNode: { borderStyle: 'dashed', borderWidth: 2 },
  nodeCopy: { flex: 1, gap: 1 },
});
