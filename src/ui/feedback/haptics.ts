import * as Haptics from 'expo-haptics';

function run(effect: () => Promise<void>): void {
  if (process.env.EXPO_OS === 'web') return;
  void effect().catch(() => undefined);
}

export const appHaptics = {
  captureSaved(): void {
    run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  },
  answerCommitted(correct: boolean): void {
    run(() =>
      correct
        ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
    );
  },
  sessionCompleted(): void {
    run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  },
  destructiveConfirmed(): void {
    run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
  },
};
