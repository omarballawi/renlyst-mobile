import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import type { ImagePickerAsset } from 'expo-image-picker';
import {
  ActivityIndicator,
  Image,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { useLocale } from '@/localization/LocaleProvider';
import { editorResizeActions } from '@/features/capture/imagePipeline';
import { AppText, PressableScale, PrimaryButton } from '@/ui/components';
import { useReducedMotion } from '@/ui/motion/useReducedMotion';
import { radii, spacing, useTheme } from '@/ui/theme';

type EditorTransform = { x: number; y: number; zoom: number };

function touchDistance(touches: readonly { pageX: number; pageY: number }[]): number {
  const [first, second] = touches;
  if (!first || !second) return 0;
  return Math.hypot(second.pageX - first.pageX, second.pageY - first.pageY);
}

export function ImageEditorModal({
  asset,
  onSave,
  onCancel,
}: {
  asset: ImagePickerAsset | null;
  onSave(asset: ImagePickerAsset): void;
  onCancel(): void;
}) {
  if (!asset) return null;
  return <ImageEditor key={asset.uri} asset={asset} onSave={onSave} onCancel={onCancel} />;
}

function ImageEditor({
  asset,
  onSave,
  onCancel,
}: {
  asset: ImagePickerAsset;
  onSave(asset: ImagePickerAsset): void;
  onCancel(): void;
}) {
  const { width: screenWidth } = useWindowDimensions();
  const { colors } = useTheme();
  const { t } = useLocale();
  const reducedMotion = useReducedMotion();
  const initialResizeActions = useMemo(
    () => editorResizeActions(asset.width, asset.height),
    [asset.height, asset.width],
  );
  const [source, setSource] = useState<ImagePickerAsset | null>(() =>
    initialResizeActions.length === 0 ? asset : null,
  );
  const [working, setWorking] = useState(initialResizeActions.length > 0);
  const [preparationError, setPreparationError] = useState<string | null>(null);
  const viewportWidth = Math.min(screenWidth - spacing.xl * 2, 520);
  const viewportHeight = viewportWidth * 0.75;
  const imageWidth = Math.max(1, source?.width ?? 1);
  const imageHeight = Math.max(1, source?.height ?? 1);
  const baseScale = Math.max(viewportWidth / imageWidth, viewportHeight / imageHeight);
  const [transform, setTransform] = useState<EditorTransform>({ x: 0, y: 0, zoom: 1 });
  const transformRef = useRef(transform);
  const gestureStart = useRef({ ...transform, distance: 0 });

  useEffect(() => {
    if (initialResizeActions.length === 0) return;
    let active = true;
    void manipulateAsync(asset.uri, initialResizeActions, {
      compress: 0.92,
      format: SaveFormat.JPEG,
    })
      .then((result) => {
        if (!active) return;
        setSource({ ...asset, uri: result.uri, width: result.width, height: result.height });
      })
      .catch(() => {
        if (active) setPreparationError('This photo could not be prepared safely. Choose another.');
      })
      .finally(() => {
        if (active) setWorking(false);
      });
    return () => {
      active = false;
    };
  }, [asset, initialResizeActions]);

  const constrain = useCallback(
    (x: number, y: number, scale: number) => {
      const maxX = Math.max(0, (imageWidth * baseScale * scale - viewportWidth) / 2);
      const maxY = Math.max(0, (imageHeight * baseScale * scale - viewportHeight) / 2);
      return {
        x: Math.min(maxX, Math.max(-maxX, x)),
        y: Math.min(maxY, Math.max(-maxY, y)),
      };
    },
    [baseScale, imageHeight, imageWidth, viewportHeight, viewportWidth],
  );

  const updateTransform = useCallback((next: EditorTransform) => {
    transformRef.current = next;
    setTransform(next);
  }, []);

  const panResponder = useMemo(
    () =>
      // PanResponder invokes these closures only for native touch events, never during render.
      // eslint-disable-next-line react-hooks/refs
      PanResponder.create({
        onStartShouldSetPanResponder: () => Boolean(source) && !working,
        onMoveShouldSetPanResponder: () => Boolean(source) && !working,
        onPanResponderGrant: (event) => {
          gestureStart.current = {
            ...transformRef.current,
            distance: touchDistance(event.nativeEvent.touches),
          };
        },
        onPanResponderMove: (event, gestureState) => {
          const distance = touchDistance(event.nativeEvent.touches);
          if (distance > 0 && gestureStart.current.distance === 0) {
            gestureStart.current = { ...transformRef.current, distance };
            return;
          }
          const start = gestureStart.current;
          const zoom =
            distance > 0 && start.distance > 0
              ? Math.min(4, Math.max(1, start.zoom * (distance / start.distance)))
              : start.zoom;
          const next = constrain(start.x + gestureState.dx, start.y + gestureState.dy, zoom);
          updateTransform({ ...next, zoom });
        },
      }),
    [constrain, source, updateTransform, working],
  );

  const resetTransform = () => {
    updateTransform({ x: 0, y: 0, zoom: 1 });
  };

  const rotate = async () => {
    if (!source || working) return;
    setWorking(true);
    try {
      const result = await manipulateAsync(source.uri, [{ rotate: 90 }], {
        compress: 1,
        format: SaveFormat.JPEG,
      });
      setSource({ ...source, uri: result.uri, width: result.width, height: result.height });
      resetTransform();
    } finally {
      setWorking(false);
    }
  };

  const adjustZoom = (delta: number) => {
    const current = transformRef.current;
    const zoom = Math.min(4, Math.max(1, current.zoom + delta));
    const next = constrain(current.x, current.y, zoom);
    updateTransform({ ...next, zoom });
  };

  const saveCrop = async () => {
    if (!source || working) return;
    setWorking(true);
    try {
      const current = transformRef.current;
      const displayScale = baseScale * current.zoom;
      const cropWidth = Math.min(imageWidth, viewportWidth / displayScale);
      const cropHeight = Math.min(imageHeight, viewportHeight / displayScale);
      const originX = Math.min(
        imageWidth - cropWidth,
        Math.max(
          0,
          (imageWidth * displayScale - viewportWidth) / (2 * displayScale) -
            current.x / displayScale,
        ),
      );
      const originY = Math.min(
        imageHeight - cropHeight,
        Math.max(
          0,
          (imageHeight * displayScale - viewportHeight) / (2 * displayScale) -
            current.y / displayScale,
        ),
      );
      const result = await manipulateAsync(
        source.uri,
        [
          {
            crop: {
              originX: Math.round(originX),
              originY: Math.round(originY),
              width: Math.max(1, Math.round(cropWidth)),
              height: Math.max(1, Math.round(cropHeight)),
            },
          },
        ],
        { compress: 0.96, format: SaveFormat.JPEG },
      );
      onSave({ ...source, uri: result.uri, width: result.width, height: result.height });
      resetTransform();
    } finally {
      setWorking(false);
    }
  };

  return (
    <Modal
      visible
      animationType={reducedMotion ? 'none' : 'slide'}
      presentationStyle="fullScreen"
      onRequestClose={onCancel}
    >
      <View style={[styles.screen, { backgroundColor: colors.ink }]}>
        <View style={styles.header}>
          <View>
            <AppText variant="label" color={colors.aqua}>
              PACKAGE PHOTO
            </AppText>
            <AppText variant="title" color={colors.canvas}>
              Frame the useful evidence.
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('Cancel photo edit')}
            onPress={onCancel}
            style={[styles.cancel, { borderColor: colors.mutedInk }]}
          >
            <AppText variant="bodyStrong" color={colors.canvas}>
              Cancel
            </AppText>
          </Pressable>
        </View>
        <AppText color={colors.canvas} style={styles.help}>
          Pinch to zoom, drag to position, or rotate in 90° steps. The bright frame is what will be
          saved.
        </AppText>

        <View
          style={[
            styles.stage,
            { width: viewportWidth, height: viewportHeight, backgroundColor: colors.surfaceStrong },
          ]}
        >
          {source ? (
            <View {...panResponder.panHandlers}>
              <Image
                source={{ uri: source.uri }}
                resizeMode="cover"
                style={{
                  width: imageWidth * baseScale,
                  height: imageHeight * baseScale,
                  transform: [
                    { translateX: transform.x },
                    { translateY: transform.y },
                    { scale: transform.zoom },
                  ],
                }}
                accessibilityLabel={t('Editable package photo')}
              />
            </View>
          ) : null}
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, styles.frame, { borderColor: colors.canvas }]}
          />
          {working ? (
            <View style={[StyleSheet.absoluteFill, styles.working]}>
              <ActivityIndicator color={colors.coral} />
            </View>
          ) : null}
        </View>

        {preparationError ? (
          <View accessibilityRole="alert" style={styles.preparationError}>
            <AppText color={colors.canvas}>{preparationError}</AppText>
          </View>
        ) : null}

        <View style={styles.controls}>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Zoom out"
            onPress={() => adjustZoom(-0.25)}
            style={[styles.control, { borderColor: colors.mutedInk }]}
          >
            <AppText variant="title" color={colors.canvas}>
              −
            </AppText>
            <AppText variant="caption" color={colors.canvas}>
              Zoom
            </AppText>
          </PressableScale>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Zoom in"
            onPress={() => adjustZoom(0.25)}
            style={[styles.control, { borderColor: colors.mutedInk }]}
          >
            <AppText variant="title" color={colors.canvas}>
              +
            </AppText>
            <AppText variant="caption" color={colors.canvas}>
              Zoom
            </AppText>
          </PressableScale>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Rotate photo clockwise"
            onPress={() => void rotate()}
            style={[styles.control, { borderColor: colors.mutedInk }]}
          >
            <AppText variant="title" color={colors.canvas}>
              ↻
            </AppText>
            <AppText variant="caption" color={colors.canvas}>
              Rotate
            </AppText>
          </PressableScale>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Reset photo position"
            onPress={resetTransform}
            style={[styles.control, { borderColor: colors.mutedInk }]}
          >
            <AppText variant="title" color={colors.canvas}>
              ⌂
            </AppText>
            <AppText variant="caption" color={colors.canvas}>
              Reset
            </AppText>
          </PressableScale>
        </View>
        <PrimaryButton
          label={working ? 'Preparing photo…' : 'Use this crop'}
          icon="check"
          disabled={working || !source}
          onPress={() => void saveCrop()}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: spacing.xl, paddingTop: 56, gap: spacing.xl },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  cancel: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  help: { opacity: 0.75 },
  stage: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: radii.lg,
  },
  frame: { borderWidth: 2, borderRadius: radii.lg },
  working: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20, 43, 70, 0.58)',
  },
  controls: { flexDirection: 'row', gap: spacing.xs },
  preparationError: { minHeight: 44, justifyContent: 'center' },
  control: {
    flex: 1,
    minHeight: 68,
    borderWidth: 1,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
