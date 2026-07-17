import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { drugBackupSchema, type DrugBackup } from '@/domain/backup';
import { applyConfirmedIdentity, tradeNamesFromInput } from '@/domain/drugs/confirmedIdentity';
import {
  defaultProviderConfiguration,
  settingKeys,
  SettingsRepository,
  type ProviderConfiguration,
} from '@/data/repositories';
import {
  applyTrustedImport,
  availableTrustedImportFields,
  availableTrustedImportSections,
  defaultTrustedImportSelection,
  type TrustedImportFieldKey,
  type TrustedImportSection,
} from '@/domain/drugs/trustedImport';
import { drugQueryKeys, useDrug, useDrugRepository } from '@/features/library/queries';
import {
  IdentityContextFields,
  type IdentityContextValue,
} from '@/features/import/IdentityContextFields';
import {
  fetchTrustedSourceDetails,
  rankTrustedSearchResults,
  searchTrustedSource,
  type TrustedDrugSearchResult,
  type TrustedDrugSourcePacket,
  type TrustedSourceName,
} from '@/services/drugSources/trustedSources';
import {
  AppText,
  AppTextInput as TextInput,
  Icon,
  PressableScale,
  PrimaryButton,
  Screen,
} from '@/ui/components';
import { fonts, radii, spacing, useTheme } from '@/ui/theme';

const sources: readonly TrustedSourceName[] = ['DailyMed', 'openFDA', 'RxNorm', 'Altibbi'];

function newProfile(scientificName: string): DrugBackup {
  const now = new Date().toISOString();
  return drugBackupSchema.parse({
    id: Crypto.randomUUID(),
    scientificName: scientificName.trim(),
    tradeNames: [],
    chapterRaw: 'Other',
    dateAdded: now,
    lastSeenDate: now,
    nextReviewDate: now,
    isUnknown: false,
    timesSeen: 1,
    activeIngredients: scientificName.trim() ? [scientificName.trim()] : [],
  });
}

function packetText(packet: TrustedDrugSourcePacket, section: TrustedImportSection): string {
  switch (section) {
    case 'Identity':
      return [packet.activeIngredientText, packet.dosageFormsText, packet.routeText]
        .filter(Boolean)
        .join(' · ');
    case 'Uses':
      return packet.indicationsText;
    case 'Dosage':
      return packet.dosageText;
    case 'Safety':
      return [packet.contraindicationsText, packet.warningsText].filter(Boolean).join('\n\n');
    case 'Adverse effects':
      return packet.adverseReactionsText;
    case 'Interactions':
      return packet.interactionsText;
    case 'Pharmacology':
      return packet.pharmacokineticsText;
    case 'Pregnancy':
      return packet.pregnancyText;
  }
}

