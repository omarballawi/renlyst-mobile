import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useDrugList } from '@/features/library/queries';
import { AppText, Icon, PressableScale, Screen } from '@/ui/components';
import { radii, spacing, useTheme } from '@/ui/theme';

const chapters = [
  'Cardiovascular',
  'Respiratory',
  'Endocrine',
  'Musculoskeletal',
  'Eye',
  'Ear/Nose/Oropharynx',
  'Gastrointestinal',
  'Dermatology',
  'Antibiotics',
  'OTC',
  'Vitamins/Supplements',
  'Other',
] as const;

export default function SystemPracticeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const drugs = useDrugList({ scope: 'all', sort: 'name' });

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Back to Practice"
          onPress={() => router.back()}
          style={[styles.back, { borderColor: colors.line }]}
        >
          <AppText variant="bodyStrong" color={colors.ink}>
            Back
          </AppText>
        </PressableScale>
        <View style={styles.header}>
          <AppText variant="label" color={colors.aqua}>
            ONE SYSTEM, FIVE QUESTIONS
          </AppText>
          <AppText variant="display" color={colors.ink}>
            Choose a chapter
          </AppText>
          <AppText color={colors.mutedInk}>
            Every question in the session stays inside the selected clinical system.
          </AppText>
        </View>
        <View>
          {chapters.map((chapter) => {
            const count =
              drugs.data?.filter((drug) => !drug.isUnknown && drug.chapterRaw === chapter).length ??
              0;
            return (
              <PressableScale
                key={chapter}
                accessibilityRole="button"
                accessibilityState={{ disabled: count === 0 }}
                disabled={count === 0}
                onPress={() =>
                  router.push(
                    `/practice/session?mode=System%20Practice&chapter=${encodeURIComponent(chapter)}`,
                  )
                }
                style={[styles.chapter, { borderBottomColor: colors.line }]}
              >
                <View
                  style={[
                    styles.chapterMark,
                    { backgroundColor: count > 0 ? colors.aquaSoft : colors.surfaceStrong },
                  ]}
                >
                  <AppText variant="label" color={count > 0 ? colors.aqua : colors.mutedInk}>
                    {count}
                  </AppText>
                </View>
                <View style={styles.chapterCopy}>
                  <AppText variant="bodyStrong" color={count > 0 ? colors.ink : colors.mutedInk}>
                    {chapter}
                  </AppText>
                  <AppText variant="caption" color={colors.mutedInk}>
                    {count === 0
                      ? 'No known profiles yet'
                      : `${count} known ${count === 1 ? 'profile' : 'profiles'}`}
                  </AppText>
                </View>
                <Icon name="chevron" color={colors.mutedInk} size={17} />
              </PressableScale>
            );
          })}
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
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderRadius: radii.pill,
    justifyContent: 'center',
  },
  header: { gap: spacing.xs },
  chapter: {
    minHeight: 76,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  chapterMark: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterCopy: { flex: 1, gap: 2 },
});
