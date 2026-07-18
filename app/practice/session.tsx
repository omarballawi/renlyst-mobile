import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { ScrollView, StyleSheet, View } from 'react-native';

import { LearningRepository } from '@/data/repositories';
import {
  answerMatches,
  generatePracticeQuestions,
  isPracticeMode,
  type PracticeMode,
  type PracticeQuestion,
} from '@/domain/learning/practiceEngine';
import type { ReviewRating } from '@/domain/learning/reviewScheduler';
import { learningQueryKeys } from '@/features/learning/queries';
import { drugQueryKeys, useDrugList, usePrimaryImageUris } from '@/features/library/queries';
import { useCachedPracticePack } from '@/features/practice/queries';
import { useLocale } from '@/localization/LocaleProvider';
import {
  AppText,
  AppTextInput as TextInput,
  Icon,
  MotionReveal,
  PressableScale,
  PrimaryButton,
  Screen,
} from '@/ui/components';
import { fonts, radii, spacing, useTheme } from '@/ui/theme';
import { appHaptics } from '@/ui/feedback/haptics';

function RatingButton({
  label,
  color,
  onPress,
  disabled,
}: {
  label: ReviewRating;
  color: string;
  onPress(): void;
  disabled: boolean;
}) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={[styles.rating, { borderColor: color }]}
    >
      <AppText variant="bodyStrong" color={color}>
        {label}
      </AppText>
    </PressableScale>
  );
}

function resolvePracticeMode(value: string | undefined): PracticeMode {
  return value && isPracticeMode(value) ? value : 'Smart Session';
}

