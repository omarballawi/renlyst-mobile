import { ScrollView, StyleSheet, View } from 'react-native';

import { chapters, type DrugChapter } from '@/domain/drugs/chapters';
import { AppText, AppTextInput, PressableScale } from '@/ui/components';
import { fonts, radii, spacing, useTheme } from '@/ui/theme';

export type IdentityContextValue = {
  tradeNames: string;
  strength: string;
  dosageForm: string;
  route: string;
  chapterRaw: DrugChapter | '';
  drugClass: string;
};

export function IdentityContextFields({
  value,
  onChange,
}: {
  value: IdentityContextValue;
  onChange(value: IdentityContextValue): void;
}) {
  const { colors } = useTheme();
  const field = (
    key: 'tradeNames' | 'strength' | 'dosageForm' | 'route' | 'drugClass',
    label: string,
    placeholder: string,
  ) => (
    <View style={styles.field}>
      <AppText variant="label" color={colors.mutedInk}>
        {label}
      </AppText>
      <AppTextInput
        accessibilityLabel={label}
        value={value[key]}
        onChangeText={(text) => onChange({ ...value, [key]: text })}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedInk}
        autoCapitalize="words"
        style={[
          styles.input,
          { color: colors.ink, borderColor: colors.line, backgroundColor: colors.surface },
        ]}
      />
    </View>
  );

  return (
    <View
      style={[styles.card, { borderColor: colors.line, backgroundColor: colors.surfaceStrong }]}
    >
      <View style={styles.heading}>
        <AppText variant="bodyStrong" color={colors.ink}>
          Package identity
        </AppText>
        <AppText variant="caption" color={colors.mutedInk}>
          Optional details improve source matching and override generated guesses.
        </AppText>
      </View>
      <View style={styles.grid}>
        {field('tradeNames', 'Trade names', 'Comma-separated brands')}
        {field('strength', 'Strength', 'e.g. 40 mg')}
        {field('dosageForm', 'Dosage form', 'e.g. tablet')}
        {field('route', 'Route', 'e.g. oral')}
        {field('drugClass', 'Drug class', 'e.g. Loop diuretic')}
      </View>
      <View style={styles.chapterGroup}>
        <AppText variant="label" color={colors.mutedInk}>
          CHAPTER / SYSTEM
        </AppText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {chapters.map((chapter) => {
            const selected = value.chapterRaw === chapter;
            return (
              <PressableScale
                key={chapter}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={chapter}
                onPress={() => onChange({ ...value, chapterRaw: chapter })}
                style={[
                  styles.chip,
                  {
                    borderColor: selected ? colors.ink : colors.line,
                    backgroundColor: selected ? colors.ink : colors.surface,
                  },
                ]}
              >
                <AppText variant="caption" color={selected ? colors.canvas : colors.ink}>
                  {chapter}
                </AppText>
              </PressableScale>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  heading: { gap: 3 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  field: { flexGrow: 1, flexBasis: 145, gap: spacing.xs },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    fontFamily: fonts.body,
    fontSize: 15,
  },
  chapterGroup: { gap: spacing.sm },
  chips: { gap: spacing.sm, paddingEnd: spacing.sm },
  chip: {
    minHeight: 40,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
  },
});
