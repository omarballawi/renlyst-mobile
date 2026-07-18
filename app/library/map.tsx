import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { masteryCount, requiredMasteryCount } from '@/domain/drugs/mastery';
import { useDrugList, usePrimaryImageUris } from '@/features/library/queries';
import { AppText, DrugThumbnail, EmptyState, Icon, PressableScale, Screen } from '@/ui/components';
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

export default function KnowledgeMapScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const drugs = useDrugList({ scope: 'all', sort: 'name' });
  const primaryImages = usePrimaryImageUris();
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PressableScale
          accessibilityRole="button"
          onPress={() => router.back()}
          style={[styles.back, { borderColor: colors.line }]}
        >
          <AppText variant="bodyStrong" color={colors.ink}>
            Back
          </AppText>
        </PressableScale>
        <View style={styles.header}>
          <AppText variant="label" color={colors.aqua}>
            SYSTEM BY SYSTEM
          </AppText>
          <AppText variant="display" color={colors.ink}>
            Knowledge map
          </AppText>
          <AppText color={colors.mutedInk}>
            Every active-ingredient profile stays anchored to one clinical chapter.
          </AppText>
        </View>
        {chapters.map((chapter) => {
          const matches = (drugs.data ?? []).filter(
            (drug) => (drug.chapterRaw || 'Other') === chapter,
          );
          if (matches.length === 0) return null;
          return (
            <View key={chapter} style={styles.chapter}>
              <View style={styles.chapterHeader}>
                <View style={[styles.chapterMark, { backgroundColor: colors.aquaSoft }]} />
                <AppText variant="heading" color={colors.ink}>
                  {chapter}
                </AppText>
                <AppText variant="caption" color={colors.mutedInk}>
                  {matches.length}
                </AppText>
              </View>
              <View style={[styles.chapterBody, { borderColor: colors.line }]}>
                {matches.map((drug) => {
                  const count = masteryCount(drug);
                  const required = requiredMasteryCount(drug);
                  const name = drug.scientificName || drug.captureLabel || 'Unknown medicine';
                  return (
                    <PressableScale
                      key={drug.id}
                      accessibilityRole="button"
                      accessibilityLabel={`${drug.scientificName}, mastery ${count} of ${required}`}
                      onPress={() => router.push(`/drug/${drug.id}`)}
                      style={[styles.drug, { borderBottomColor: colors.line }]}
                    >
                      <DrugThumbnail
                        id={drug.id}
                        name={name}
                        uri={primaryImages.data?.[drug.id]}
                        size={46}
                        unknown={drug.isUnknown}
                      />
                      <View style={styles.drugCopy}>
                        <AppText variant="bodyStrong" color={colors.ink}>
                          {name}
                        </AppText>
                        <AppText variant="caption" color={colors.mutedInk}>
                          {drug.drugClass || drug.tradeNames[0] || 'Class not recorded'}
                        </AppText>
                      </View>
                      <AppText
                        variant="label"
                        color={count === required ? colors.aqua : colors.saffron}
                      >
                        {count}/{required}
                      </AppText>
                      <Icon name="chevron" color={colors.mutedInk} size={17} />
                    </PressableScale>
                  );
                })}
              </View>
            </View>
          );
        })}
        {!drugs.isLoading && (drugs.data?.length ?? 0) === 0 ? (
          <EmptyState
            icon="library"
            title="The map is empty"
            body="Capture a known package to place its ingredient profile in a clinical system."
          />
        ) : null}
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
  chapter: { gap: spacing.sm },
  chapterHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  chapterMark: { width: 10, height: 10, borderRadius: radii.pill },
  chapterBody: { borderWidth: 1, borderRadius: radii.lg, paddingHorizontal: spacing.md },
  drug: {
    minHeight: 72,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  drugCopy: { flex: 1, flexShrink: 1, minWidth: 0, gap: 2 },
});
