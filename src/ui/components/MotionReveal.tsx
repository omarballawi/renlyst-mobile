import { useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { Animated, Easing, type StyleProp, type ViewStyle } from 'react-native';

import { useLocale } from '@/localization/LocaleProvider';
import { useReducedMotion } from '@/ui/motion/useReducedMotion';

type MotionRevealProps = PropsWithChildren<{
  delay?: number;
  direction?: 'fade' | 'up' | 'forward';
  style?: StyleProp<ViewStyle>;
}>;

export function MotionReveal({ children, delay = 0, direction = 'up', style }: MotionRevealProps) {
  const { isRTL } = useLocale();
  const reducedMotion = useReducedMotion();
  const [opacity] = useState(() => new Animated.Value(1));
  const [translateX] = useState(() => new Animated.Value(0));
  const [translateY] = useState(() => new Animated.Value(0));
  const animation = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    animation.current?.stop();
    const horizontalOffset = direction === 'forward' ? (isRTL ? -12 : 12) : 0;
    const verticalOffset = direction === 'up' ? 12 : 0;

    if (reducedMotion) {
      opacity.setValue(1);
      translateX.setValue(0);
      translateY.setValue(0);
      return;
    }

    opacity.setValue(0);
    translateX.setValue(horizontalOffset);
    translateY.setValue(verticalOffset);
    animation.current = Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(translateX, {
          toValue: 0,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]),
    ]);
    animation.current.start();

    return () => {
      animation.current?.stop();
      opacity.stopAnimation();
      translateX.stopAnimation();
      translateY.stopAnimation();
    };
  }, [delay, direction, isRTL, opacity, reducedMotion, translateX, translateY]);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateX }, { translateY }] }]}>
      {children}
    </Animated.View>
  );
}
