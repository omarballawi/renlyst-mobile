import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import {
  defaultProviderConfiguration,
  ProviderCredentialStore,
  settingKeys,
  SettingsRepository,
  type ProviderConfiguration,
} from '@/data/repositories';
import { drugBackupSchema, type DrugBackup } from '@/domain/backup';
import { applyConfirmedIdentity, tradeNamesFromInput } from '@/domain/drugs/confirmedIdentity';
import {
  applyAIDrugDraft,
  availableAIImportFields,
  availableAIImportSections,
  defaultAIImportSelection,
  type AIImportFieldKey,
  type AIImportSection,
} from '@/domain/drugs/aiImport';
import { drugQueryKeys, useDrug, useDrugRepository } from '@/features/library/queries';
import {
  IdentityContextFields,
  type IdentityContextValue,
} from '@/features/import/IdentityContextFields';
import { generateDeepSeekDrugDraft, type AIDrugDraft } from '@/services/providers/providerClients';
import {
  AppText,
  AppTextInput as TextInput,
  Icon,
  PressableScale,
  PrimaryButton,
  Screen,
} from '@/ui/components';
import { fonts, radii, spacing, useTheme } from '@/ui/theme';

function newProfile(scientificName: string): DrugBackup {
  const now = new Date().toISOString();
  return drugBackupSchema.parse({
    id: Crypto.randomUUID(),
    scientificName,
    tradeNames: [],
    chapterRaw: 'Other',
    dateAdded: now,
    lastSeenDate: now,
    nextReviewDate: now,
    timesSeen: 1,
    isUnknown: false,
    activeIngredients: [scientificName],
  });
}

function sectionPreview(draft: AIDrugDraft, section: AIImportSection): string {
  switch (section) {
    case 'Identity':
      return [
        draft.drugClass,
        draft.chapterRaw,
        draft.activeIngredients.join(' + '),
        draft.dosageForms.join(', '),
        draft.routes.join(', '),
      ]
        .filter(Boolean)
        .join(' · ');
    case 'Uses & mechanism':
      return [...draft.indications, draft.mechanism].filter(Boolean).join('\n');
    case 'Pharmacology':
      return [
        draft.halfLifeText,
        draft.onsetText,
        draft.durationText,
        draft.excretionNotes,
        ...draft.pharmacologyProfile.absorption,
        ...draft.pharmacologyProfile.metabolism,
        ...draft.pharmacologyProfile.elimination,
      ]
        .filter(Boolean)
        .join('\n');
    case 'Safety':
      return [
        ...draft.contraindications,
        ...draft.warnings,
        ...draft.interactions,
        draft.renalCaution,
        draft.hepaticCaution,
        draft.pregnancyCaution,
      ]
        .filter(Boolean)
        .join('\n');
    case 'Counseling':
      return [
        draft.counselingSentence,
        draft.howToTake,
        draft.foodInstruction,
        draft.counselingHowToTakeArabic,
        draft.missedDoseArabic,
      ]
        .filter(Boolean)
        .join('\n');
    case 'Arabic learning':
      return [
        draft.arabicExplanation,
        draft.arabicMechanism,
        draft.arabicMemoryStory,
        draft.arabicImportantNote,
      ]
        .filter(Boolean)
        .join('\n');
    case 'Adverse effects':
      return [...draft.commonSideEffects, ...draft.seriousSideEffects].join('\n');
    case 'Dosing':
      return draft.doseRegimens
        .map((regimen) => `${regimen.indication} · ${regimen.population} · ${regimen.route}`)
        .join('\n');
    case 'Memorization':
      return [...draft.mustKnow, ...draft.flashcards, draft.oneLineSummaryArabic]
        .filter(Boolean)
        .join('\n');
  }
}

