import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import {
  Newsreader_500Medium,
  Newsreader_600SemiBold,
  Newsreader_700Bold,
} from '@expo-google-fonts/newsreader';
import {
  NotoSansArabic_400Regular,
  NotoSansArabic_600SemiBold,
  NotoSansArabic_700Bold,
} from '@expo-google-fonts/noto-sans-arabic';
import { useFonts } from 'expo-font';
import { getLocales } from 'expo-localization';
import { Stack, usePathname, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, type PropsWithChildren } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppProviders } from '@/providers/AppProviders';
import { AppCrashBoundary } from '@/diagnostics/AppCrashBoundary';
import { translateCopy } from '@/localization/copy';
import { lightColors } from '@/ui/theme';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

function LoadingApp() {
  const language = getLocales()[0]?.languageCode === 'ar' ? 'ar' : 'en';
  return (
    <View
      style={styles.loading}
      accessibilityRole="progressbar"
      accessibilityLabel={translateCopy('Opening Renlyst', language)}
    >
      <ActivityIndicator color={lightColors.coral} />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    Newsreader_500Medium,
    Newsreader_600SemiBold,
    Newsreader_700Bold,
    NotoSansArabic_400Regular,
    NotoSansArabic_600SemiBold,
    NotoSansArabic_700Bold,
  });

  if (!fontsLoaded && !fontError) return <LoadingApp />;

  return <RootApp />;
}

function RootApp() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <AppCrashBoundary route={pathname} onReturnHome={() => router.replace('/(tabs)/today')}>
      <AppProviders fallback={<LoadingApp />}>
        <AppReady>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="capture"
              options={{ presentation: 'formSheet', sheetGrabberVisible: true }}
            />
            <Stack.Screen
              name="add"
              options={{ presentation: 'formSheet', sheetGrabberVisible: true }}
            />
            <Stack.Screen name="drug/[id]" options={{ presentation: 'card' }} />
          </Stack>
        </AppReady>
      </AppProviders>
    </AppCrashBoundary>
  );
}

function AppReady({ children }: PropsWithChildren) {
  useEffect(() => {
    void SplashScreen.hideAsync().catch(() => undefined);
  }, []);
  return children;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightColors.canvas,
  },
});