function PracticeSessionContent({
  mode,
  chapter,
  initialQuestions,
}: {
  mode: PracticeMode;
  chapter?: string;
  initialQuestions: PracticeQuestion[];
}) {
  const router = useRouter();
  const db = useSQLiteContext();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const { t } = useLocale();
  const [questions] = useState(initialQuestions);
  const [index, setIndex] = useState(0);
  const [response, setResponse] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [committed, setCommitted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [lastRating, setLastRating] = useState<ReviewRating | null>(null);
  const answerCommitInFlight = useRef(false);
  const completionInFlight = useRef(false);
  const advanceInFlight = useRef(false);
  const correctCountRef = useRef(0);
  const question = questions[index];

  const rate = useMutation({
    mutationFn: async ({ item, rating }: { item: PracticeQuestion; rating: ReviewRating }) => {
      if (!item.drugID) return null;
      return new LearningRepository(db).recordReview(
        item.drugID,
        rating,
        item.questionType,
        item.caseID,
      );
    },
    onSuccess: async (_, variables) => {
      setCommitted(true);
      advanceInFlight.current = false;
      if (variables.rating === 'Correct') {
        correctCountRef.current += 1;
        setCorrectCount(correctCountRef.current);
      }
      appHaptics.answerCommitted(variables.rating === 'Correct');
      await queryClient.invalidateQueries({ queryKey: drugQueryKeys.all });
    },
    onSettled: () => {
      answerCommitInFlight.current = false;
    },
  });

  const complete = useMutation({
    mutationFn: () =>
      new LearningRepository(db).recordCompletedSession({
        questionCount: questions.length,
        correctCount: correctCountRef.current,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: learningQueryKeys.all });
      appHaptics.sessionCompleted();
      setFinished(true);
    },
    onSettled: () => {
      completionInFlight.current = false;
    },
  });

  const commit = (rating: ReviewRating) => {
    if (!question || committed || rate.isPending || answerCommitInFlight.current) return;
    answerCommitInFlight.current = true;
    setLastRating(rating);
    rate.mutate({ item: question, rating });
  };

  const next = () => {
    if (index + 1 >= questions.length) {
      if (!complete.isPending && !completionInFlight.current) {
        completionInFlight.current = true;
        complete.mutate();
      }
      return;
    }
    if (advanceInFlight.current) return;
    advanceInFlight.current = true;
    setIndex((value) => value + 1);
    setResponse('');
    setRevealed(false);
    setCommitted(false);
    setLastRating(null);
    rate.reset();
  };

  const submitTyped = () => {
    if (!question || !response.trim() || revealed || answerCommitInFlight.current) return;
    setRevealed(true);
    commit(answerMatches(question, response) ? 'Correct' : 'Wrong');
  };

  if (questions.length === 0) {
    return (
      <Screen safeBottom>
        <View style={styles.empty}>
          <AppText variant="title" color={colors.ink}>
            This mode needs more saved evidence.
          </AppText>
          <AppText color={colors.mutedInk}>
            {mode === 'Image Quiz'
              ? 'Add a package photo to a known profile, then try Image Quiz again.'
              : `No eligible known profiles match this mode${chapter ? ` in ${chapter}` : ''}.`}
          </AppText>
          <PrimaryButton label="Return to Practice" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  if (finished) {
    return (
      <Screen safeBottom>
        <View style={styles.finished}>
          <View style={[styles.finishIcon, { backgroundColor: colors.aquaSoft }]}>
            <Icon name="check" color={colors.aqua} size={32} />
          </View>
          <AppText variant="display" color={colors.ink}>
            Five complete.
          </AppText>
          <AppText color={colors.mutedInk} style={styles.finishCopy}>
            {correctCount} correct · {questions.length - correctCount} to revisit. Your review
            dates, field mastery, streak, and daily mission are updated locally.
          </AppText>
          <PrimaryButton
            label="Back to Practice"
            icon="practice"
            onPress={() => router.replace('/(tabs)/practice')}
          />
        </View>
      </Screen>
    );
  }

  if (!question) {
    return (
      <Screen safeBottom>
        <View style={styles.empty}>
          <View style={[styles.finishIcon, { backgroundColor: colors.saffronSoft }]}>
            <Icon name="warning" color={colors.saffron} size={28} />
          </View>
          <AppText variant="title" color={colors.ink}>
            No grounded questions yet.
          </AppText>
          <AppText color={colors.mutedInk}>
            {mode === 'Image Quiz'
              ? 'Add a package photo to a known profile, then return to Image Quiz.'
              : mode === 'System Practice'
                ? 'Add a known drug in this system before starting its focused five.'
                : 'Capture a known drug with enough saved facts, then return for a grounded five.'}
          </AppText>
          <PrimaryButton label="Return to Practice" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }
  return (
    <Screen safeBottom>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <View style={styles.sessionHeader}>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Close practice session"
            onPress={() => router.back()}
            style={[styles.close, { borderColor: colors.line }]}
          >
            <AppText variant="heading" color={colors.ink}>
              ×
            </AppText>
          </PressableScale>
          <View style={styles.progressCopy}>
            <AppText variant="label" color={colors.aqua}>
              {mode.toLocaleUpperCase()}
            </AppText>
            <AppText variant="caption" color={colors.mutedInk}>
              Question {index + 1} of {questions.length} · {question.difficulty}
            </AppText>
          </View>
        </View>
        <View style={styles.progressTrack}>
          {Array.from({ length: questions.length }, (_, itemIndex) => (
            <View
              key={itemIndex}
              style={[
                styles.progressSegment,
                { backgroundColor: itemIndex <= index ? colors.coral : colors.line },
              ]}
            />
          ))}
        </View>

        <MotionReveal key={question.id} direction="forward" style={styles.questionStage}>
          {question.imageUri ? (
            <Image
              source={question.imageUri}
              style={styles.questionImage}
              contentFit="contain"
              accessibilityLabel={t('Medicine package for this question')}
            />
          ) : null}
          <View style={styles.questionCopy}>
            <AppText variant="label" color={colors.mutedInk}>
              {question.learningObjective.toLocaleUpperCase()}
            </AppText>
            <AppText variant="title" color={colors.ink}>
              {question.prompt}
            </AppText>
          </View>

          {question.interaction === 'multipleChoice' ? (
            <View style={styles.choices}>
              {question.choices.map((choice) => (
                <PressableScale
                  key={choice}
                  accessibilityRole="button"
                  disabled={revealed || committed || rate.isPending}
                  onPress={() => {
                    setResponse(choice);
                    setRevealed(true);
                    commit(answerMatches(question, choice) ? 'Correct' : 'Wrong');
                  }}
                  style={[
                    styles.choice,
                    {
                      borderColor: response === choice ? colors.coral : colors.line,
                      backgroundColor: colors.surface,
                    },
                  ]}
                >
                  <AppText variant="bodyStrong" color={colors.ink}>
                    {choice}
                  </AppText>
                </PressableScale>
              ))}
            </View>
          ) : question.interaction === 'textEntry' ? (
            <View style={styles.answerArea}>
              <AppText variant="bodyStrong" color={colors.ink}>
                Your answer
              </AppText>
              <TextInput
                accessibilityLabel="Your answer"
                value={response}
                onChangeText={setResponse}
                editable={!revealed && !committed && !rate.isPending}
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={submitTyped}
                style={[
                  styles.answerInput,
                  {
                    color: colors.ink,
                    borderColor: colors.line,
                    backgroundColor: colors.surface,
                  },
                ]}
              />
              {!revealed ? (
                <PrimaryButton
                  label="Check answer"
                  disabled={!response.trim()}
                  onPress={submitTyped}
                />
              ) : null}
            </View>
          ) : (
            <View style={styles.answerArea}>
              {!revealed ? (
                <PrimaryButton label="Reveal saved answer" onPress={() => setRevealed(true)} />
              ) : null}
            </View>
          )}

          {revealed ? (
            <MotionReveal direction="up">
              <View
                style={[styles.reveal, { backgroundColor: colors.aquaSoft }]}
                accessibilityLiveRegion="polite"
              >
                <AppText variant="label" color={colors.aqua}>
                  SAVED ANSWER
                </AppText>
                <AppText variant="heading" color={colors.ink}>
                  {question.correctAnswer}
                </AppText>
                <AppText color={colors.mutedInk}>{question.explanation}</AppText>
              </View>
            </MotionReveal>
          ) : null}

          {revealed && question.interaction === 'recall' && !committed ? (
            <View style={styles.ratings}>
              <RatingButton
                label="Wrong"
                color={colors.danger}
                disabled={rate.isPending}
                onPress={() => commit('Wrong')}
              />
              <RatingButton
                label="Partly correct"
                color={colors.saffron}
                disabled={rate.isPending}
                onPress={() => commit('Partly correct')}
              />
              <RatingButton
                label="Correct"
                color={colors.success}
                disabled={rate.isPending}
                onPress={() => commit('Correct')}
              />
            </View>
          ) : null}
          {committed ? (
            <PrimaryButton
              label={
                index === questions.length - 1
                  ? complete.isPending
                    ? 'Saving progress…'
                    : 'Finish session'
                  : 'Next question'
              }
              icon="arrow"
              disabled={complete.isPending}
              onPress={next}
            />
          ) : null}
        </MotionReveal>
        {rate.error ? (
          <MotionReveal direction="up">
            <View
              accessibilityRole="alert"
              style={[styles.error, { backgroundColor: colors.saffronSoft }]}
            >
              <AppText variant="bodyStrong" color={colors.ink}>
                Your answer is still here.
              </AppText>
              <AppText color={colors.mutedInk}>
                Renlyst could not save this review. Retry without leaving the session.
              </AppText>
              <PressableScale
                accessibilityRole="button"
                disabled={rate.isPending || !lastRating}
                onPress={() => {
                  if (lastRating) commit(lastRating);
                }}
              >
                <AppText variant="bodyStrong" color={colors.coral}>
                  Try saving answer again
                </AppText>
              </PressableScale>
            </View>
          </MotionReveal>
        ) : null}
        {complete.error ? (
          <View
            accessibilityRole="alert"
            style={[styles.error, { backgroundColor: colors.saffronSoft }]}
          >
            <AppText color={colors.ink}>
              {complete.error instanceof Error
                ? complete.error.message
                : 'Session progress could not be saved.'}
            </AppText>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

export default function PracticeSessionScreen() {
  const params = useLocalSearchParams<{
    mode?: string;
    chapter?: string;
    pack?: string;
    drug?: string;
  }>();
  const mode = resolvePracticeMode(params.mode);
  const router = useRouter();
  const { colors } = useTheme();
  const drugs = useDrugList({ sort: 'mastery' });
  const images = usePrimaryImageUris();
  const cachedPack = useCachedPracticePack(params.pack);

  if (drugs.isLoading || images.isLoading || (params.pack && cachedPack.isLoading)) {
    return (
      <Screen>
        <View style={styles.center}>
          <AppText color={colors.mutedInk}>Preparing five questions…</AppText>
        </View>
      </Screen>
    );
  }

  if (
    drugs.error ||
    images.error ||
    !drugs.data ||
    !images.data ||
    (params.pack && !cachedPack.data)
  ) {
    const error = drugs.error ?? images.error ?? cachedPack.error;
    return (
      <Screen safeBottom>
        <View style={styles.empty}>
          <AppText variant="title" color={colors.ink}>
            The session could not be prepared.
          </AppText>
          <AppText color={colors.mutedInk}>
            {error instanceof Error
              ? error.message
              : params.pack
                ? 'This saved pack expired after the library changed. Refresh it from Practice.'
                : 'Try opening Practice again.'}
          </AppText>
          <PrimaryButton label="Return to Practice" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  const initialQuestions = params.pack
    ? (cachedPack.data?.questions ?? [])
    : generatePracticeQuestions({
        mode,
        drugs: params.drug
          ? drugs.data.filter((candidate) => candidate.id === params.drug)
          : drugs.data,
        imageUris: images.data,
        ...(params.chapter ? { chapter: params.chapter } : {}),
      });
  return (
    <PracticeSessionContent
      key={`${mode}:${params.chapter ?? 'all'}:${params.drug ?? 'all'}:${params.pack ?? 'generated'}`}
      mode={mode}
      initialQuestions={initialQuestions}
      {...(params.chapter ? { chapter: params.chapter } : {})}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.lg },
  content: { padding: spacing.lg, paddingBottom: spacing.section, gap: spacing.xl },
  questionStage: { gap: spacing.xl },
  sessionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  close: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCopy: { flex: 1 },
  progressTrack: { flexDirection: 'row', gap: spacing.xxs },
  progressSegment: { flex: 1, height: 5, borderRadius: radii.pill },
  questionImage: { width: '100%', height: 230, borderRadius: radii.lg },
  questionCopy: { gap: spacing.sm },
  choices: { gap: spacing.sm },
  choice: {
    minHeight: 58,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  answerArea: { gap: spacing.sm },
  answerInput: {
    minHeight: 54,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    fontFamily: fonts.body,
    fontSize: 16,
  },
  reveal: { borderRadius: radii.lg, padding: spacing.lg, gap: spacing.xs },
  ratings: { gap: spacing.xs },
  rating: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: { padding: spacing.md, borderRadius: radii.md },
  finished: { flex: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.lg },
  finishIcon: {
    width: 72,
    height: 72,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishCopy: { maxWidth: 420 },
});
