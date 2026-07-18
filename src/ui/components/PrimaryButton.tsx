import { StyleSheet, View } from 'react-native';

import { AppText } from './AppText';
import { Icon, type AppIconName } from './Icon';
import { PressableScale } from './PressableScale';
import { radii, spacing, useTheme } from '@/ui/theme';
import { useLocale } from '@/localization/LocaleProvider';

type PrimaryButtonProps = {
  label: string;
  onPress(): void;
  icon?: AppIconName;
  disabled?: boolean;
  accessibilityHint?: string;
};

export function PrimaryButton({
  label,
  onPress,
  icon,
  disabled = false,
  accessibilityHint,
}: PrimaryButtonProps) {
  const { colors } = useTheme();
  const { t } = useLocale();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={t(label)}
      accessibilityHint={accessibilityHint ? t(accessibilityHint) : undefined}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.container,
        {
          backgroundColor: disabled ? colors.surfaceStrong : colors.coral,
          boxShadow: disabled ? undefined : `0px 4px 8px ${colors.shadow}`,
        },
      ]}
    >
      <View style={styles.content}>
        {icon ? (
          <Icon name={icon} color={disabled ? colors.mutedInk : colors.coralText} size={19} />
        ) : null}
        <AppText
          variant="bodyStrong"
          color={disabled ? colors.mutedInk : colors.coralText}
          style={styles.label}
        >
          {label}
        </AppText>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 54,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  label: { textAlign: 'center' },
});