export default function AIImportScreen() {
  const { id, name } = useLocalSearchParams<{ id?: string; name?: string }>();
  const router = useRouter();
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const repository = useDrugRepository();
  const existing = useDrug(id ?? '');
  const [scientificName, setScientificName] = useState(name?.trim() ?? '');
  const [packageText, setPackageText] = useState('');
  const [identityContext, setIdentityContext] = useState<IdentityContextValue>({
    tradeNames: '',
    strength: '',
    dosageForm: '',
    route: '',
    chapterRaw: '',
    drugClass: '',
  });
  const [draft, setDraft] = useState<AIDrugDraft | null>(null);
  const [selection, setSelection] = useState<Set<AIImportSection>>(new Set());
  const [excludedFieldKeys, setExcludedFieldKeys] = useState<Set<AIImportFieldKey>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const generate = useMutation({
    mutationFn: async () => {
      const [configuration, apiKey] = await Promise.all([
        new SettingsRepository(db).get<ProviderConfiguration>(
          settingKeys.providerConfiguration,
          defaultProviderConfiguration,
        ),
        ProviderCredentialStore.get('deepSeek'),
      ]);
      return generateDeepSeekDrugDraft({
        confirmedScientificName: scientificName,
        confirmedIdentity: {
          tradeNames: tradeNamesFromInput(identityContext.tradeNames),
          strength: identityContext.strength,
          dosageForm: identityContext.dosageForm,
          route: identityContext.route,
          chapterRaw: identityContext.chapterRaw,
          drugClass: identityContext.drugClass,
        },
        packageText,
        apiKey,
        model: configuration.deepSeekModel || defaultProviderConfiguration.deepSeekModel,
      });
    },
    onSuccess: (value) => {
      setDraft(value);
      setSelection(defaultAIImportSelection(existing.data ?? newProfile(scientificName), value));
      setExcludedFieldKeys(new Set());
      setError(null);
    },
    onError: (reason) =>
      setError(
        reason instanceof Error
          ? reason.message
          : 'DeepSeek could not create a readable profile draft.',
      ),
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!draft) throw new Error('Generate and review a draft first.');
      const nameValue = scientificName.trim();
      if (!nameValue) throw new Error('Confirm the active ingredient first.');
      const base = existing.data ?? newProfile(nameValue);
      const imported = applyAIDrugDraft(
        base,
        draft,
        selection,
        new Date(),
        Crypto.randomUUID,
        excludedFieldKeys,
      );
      const updated = applyConfirmedIdentity(imported, {
        scientificName: nameValue,
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
      router.replace(`/import/complete?id=${encodeURIComponent(updated.id)}&source=ai`);
    },
    onError: (reason) =>
      setError(reason instanceof Error ? reason.message : 'The selected draft could not be saved.'),
  });

  const available = useMemo(() => (draft ? availableAIImportSections(draft) : []), [draft]);
  const visibleFields = useMemo(
    () =>
      draft ? availableAIImportFields(draft).filter((field) => selection.has(field.section)) : [],
    [draft, selection],
  );
  const selectedFieldCount = visibleFields.filter(
    (field) => !excludedFieldKeys.has(field.key),
  ).length;
  const toggle = (section: AIImportSection) => {
    setSelection((current) => {
      const next = new Set(current);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };
  const toggleField = (key: AIImportFieldKey) => {
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
            accessibilityLabel="Close AI generation"
            onPress={() => router.back()}
            style={[styles.back, { borderColor: colors.line }]}
          >
            <AppText variant="bodyStrong" color={colors.ink}>
              Back
            </AppText>
          </PressableScale>

          <View style={styles.header}>
            <AppText variant="label" color={colors.coral}>
              OPTIONAL DRAFT, HUMAN DECISION
            </AppText>
            <AppText variant="display" color={colors.ink}>
              Generate with AI
            </AppText>
            <AppText color={colors.mutedInk}>
              DeepSeek can assemble an educational draft. Nothing is saved until you inspect and
              select its sections, and every saved value remains marked unverified.
            </AppText>
          </View>

          <View style={[styles.warning, { backgroundColor: colors.saffronSoft }]}>
            <Icon name="warning" color={colors.saffron} size={20} />
            <AppText color={colors.ink} style={styles.warningCopy}>
              Do not enter patient information. Verify doses, interactions, pregnancy, and organ
              cautions against a current trusted source and pharmacist supervision.
            </AppText>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <AppText variant="label" color={colors.mutedInk}>
                CONFIRMED ACTIVE INGREDIENT
              </AppText>
              <TextInput
                accessibilityLabel="Confirmed active ingredient"
                value={scientificName}
                editable={!existing.data}
                onChangeText={setScientificName}
                placeholder="Example: Furosemide"
                placeholderTextColor={colors.mutedInk}
                style={[
                  styles.input,
                  {
                    color: colors.ink,
                    borderColor: colors.line,
                    backgroundColor: existing.data ? colors.surfaceStrong : colors.surface,
                  },
                ]}
              />
            </View>
            <IdentityContextFields value={identityContext} onChange={setIdentityContext} />
            <View style={styles.field}>
              <AppText variant="label" color={colors.mutedInk}>
                VISIBLE PACKAGE TEXT · OPTIONAL
              </AppText>
              <TextInput
                accessibilityLabel="Optional visible package text"
                value={packageText}
                onChangeText={setPackageText}
                multiline
                placeholder="Identity text only—never patient details"
                placeholderTextColor={colors.mutedInk}
                style={[
                  styles.input,
                  styles.textArea,
                  { color: colors.ink, borderColor: colors.line, backgroundColor: colors.surface },
                ]}
              />
            </View>
            <PrimaryButton
              label={
                generate.isPending ? 'Building unverified draft…' : 'Generate unverified draft'
              }
              icon="practice"
              disabled={!scientificName.trim() || generate.isPending}
              onPress={() => generate.mutate()}
            />
          </View>

          {draft ? (
            <View style={styles.preview}>
              <View style={styles.previewHeading}>
                <View style={styles.previewCopy}>
                  <AppText variant="heading" color={colors.ink}>
                    Review every section
                  </AppText>
                  <AppText variant="caption" color={colors.mutedInk}>
                    Existing knowledge stays untouched unless its section is selected.
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
                      <AppText color={colors.mutedInk} numberOfLines={6}>
                        {sectionPreview(draft, section)}
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
                        Exclude any generated field you want to keep local.
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
                            {field.summary}
                          </AppText>
                        </View>
                      </PressableScale>
                    );
                  })}
                </View>
              ) : null}
              <PrimaryButton
                label={save.isPending ? 'Saving draft…' : 'Save selected as unverified'}
                icon="database"
                disabled={selectedFieldCount === 0 || save.isPending}
                onPress={() => save.mutate()}
              />
            </View>
          ) : null}

          {error ? (
            <View
              accessibilityRole="alert"
              style={[styles.error, { backgroundColor: colors.saffronSoft }]}
            >
              <AppText color={colors.ink}>{error}</AppText>
              {error.includes('API key') ? (
                <PressableScale
                  accessibilityRole="button"
                  onPress={() => router.push('/settings/providers')}
                  style={[styles.settingsLink, { borderColor: colors.ink }]}
                >
                  <AppText variant="bodyStrong" color={colors.ink}>
                    Open provider settings
                  </AppText>
                </PressableScale>
              ) : null}
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
  warning: {
    borderRadius: radii.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  warningCopy: { flex: 1 },
  form: { gap: spacing.md },
  field: { gap: spacing.xs },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: fonts.body,
    fontSize: 16,
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  preview: { gap: spacing.md },
  previewHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  previewCopy: { flex: 1, gap: 2 },
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
  error: { padding: spacing.md, borderRadius: radii.md, gap: spacing.md },
  settingsLink: {
    alignSelf: 'flex-start',
    minHeight: 42,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
});
