import { Suspense, useState, type PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DatabaseProvider } from '@/data/database';
import { LocaleProvider } from '@/localization/LocaleProvider';
import { FeedbackProvider } from '@/ui/feedback/FeedbackProvider';
import { ThemeProvider } from '@/ui/theme';

type AppProvidersProps = PropsWithChildren<{ fallback: React.ReactNode }>;

export function AppProviders({ children, fallback }: AppProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 15_000, retry: 1 },
          mutations: { retry: 0 },
        },
      }),
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <Suspense fallback={fallback}>
            <DatabaseProvider>
              <ThemeProvider>
                <LocaleProvider>
                  <FeedbackProvider>{children}</FeedbackProvider>
                </LocaleProvider>
              </ThemeProvider>
            </DatabaseProvider>
          </Suspense>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
