import { StyleSheet, View } from 'react-native';

import { AppText } from './AppText';
import { Icon, type AppIconName } from './Icon';
import { radii, spacing, useTheme } from '@/ui/theme';

type EmptyStateProps = { icon: AppIconName; title: string; body: string };

export function EmptyState({ icon, title, body }: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { borderColor: colors.line, backgroundColor: colors.surface }]}>
      <View style={[styles.icon, { backgroundColor: colors.aquaSoft }]}>
        <Icon name={icon} color={colors.aqua} size={24} />
      </View>
      <AppText variant="heading" color={colors.ink} style={styles.title}>
        {title}
      </AppText>
      <AppText color={colors.mutedInk} style={styles.body}>
        {body}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.xl,
    alignItems: 'flex-start',
  },
  icon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  title: { marginTop: spacing.md },
  body: { marginTop: spacing.xs, maxWidth: 380 },
});