export default function TrustedImportScreen() {
  const { id, name } = useLocalSearchParams<{ id?: string; name?: string }>();
  const router = useRouter();
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const repository = useDrugRepository();
  const existing = useDrug(id ?? '');
  const [source, setSource] = useState<TrustedSourceName>('DailyMed');
  const [query, setQuery] = useState(name?.trim() ?? '');
  const [confirmedName, setConfirmedName] = useState(name?.trim() ?? '');
  const [identityContext, setIdentityContext] = useState<IdentityContextValue>({
    tradeNames: '',
    strength: '',
    dosageForm: '',
    route: '',
    chapterRaw: '',
    drugClass: '',
  });
  const [results, setResults] = useState<TrustedDrugSearchResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<TrustedDrugSearchResult | null>(null);
  const [packet, setPacket] = useState<TrustedDrugSourcePacket | null>(null);
  const [selection, setSelection] = useState<Set<TrustedImportSection>>(new Set());
  const [excludedFieldKeys, setExcludedFieldKeys] = useState<Set<TrustedImportFieldKey>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const providerSettings = useQuery({
    queryKey: ['settings', settingKeys.providerConfiguration],
    queryFn: () =>
      new SettingsRepository(db).get<ProviderConfiguration>(
        settingKeys.providerConfiguration,
        defaultProviderConfiguration,
      ),
  });
  const enabledSources = useMemo(() => {
    const settings = { ...defaultProviderConfiguration, ...providerSettings.data };
    return sources.filter((candidate) => {
      if (candidate === 'Altibbi') return settings.altibbiEnabled;
      if (candidate === 'RxNorm') return settings.rxNormEnabled;
      if (candidate === 'DailyMed') return settings.dailyMedEnabled;
      return settings.openFDAEnabled;
    });
  }, [providerSettings.data]);
  const activeSource = enabledSources.includes(source) ? source : (enabledSources[0] ?? source);

  const search = useMutation({
    mutationFn: () => searchTrustedSource(activeSource, query),
    onSuccess: (value) => {
      const known = existing.data;
      const confirmedTrades = tradeNamesFromInput(identityContext.tradeNames);
      const ranked = rankTrustedSearchResults(value, {
        scientificName: confirmedName.trim() || query.trim(),
        tradeNames: confirmedTrades.length > 0 ? confirmedTrades : (known?.tradeNames ?? []),
        strength: identityContext.strength.trim() || known?.strengths[0] || '',
        dosageForm: identityContext.dosageForm.trim() || known?.dosageForms[0] || '',
      });
      setResults(ranked);
      setSelectedResult(null);
      setPacket(null);
      setError(
        ranked.length === 0 ? `No ${activeSource} results matched that confirmed name.` : null,
      );
    },
    onError: (reason) =>
      setError(reason instanceof Error ? reason.message : `${activeSource} search failed.`),
  });

  const details = useMutation({
    mutationFn: (result: TrustedDrugSearchResult) => fetchTrustedSourceDetails(result),
    onSuccess: (value, result) => {
      setSelectedResult(result);
      setPacket(value);
      const name = confirmedName.trim() || result.activeIngredient.trim();
      if (!confirmedName.trim() && name) setConfirmedName(name);
      const base = existing.data ?? newProfile(name || result.displayName);
      setSelection(defaultTrustedImportSelection(base, value));
      setExcludedFieldKeys(new Set());
      setError(null);
    },
    onError: (reason) =>
      setError(reason instanceof Error ? reason.message : 'The selected source could not be read.'),
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!packet || !selectedResult) throw new Error('Choose and review a source result first.');
      const name = confirmedName.trim();
      if (!name) throw new Error('Confirm the active ingredient before importing.');
      const base = existing.data ?? newProfile(name);
      const imported = applyTrustedImport(
        { ...base, scientificName: name },
        packet,
        selection,
        new Date(),
        Crypto.randomUUID,
        excludedFieldKeys,
      );
      const updated = applyConfirmedIdentity(imported, {
        scientificName: name,
        tradeNames: tradeNamesFromInput(identityContext.tradeNames),
        strength: identityContext.strength,
        dosageForm: identityContext.dosageForm,
        route: identityContext.route,
        chapterRaw: identityContext.chapterRaw,
        drugClass: identityContext.drugClass,
      });
      await repository.save(updated);
      return updated;
    },
    onSuccess: async (updated) => {
      await queryClient.invalidateQueries({ queryKey: drugQueryKeys.all });
      router.replace(`/import/complete?id=${encodeURIComponent(updated.id)}&source=trusted`);
    },
    onError: (reason) =>
      setError(
        reason instanceof Error ? reason.message : 'The selected fields could not be saved.',
      ),
  });

  const available = useMemo(() => (packet ? availableTrustedImportSections(packet) : []), [packet]);
  const visibleFields = useMemo(
    () =>
      packet
        ? availableTrustedImportFields(packet).filter((field) => selection.has(field.section))
        : [],
    [packet, selection],
  );
  const selectedFieldCount = visibleFields.filter(
    (field) => !excludedFieldKeys.has(field.key),
  ).length;
  const toggle = (section: TrustedImportSection) => {
    setSelection((current) => {
      const next = new Set(current);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };
  const toggleField = (key: TrustedImportFieldKey) => {
    setExcludedFieldKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Close trusted import"
            onPress={() => router.back()}
            style={[styles.back, { borderColor: colors.line }]}
          >
            <AppText variant="bodyStrong" color={colors.ink}>
              Back
            </AppText>
          </PressableScale>

          <View style={styles.header}>
            <AppText variant="label" color={colors.aqua}>
              SOURCE BEFORE SUMMARY
            </AppText>
            <AppText variant="display" color={colors.ink}>
              Trusted import
            </AppText>
            <AppText color={colors.mutedInk}>
              Search a primary label, inspect the raw evidence, and choose exactly what may update
              {existing.data ? ` ${existing.data.scientificName}` : ' a new profile'}.
            </AppText>
          </View>

          <View style={styles.sourceGroup}>
            <AppText variant="label" color={colors.mutedInk}>
              SOURCE
            </AppText>
            <View style={styles.chips}>
              {enabledSources.map((value) => (
                <PressableScale
                  key={value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: activeSource === value }}
                  onPress={() => {
                    setSource(value);
                    setResults([]);
                    setSelectedResult(null);
                    setPacket(null);
                    setError(null);
                  }}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: activeSource === value ? colors.ink : colors.surface,
                      borderColor: activeSource === value ? colors.ink : colors.line,
                    },
                  ]}
                >
                  <AppText
                    variant="caption"
                    color={activeSource === value ? colors.canvas : colors.ink}
                  >
                    {value}
                  </AppText>
                </PressableScale>
              ))}
            </View>
            {enabledSources.length === 0 ? (
              <View style={[styles.disabledSources, { backgroundColor: colors.saffronSoft }]}>
                <Icon name="warning" color={colors.saffron} />
                <View style={styles.disabledCopy}>
                  <AppText variant="bodyStrong" color={colors.ink}>
                    Every trusted source is disabled
                  </AppText>
                  <PressableScale
                    accessibilityRole="button"
                    onPress={() => router.push('/settings/providers')}
                  >
                    <AppText variant="bodyStrong" color={colors.aqua}>
                      Open provider settings
                    </AppText>
                  </PressableScale>
                </View>
              </View>
            ) : null}
            {activeSource === 'Altibbi' ? (
              <AppText variant="caption" color={colors.saffron}>
                Altibbi is an Arabic reference source and is always marked for pharmacist review.
              </AppText>
            ) : null}
          </View>

          <View style={styles.searchGroup}>
            <AppText variant="label" color={colors.mutedInk}>
              CONFIRMED DRUG NAME OR ALTIBBI URL
            </AppText>
            <View
              style={[
                styles.searchBox,
                { backgroundColor: colors.surface, borderColor: colors.line },
              ]}
            >
              <Icon name="search" color={colors.mutedInk} size={20} />
              <TextInput
                accessibilityLabel="Trusted source search"
                value={query}
                onChangeText={setQuery}
                placeholder="Active ingredient or brand"
                placeholderTextColor={colors.mutedInk}
                autoCorrect={false}
                returnKeyType="search"
                onSubmitEditing={() => {
                  if (query.trim() && enabledSources.length > 0) search.mutate();
                }}
                style={[styles.searchInput, { color: colors.ink }]}
              />
            </View>
            <PrimaryButton
              label={search.isPending ? `Searching ${activeSource}…` : `Search ${activeSource}`}
              disabled={!query.trim() || search.isPending || enabledSources.length === 0}
              onPress={() => search.mutate()}
            />
            <IdentityContextFields value={identityContext} onChange={setIdentityContext} />
          </View>

          {results.length > 0 ? (
            <View style={styles.results}>
              <AppText variant="heading" color={colors.ink}>
                Source matches
              </AppText>
              {results.map((result) => (
                <PressableScale
                  key={`${result.sourceName}-${result.id}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: selectedResult?.id === result.id }}
                  onPress={() => details.mutate(result)}
                  style={[
                    styles.result,
                    {
                      backgroundColor:
                        selectedResult?.id === result.id ? colors.surfaceStrong : colors.surface,
                      borderColor: selectedResult?.id === result.id ? colors.aqua : colors.line,
                    },
                  ]}
                >
                  <View style={styles.resultCopy}>
                    <AppText variant="bodyStrong" color={colors.ink}>
                      {result.displayName}
                    </AppText>
                    <AppText variant="caption" color={colors.mutedInk}>
                      {[result.activeIngredient, result.dosageForm, result.lastUpdatedText]
                        .filter(Boolean)
                        .join(' · ') || result.sourceName}
                    </AppText>
                  </View>
                  {details.isPending && details.variables?.id === result.id ? (
                    <AppText variant="caption" color={colors.aqua}>
                      Reading…
                    </AppText>
                  ) : (
                    <Icon name="chevron" color={colors.mutedInk} size={17} />
                  )}
                </PressableScale>
              ))}
            </View>
          ) : null}

          {packet ? (
            <View style={styles.preview}>
              <View style={[styles.sourceProof, { backgroundColor: colors.aquaSoft }]}>
                <View style={styles.sourceProofCopy}>
                  <AppText variant="label" color={colors.aqua}>
                    {packet.sourceName.toLocaleUpperCase()}
                  </AppText>
                  <AppText variant="bodyStrong" color={colors.ink}>
                    Raw source loaded
                  </AppText>
                  <AppText variant="caption" color={colors.mutedInk} numberOfLines={2}>
                    {packet.sourceURL}
                  </AppText>
                </View>
                {packet.isTruncated ? (
                  <AppText variant="label" color={colors.saffron}>
                    TRIMMED
                  </AppText>
                ) : null}
              </View>

              <View style={styles.confirmGroup}>
                <AppText variant="label" color={colors.mutedInk}>
                  CONFIRM ACTIVE INGREDIENT
                </AppText>
                <TextInput
                  accessibilityLabel="Confirmed active ingredient"
                  value={confirmedName}
                  onChangeText={setConfirmedName}
                  placeholder="Required before save"
                  placeholderTextColor={colors.mutedInk}
                  style={[styles.confirmInput, { color: colors.ink, borderColor: colors.line }]}
                />
              </View>

              <View style={styles.sectionHeading}>
                <View>
                  <AppText variant="heading" color={colors.ink}>
                    Choose fields
                  </AppText>
                  <AppText variant="caption" color={colors.mutedInk}>
                    Existing fields stay untouched unless selected.
                  </AppText>
                </View>
                <AppText variant="label" color={colors.coral}>
                  {selection.size}/{available.length}
                </AppText>
              </View>
              {available.map((section) => {
                const selected = selection.has(section);
                return (
                  <PressableScale
                    key={section}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                    onPress={() => toggle(section)}
                    style={[
                      styles.section,
                      {
                        backgroundColor: selected ? colors.surfaceStrong : colors.surface,
                        borderColor: selected ? colors.coral : colors.line,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        {
                          backgroundColor: selected ? colors.coral : colors.surface,
                          borderColor: selected ? colors.coral : colors.line,
                        },
                      ]}
                    >
                      {selected ? <Icon name="check" color={colors.coralText} size={15} /> : null}
                    </View>
                    <View style={styles.sectionCopy}>
                      <AppText variant="bodyStrong" color={colors.ink}>
                        {section}
                      </AppText>
                      <AppText color={colors.mutedInk} numberOfLines={5}>
                        {packetText(packet, section)}
                      </AppText>
                    </View>
                  </PressableScale>
                );
              })}
              {visibleFields.length > 0 ? (
                <View style={[styles.fineControl, { borderColor: colors.line }]}>
                  <View style={styles.fineControlHeader}>
                    <View style={styles.sectionCopy}>
                      <AppText variant="bodyStrong" color={colors.ink}>
                        Fine control
                      </AppText>
                      <AppText variant="caption" color={colors.mutedInk}>
                        Keep individual local fields even when their section is selected.
                      </AppText>
                    </View>
                    <AppText variant="label" color={colors.aqua}>
                      {selectedFieldCount}/{visibleFields.length}
                    </AppText>
                  </View>
                  {visibleFields.map((field) => {
                    const checked = !excludedFieldKeys.has(field.key);
                    return (
                      <PressableScale
                        key={field.key}
                        accessibilityRole="checkbox"
                        accessibilityLabel={field.label}
                        accessibilityState={{ checked }}
                        onPress={() => toggleField(field.key)}
                        style={[styles.fieldRow, { borderTopColor: colors.line }]}
                      >
                        <View
                          style={[
                            styles.fieldCheckbox,
                            {
                              borderColor: checked ? colors.aqua : colors.line,
                              backgroundColor: checked ? colors.aqua : colors.surface,
                            },
                          ]}
                        >
                          {checked ? <Icon name="check" color={colors.canvas} size={13} /> : null}
                        </View>
                        <View style={styles.sectionCopy}>
                          <AppText variant="bodyStrong" color={colors.ink}>
                            {field.label}
                          </AppText>
                          <AppText variant="caption" color={colors.mutedInk} numberOfLines={2}>
                            {field.value}
                          </AppText>
                        </View>
                      </PressableScale>
                    );
                  })}
                </View>
              ) : null}
              <PrimaryButton
                label={save.isPending ? 'Saving selected evidence…' : 'Save selected evidence'}
                icon="database"
                disabled={!confirmedName.trim() || selectedFieldCount === 0 || save.isPending}
                onPress={() => save.mutate()}
                accessibilityHint="Only selected source sections will update the profile"
              />
            </View>
          ) : null}

          {error ? (
            <View
              accessibilityRole="alert"
              style={[styles.alert, { backgroundColor: colors.saffronSoft }]}
            >
              <AppText color={colors.ink}>{error}</AppText>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
  sourceGroup: { gap: spacing.xs },
  disabledSources: {
    borderRadius: radii.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  disabledCopy: { flex: 1, gap: spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    minHeight: 42,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderRadius: radii.pill,
    justifyContent: 'center',
  },
  searchGroup: { gap: spacing.sm },
  searchBox: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchInput: { flex: 1, minHeight: 48, fontFamily: fonts.body, fontSize: 16 },
  results: { gap: spacing.sm },
  result: {
    minHeight: 76,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  resultCopy: { flex: 1, gap: 2 },
  preview: { gap: spacing.md },
  sourceProof: {
    borderRadius: radii.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  sourceProofCopy: { flex: 1, gap: 2 },
  confirmGroup: { gap: spacing.xs },
  confirmInput: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    fontFamily: fonts.body,
    fontSize: 16,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  section: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderWidth: 1,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fineControl: { borderWidth: 1, borderRadius: radii.lg, overflow: 'hidden' },
  fineControlHeader: {
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  fieldRow: {
    minHeight: 66,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  fieldCheckbox: {
    width: 22,
    height: 22,
    borderWidth: 1,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCopy: { flex: 1, gap: spacing.xs },
  alert: { padding: spacing.md, borderRadius: radii.md },
});
