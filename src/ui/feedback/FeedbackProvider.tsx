import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { setAudioModeAsync, useAudioPlayer, type AudioPlayer } from 'expo-audio';
import { useSQLiteContext } from 'expo-sqlite';

import {
  defaultFeedbackPreferences,
  settingKeys,
  SettingsRepository,
  type FeedbackPreferences,
} from '@/data/repositories';
import { appHaptics } from '@/ui/feedback/haptics';

type FeedbackContextValue = {
  preferences: FeedbackPreferences;
  setPreferences(preferences: FeedbackPreferences): Promise<void>;
  captureSaved(): void;
  profileGenerated(): void;
  backupCompleted(): void;
  answerCommitted(correct: boolean): void;
  sessionCompleted(): void;
  destructiveConfirmed(): void;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

function play(player: AudioPlayer): void {
  player.volume = 0.28;
  void player
    .seekTo(0)
    .then(() => player.play())
    .catch(() => undefined);
}

export function FeedbackProvider({ children }: PropsWithChildren) {
  const db = useSQLiteContext();
  const [preferences, setLocalPreferences] = useState(defaultFeedbackPreferences);
  const successPlayer = useAudioPlayer(require('../../../assets/audio/success.wav'));
  const incorrectPlayer = useAudioPlayer(require('../../../assets/audio/incorrect.wav'));
  const completionPlayer = useAudioPlayer(require('../../../assets/audio/completion.wav'));

  useEffect(() => {
    let active = true;
    void new SettingsRepository(db)
      .get<FeedbackPreferences>(settingKeys.feedbackPreferences, defaultFeedbackPreferences)
      .then((stored) => {
        if (active) setLocalPreferences({ ...defaultFeedbackPreferences, ...stored });
      });
    void setAudioModeAsync({
      playsInSilentMode: false,
      interruptionMode: 'mixWithOthers',
      allowsRecording: false,
      shouldPlayInBackground: false,
      shouldRouteThroughEarpiece: false,
      allowsBackgroundRecording: false,
    }).catch(() => undefined);
    return () => {
      active = false;
    };
  }, [db]);

  const setPreferences = useCallback(
    async (next: FeedbackPreferences) => {
      setLocalPreferences(next);
      await new SettingsRepository(db).set(settingKeys.feedbackPreferences, next);
    },
    [db],
  );

  const success = useCallback(() => {
    if (preferences.hapticsEnabled) appHaptics.captureSaved();
    if (preferences.soundEffectsEnabled) play(successPlayer);
  }, [preferences, successPlayer]);

  const value = useMemo<FeedbackContextValue>(
    () => ({
      preferences,
      setPreferences,
      captureSaved: success,
      profileGenerated: success,
      backupCompleted: success,
      answerCommitted(correct) {
        if (preferences.hapticsEnabled) appHaptics.answerCommitted(correct);
        if (preferences.soundEffectsEnabled) play(correct ? successPlayer : incorrectPlayer);
      },
      sessionCompleted() {
        if (preferences.hapticsEnabled) appHaptics.sessionCompleted();
        if (preferences.soundEffectsEnabled) play(completionPlayer);
      },
      destructiveConfirmed() {
        if (preferences.hapticsEnabled) appHaptics.destructiveConfirmed();
      },
    }),
    [completionPlayer, incorrectPlayer, preferences, setPreferences, success, successPlayer],
  );

  return <FeedbackContext.Provider value={value}>{children}</FeedbackContext.Provider>;
}

export function useFeedback(): FeedbackContextValue {
  const value = useContext(FeedbackContext);
  if (!value) throw new Error('useFeedback must be used inside FeedbackProvider.');
  return value;
}
