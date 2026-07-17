import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/ui/theme';
import { useLocale } from '@/localization/LocaleProvider';

type ScreenProps = PropsWithChildren<ViewProps> & { safeBottom?: boolean };

export function Screen({ children, style, safeBottom = false, ...props }: ScreenProps) {
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  return (
    <SafeAreaView
      edges={safeBottom ? ['top', 'left', 'right', 'bottom'] : ['top', 'left', 'right']}
      style={[styles.safe, { backgroundColor: colors.canvas }]}
    >
      <View {...props} style={[styles.content, { direction: isRTL ? 'rtl' : 'ltr' }, style]}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1 }, content: { flex: 1 } });
