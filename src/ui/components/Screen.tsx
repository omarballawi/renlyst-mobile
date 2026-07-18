import type { PropsWithChildren } from 'react';
import { StyleSheet, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';

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
      <Animated.View
        {...props}
        entering={FadeIn.duration(180).reduceMotion(ReduceMotion.System)}
        style={[styles.content, { direction: isRTL ? 'rtl' : 'ltr' }, style]}
      >
        {children}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1 }, content: { flex: 1 } });
