import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import type { DrugBackup, DrugProductBackup } from '@/domain/backup';
import {
  parseIngredientComponents,
  synchronizeTradeNames,
  updateBrandProduct,
  type EditableIngredientComponent,
} from '@/domain/drugs/brands';
import { CaptureService, type CaptureImageAsset } from '@/features/capture/captureService';
import { ImageEditorModal } from '@/features/capture/ImageEditorModal';
import {
  drugQueryKeys,
  useDrug,
  useProduct,
  useProductImageSources,
  useProducts,
} from '@/features/library/queries';
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

function ProductEditor({
  drug,
  product,
  existingProducts,
  initialImages,
}: {
  drug: DrugBackup;
  product: DrugProductBackup;
  existingProducts: readonly DrugProductBackup[];
  initialImages: CaptureImageAsset[];
}) {
  const router = useRouter();
  const db = useSQLiteContext();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const { t } = useLocale();
  const [tradeName, setTradeName] = useState(product.tradeName);
  const [manufacturer, setManufacturer] = useState(product.manufacturer);
  const [marketedStrength, setMarketedStrength] = useState(
    product.marketedStrengthLabel ?? product.strength,
  );
  const [dosageForm, setDosageForm] = useState(product.dosageForm);
  const [route, setRoute] = useState(product.route);
  const [country, setCountry] = useState(product.country);
  const [shelfLocation, setShelfLocation] = useState(product.shelfLocation);
  const [leafletText, setLeafletText] = useState(product.leafletText);
  const [components, setComponents] = useState<EditableIngredientComponent[]>(() =>
    parseIngredientComponents(product.ingredientComponentsJSON, drug),
  );
  const [assets, setAssets] = useState<CaptureImageAsset[]>(initialImages);
  const [editQueue, setEditQueue] = useState<ImagePicker.ImagePickerAsset[]>([]);

  const updateComponent = (
    index: number,
    field: 'name' | 'displayStrength' | 'saltForm',
    value: string,
  ) => {
    setComponents((current) =>
      current.map((component, itemIndex) =>
        itemIndex === index ? { ...component, [field]: value } : component,
      ),
    );
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
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: Math.max(1, 8 - assets.length),
      quality: 1,
      orderedSelection: true,
    });
    if (!result.canceled) queueForEditing(result.assets);
  };

  const save = useMutation({
    mutationFn: async () => {
      const updated = updateBrandProduct({
        product,
        drug,
        draft: {
          tradeName,
          manufacturer,
          marketedStrengthLabel: marketedStrength,
          ingredientComponents: components,
          dosageForm,
          route,
          country,
          shelfLocation,
          leafletText,
        },
        existingProducts,
      });
      const synchronized = synchronizeTradeNames(drug, [
        ...existingProducts.filter((candidate) => candidate.id !== product.id),
        updated,
      ]);
      await new CaptureService(db).replaceProduct(synchronized, updated, assets);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: drugQueryKeys.all });
      router.back();
    },
  });

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
              accessibilityLabel="Close brand editor"
              onPress={() => router.back()}
              style={[styles.close, { borderColor: colors.line }]}
            >
              <AppText variant="heading" color={colors.ink}>
                ×
              </AppText>
            </PressableScale>
            <View style={styles.headerCopy}>
              <AppText variant="label" color={colors.aqua}>
                PACKAGE RECORD
              </AppText>
              <AppText variant="title" color={colors.ink}>
                Edit {product.tradeName}
              </AppText>
              <AppText color={colors.mutedInk}>
                Printed facts and the leaflet stay attached to this brand package.
              </AppText>
            </View>
          </View>

          <View style={styles.fields}>
            <Field
              label="Trade name"
              value={tradeName}
              onChangeText={setTradeName}
              placeholder="Brand printed on package"
            />
            <Field
              label="Manufacturer"
              value={manufacturer}
              onChangeText={setManufacturer}
              placeholder="Manufacturer"
            />
            <View style={styles.row}>
              <Field
                label="Printed strength"
                value={marketedStrength}
                onChangeText={setMarketedStrength}
                placeholder="e.g. 625 mg"
              />
              <Field
                label="Dosage form"
                value={dosageForm}
                onChangeText={setDosageForm}
                placeholder="e.g. tablet"
              />
            </View>
            <View style={styles.row}>
              <Field label="Route" value={route} onChangeText={setRoute} placeholder="e.g. oral" />
              <Field
                label="Country"
                value={country}
                onChangeText={setCountry}
                placeholder="Country"
              />
            </View>
            <Field
              label="Shelf location"
              value={shelfLocation}
              onChangeText={setShelfLocation}
              placeholder="Optional"
            />
          </View>

          <View style={[styles.components, { backgroundColor: colors.surfaceStrong }]}>
            <View style={styles.sectionHeading}>
              <View style={styles.sectionCopy}>
                <AppText variant="heading" color={colors.ink}>
                  Ingredient components
                </AppText>
                <AppText variant="caption" color={colors.mutedInk}>
                  Keep the printed total separate from each component.
                </AppText>
              </View>
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Add active ingredient"
                onPress={() =>
                  setComponents((current) => [
                    ...current,
                    {
                      name: '',
                      displayStrength: '',
                      saltForm: '',
                      strengthValue: null,
                      strengthUnit: '',
                    },
                  ])
                }
              >
                <AppText variant="bodyStrong" color={colors.aqua}>
                  Add
                </AppText>
              </PressableScale>
            </View>
            {components.map((component, index) => (
              <View key={`${index}-${component.name}`} style={styles.component}>
                <Field
                  label="Active ingredient"
                  value={component.name}
                  onChangeText={(value) => updateComponent(index, 'name', value)}
                  placeholder="Ingredient name"
                />
                <View style={styles.row}>
                  <Field
                    label="Component strength"
                    value={component.displayStrength}
                    onChangeText={(value) => updateComponent(index, 'displayStrength', value)}
                    placeholder="e.g. 500 mg"
                  />
                  <Field
                    label="Salt form"
                    value={component.saltForm}
                    onChangeText={(value) => updateComponent(index, 'saltForm', value)}
                    placeholder="Optional"
                  />
                </View>
                <PressableScale
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ingredient ${index + 1}`}
                  onPress={() =>
                    setComponents((current) =>
                      current.filter((_, itemIndex) => itemIndex !== index),
                    )
                  }
                >
                  <AppText variant="caption" color={colors.danger}>
                    Remove component
                  </AppText>
                </PressableScale>
              </View>
            ))}
          </View>

          <View style={styles.sectionHeading}>
            <View style={styles.sectionCopy}>
              <AppText variant="heading" color={colors.ink}>
                Package photos
              </AppText>
              <AppText variant="caption" color={colors.mutedInk}>
                {assets.length}/8 · crop, pan, zoom, and rotate before saving
              </AppText>
            </View>
          </View>
          <View style={styles.photoActions}>
            <PressableScale
              accessibilityRole="button"
              disabled={assets.length >= 8}
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
          {assets.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.previews}
            >
              {assets.map((asset, index) => (
                <View key={`${asset.uri}-${index}`}>
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
                    style={[styles.removePhoto, { backgroundColor: colors.ink }]}
                  >
                    <AppText variant="bodyStrong" color={colors.canvas}>
                      ×
                    </AppText>
                  </PressableScale>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.noPhotos, { borderColor: colors.line }]}>
              <Icon name="image" color={colors.mutedInk} />
              <AppText color={colors.mutedInk}>No package photos are attached.</AppText>
            </View>
          )}

          <View style={styles.field}>
            <AppText variant="heading" color={colors.ink}>
              Product leaflet
            </AppText>
            <AppText variant="caption" color={colors.mutedInk}>
              Paste the leaflet exactly as printed. This text remains product-specific.
            </AppText>
            <TextInput
              accessibilityLabel="Product leaflet"
              value={leafletText}
              onChangeText={setLeafletText}
              multiline
              textAlignVertical="top"
              placeholder="Paste leaflet text"
              placeholderTextColor={colors.mutedInk}
              style={[
                styles.leaflet,
                { color: colors.ink, borderColor: colors.line, backgroundColor: colors.surface },
              ]}
            />
          </View>

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
            label={save.isPending ? 'Saving brand…' : 'Save brand product'}
            icon="check"
            disabled={save.isPending}
            onPress={() => save.mutate()}
          />
        </ScrollView>
      </KeyboardAvoidingView>
      <ImageEditorModal
        asset={editQueue[0] ?? null}
        onSave={(edited) => {
          setAssets((current) => [...current, edited].slice(0, 8));
          setEditQueue((current) => current.slice(1));
        }}
        onCancel={() => setEditQueue([])}
      />
    </Screen>
  );
}

export default function EditBrandScreen() {
  const { id, productID } = useLocalSearchParams<{ id: string; productID: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const drug = useDrug(id);
  const product = useProduct(productID);
  const products = useProducts(id);
  const images = useProductImageSources(productID);

  if (drug.isLoading || product.isLoading || products.isLoading || images.isLoading) {
    return (
      <Screen>
        <View style={styles.center}>
          <AppText color={colors.mutedInk}>Opening package record…</AppText>
        </View>
      </Screen>
    );
  }
  if (!drug.data || !product.data || product.data.profileID !== drug.data.id) {
    return (
      <Screen safeBottom>
        <View style={styles.centerCopy}>
          <AppText variant="title" color={colors.ink}>
            This package record is unavailable.
          </AppText>
          <PrimaryButton label="Return to profile" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  return (
    <ProductEditor
      key={product.data.id}
      drug={drug.data}
      product={product.data}
      existingProducts={products.data?.map((item) => item.product) ?? []}
      initialImages={(images.data ?? []).map((image) => ({
        uri: image.uri,
        width: image.width,
        height: image.height,
      }))}
    />
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
  components: { borderRadius: radii.lg, padding: spacing.md, gap: spacing.lg },
  component: { gap: spacing.sm },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionCopy: { flex: 1, gap: 2 },
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
  removePhoto: {
    position: 'absolute',
    right: -4,
    top: -4,
    width: 34,
    height: 34,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noPhotos: {
    minHeight: 96,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  leaflet: {
    minHeight: 240,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 24,
  },
  error: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderRadius: radii.md },
  errorCopy: { flex: 1 },
});
