import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { AppText } from './AppText';
import { radii, useTheme } from '@/ui/theme';

type DrugThumbnailProps = {
  id: string;
  name: string;
  uri?: string | null | undefined;
  size?: number;
  unknown?: boolean;
  accessibilityLabel?: string;
};

function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/u)
      .slice(0, 2)
      .map((part) => part.slice(0, 1))
      .join('')
      .toLocaleUpperCase() || '?'
  );
}

export function DrugThumbnail({
  id,
  name,
  uri,
  size = 48,
  unknown = false,
  accessibilityLabel,
}: DrugThumbnailProps) {
  const { colors } = useTheme();
  const frame = {
    width: size,
    height: size,
    borderRadius: Math.min(radii.md, size * 0.28),
  };

  if (uri) {
    return (
      <Image
        source={uri}
        recyclingKey={`${id}:${size}`}
        cachePolicy="memory-disk"
        transition={160}
        contentFit="cover"
        {...(accessibilityLabel ? { accessibilityLabel, accessible: true } : { accessible: false })}
        style={[styles.frame, frame, { backgroundColor: colors.surfaceStrong }]}
      />
    );
  }

  return (
    <View
      accessible={Boolean(accessibilityLabel)}
      {...(accessibilityLabel
        ? { accessibilityRole: 'image' as const, accessibilityLabel }
        : { accessible: false })}
      style={[
        styles.frame,
        frame,
        { backgroundColor: unknown ? colors.saffronSoft : colors.aquaSoft },
      ]}
    >
      <AppText variant="label" color={unknown ? colors.saffron : colors.aqua}>
        {initials(name)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
});
