import { StyleSheet, View } from 'react-native';

import { AppText } from './AppText';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';
import { radii, spacing, useTheme } from '@/ui/theme';
import { useLocale } from '@/localization/LocaleProvider';

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  onAdd?(): void;
};

export function PageHeader({ eyebrow, title, subtitle, onAdd }: PageHeaderProps) {
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        {eyebrow ? (
          <AppText variant="label" color={colors.aqua}>
            {isRTL ? eyebrow : eyebrow.toLocaleUpperCase()}
          </AppText>
        ) : null}
        <AppText
          variant="display"
          color={colors.ink}
          style={[styles.title, isRTL && styles.rtlTitle]}
        >
          {title}
        </AppText>
        {subtitle ? <AppText color={colors.mutedInk}>{subtitle}</AppText> : null}
      </View>
      {onAdd ? (
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Capture a medicine package"
          accessibilityHint="Opens the capture sheet"
          onPress={onAdd}
          style={[styles.add, { backgroundColor: colors.ink }]}
        >
          <Icon name="add" color={colors.canvas} size={21} />
        </PressableScale>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { width: '100%', flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  copy: { flex: 1, flexShrink: 1, minWidth: 0, gap: spacing.xs },
  title: { flexShrink: 1 },
  rtlTitle: { fontSize: 34, lineHeight: 45 },
  add: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
    flexShrink: 0,
  },
});
