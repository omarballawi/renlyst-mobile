import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { File } from 'expo-file-system';
import { SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Image } from 'expo-image';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { drugBackupSchema, type DrugBackup } from '@/domain/backup';
import {
  defaultProviderConfiguration,
  ProviderCredentialStore,
  settingKeys,
  SettingsRepository,
  type ProviderConfiguration,
} from '@/data/repositories';
import {
  brandDraftFor,
  createCapturedBrandProduct,
  synchronizeTradeNames,
} from '@/domain/drugs/brands';
import { chapters, quickClasses, type DrugChapter } from '@/domain/drugs/chapters';
import { CaptureService } from '@/features/capture/captureService';
import { ImageEditorModal } from '@/features/capture/ImageEditorModal';
import { manipulateImage } from '@/features/capture/manipulateImage';
import { drugQueryKeys } from '@/features/library/queries';
import { useLocale } from '@/localization/LocaleProvider';
import {
  AppText,
  AppTextInput as TextInput,
  Icon,
  PressableScale,
  PrimaryButton,
  Screen,
} from '@/ui/components';
import { fonts, radii, spacing, useTheme } from '@/ui/theme';
import { appHaptics } from '@/ui/feedback/haptics';
import {
  recognizePackageWithOpenRouter,
  type PackageRecognition,
} from '@/services/providers/providerClients';

type SaveDestination = 'open' | 'later' | 'another';

