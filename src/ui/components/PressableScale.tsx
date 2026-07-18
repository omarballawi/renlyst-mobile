import type { PropsWithChildren } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useLocale } from '@/localization/LocaleProvider';

type PressableScaleProps = PropsWithChildren<
  Omit<PressableProps, 'style'> & { style?: StyleProp<ViewStyle> }
>;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PressableScale({
  children,
  style,
  onPressIn,
  onPressOut,
  accessibilityLabel,
  accessibilityHint,
  ...props
}: PressableScaleProps) {
  const { t } = useLocale();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const pressIn: NonNullable<PressableProps['onPressIn']> = (event) => {
    // Reanimated shared values are mutable UI-thread containers by design.
    // eslint-disable-next-line react-hooks/immutability
    scale.value = withSpring(0.982, {
      stiffness: 400,
      damping: 30,
      reduceMotion: ReduceMotion.System,
    });
    // eslint-disable-next-line react-hooks/immutability
    opacity.value = withTiming(0.9, { duration: 90, reduceMotion: ReduceMotion.System });
    onPressIn?.(event);
  };

  const pressOut: NonNullable<PressableProps['onPressOut']> = (event) => {
    // Reanimated shared values are mutable UI-thread containers by design.
    // eslint-disable-next-line react-hooks/immutability
    scale.value = withSpring(1, {
      stiffness: 400,
      damping: 30,
      reduceMotion: ReduceMotion.System,
    });
    // eslint-disable-next-line react-hooks/immutability
    opacity.value = withTiming(1, { duration: 120, reduceMotion: ReduceMotion.System });
    onPressOut?.(event);
  };

  return (
    <AnimatedPressable
      {...props}
      accessibilityLabel={
        typeof accessibilityLabel === 'string' ? t(accessibilityLabel) : accessibilityLabel
      }
      accessibilityHint={
        typeof accessibilityHint === 'string' ? t(accessibilityHint) : accessibilityHint
      }
      onPressIn={pressIn}
      onPressOut={pressOut}
      style={[{ minHeight: 44, justifyContent: 'center' }, style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}
