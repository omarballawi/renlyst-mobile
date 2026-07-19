import type { ErrorInfo, PropsWithChildren } from 'react';
import { Component, useState } from 'react';
import Constants from 'expo-constants';
import * as Clipboard from 'expo-clipboard';
import { getLocales } from 'expo-localization';
import * as SplashScreen from 'expo-splash-screen';
import { Linking, Platform, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';

import {
  createCrashDiagnostic,
  formatCrashDiagnostic,
  type CrashDiagnostic,
} from './diagnosticReport';
import { saveCrashDiagnostic } from './diagnosticStore';
import { translateCopy } from '@/localization/copy';
import { darkColors, lightColors, radii, spacing } from '@/ui/theme';

type AppCrashBoundaryProps = PropsWithChildren<{
  route: string | null;
  onReturnHome(): void;
}>;

type AppCrashBoundaryState = {
  report: CrashDiagnostic | null;
  attempt: number;
};

const issueURL = 'https://github.com/omarballawi/renlyst-mobile/issues/new?template=bug_report.yml';

export class AppCrashBoundary extends Component<AppCrashBoundaryProps, AppCrashBoundaryState> {
  override state: AppCrashBoundaryState = { report: null, attempt: 0 };

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    void SplashScreen.hideAsync().catch(() => undefined);
    const report = createCrashDiagnostic({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      appVersion: Constants.expoConfig?.version ?? 'unknown',
      buildVersion:
        Constants.nativeBuildVersion ??
        Constants.expoConfig?.ios?.buildNumber ??
        String(Constants.expoConfig?.android?.versionCode ?? 'unknown'),
      platform: Platform.OS,
      route: this.props.route,
      error,
      componentStack: errorInfo.componentStack ?? null,
    });

    void Promise.resolve().then(() => saveCrashDiagnostic(report));
    this.setState({ report });
  }

  private retry = () => {
    this.setState((state) => ({ report: null, attempt: state.attempt + 1 }));
  };

  private returnHome = () => {
    this.setState((state) => ({ report: null, attempt: state.attempt + 1 }));
    this.props.onReturnHome();
  };

  override render() {
    if (this.state.report) {
      return (
        <CrashRecovery
          report={this.state.report}
          onRetry={this.retry}
          onReturnHome={this.returnHome}
        />
      );
    }

    return (
      <View key={this.state.attempt} style={styles.flex}>
        {this.props.children}
      </View>
    );
  }
}

type CrashRecoveryProps = {
  report: CrashDiagnostic;
  onRetry(): void;
  onReturnHome(): void;
};

function CrashRecovery({ report, onRetry, onReturnHome }: CrashRecoveryProps) {
  const isDark = useColorScheme() === 'dark';
  const colors = isDark ? darkColors : lightColors;
  const [copied, setCopied] = useState(false);
  const language = getLocales()[0]?.languageCode === 'ar' ? 'ar' : 'en';
  const isRTL = language === 'ar';
  const t = (copy: string) => translateCopy(copy, language);

  const copyDiagnostics = () => {
    void Clipboard.setStringAsync(formatCrashDiagnostic(report))
      .then(() => setCopied(true))
      .catch(() => setCopied(false));
  };

  const openBugReport = () => {
    void Linking.openURL(issueURL).catch(() => undefined);
  };

  return (
    <View
      style={[
        styles.recovery,
        { backgroundColor: colors.canvas, direction: isRTL ? 'rtl' : 'ltr' },
      ]}
    >
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
        <Text style={[styles.eyebrow, isRTL && styles.rtlEyebrow, { color: colors.coral }]}>
          {t('RENLYST RECOVERY')}
        </Text>
        <Text
          accessibilityRole="header"
          style={[styles.title, isRTL && styles.rtlTitle, { color: colors.ink }]}
        >
          {t('Let’s get you back to learning.')}
        </Text>
        <Text style={[styles.body, isRTL && styles.rtlBody, { color: colors.mutedInk }]}>
          {t(
            'Renlyst hit an unexpected interface error. Your library, images, and private learning records were not included in the diagnostic report.',
          )}
        </Text>
        <View style={styles.actions}>
          <RecoveryButton
            label={t('Try again')}
            onPress={onRetry}
            primary
            colors={colors}
            isRTL={isRTL}
          />
          <RecoveryButton
            label={t('Return home')}
            onPress={onReturnHome}
            colors={colors}
            isRTL={isRTL}
          />
          <RecoveryButton
            label={copied ? t('Diagnostics copied') : t('Copy diagnostics')}
            onPress={copyDiagnostics}
            colors={colors}
            isRTL={isRTL}
          />
          <RecoveryButton
            label={t('Report a bug')}
            onPress={openBugReport}
            colors={colors}
            isRTL={isRTL}
          />
        </View>
      </View>
    </View>
  );
}

function RecoveryButton({
  label,
  onPress,
  primary = false,
  colors,
  isRTL,
}: {
  label: string;
  onPress(): void;
  primary?: boolean;
  colors: typeof lightColors;
  isRTL: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: primary ? colors.coral : colors.surfaceStrong,
          opacity: pressed ? 0.86 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.buttonLabel,
          isRTL && styles.rtlButtonLabel,
          { color: primary ? colors.coralText : colors.ink },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  recovery: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  card: {
    width: '100%',
    maxWidth: 520,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.xl,
    gap: spacing.md,
  },
  eyebrow: { fontFamily: 'Manrope_800ExtraBold', fontSize: 12, letterSpacing: 1.1 },
  title: {
    fontFamily: 'Newsreader_600SemiBold',
    fontSize: 31,
    lineHeight: 36,
    letterSpacing: -0.4,
  },
  body: { fontFamily: 'Manrope_400Regular', fontSize: 16, lineHeight: 24 },
  rtlEyebrow: {
    textAlign: 'right',
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_700Bold',
    lineHeight: 24,
    letterSpacing: 0,
  },
  rtlTitle: {
    textAlign: 'right',
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_700Bold',
    lineHeight: 46,
    letterSpacing: 0,
  },
  rtlBody: {
    textAlign: 'right',
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_400Regular',
    lineHeight: 31,
  },
  actions: { gap: spacing.sm, marginTop: spacing.xs },
  button: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
  },
  buttonLabel: { fontFamily: 'Manrope_700Bold', fontSize: 15, lineHeight: 20 },
  rtlButtonLabel: {
    fontFamily: 'NotoSansArabic_700Bold',
    lineHeight: 28,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
});
