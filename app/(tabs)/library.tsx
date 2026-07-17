import { useState } from 'react';
import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';

import type { LibraryScope, LibrarySort } from '@/data/repositories';
import { DrugRow } from '@/features/library/DrugRow';
import { useDrugList, useLibrarySummary } from '@/features/library/queries';
import { useLocale } from '@/localization/LocaleProvider';
import {
  AppText,
  AppTextInput as TextInput,
  EmptyState,
  Icon,
  PageHeader,
  PressableScale,
  Screen,
} from '@/ui/components';
import { fonts, radii, spacing, useTheme } from '@/ui/theme';

const scopes: readonly { key: LibraryScope; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'due', label: 'Due' },
  { key: 'needsAttention', label: 'Needs attention' },
  { key: 'noPhoto', label: 'No photo' },
];

const sorts: readonly { key: LibrarySort; label: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'recent', label: 'Recent' },
  { key: 'due', label: 'Due first' },
  { key: 'mastery', label: 'Weakest first' },
];

type ChipProps = { label: string; selected: boolean; onPress(): void };

function Chip({ label, selected, onPress }: ChipProps) {
  const { colors } = useTheme();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.ink : colors.surface,
          borderColor: selected ? colors.ink : colors.line,
        },
      ]}
    >
      <AppText variant="caption" color={selected ? colors.canvas : colors.ink}>
        {label}
      </AppText>
    </PressableScale>
  );
}

export default function LibraryScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLocale();
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<LibraryScope>('all');
  const [sort, setSort] = useState<LibrarySort>('name');
  const drugs = useDrugList({ query, scope, sort });
  const summary = useLibrarySummary();

  return (
    <Screen>
      <FlatList
        data={drugs.data ?? []}
        keyExtractor={(drug) => drug.id}
        renderItem={({ item }) => (
          <DrugRow drug={item} onPress={() => router.push(`/drug/${item.id}`)} />
        )}
        refreshing={drugs.isRefetching || summary.isRefetching}
        onRefresh={() => void Promise.all([drugs.refetch(), summary.refetch()])}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <PageHeader
              eyebrow="Your evidence"
              title="Drug library"
              subtitle="Search ingredients, brands, uses, Arabic notes, and shelf locations."
              onAdd={() => router.push('/add')}
            />
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Open library learning tools"
              accessibilityHint="Explore the knowledge map, compare profiles, and start a shelf quest"
              onPress={() => router.push('/library/tools')}
              style={[
                styles.toolsCard,
                { backgroundColor: colors.surfaceStrong, borderColor: colors.line },
              ]}
            >
              <View style={[styles.toolsIcon, { backgroundColor: colors.aquaSoft }]}>
                <Icon name="practice" color={colors.aqua} size={22} />
              </View>
              <View style={styles.toolsCopy}>
                <AppText variant="bodyStrong" color={colors.ink}>
                  Work the shelf
                </AppText>
                <AppText variant="caption" color={colors.mutedInk}>
                  Map, compare, and turn gaps into capture quests
                </AppText>
              </View>
              <Icon name="chevron" color={colors.mutedInk} size={17} />
            </PressableScale>
            <View
              style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.line }]}
            >
              <Icon name="search" color={colors.mutedInk} size={20} />
              <TextInput
                testID="library-search"
                accessibilityLabel="Search drug library"
                value={query}
                onChangeText={setQuery}
                placeholder="Ingredient, brand, Arabic, shelf…"
                placeholderTextColor={colors.mutedInk}
                autoCorrect={false}
                returnKeyType="search"
                clearButtonMode="while-editing"
                style={[styles.searchInput, { color: colors.ink }]}
              />
            </View>
            <View style={styles.summary} accessibilityLabel={t('Library summary')}>
              <View>
                <AppText variant="label" color={colors.mutedInk}>
                  PROFILES
                </AppText>
                <AppText variant="heading" color={colors.ink}>
                  {summary.data?.profiles ?? 0}
                </AppText>
              </View>
              <View>
                <AppText variant="label" color={colors.mutedInk}>
                  BRANDS
                </AppText>
                <AppText variant="heading" color={colors.ink}>
                  {summary.data?.brands ?? 0}
                </AppText>
              </View>
              <View>
                <AppText variant="label" color={colors.mutedInk}>
                  DUE
                </AppText>
                <AppText variant="heading" color={colors.saffron}>
                  {summary.data?.due ?? 0}
                </AppText>
              </View>
            </View>
            <View>
              <AppText variant="label" color={colors.mutedInk} style={styles.groupLabel}>
                SHOW
              </AppText>
              <View style={styles.chips}>
                {scopes.map((item) => (
                  <Chip
                    key={item.key}
                    label={item.label}
                    selected={scope === item.key}
                    onPress={() => setScope(item.key)}
                  />
                ))}
              </View>
            </View>
            <View>
              <AppText variant="label" color={colors.mutedInk} style={styles.groupLabel}>
                SORT
              </AppText>
              <View style={styles.chips}>
                {sorts.map((item) => (
                  <Chip
                    key={item.key}
                    label={item.label}
                    selected={sort === item.key}
                    onPress={() => setSort(item.key)}
                  />
                ))}
              </View>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.line }]} />
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon={query || scope !== 'all' ? 'search' : 'library'}
            title={
              query || scope !== 'all' ? 'No profiles match this view' : 'No drug profiles yet'
            }
            body={
              query || scope !== 'all'
                ? 'Try a different term or clear the current scope.'
                : 'Capture a package to create a profile without needing to finish every field.'
            }
          />
        }
        ListFooterComponent={<View style={{ height: spacing.section }} />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, flexGrow: 1 },
  header: { gap: spacing.xl },
  search: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchInput: { flex: 1, minHeight: 48, fontFamily: fonts.body, fontSize: 16 },
  toolsCard: {
    minHeight: 78,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  toolsIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolsCopy: { flex: 1, gap: 2 },
  summary: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.xs },
  groupLabel: { marginBottom: spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
    justifyContent: 'center',
  },
  divider: { height: StyleSheet.hairlineWidth },
});
