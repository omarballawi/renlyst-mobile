import type { PropsWithChildren } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useLocale } from '@/localization/LocaleProvider';

type PressableScaleProps = PropsWithChildren<
  Omit<PressableProps, 'style'> & { style?: StyleProp<ViewStyle> }
>;

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
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[style, animatedStyle]}>
      <Pressable
        {...props}
        accessibilityLabel={
          typeof accessibilityLabel === 'string' ? t(accessibilityLabel) : accessibilityLabel
        }
        accessibilityHint={
          typeof accessibilityHint === 'string' ? t(accessibilityHint) : accessibilityHint
        }
        onPressIn={(event) => {
          // Reanimated shared values are intentionally mutable UI-thread containers.
          // eslint-disable-next-line react-hooks/immutability
          scale.value = withSpring(0.975, {
            stiffness: 400,
            damping: 30,
            reduceMotion: ReduceMotion.System,
          });
          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          // Reanimated shared values are intentionally mutable UI-thread containers.
          // eslint-disable-next-line react-hooks/immutability
          scale.value = withSpring(1, {
            stiffness: 400,
            damping: 30,
            reduceMotion: ReduceMotion.System,
          });
          onPressOut?.(event);
        }}
        style={{ minHeight: 44, justifyContent: 'center' }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
