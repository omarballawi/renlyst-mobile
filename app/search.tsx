import { useState } from 'react';
import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';

import { DrugRow } from '@/features/library/DrugRow';
import { useDrugList } from '@/features/library/queries';
import { AppText, AppTextInput as TextInput, Icon, PressableScale, Screen } from '@/ui/components';
import { fonts, radii, spacing, useTheme } from '@/ui/theme';

export default function QuickSearchScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const results = useDrugList({ query, scope: 'all', sort: 'recent' });

  return (
    <Screen safeBottom>
      <FlatList
        data={(results.data ?? []).slice(0, query.trim() ? undefined : 8)}
        keyExtractor={(drug) => drug.id}
        renderItem={({ item }) => (
          <DrugRow drug={item} onPress={() => router.push(`/drug/${item.id}`)} />
        )}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Close quick search"
                onPress={() => router.back()}
                style={[styles.close, { borderColor: colors.line }]}
              >
                <AppText variant="heading" color={colors.ink}>
                  ‹
                </AppText>
              </PressableScale>
              <View style={styles.titleCopy}>
                <AppText variant="label" color={colors.aqua}>
                  COMMAND SEARCH
                </AppText>
                <AppText variant="title" color={colors.ink}>
                  Find anything.
                </AppText>
              </View>
            </View>
            <View
              style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.line }]}
            >
              <Icon name="search" color={colors.mutedInk} size={20} />
              <TextInput
                autoFocus
                accessibilityLabel="Quick search"
                value={query}
                onChangeText={setQuery}
                placeholder="Drug, class, system, note, Arabic…"
                placeholderTextColor={colors.mutedInk}
                autoCorrect={false}
                returnKeyType="search"
                clearButtonMode="while-editing"
                style={[styles.input, { color: colors.ink }]}
              />
            </View>
            <View style={styles.actions}>
              <PressableScale
                accessibilityRole="button"
                onPress={() => router.push('/capture')}
                style={[styles.action, { borderColor: colors.line }]}
              >
                <Icon name="camera" color={colors.coral} size={19} />
                <AppText variant="caption" color={colors.ink}>
                  Capture
                </AppText>
              </PressableScale>
              <PressableScale
                accessibilityRole="button"
                onPress={() => router.push('/practice/session?mode=Smart%20Session')}
                style={[styles.action, { borderColor: colors.line }]}
              >
                <Icon name="practice" color={colors.aqua} size={19} />
                <AppText variant="caption" color={colors.ink}>
                  Smart session
                </AppText>
              </PressableScale>
              <PressableScale
                accessibilityRole="button"
                onPress={() => router.replace('/(tabs)/library')}
                style={[styles.action, { borderColor: colors.line }]}
              >
                <Icon name="library" color={colors.ink} size={19} />
                <AppText variant="caption" color={colors.ink}>
                  Library
                </AppText>
              </PressableScale>
            </View>
            <AppText variant="label" color={colors.mutedInk}>
              {query.trim() ? 'RESULTS' : 'RECENT PROFILES'}
            </AppText>
          </View>
        }
        ListEmptyComponent={
          <AppText color={colors.mutedInk} style={styles.empty}>
            No matching drug, brand, class, note, or Arabic text.
          </AppText>
        }
        ListFooterComponent={<View style={styles.footer} />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, flexGrow: 1 },
  header: { gap: spacing.lg, marginBottom: spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  titleCopy: { flex: 1, gap: spacing.xxs },
  close: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  search: {
    minHeight: 54,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  input: { flex: 1, minHeight: 50, fontFamily: fonts.body, fontSize: 16 },
  actions: { flexDirection: 'row', gap: spacing.xs },
  action: {
    flex: 1,
    minHeight: 66,
    borderWidth: 1,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
  },
  empty: { paddingVertical: spacing.xl },
  footer: { height: spacing.section },
});
