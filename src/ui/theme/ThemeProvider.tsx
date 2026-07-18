import { createContext, useCallback, useContext, useMemo, type PropsWithChildren } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';
import { useColorScheme } from 'react-native';

import { settingKeys, SettingsRepository } from '@/data/repositories';
import { darkColors, lightColors, type ThemeColors } from './tokens';

export type ThemeMode = 'system' | 'light' | 'dark';

type ThemeContextValue = {
  colors: ThemeColors;
  isDark: boolean;
  mode: ThemeMode;
  setMode(mode: ThemeMode): void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const themeSettingQueryKey = ['settings', settingKeys.themeMode] as const;

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const db = useSQLiteContext();
  const queryClient = useQueryClient();
  const setting = useQuery({
    queryKey: themeSettingQueryKey,
    queryFn: () => new SettingsRepository(db).get<ThemeMode>(settingKeys.themeMode, 'system'),
  });
  const mode = setting.data ?? 'system';
  const setMode = useCallback(
    (value: ThemeMode) => {
      const previous = queryClient.getQueryData<ThemeMode>(themeSettingQueryKey) ?? mode;
      queryClient.setQueryData(themeSettingQueryKey, value);
      void new SettingsRepository(db)
        .set(settingKeys.themeMode, value)
        .catch(() => queryClient.setQueryData(themeSettingQueryKey, previous));
    },
    [db, mode, queryClient],
  );
  const isDark = mode === 'system' ? systemScheme === 'dark' : mode === 'dark';
  const value = useMemo<ThemeContextValue>(
    () => ({ colors: isDark ? darkColors : lightColors, isDark, mode, setMode }),
    [isDark, mode, setMode],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider.');
  return context;
}
