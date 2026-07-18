import type { PropsWithChildren } from 'react';
import { Platform, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInLeft,
  FadeInRight,
  FadeOut,
  ReduceMotion,
} from 'react-native-reanimated';

import { useLocale } from '@/localization/LocaleProvider';

type MotionRevealProps = PropsWithChildren<{
  delay?: number;
  direction?: 'fade' | 'up' | 'forward';
  style?: StyleProp<ViewStyle>;
}>;

export function MotionReveal({ children, delay = 0, direction = 'up', style }: MotionRevealProps) {
  const { isRTL } = useLocale();
  const base =
    direction === 'fade'
      ? FadeIn
      : direction === 'forward'
        ? isRTL
          ? FadeInLeft
          : FadeInRight
        : FadeInDown;
  const entering = base
    .duration(220)
    .delay(delay)
    .easing(Platform.OS === 'web' ? Easing.linear : Easing.out(Easing.cubic))
    .reduceMotion(ReduceMotion.System);

  return (
    <Animated.View
      entering={entering}
      exiting={FadeOut.duration(140).reduceMotion(ReduceMotion.System)}
      style={style}
    >
      {children}
    </Animated.View>
  );
}
