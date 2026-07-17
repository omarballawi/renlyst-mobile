import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useDrugList } from '@/features/library/queries';
import { AppText, Icon, PressableScale, PrimaryButton, Screen } from '@/ui/components';
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
type Chapter = (typeof chapters)[number];

const targetedQuests: Partial<Record<Chapter, readonly string[]>> = {
  Cardiovascular: ['ACE inhibitor', 'ARB', 'Beta blocker', 'Calcium channel blocker'],
  Respiratory: ['SABA', 'LABA', 'Inhaled corticosteroid', 'Antihistamine'],
  Endocrine: ['Biguanide', 'Sulfonylurea', 'Insulin', 'Thyroid medicine'],
};
const fallbackQuests = [
  'First package',
  'Different dosage form',
  'Safety warning',
  'Counseling example',
];

export default function ShelfQuestScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const drugs = useDrugList({ scope: 'all', sort: 'recent' });
  const [chapter, setChapter] = useState<Chapter>('Cardiovascular');
  const targets = targetedQuests[chapter] ?? fallbackQuests;
  const matched = (target: string) =>
    drugs.data?.find(
      (drug) =>
        drug.chapterRaw === chapter &&
        [drug.drugClass, drug.scientificName, drug.notes]
          .join(' ')
          .toLocaleLowerCase()
          .includes(target.toLocaleLowerCase()),
    );

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
          <AppText variant="label" color={colors.saffron}>
            REAL PACKAGES, REAL CONTEXT
          </AppText>
          <AppText variant="display" color={colors.ink}>
            Today’s Shelf Quest
          </AppText>
          <AppText color={colors.mutedInk}>
            Find the package, capture it, then connect what is easiest to confuse.
          </AppText>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {chapters.map((item) => (
            <PressableScale
              key={item}
              accessibilityRole="button"
              accessibilityState={{ selected: item === chapter }}
              onPress={() => setChapter(item)}
              style={[
                styles.chip,
                {
                  backgroundColor: item === chapter ? colors.ink : colors.surface,
                  borderColor: item === chapter ? colors.ink : colors.line,
                },
              ]}
            >
              <AppText variant="caption" color={item === chapter ? colors.canvas : colors.ink}>
                {item}
              </AppText>
            </PressableScale>
          ))}
        </ScrollView>
        <View style={styles.quests}>
          {targets.map((target) => {
            const found = matched(target);
            return (
              <View
                key={target}
                style={[
                  styles.quest,
                  { backgroundColor: colors.surface, borderColor: colors.line },
                ]}
              >
                <View
                  style={[
                    styles.check,
                    { backgroundColor: found ? colors.aquaSoft : colors.surfaceStrong },
                  ]}
                >
                  <Icon
                    name={found ? 'check' : 'camera'}
                    color={found ? colors.aqua : colors.mutedInk}
                    size={18}
                  />
                </View>
                <View style={styles.questCopy}>
                  <AppText variant="bodyStrong" color={colors.ink}>
                    {target}
                  </AppText>
                  <AppText variant="caption" color={colors.mutedInk}>
                    {found?.scientificName || 'Not found on your shelf yet'}
                  </AppText>
                </View>
                {found ? (
                  <PressableScale
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${found.scientificName || target}`}
                    onPress={() => router.push(`/drug/${found.id}`)}
                  >
                    <Icon name="chevron" color={colors.aqua} size={18} />
                  </PressableScale>
                ) : (
                  <PressableScale
                    accessibilityRole="button"
                    accessibilityLabel={`Capture ${target}`}
                    onPress={() => router.push(`/capture?chapter=${encodeURIComponent(chapter)}`)}
                    style={[styles.capture, { borderColor: colors.coral }]}
                  >
                    <Icon name="camera" color={colors.coral} size={18} />
                  </PressableScale>
                )}
              </View>
            );
          })}
        </View>
        <View style={[styles.connect, { backgroundColor: colors.ink }]}>
          <AppText variant="heading" color={colors.canvas}>
            Connect the shelf
          </AppText>
          <AppText color={colors.canvas} style={styles.connectCopy}>
            Which two packages are easiest to confuse? Compare them and name one meaningful
            difference.
          </AppText>
          <PrimaryButton
            label="Compare two drugs"
            icon="practice"
            onPress={() => router.push('/library/compare')}
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
  chips: { gap: spacing.xs, paddingRight: spacing.lg },
  chip: {
    minHeight: 42,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  quests: { gap: spacing.sm },
  quest: {
    minHeight: 78,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  check: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questCopy: { flex: 1, gap: 2 },
  capture: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connect: { borderRadius: radii.xl, padding: spacing.xl, gap: spacing.md },
  connectCopy: { opacity: 0.82 },
});
