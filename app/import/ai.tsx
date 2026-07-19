import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { File } from 'expo-file-system';
import { Image } from 'expo-image';
import { SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import {
  defaultProviderConfiguration,
  ProviderCredentialStore,
  settingKeys,
  SettingsRepository,
  type ProviderConfiguration,
} from '@/data/repositories';
import { drugBackupSchema, type DrugBackup } from '@/domain/backup';
import { applyConfirmedIdentity } from '@/domain/drugs/confirmedIdentity';
import {
  applyAIDrugDraft,
  availableAIImportFields,
  availableAIImportSections,
  defaultAIImportSelection,
  type AIImportFieldKey,
  type AIImportSection,
} from '@/domain/drugs/aiImport';
import { CaptureService } from '@/features/capture/captureService';
import { manipulateImage } from '@/features/capture/manipulateImage';
import { drugQueryKeys, useDrug, usePrimaryImageUris } from '@/features/library/queries';
import { useLocale } from '@/localization/LocaleProvider';
import {
  generateGeminiVisionDrugDraft,
  type AIDrugDraft,
  type PackageRecognition,
} from '@/services/providers/providerClients';
import { AppText, Icon, PressableScale, PrimaryButton, Screen } from '@/ui/components';
import { useFeedback } from '@/ui/feedback/FeedbackProvider';
import { radii, spacing, useTheme } from '@/ui/theme';

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

async function imageDataUrl(uri: string): Promise<string> {
  const resized = await manipulateImage(uri, [{ resize: { width: 1400 } }], {
    compress: 0.72,
    format: SaveFormat.JPEG,
  });
  return `data:image/jpeg;base64,${await new File(resized.uri).base64()}`;
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
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const { t } = useLocale();
  const feedback = useFeedback();
  const queryClient = useQueryClient();
  const existing = useDrug(id ?? '');
  const primaryImages = usePrimaryImageUris();
  const existingImageUri = id ? primaryImages.data?.[id] : undefined;
  const [assets, setAssets] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [recognition, setRecognition] = useState<PackageRecognition | null>(null);
  const [draft, setDraft] = useState<AIDrugDraft | null>(null);
  const [selection, setSelection] = useState<Set<AIImportSection>>(new Set());
  const [excludedFieldKeys, setExcludedFieldKeys] = useState<Set<AIImportFieldKey>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const replaceAssets = (next: ImagePicker.ImagePickerAsset[]) => {
    setAssets(next.slice(0, 8));
    setRecognition(null);
    setDraft(null);
    setSelection(new Set());
    setExcludedFieldKeys(new Set());
    setError(null);
  };

  const appendAssets = (incoming: ImagePicker.ImagePickerAsset[]) => {
    replaceAssets([...assets, ...incoming]);
  };

  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        t('Camera access is off'),
        t('Allow camera access in Settings, or choose a photo from your library.'),
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 });
    if (!result.canceled) appendAssets(result.assets);
  };

  const openLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        t('Photo access is off'),
        t('Allow selected photo access in Settings to choose package images.'),
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 8 - assets.length,
      orderedSelection: true,
      quality: 1,
    });
    if (!result.canceled) appendAssets(result.assets);
  };

  const generate = useMutation({
    mutationFn: async () => {
      const storedImages =
        assets.length === 0 && id
          ? await db.getAllAsync<{ uri: string }>(
              `SELECT uri FROM drug_images
               WHERE role = 'original' AND (
                 drug_id = ? OR product_id IN (
                   SELECT id FROM drug_products WHERE profile_id = ?
                 )
               )
               ORDER BY CASE WHEN drug_id IS NULL THEN 0 ELSE 1 END, ordinal
               LIMIT 4`,
              id,
              id,
            )
          : [];
      const imageUris =
        assets.length > 0
          ? assets.map((asset) => asset.uri)
          : storedImages.length > 0
            ? storedImages.map((image) => image.uri)
            : [existingImageUri];
      const usableUris = imageUris.filter((uri): uri is string => Boolean(uri));
      if (usableUris.length === 0) throw new Error('Add a clear medicine package photo first.');
      const [configuration, apiKey] = await Promise.all([
        new SettingsRepository(db).get<ProviderConfiguration>(
          settingKeys.providerConfiguration,
          defaultProviderConfiguration,
        ),
        ProviderCredentialStore.get('openRouter'),
      ]);
      const dataUrls = await Promise.all(usableUris.slice(0, 4).map(imageDataUrl));
      return generateGeminiVisionDrugDraft({
        dataUrls,
        apiKey,
        model: configuration.openRouterModel || defaultProviderConfiguration.openRouterModel,
        ...(existing.data?.scientificName
          ? { expectedScientificName: existing.data.scientificName }
          : {}),
        expectedIngredients: existing.data?.activeIngredients ?? [],
      });
    },
    onSuccess: (value) => {
      setRecognition(value.packageRecognition);
      setDraft(value.drugDraft);
      setSelection(
        defaultAIImportSelection(
          existing.data ?? newProfile(value.packageRecognition.scientificName),
          value.drugDraft,
        ),
      );
      setExcludedFieldKeys(new Set());
      setError(null);
      feedback.profileGenerated();
    },
    onError: (reason) =>
      setError(
        reason instanceof Error
          ? reason.message
          : 'Gemini could not create a readable profile draft from this package.',
      ),
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!draft || !recognition) throw new Error('Generate and review a draft first.');
      const nameValue = existing.data?.scientificName.trim() || recognition.scientificName.trim();
      if (!nameValue) throw new Error('Gemini could not identify the active ingredient.');
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
        tradeNames: [...base.tradeNames, ...recognition.tradeNames],
        strength: recognition.marketedStrengthLabel,
        dosageForm: recognition.dosageForm,
        route: recognition.route,
        chapterRaw: draft.chapterRaw,
        drugClass: draft.drugClass,
      });
      const captureService = new CaptureService(db);
      if (existing.data) await captureService.appendDrugImages(updated, assets);
      else await captureService.save(updated, assets);
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
    <Screen safeBottom>
      <ScrollView contentContainerStyle={styles.content}>
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
            Add a medicine package image. Gemini vision reads the identity and fills the complete
            educational profile for you to review before saving.
          </AppText>
        </View>

        <View style={[styles.warning, { backgroundColor: colors.saffronSoft }]}>
          <Icon name="warning" color={colors.saffron} size={20} />
          <AppText color={colors.ink} style={styles.warningCopy}>
            Do not enter patient information. Verify doses, interactions, pregnancy, and organ
            cautions against a current trusted source and pharmacist supervision.
          </AppText>
        </View>

        <View style={[styles.photoCard, { borderColor: colors.line }]}>
          <View style={styles.photoHeading}>
            <View style={styles.previewCopy}>
              <AppText variant="heading" color={colors.ink}>
                Package image required
              </AppText>
              <AppText variant="caption" color={colors.mutedInk}>
                Use a clear front or ingredient-panel photo. Up to four resized images are sent
                through your configured Gemini model.
              </AppText>
            </View>
            <AppText variant="label" color={colors.coral}>
              REQUIRED
            </AppText>
          </View>

          {assets.length === 0 && existingImageUri ? (
            <View style={styles.savedImageRow}>
              <Image
                source={existingImageUri}
                style={styles.savedImage}
                contentFit="cover"
                accessibilityLabel={t('Saved medicine package photo')}
              />
              <View style={styles.previewCopy}>
                <AppText variant="bodyStrong" color={colors.ink}>
                  Using the saved package photo
                </AppText>
                <AppText variant="caption" color={colors.mutedInk}>
                  Add new photos only if the printed ingredient is hard to read.
                </AppText>
              </View>
            </View>
          ) : null}

          <View style={styles.photoActions}>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Take package photo"
              onPress={() => void openCamera()}
              style={[styles.photoAction, { borderColor: colors.line }]}
            >
              <Icon name="camera" color={colors.coral} size={20} />
              <AppText variant="bodyStrong" color={colors.ink}>
                Camera
              </AppText>
            </PressableScale>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Choose package photos"
              disabled={assets.length >= 8}
              onPress={() => void openLibrary()}
              style={[styles.photoAction, { borderColor: colors.line }]}
            >
              <Icon name="photos" color={colors.aqua} size={20} />
              <AppText variant="bodyStrong" color={colors.ink}>
                Photo library
              </AppText>
            </PressableScale>
          </View>

          {assets.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.imagePreviews}
              accessibilityLabel="Selected package photos"
            >
              {assets.map((asset, index) => (
                <View key={`${asset.assetId ?? asset.uri}-${index}`}>
                  <Image
                    source={asset.uri}
                    style={styles.imagePreview}
                    contentFit="cover"
                    accessibilityLabel={t(`Package photo ${index + 1}`)}
                  />
                  <PressableScale
                    accessibilityRole="button"
                    accessibilityLabel={`Remove package photo ${index + 1}`}
                    onPress={() =>
                      replaceAssets(assets.filter((_, itemIndex) => itemIndex !== index))
                    }
                    style={[styles.removeImage, { backgroundColor: colors.ink }]}
                  >
                    <AppText variant="bodyStrong" color={colors.canvas}>
                      ×
                    </AppText>
                  </PressableScale>
                </View>
              ))}
            </ScrollView>
          ) : null}

          <PrimaryButton
            label={
              generate.isPending
                ? 'Reading package and building profile…'
                : 'Generate full profile from image'
            }
            icon="practice"
            disabled={(!existingImageUri && assets.length === 0) || generate.isPending}
            onPress={() => {
              setError(null);
              generate.mutate();
            }}
          />
        </View>

        {recognition ? (
          <View style={[styles.identityResult, { backgroundColor: colors.aquaSoft }]}>
            <Icon name="check" color={colors.aqua} size={20} />
            <View style={styles.previewCopy}>
              <AppText variant="bodyStrong" color={colors.ink}>
                {recognition.scientificName}
              </AppText>
              <AppText variant="caption" color={colors.mutedInk}>
                {[
                  recognition.tradeNames.join(', '),
                  recognition.marketedStrengthLabel,
                  recognition.dosageForm,
                  recognition.route,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </AppText>
              {recognition.confidence === 'low' ? (
                <AppText variant="caption" color={colors.saffron}>
                  Gemini read this package with low confidence. Check the identity carefully.
                </AppText>
              ) : null}
            </View>
          </View>
        ) : null}

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
  warning: {
    borderRadius: radii.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  warningCopy: { flex: 1 },
  photoCard: {
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  photoHeading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  photoActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  photoAction: {
    flex: 1,
    minWidth: 132,
    minHeight: 52,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  savedImageRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  savedImage: { width: 76, height: 76, borderRadius: radii.md },
  imagePreviews: { gap: spacing.sm, paddingVertical: spacing.xs, paddingEnd: spacing.sm },
  imagePreview: { width: 116, height: 144, borderRadius: radii.md },
  removeImage: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 32,
    minHeight: 32,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityResult: {
    borderRadius: radii.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
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
