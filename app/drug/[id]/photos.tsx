import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { CaptureService, type CaptureImageAsset } from '@/features/capture/captureService';
import { ImageEditorModal } from '@/features/capture/ImageEditorModal';
import { drugQueryKeys, useDrug, useDrugImageSources } from '@/features/library/queries';
import { useLocale } from '@/localization/LocaleProvider';
import { AppText, Icon, PressableScale, PrimaryButton, Screen } from '@/ui/components';
import { radii, spacing, useTheme } from '@/ui/theme';

export default function DrugPhotosScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const db = useSQLiteContext();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const { t } = useLocale();
  const drug = useDrug(id);
  const stored = useDrugImageSources(id);
  const [assets, setAssets] = useState<CaptureImageAsset[] | null>(null);
  const [editQueue, setEditQueue] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [error, setError] = useState<string | null>(null);
  const current = assets ?? stored.data ?? [];

  const save = useMutation({
    mutationFn: async () => {
      if (!drug.data) throw new Error('The profile is no longer available.');
      await new CaptureService(db).replaceDrug(drug.data, current);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: drugQueryKeys.all });
      router.back();
    },
    onError: (reason) =>
      setError(reason instanceof Error ? reason.message : 'Profile photos could not be saved.'),
  });

  const queueForEditing = (incoming: ImagePicker.ImagePickerAsset[]) => {
    setEditQueue((queue) => [...queue, ...incoming].slice(0, 8 - current.length));
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
      selectionLimit: Math.max(1, 8 - current.length),
      quality: 1,
      orderedSelection: true,
    });
    if (!result.canceled) queueForEditing(result.assets);
  };
  const remove = (index: number) => {
    setAssets(current.filter((_, assetIndex) => assetIndex !== index));
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Cancel photo editing"
          onPress={() => router.back()}
          style={[styles.back, { borderColor: colors.line }]}
        >
          <AppText variant="bodyStrong" color={colors.ink}>
            Cancel
          </AppText>
        </PressableScale>
        <View style={styles.header}>
          <AppText variant="label" color={colors.aqua}>
            PROFILE EVIDENCE
          </AppText>
          <AppText variant="display" color={colors.ink}>
            Package photos
          </AppText>
          <AppText color={colors.mutedInk}>
            Keep up to eight views for {drug.data?.scientificName || 'this profile'}. Brand-specific
            packages belong in their separate brand record.
          </AppText>
        </View>

        <View style={styles.actions}>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Take package photo"
            disabled={current.length >= 8}
            onPress={() => void openCamera()}
            style={[styles.action, { backgroundColor: colors.ink }]}
          >
            <Icon name="camera" color={colors.canvas} size={20} />
            <AppText variant="bodyStrong" color={colors.canvas}>
              Camera
            </AppText>
          </PressableScale>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Choose package photos"
            disabled={current.length >= 8}
            onPress={() => void openLibrary()}
            style={[styles.action, { borderColor: colors.line, backgroundColor: colors.surface }]}
          >
            <Icon name="photos" color={colors.aqua} size={20} />
            <AppText variant="bodyStrong" color={colors.ink}>
              Library
            </AppText>
          </PressableScale>
        </View>

        <View style={styles.gallery}>
          {current.map((asset, index) => (
            <View
              key={`${asset.uri}-${index}`}
              style={[styles.photo, { borderColor: colors.line }]}
            >
              <Image
                source={asset.uri}
                style={styles.image}
                contentFit="cover"
                accessibilityLabel={t(`Package photo ${index + 1}`)}
              />
              <View style={styles.photoFooter}>
                <AppText variant="caption" color={colors.mutedInk}>
                  {index === 0 ? 'Primary' : `View ${index + 1}`}
                </AppText>
                <PressableScale
                  accessibilityRole="button"
                  accessibilityLabel={`Remove package photo ${index + 1}`}
                  onPress={() => remove(index)}
                  style={[styles.remove, { borderColor: colors.danger }]}
                >
                  <AppText variant="caption" color={colors.danger}>
                    Remove
                  </AppText>
                </PressableScale>
              </View>
            </View>
          ))}
        </View>
        {!stored.isLoading && current.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: colors.surfaceStrong }]}>
            <Icon name="image" color={colors.mutedInk} />
            <AppText variant="bodyStrong" color={colors.ink}>
              No profile-level photo
            </AppText>
            <AppText variant="caption" color={colors.mutedInk}>
              This is valid for imported profiles. Add evidence only when you have the package.
            </AppText>
          </View>
        ) : null}
        {error ? (
          <View
            accessibilityRole="alert"
            style={[styles.error, { backgroundColor: colors.saffronSoft }]}
          >
            <AppText color={colors.ink}>{error}</AppText>
          </View>
        ) : null}
        <PrimaryButton
          label={save.isPending ? 'Saving photos…' : 'Save photos'}
          icon="check"
          disabled={stored.isLoading || save.isPending}
          onPress={() => save.mutate()}
        />
      </ScrollView>
      <ImageEditorModal
        asset={editQueue[0] ?? null}
        onCancel={() => setEditQueue((queue) => queue.slice(1))}
        onSave={(asset) => {
          setAssets([...current, asset].slice(0, 8));
          setEditQueue((queue) => queue.slice(1));
        }}
      />
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
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: {
    flex: 1,
    minHeight: 54,
    borderWidth: 1,
    borderRadius: radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  gallery: { gap: spacing.md },
  photo: { borderWidth: 1, borderRadius: radii.lg, overflow: 'hidden' },
  image: { width: '100%', aspectRatio: 4 / 3 },
  photoFooter: {
    minHeight: 56,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  remove: {
    minHeight: 38,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { borderRadius: radii.lg, padding: spacing.xl, alignItems: 'center', gap: spacing.xs },
  error: { padding: spacing.md, borderRadius: radii.md },
});