export default function CaptureScreen() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();
  const router = useRouter();
  const params = useLocalSearchParams<{ chapter?: string }>();
  const { colors } = useTheme();
  const { t } = useLocale();
  const [known, setKnown] = useState(true);
  const [scientificName, setScientificName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [marketedStrength, setMarketedStrength] = useState('');
  const [dosageForm, setDosageForm] = useState('');
  const [route, setRoute] = useState('');
  const [country, setCountry] = useState('');
  const [shelfLocation, setShelfLocation] = useState('');
  const [captureLabel, setCaptureLabel] = useState('');
  const [chapter, setChapter] = useState<DrugChapter>(() => {
    const requested = params.chapter?.trim();
    return chapters.find((value) => value === requested) ?? 'Other';
  });
  const [drugClass, setDrugClass] = useState('');
  const [assets, setAssets] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [editQueue, setEditQueue] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [recognitionMessage, setRecognitionMessage] = useState<string | null>(null);
  const [recognizedByOpenRouter, setRecognizedByOpenRouter] = useState(false);
  const [recognizedIngredients, setRecognizedIngredients] = useState<
    PackageRecognition['ingredientComponents']
  >([]);
  const saveInFlight = useRef(false);

  const recognize = useMutation({
    mutationFn: async () => {
      if (assets.length === 0) throw new Error('Add a package photo first.');
      const [configuration, apiKey] = await Promise.all([
        new SettingsRepository(db).get<ProviderConfiguration>(
          settingKeys.providerConfiguration,
          defaultProviderConfiguration,
        ),
        ProviderCredentialStore.get('openRouter'),
      ]);
      const dataUrls = await Promise.all(
        assets.slice(0, 4).map(async (asset) => {
          const resized = await manipulateImage(asset.uri, [{ resize: { width: 1400 } }], {
            compress: 0.72,
            format: SaveFormat.JPEG,
          });
          return `data:image/jpeg;base64,${await new File(resized.uri).base64()}`;
        }),
      );
      return recognizePackageWithOpenRouter({
        dataUrls,
        apiKey,
        model: configuration.openRouterModel || defaultProviderConfiguration.openRouterModel,
      });
    },
    onSuccess: (result) => {
      setKnown(true);
      if (!scientificName.trim() && result.scientificName.trim())
        setScientificName(result.scientificName);
      if (!brandName.trim() && result.tradeNames[0]?.trim()) setBrandName(result.tradeNames[0]);
      if (!manufacturer.trim() && result.manufacturer.trim()) setManufacturer(result.manufacturer);
      if (!marketedStrength.trim() && result.marketedStrengthLabel.trim())
        setMarketedStrength(result.marketedStrengthLabel);
      if (!dosageForm.trim() && result.dosageForm.trim()) setDosageForm(result.dosageForm);
      if (!route.trim() && result.route.trim()) setRoute(result.route);
      if (!country.trim() && result.country.trim()) setCountry(result.country);
      setRecognizedIngredients(result.ingredientComponents);
      setRecognizedByOpenRouter(true);
      setRecognitionMessage(
        result.confidence === 'low'
          ? 'Visible facts were filled with low confidence. Verify every field against the package before saving.'
          : 'Visible package facts were filled in. Verify each field before saving.',
      );
    },
  });

  const save = useMutation({
    mutationFn: async ({ destination }: { destination: SaveDestination }) => {
      const now = new Date().toISOString();
      const name = scientificName.trim();
      if (known && !name)
        throw new Error('Enter the active ingredient, or save this package as unknown.');
      if (!known && !captureLabel.trim() && !brandName.trim() && assets.length === 0) {
        throw new Error(
          'Add a quick label, brand, or photo so you can identify this package later.',
        );
      }
      const id = Crypto.randomUUID();
      const ingredients = known
        ? name
            .split(/\s*\+\s*/u)
            .map((value) => value.trim())
            .filter(Boolean)
        : [];
      const drug: DrugBackup = drugBackupSchema.parse({
        id,
        scientificName: known ? name : '',
        tradeNames: [],
        captureLabel: known ? '' : captureLabel.trim() || 'Unknown package',
        isUnknown: !known,
        timesSeen: 1,
        dateAdded: now,
        lastSeenDate: now,
        nextReviewDate: now,
        activeIngredients: ingredients,
        chapterRaw: chapter,
        drugClass: drugClass.trim(),
        strengths: marketedStrength.trim() ? [marketedStrength.trim()] : [],
        dosageForms: dosageForm.trim() ? [dosageForm.trim()] : [],
        routes: route.trim() ? [route.trim()] : [],
        shelfLocation: shelfLocation.trim(),
      });
      const createdProduct = brandName.trim()
        ? createCapturedBrandProduct({
            id: Crypto.randomUUID(),
            drug,
            draft: {
              ...brandDraftFor(drug),
              ingredientComponents:
                recognizedIngredients.length > 0
                  ? recognizedIngredients
                  : brandDraftFor(drug).ingredientComponents,
              tradeName: brandName,
              manufacturer,
              marketedStrengthLabel: marketedStrength,
              dosageForm,
              route,
              country,
              shelfLocation,
            },
            hasPhoto: assets.length > 0,
          })
        : undefined;
      const product =
        createdProduct && recognizedByOpenRouter
          ? { ...createdProduct, sourceName: 'OpenRouter package vision' }
          : createdProduct;
      const profile = product ? synchronizeTradeNames(drug, [product]) : drug;
      await new CaptureService(db).save(profile, assets, product);
      return { destination, id };
    },
    onSuccess: async ({ destination, id }) => {
      appHaptics.captureSaved();
      await queryClient.invalidateQueries({ queryKey: drugQueryKeys.all });
      if (destination === 'open') router.replace(`/drug/${id}`);
      else if (destination === 'later') router.back();
      else {
        setScientificName('');
        setBrandName('');
        setManufacturer('');
        setMarketedStrength('');
        setDosageForm('');
        setRoute('');
        setCountry('');
        setShelfLocation('');
        setCaptureLabel('');
        setChapter('Other');
        setDrugClass('');
        setAssets([]);
        setError(null);
        setRecognitionMessage(null);
        setRecognizedByOpenRouter(false);
        setRecognizedIngredients([]);
      }
    },
    onError: (reason) =>
      setError(reason instanceof Error ? reason.message : 'The package could not be saved.'),
    onSettled: () => {
      saveInFlight.current = false;
    },
  });

  const beginSave = (destination: SaveDestination) => {
    if (saveInFlight.current || save.isPending) return;
    saveInFlight.current = true;
    setError(null);
    save.mutate({ destination });
  };

  const appendAssets = (incoming: ImagePicker.ImagePickerAsset[]) => {
    setAssets((current) => [...current, ...incoming].slice(0, 8));
  };

  const queueForEditing = (incoming: ImagePicker.ImagePickerAsset[]) => {
    setEditQueue((current) => [...current, ...incoming].slice(0, 8 - assets.length));
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
    if (!result.canceled) queueForEditing(result.assets);
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
    const remaining = 8 - assets.length;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 1,
      orderedSelection: true,
    });
    if (!result.canceled) queueForEditing(result.assets);
  };

  return (
    <Screen safeBottom>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="always"
          contentContainerStyle={styles.content}
        >
          <View style={styles.titleRow}>
            <View style={styles.titleCopy}>
              <AppText variant="label" color={colors.aqua}>
                FAST CAPTURE
              </AppText>
              <AppText variant="title" color={colors.ink}>
                Save the shelf moment.
              </AppText>
              <AppText color={colors.mutedInk}>
                An identity or recognizable package note is enough. Clinical detail can wait.
              </AppText>
            </View>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Close capture"
              onPress={() => router.back()}
              style={[styles.close, { borderColor: colors.line }]}
            >
              <AppText variant="heading" color={colors.ink}>
                ×
              </AppText>
            </PressableScale>
          </View>

          <View style={[styles.segment, { backgroundColor: colors.surfaceStrong }]}>
            {([true, false] as const).map((value) => (
              <PressableScale
                key={String(value)}
                accessibilityRole="button"
                accessibilityState={{ selected: known === value }}
                onPress={() => setKnown(value)}
                style={[styles.segmentItem, known === value && { backgroundColor: colors.surface }]}
              >
                <AppText
                  variant="bodyStrong"
                  color={known === value ? colors.ink : colors.mutedInk}
                >
                  {value ? 'I know it' : 'Identify later'}
                </AppText>
              </PressableScale>
            ))}
          </View>

          <View style={styles.fields}>
            {known ? (
              <>
                <AppText variant="bodyStrong" color={colors.ink}>
                  Active ingredient
                </AppText>
                <TextInput
                  testID="capture-active-ingredient"
                  accessibilityLabel="Active ingredient"
                  value={scientificName}
                  onChangeText={setScientificName}
                  placeholder="e.g. furosemide"
                  placeholderTextColor={colors.mutedInk}
                  autoCapitalize="words"
                  autoCorrect={false}
                  spellCheck={false}
                  textContentType="none"
                  style={[
                    styles.input,
                    {
                      color: colors.ink,
                      borderColor: colors.line,
                      backgroundColor: colors.surface,
                    },
                  ]}
                />
              </>
            ) : (
              <>
                <AppText variant="bodyStrong" color={colors.ink}>
                  Quick label <AppText color={colors.mutedInk}>(optional)</AppText>
                </AppText>
                <TextInput
                  accessibilityLabel="Quick label for unknown package"
                  value={captureLabel}
                  onChangeText={setCaptureLabel}
                  placeholder="e.g. blue inhaler, top shelf"
                  placeholderTextColor={colors.mutedInk}
                  style={[
                    styles.input,
                    {
                      color: colors.ink,
                      borderColor: colors.line,
                      backgroundColor: colors.surface,
                    },
                  ]}
                />
              </>
            )}

            <AppText variant="bodyStrong" color={colors.ink}>
              Brand on the package <AppText color={colors.mutedInk}>(optional)</AppText>
            </AppText>
            <TextInput
              testID="capture-brand"
              accessibilityLabel="Brand on package"
              value={brandName}
              onChangeText={setBrandName}
              placeholder="e.g. Lasix"
              placeholderTextColor={colors.mutedInk}
              autoCapitalize="words"
              autoCorrect={false}
              spellCheck={false}
              textContentType="none"
              style={[
                styles.input,
                { color: colors.ink, borderColor: colors.line, backgroundColor: colors.surface },
              ]}
            />
            <View style={styles.fieldRow}>
              <TextInput
                testID="capture-strength"
                accessibilityLabel="Strength"
                value={marketedStrength}
                onChangeText={setMarketedStrength}
                placeholder="Strength, e.g. 40 mg"
                placeholderTextColor={colors.mutedInk}
                style={[
                  styles.input,
                  styles.rowInput,
                  { color: colors.ink, borderColor: colors.line, backgroundColor: colors.surface },
                ]}
              />
              <TextInput
                testID="capture-dosage-form"
                accessibilityLabel="Dosage form"
                value={dosageForm}
                onChangeText={setDosageForm}
                placeholder="Form, e.g. tablet"
                placeholderTextColor={colors.mutedInk}
                style={[
                  styles.input,
                  styles.rowInput,
                  { color: colors.ink, borderColor: colors.line, backgroundColor: colors.surface },
                ]}
              />
            </View>
            <AppText variant="bodyStrong" color={colors.ink}>
              Chapter
            </AppText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
            >
              {chapters.map((value) => {
                const selected = chapter === value;
                return (
                  <PressableScale
                    key={value}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setChapter(value)}
                    style={[
                      styles.chip,
                      {
                        borderColor: selected ? colors.coral : colors.line,
                        backgroundColor: selected ? colors.saffronSoft : colors.surface,
                      },
                    ]}
                  >
                    <AppText variant="caption" color={selected ? colors.coral : colors.ink}>
                      {value}
                    </AppText>
                  </PressableScale>
                );
              })}
            </ScrollView>
            <AppText variant="bodyStrong" color={colors.ink}>
              Drug class <AppText color={colors.mutedInk}>(optional)</AppText>
            </AppText>
            <TextInput
              testID="capture-drug-class"
              accessibilityLabel="Drug class"
              value={drugClass}
              onChangeText={setDrugClass}
              placeholder="e.g. Loop diuretic"
              placeholderTextColor={colors.mutedInk}
              style={[
                styles.input,
                { color: colors.ink, borderColor: colors.line, backgroundColor: colors.surface },
              ]}
            />
            {(quickClasses[chapter]?.length ?? 0) > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chips}
              >
                {quickClasses[chapter]?.map((value) => (
                  <PressableScale
                    key={value}
                    accessibilityRole="button"
                    onPress={() => setDrugClass(value)}
                    style={[
                      styles.chip,
                      { borderColor: colors.line, backgroundColor: colors.surface },
                    ]}
                  >
                    <AppText variant="caption" color={colors.ink}>
                      {value}
                    </AppText>
                  </PressableScale>
                ))}
              </ScrollView>
            ) : null}
            <TextInput
              accessibilityLabel="Shelf location"
              value={shelfLocation}
              onChangeText={setShelfLocation}
              placeholder="Shelf location"
              placeholderTextColor={colors.mutedInk}
              style={[
                styles.input,
                { color: colors.ink, borderColor: colors.line, backgroundColor: colors.surface },
              ]}
            />
            {brandName.trim() ? (
              <View style={[styles.packageDetails, { borderColor: colors.line }]}>
                <View style={styles.packageHeading}>
                  <AppText variant="label" color={colors.aqua}>
                    PACKAGE-SPECIFIC DETAILS
                  </AppText>
                  <AppText variant="caption" color={colors.mutedInk}>
                    Kept separate from ingredient knowledge
                  </AppText>
                </View>
                <TextInput
                  accessibilityLabel="Package manufacturer"
                  value={manufacturer}
                  onChangeText={setManufacturer}
                  placeholder="Manufacturer"
                  placeholderTextColor={colors.mutedInk}
                  style={[
                    styles.input,
                    {
                      color: colors.ink,
                      borderColor: colors.line,
                      backgroundColor: colors.surface,
                    },
                  ]}
                />
                <View style={styles.fieldRow}>
                  <TextInput
                    accessibilityLabel="Package route"
                    value={route}
                    onChangeText={setRoute}
                    placeholder="Route"
                    placeholderTextColor={colors.mutedInk}
                    style={[
                      styles.input,
                      styles.rowInput,
                      {
                        color: colors.ink,
                        borderColor: colors.line,
                        backgroundColor: colors.surface,
                      },
                    ]}
                  />
                  <TextInput
                    accessibilityLabel="Package country"
                    value={country}
                    onChangeText={setCountry}
                    placeholder="Country"
                    placeholderTextColor={colors.mutedInk}
                    style={[
                      styles.input,
                      styles.rowInput,
                      {
                        color: colors.ink,
                        borderColor: colors.line,
                        backgroundColor: colors.surface,
                      },
                    ]}
                  />
                </View>
              </View>
            ) : null}
          </View>

          <View style={styles.photoHeader}>
            <View>
              <AppText variant="heading" color={colors.ink}>
                Package photos
              </AppText>
              <AppText variant="caption" color={colors.mutedInk}>
                {assets.length}/8 selected
              </AppText>
            </View>
            {assets.length > 0 ? (
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Remove all selected photos"
                onPress={() => setAssets([])}
              >
                <AppText variant="bodyStrong" color={colors.danger}>
                  Clear
                </AppText>
              </PressableScale>
            ) : null}
          </View>
          <View style={styles.photoActions}>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Take package photo"
              onPress={() => void openCamera()}
              style={[
                styles.photoAction,
                { borderColor: colors.line, backgroundColor: colors.surface },
              ]}
            >
              <Icon name="camera" color={colors.coral} />
              <AppText variant="bodyStrong" color={colors.ink}>
                Camera
              </AppText>
            </PressableScale>
            <PressableScale
              testID="capture-photo-library"
              accessibilityRole="button"
              accessibilityLabel="Choose package photos"
              disabled={assets.length >= 8}
              onPress={() => void openLibrary()}
              style={[
                styles.photoAction,
                { borderColor: colors.line, backgroundColor: colors.surface },
              ]}
            >
              <Icon name="photos" color={colors.aqua} />
              <AppText variant="bodyStrong" color={colors.ink}>
                Photo library
              </AppText>
            </PressableScale>
          </View>
          {assets.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.previews}
              accessibilityLabel="Selected package photos"
            >
              {assets.map((asset, index) => (
                <View key={`${asset.assetId ?? asset.uri}-${index}`}>
                  <Image
                    source={asset.uri}
                    style={styles.preview}
                    contentFit="cover"
                    accessibilityLabel={t(`Package photo ${index + 1}`)}
                  />
                  <PressableScale
                    accessibilityRole="button"
                    accessibilityLabel={`Remove package photo ${index + 1}`}
                    onPress={() =>
                      setAssets((current) => current.filter((_, itemIndex) => itemIndex !== index))
                    }
                    style={[styles.remove, { backgroundColor: colors.ink }]}
                  >
                    <AppText variant="bodyStrong" color={colors.canvas}>
                      ×
                    </AppText>
                  </PressableScale>
                </View>
              ))}
            </ScrollView>
          ) : null}

          <View style={[styles.recognition, { borderColor: colors.line }]}>
            <View style={styles.recognitionCopy}>
              <AppText variant="bodyStrong" color={colors.ink}>
                Read visible package facts
              </AppText>
              <AppText variant="caption" color={colors.mutedInk}>
                Only runs when you tap it. Up to four resized photos are sent through your
                configured OpenRouter model; clinical knowledge is never generated here.
              </AppText>
            </View>
            <PressableScale
              accessibilityRole="button"
              disabled={assets.length === 0 || recognize.isPending}
              onPress={() => recognize.mutate()}
              style={[
                styles.recognizeButton,
                {
                  borderColor: colors.aqua,
                  backgroundColor: assets.length > 0 ? colors.aquaSoft : colors.surfaceStrong,
                },
              ]}
            >
              <AppText
                variant="bodyStrong"
                color={assets.length > 0 ? colors.aqua : colors.mutedInk}
              >
                {recognize.isPending ? 'Reading package…' : 'Recognize package'}
              </AppText>
            </PressableScale>
          </View>
          {recognize.error ? (
            <View
              accessibilityRole="alert"
              style={[styles.error, { backgroundColor: colors.saffronSoft }]}
            >
              <Icon name="warning" color={colors.saffron} />
              <AppText color={colors.ink} style={styles.errorText}>
                {recognize.error instanceof Error
                  ? recognize.error.message
                  : 'Package recognition could not be completed.'}
              </AppText>
            </View>
          ) : null}
          {recognitionMessage ? (
            <View
              accessibilityLiveRegion="polite"
              style={[styles.error, { backgroundColor: colors.aquaSoft }]}
            >
              <Icon name="check" color={colors.aqua} />
              <AppText color={colors.ink} style={styles.errorText}>
                {recognitionMessage}
              </AppText>
            </View>
          ) : null}

          {error ? (
            <View
              accessibilityRole="alert"
              style={[styles.error, { backgroundColor: colors.saffronSoft }]}
            >
              <Icon name="warning" color={colors.saffron} />
              <AppText color={colors.ink} style={styles.errorText}>
                {error}
              </AppText>
            </View>
          ) : null}
        </ScrollView>
        <View
          style={[
            styles.saveActions,
            { backgroundColor: colors.canvas, borderTopColor: colors.line },
          ]}
        >
          <PrimaryButton
            label={save.isPending ? 'Saving package…' : 'Save and open profile'}
            icon="check"
            testID="capture-save-open"
            disabled={save.isPending}
            onPress={() => beginSave('open')}
          />
          <View style={styles.secondaryActions}>
            <PressableScale
              accessibilityRole="button"
              onPress={() => beginSave('later')}
              disabled={save.isPending}
            >
              <AppText variant="bodyStrong" color={colors.aqua}>
                Save for later
              </AppText>
            </PressableScale>
            <PressableScale
              accessibilityRole="button"
              onPress={() => beginSave('another')}
              disabled={save.isPending}
            >
              <AppText variant="bodyStrong" color={colors.aqua}>
                Save another
              </AppText>
            </PressableScale>
          </View>
        </View>
      </KeyboardAvoidingView>
      <ImageEditorModal
        asset={editQueue[0] ?? null}
        onSave={(edited) => {
          appendAssets([edited]);
          setEditQueue((current) => current.slice(1));
        }}
        onCancel={() => setEditQueue([])}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.xl, paddingBottom: spacing.xxl },
  titleRow: { flexDirection: 'row', gap: spacing.md },
  titleCopy: { flex: 1, gap: spacing.xs },
  close: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segment: { flexDirection: 'row', padding: spacing.xxs, borderRadius: radii.md },
  segmentItem: {
    flex: 1,
    minHeight: 44,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fields: { gap: spacing.xs },
  chips: { gap: spacing.xs, paddingRight: spacing.lg },
  chip: {
    minHeight: 42,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  packageDetails: { borderWidth: 1, borderRadius: radii.lg, padding: spacing.md, gap: spacing.xs },
  packageHeading: { marginBottom: spacing.xs },
  fieldRow: { flexDirection: 'row', gap: spacing.sm },
  rowInput: { flex: 1, minWidth: 0 },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    fontFamily: fonts.body,
    fontSize: 16,
    marginBottom: spacing.sm,
  },
  photoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  photoActions: { flexDirection: 'row', gap: spacing.sm },
  photoAction: {
    flex: 1,
    minHeight: 86,
    borderWidth: 1,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  previews: { gap: spacing.sm, paddingRight: spacing.lg },
  preview: { width: 112, height: 140, borderRadius: radii.md },
  remove: {
    position: 'absolute',
    right: -4,
    top: -4,
    width: 34,
    height: 34,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recognition: { borderWidth: 1, borderRadius: radii.lg, padding: spacing.md, gap: spacing.md },
  recognitionCopy: { gap: spacing.xs },
  recognizeButton: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
  },
  errorText: { flex: 1 },
  saveActions: {
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  secondaryActions: { flexDirection: 'row', justifyContent: 'space-around', gap: spacing.lg },
});
