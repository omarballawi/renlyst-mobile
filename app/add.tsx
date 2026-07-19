import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import {
  AppText,
  Icon,
  PressableScale,
  PrimaryButton,
  Screen,
  type AppIconName,
} from '@/ui/components';
import { radii, spacing, useTheme } from '@/ui/theme';

function AddRoute({
  icon,
  title,
  detail,
  tint,
  onPress,
}: {
  icon: AppIconName;
  title: string;
  detail: string;
  tint: string;
  onPress(): void;
}) {
  const { colors } = useTheme();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={detail}
      onPress={onPress}
      style={[styles.route, { borderColor: colors.line, backgroundColor: colors.surface }]}
    >
      <View style={[styles.routeIcon, { backgroundColor: `${tint}18` }]}>
        <Icon name={icon} color={tint} size={24} />
      </View>
      <View style={styles.routeCopy}>
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

export default function AddHubScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  return (
    <Screen safeBottom>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <AppText variant="label" color={colors.aqua}>
              ADD TO RENLYST
            </AppText>
            <AppText variant="title" color={colors.ink}>
              Start with trustworthy context.
            </AppText>
            <AppText color={colors.mutedInk}>
              Capture an active drug quickly, import reviewed evidence, or generate an unverified
              draft you will inspect field by field.
            </AppText>
          </View>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={() => router.back()}
            style={[styles.close, { borderColor: colors.line }]}
          >
            <AppText variant="heading" color={colors.ink}>
              ×
            </AppText>
          </PressableScale>
        </View>

        <View style={[styles.primary, { backgroundColor: colors.ink }]}>
          <View style={[styles.primaryIcon, { backgroundColor: colors.saffronSoft }]}>
            <Icon name="camera" color={colors.coral} size={28} />
          </View>
          <AppText variant="heading" color={colors.canvas}>
            Add an active drug
          </AppText>
          <AppText color={colors.canvas} style={styles.primaryBody}>
            Fast manual capture for a known medicine or a package you will identify later.
          </AppText>
          <PrimaryButton
            label="Open fast capture"
            icon="camera"
            onPress={() => router.replace('/capture')}
          />
        </View>

        <View style={styles.section}>
          <AppText variant="label" color={colors.mutedInk}>
            OPTIONAL SMART TOOLS
          </AppText>
          <AddRoute
            icon="search"
            title="Trusted-source import"
            detail="Search current sources, choose sections, and review evidence before saving"
            tint={colors.aqua}
            onPress={() => router.replace('/import/trusted')}
          />
          <AddRoute
            icon="practice"
            title="Generate a full profile"
            detail="Add a package image; Gemini fills a complete unverified profile for review"
            tint={colors.coral}
            onPress={() => router.replace('/import/ai')}
          />
        </View>

        <View style={[styles.note, { backgroundColor: colors.aquaSoft }]}>
          <Icon name="library" color={colors.aqua} size={20} />
          <AppText color={colors.ink} style={styles.noteCopy}>
            To add another brand for an ingredient you already know, open that drug and choose Add
            brand. Ingredient knowledge stays unchanged.
          </AppText>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.section, gap: spacing.xxl },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  headerCopy: { flex: 1, gap: spacing.xs },
  close: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { borderRadius: radii.xl, padding: spacing.xl, gap: spacing.md },
  primaryIcon: {
    width: 56,
    height: 56,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBody: { opacity: 0.82 },
  section: { gap: spacing.sm },
  route: {
    minHeight: 86,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  routeIcon: {
    width: 50,
    height: 50,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeCopy: { flex: 1, gap: 2 },
  note: {
    borderRadius: radii.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  noteCopy: { flex: 1 },
});
