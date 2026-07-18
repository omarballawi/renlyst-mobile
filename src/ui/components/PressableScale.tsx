import { useEffect, useRef, useState, type PropsWithChildren } from 'react';
import {
  Animated,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

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
  const [scale] = useState(() => new Animated.Value(1));
  const [opacity] = useState(() => new Animated.Value(1));
  const animation = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(
    () => () => {
      animation.current?.stop();
      scale.stopAnimation();
      opacity.stopAnimation();
    },
    [opacity, scale],
  );

  const animatePress = (pressed: boolean) => {
    animation.current?.stop();
    animation.current = Animated.parallel([
      Animated.spring(scale, {
        toValue: pressed ? 0.982 : 1,
        stiffness: 400,
        damping: 30,
        mass: 1,
        useNativeDriver: false,
      }),
      Animated.timing(opacity, {
        toValue: pressed ? 0.9 : 1,
        duration: pressed ? 90 : 120,
        useNativeDriver: false,
      }),
    ]);
    animation.current.start();
  };

  const pressIn: NonNullable<PressableProps['onPressIn']> = (event) => {
    animatePress(true);
    onPressIn?.(event);
  };

  const pressOut: NonNullable<PressableProps['onPressOut']> = (event) => {
    animatePress(false);
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
      style={[
        { minHeight: 44, justifyContent: 'center' },
        style,
        { opacity, transform: [{ scale }] },
      ]}
    >
      {children}
    </AnimatedPressable>
  );
}
