import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText, Icon, PressableScale, Screen } from '@/ui/components';
import { radii, spacing, useTheme } from '@/ui/theme';

function Tool({
  title,
  detail,
  icon,
  onPress,
}: {
  title: string;
  detail: string;
  icon: 'library' | 'practice' | 'camera' | 'database';
  onPress(): void;
}) {
  const { colors } = useTheme();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={detail}
      onPress={onPress}
      style={[styles.tool, { backgroundColor: colors.surface, borderColor: colors.line }]}
    >
      <View style={[styles.toolIcon, { backgroundColor: colors.aquaSoft }]}>
        <Icon name={icon} color={colors.aqua} />
      </View>
      <View style={styles.toolCopy}>
        <AppText variant="bodyStrong" color={colors.ink}>
          {title}
        </AppText>
        <AppText variant="caption" color={colors.mutedInk}>
          {detail}
        </AppText>
      </View>
      <Icon name="chevron" color={colors.mutedInk} size={17} />
    </PressableScale>
  );
}

export default function LibraryToolsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Back to Library"
          onPress={() => router.back()}
          style={[styles.back, { borderColor: colors.line }]}
        >
          <AppText variant="bodyStrong" color={colors.ink}>
            Back
          </AppText>
        </PressableScale>
        <View style={styles.header}>
          <AppText variant="label" color={colors.coral}>
            UNDERSTAND YOUR LIBRARY
          </AppText>
          <AppText variant="display" color={colors.ink}>
            Work the shelf.
          </AppText>
          <AppText color={colors.mutedInk}>
            See the systems you are building, compare confusing profiles, and find the next real
            package to capture.
          </AppText>
        </View>
        <View style={styles.tools}>
          <Tool
            title="Trusted import"
            detail="Search DailyMed, openFDA, RxNorm, or Altibbi and review every field"
            icon="database"
            onPress={() => router.push('/import/trusted')}
          />
          <Tool
            title="Generate with AI"
            detail="Use a required package image to build a selectable Gemini profile"
            icon="practice"
            onPress={() => router.push('/import/ai')}
          />
          <Tool
            title="Knowledge map"
            detail="Browse every profile inside its clinical system"
            icon="library"
            onPress={() => router.push('/library/map')}
          />
          <Tool
            title="Compare two drugs"
            detail="Put identity, class, use, and warning side by side"
            icon="practice"
            onPress={() => router.push('/library/compare')}
          />
          <Tool
            title="Shelf quest"
            detail="Turn a system checklist into real package captures"
            icon="camera"
            onPress={() => router.push('/library/shelf')}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.section, gap: spacing.xl },
  back: {
    alignSelf: 'flex-start',
    minHeight: 44,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  header: { gap: spacing.xs },
  tools: { gap: spacing.sm },
  tool: {
    minHeight: 88,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  toolIcon: {
    width: 52,
    height: 52,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolCopy: { flex: 1, gap: 2 },
});
