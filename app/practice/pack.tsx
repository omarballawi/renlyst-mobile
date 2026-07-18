import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { ScrollView, StyleSheet, View } from 'react-native';

import {
  defaultProviderConfiguration,
  ProviderCredentialStore,
  settingKeys,
  SettingsRepository,
  type ProviderConfiguration,
} from '@/data/repositories';
import { useDrugList, usePrimaryImageUris } from '@/features/library/queries';
import {
  practiceQueryKeys,
  useCachedPracticePack,
  usePracticeRepository,
} from '@/features/practice/queries';
import { generateDeepSeekPracticePack } from '@/services/providers/providerClients';
import {
  AppText,
  DrugThumbnail,
  EmptyState,
  Icon,
  PressableScale,
  PrimaryButton,
  Screen,
} from '@/ui/components';
import { radii, spacing, useTheme } from '@/ui/theme';

export default function CachedPracticePackScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const repository = usePracticeRepository();
  const pack = useCachedPracticePack();
  const drugs = useDrugList({ scope: 'all', sort: 'mastery' });
  const primaryImages = usePrimaryImageUris();
  const [providerMessage, setProviderMessage] = useState<string | null>(null);

  const refresh = useMutation({
    mutationFn: async () => {
      const [configuration, apiKey] = await Promise.all([
        new SettingsRepository(db).get<ProviderConfiguration>(
          settingKeys.providerConfiguration,
          defaultProviderConfiguration,
        ),
        ProviderCredentialStore.get('deepSeek'),
      ]);
      const result = await generateDeepSeekPracticePack({
        drugs: drugs.data ?? [],
        apiKey,
        model: configuration.deepSeekModel || defaultProviderConfiguration.deepSeekModel,
      });
      const saved = await repository.savePack(result.questions, drugs.data ?? []);
      return { saved, result };
    },
    onSuccess: ({ saved, result }) => {
      queryClient.setQueryData(practiceQueryKeys.pack(), saved);
      setProviderMessage(
        result.warning ??
          (result.source === 'deepSeek'
            ? 'DeepSeek created a grounded pack; it is now cached for offline practice.'
            : 'No DeepSeek key is configured, so Renlyst saved a local grounded five.'),
      );
    },
  });
  const available = (drugs.data?.filter((drug) => !drug.isUnknown).length ?? 0) > 0;
  const generatedAt = pack.data ? new Date(pack.data.generatedAt) : null;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Back to Practice"
          onPress={() => router.back()}
          style={[styles.back, { borderColor: colors.line }]}
        >
          <AppText variant="bodyStrong" color={colors.ink}>
            Back
          </AppText>
        </PressableScale>
        <View style={styles.header}>
          <AppText variant="label" color={colors.coral}>
            SAVED ON THIS DEVICE
          </AppText>
          <AppText variant="display" color={colors.ink}>
            Offline five
          </AppText>
          <AppText color={colors.mutedInk}>
            A grounded five-question pack stays available without a connection until the library
            changes or you refresh it.
          </AppText>
        </View>

        {pack.data ? (
          <>
            <View style={[styles.status, { backgroundColor: colors.aquaSoft }]}>
              <Icon name="check" color={colors.aqua} />
              <View style={styles.statusCopy}>
                <AppText variant="bodyStrong" color={colors.ink}>
                  Five questions ready offline
                </AppText>
                <AppText variant="caption" color={colors.mutedInk}>
                  {generatedAt && !Number.isNaN(generatedAt.valueOf())
                    ? `Saved ${formatDistanceToNow(generatedAt, { addSuffix: true })}`
                    : 'Saved on this device'}
                </AppText>
              </View>
            </View>
            <View style={styles.questionList}>
              {pack.data.questions.map((question, index) => (
                <View
                  key={question.id}
                  style={[styles.question, { borderBottomColor: colors.line }]}
                >
                  <DrugThumbnail
                    id={question.drugID ?? question.id}
                    name={question.drugName}
                    uri={
                      question.imageUri ||
                      (question.drugID ? primaryImages.data?.[question.drugID] : null)
                    }
                    size={44}
                    unknown={!question.drugID}
                  />
                  <View style={styles.questionCopy}>
                    <AppText variant="label" color={colors.aqua}>
                      {index + 1} · {question.difficulty.toLocaleUpperCase()}
                    </AppText>
                    <AppText color={colors.ink}>{question.prompt}</AppText>
                  </View>
                </View>
              ))}
            </View>
            <PrimaryButton
              label="Start saved five"
              icon="practice"
              onPress={() =>
                router.push('/practice/session?mode=Smart%20Session&pack=ai-practice-pack-v1')
              }
            />
          </>
        ) : !pack.isLoading ? (
          <EmptyState
            icon="database"
            title="No offline pack yet"
            body="Create a grounded five from the facts already saved in your library."
          />
        ) : null}

        {refresh.error ? (
          <View
            accessibilityRole="alert"
            style={[styles.error, { backgroundColor: colors.saffronSoft }]}
          >
            <AppText color={colors.ink}>
              {refresh.error instanceof Error
                ? refresh.error.message
                : 'The pack could not be saved.'}
            </AppText>
          </View>
        ) : null}
        {providerMessage ? (
          <View
            accessibilityLiveRegion="polite"
            style={[
              styles.error,
              {
                backgroundColor: providerMessage.includes('unavailable')
                  ? colors.saffronSoft
                  : colors.aquaSoft,
              },
            ]}
          >
            <AppText color={colors.ink}>{providerMessage}</AppText>
          </View>
        ) : null}
        <PrimaryButton
          label={
            refresh.isPending
              ? 'Building five…'
              : pack.data
                ? 'Refresh saved five'
                : 'Create saved five'
          }
          icon="database"
          disabled={refresh.isPending || !available}
          onPress={() => refresh.mutate()}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.section, gap: spacing.xl },
  back: {
    alignSelf: 'flex-start',
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderRadius: radii.pill,
    justifyContent: 'center',
  },
  header: { gap: spacing.xs },
  status: { borderRadius: radii.lg, padding: spacing.md, flexDirection: 'row', gap: spacing.sm },
  statusCopy: { flex: 1, gap: 2 },
  questionList: { gap: 0 },
  question: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  questionCopy: { flex: 1, flexShrink: 1, minWidth: 0, gap: spacing.xs },
  error: { padding: spacing.md, borderRadius: radii.md },
});
