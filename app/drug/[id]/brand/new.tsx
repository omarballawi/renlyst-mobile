import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { brandDraftFor, createBrandProduct, synchronizeTradeNames } from '@/domain/drugs/brands';
import { CaptureService } from '@/features/capture/captureService';
import { ImageEditorModal } from '@/features/capture/ImageEditorModal';
import { drugQueryKeys, useDrug, useProducts } from '@/features/library/queries';
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

function Field({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText(value: string): void;
  placeholder: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.field}>
      <AppText variant="bodyStrong" color={colors.ink}>
        {label}
      </AppText>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedInk}
        style={[
          styles.input,
          { color: colors.ink, borderColor: colors.line, backgroundColor: colors.surface },
        ]}
      />
    </View>
  );
}

export default function AddBrandScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const db = useSQLiteContext();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const { t } = useLocale();
  const drug = useDrug(id);
  const products = useProducts(id);
  const defaults = useMemo(() => (drug.data ? brandDraftFor(drug.data) : null), [drug.data]);
  const [tradeName, setTradeName] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [marketedStrength, setMarketedStrength] = useState('');
  const [dosageForm, setDosageForm] = useState('');
  const [route, setRoute] = useState('');
  const [country, setCountry] = useState('');
  const [shelfLocation, setShelfLocation] = useState('');
  const [componentStrengths, setComponentStrengths] = useState<Record<string, string>>({});
  const [assets, setAssets] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [editQueue, setEditQueue] = useState<ImagePicker.ImagePickerAsset[]>([]);

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
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 1,
    });
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
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 8 - assets.length,
      quality: 1,
      orderedSelection: true,
    });
    if (!result.canceled) queueForEditing(result.assets);
  };

  const save = useMutation({
    mutationFn: async () => {
      if (!drug.data) throw new Error('The ingredient profile is unavailable.');
      const base = brandDraftFor(drug.data);
      const product = createBrandProduct({
        id: Crypto.randomUUID(),
        drug: drug.data,
        draft: {
          ...base,
          tradeName,
          manufacturer,
          marketedStrengthLabel: marketedStrength,
          ingredientComponents: base.ingredientComponents.map((component) => ({
            ...component,
            displayStrength: componentStrengths[component.name] ?? '',
          })),
          dosageForm: dosageForm || defaults?.dosageForm || '',
          route: route || defaults?.route || '',
          country,
          shelfLocation: shelfLocation || defaults?.shelfLocation || '',
        },
        hasPhoto: assets.length > 0,
        existingProducts: products.data?.map((item) => item.product) ?? [],
      });
      const profile = synchronizeTradeNames(drug.data, [
        ...(products.data?.map((item) => item.product) ?? []),
        product,
      ]);
      await new CaptureService(db).save(profile, assets, product);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: drugQueryKeys.all });
      router.back();
    },
  });

  if (drug.isLoading || products.isLoading) {
    return (
      <Screen>
        <View style={styles.center}>
          <AppText color={colors.mutedInk}>Preparing brand entry…</AppText>
        </View>
      </Screen>
    );
  }
  if (!drug.data || drug.data.isUnknown) {
    return (
      <Screen safeBottom>
        <View style={styles.centerCopy}>
          <AppText variant="title" color={colors.ink}>
            Confirm the ingredient first.
          </AppText>
          <AppText color={colors.mutedInk}>
            Brand products must belong to a known ingredient profile.
          </AppText>
          <PrimaryButton label="Return to profile" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  const ingredients = defaults?.ingredientComponents ?? [];
  return (
    <Screen safeBottom>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Close brand entry"
              onPress={() => router.back()}
              style={[styles.close, { borderColor: colors.line }]}
            >
              <AppText variant="heading" color={colors.ink}>
                ×
              </AppText>
            </PressableScale>
            <View style={styles.headerCopy}>
              <AppText variant="label" color={colors.aqua}>
                PACKAGE EVIDENCE
              </AppText>
              <AppText variant="title" color={colors.ink}>
                Add a brand of {drug.data.scientificName}.
              </AppText>
              <AppText color={colors.mutedInk}>
                The package can change. Your ingredient knowledge will not.
              </AppText>
            </View>
          </View>

          <View style={styles.fields}>
            <Field
              label="Brand printed on package"
              value={tradeName}
              onChangeText={setTradeName}
              placeholder="e.g. Augmentin"
            />
            <Field
              label="Manufacturer"
              value={manufacturer}
              onChangeText={setManufacturer}
              placeholder="e.g. GSK"
            />
            <View style={styles.row}>
              <View style={styles.rowField}>
                <Field
                  label="Marketed strength"
                  value={marketedStrength}
                  onChangeText={setMarketedStrength}
                  placeholder="e.g. 625 mg"
                />
              </View>
              <View style={styles.rowField}>
                <Field
                  label="Dosage form"
                  value={dosageForm}
                  onChangeText={setDosageForm}
                  placeholder={defaults?.dosageForm || 'e.g. tablet'}
                />
              </View>
            </View>
            {ingredients.length > 1 ? (
              <View style={[styles.components, { backgroundColor: colors.surfaceStrong }]}>
                <AppText variant="label" color={colors.aqua}>
                  COMPONENT STRENGTHS
                </AppText>
                {ingredients.map((component) => (
                  <Field
                    key={component.name}
                    label={component.name}
                    value={componentStrengths[component.name] ?? ''}
                    onChangeText={(value) =>
                      setComponentStrengths((current) => ({ ...current, [component.name]: value }))
                    }
                    placeholder="Strength on package"
                  />
                ))}
              </View>
            ) : null}
            <View style={styles.row}>
              <View style={styles.rowField}>
                <Field
                  label="Route"
                  value={route}
                  onChangeText={setRoute}
                  placeholder={defaults?.route || 'e.g. oral'}
                />
              </View>
              <View style={styles.rowField}>
                <Field
                  label="Country"
                  value={country}
                  onChangeText={setCountry}
                  placeholder="Country"
                />
              </View>
            </View>
            <Field
              label="Shelf location"
              value={shelfLocation}
              onChangeText={setShelfLocation}
              placeholder={defaults?.shelfLocation || 'Optional'}
            />
          </View>

          <View style={styles.photoHeading}>
            <View>
              <AppText variant="heading" color={colors.ink}>
                Package photos
              </AppText>
              <AppText variant="caption" color={colors.mutedInk}>
                {assets.length}/8 · at least one required
              </AppText>
            </View>
            {assets.length ? (
              <PressableScale accessibilityRole="button" onPress={() => setAssets([])}>
                <AppText variant="bodyStrong" color={colors.danger}>
                  Clear
                </AppText>
              </PressableScale>
            ) : null}
          </View>
          <View style={styles.photoActions}>
            <PressableScale
              accessibilityRole="button"
              onPress={() => void openCamera()}
              style={[styles.photoAction, { borderColor: colors.line }]}
            >
              <Icon name="camera" color={colors.coral} />
              <AppText variant="bodyStrong" color={colors.ink}>
                Camera
              </AppText>
            </PressableScale>
            <PressableScale
              accessibilityRole="button"
              disabled={assets.length >= 8}
              onPress={() => void openLibrary()}
              style={[styles.photoAction, { borderColor: colors.line }]}
            >
              <Icon name="photos" color={colors.aqua} />
              <AppText variant="bodyStrong" color={colors.ink}>
                Photo library
              </AppText>
            </PressableScale>
          </View>
          {assets.length ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.previews}
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

          {save.error ? (
            <View
              accessibilityRole="alert"
              style={[styles.error, { backgroundColor: colors.saffronSoft }]}
            >
              <Icon name="warning" color={colors.saffron} />
              <AppText color={colors.ink} style={styles.errorCopy}>
                {save.error instanceof Error ? save.error.message : 'The brand could not be saved.'}
              </AppText>
            </View>
          ) : null}
          <PrimaryButton
            label={save.isPending ? 'Saving brand…' : 'Save photographed brand'}
            icon="check"
            disabled={save.isPending}
            onPress={() => save.mutate()}
          />
        </ScrollView>
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  centerCopy: { flex: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.lg },
  content: { padding: spacing.lg, paddingBottom: spacing.section, gap: spacing.xl },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  headerCopy: { flex: 1, gap: spacing.xs },
  close: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fields: { gap: spacing.md },
  field: { flex: 1, gap: spacing.xs },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    fontFamily: fonts.body,
    fontSize: 16,
  },
  row: { flexDirection: 'row', gap: spacing.sm },
  rowField: { flex: 1 },
  components: { borderRadius: radii.lg, padding: spacing.md, gap: spacing.md },
  photoHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  photoActions: { flexDirection: 'row', gap: spacing.sm },
  photoAction: {
    flex: 1,
    minHeight: 84,
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
  error: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderRadius: radii.md },
  errorCopy: { flex: 1 },
});
