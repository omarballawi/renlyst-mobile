import { createContext, useCallback, useContext, useMemo, type PropsWithChildren } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getLocales } from 'expo-localization';
import { useSQLiteContext } from 'expo-sqlite';
import { View } from 'react-native';

import { settingKeys, SettingsRepository } from '@/data/repositories';
import { translateCopy } from './copy';

export type AppLanguage = 'en' | 'ar';

type LocaleContextValue = {
  language: AppLanguage;
  isRTL: boolean;
  setLanguage(language: AppLanguage): void;
  t(value: string): string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);
const languageSettingQueryKey = ['settings', settingKeys.language] as const;

function deviceLanguage(): AppLanguage {
  return getLocales()[0]?.languageCode === 'ar' ? 'ar' : 'en';
}

export function LocaleProvider({ children }: PropsWithChildren) {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();
  const setting = useQuery({
    queryKey: languageSettingQueryKey,
    queryFn: () =>
      new SettingsRepository(db).get<AppLanguage>(settingKeys.language, deviceLanguage()),
  });
  const language = setting.data ?? deviceLanguage();
  const setLanguage = useCallback(
    (value: AppLanguage) => {
      queryClient.setQueryData(languageSettingQueryKey, value);
      void new SettingsRepository(db).set(settingKeys.language, value);
    },
    [db, queryClient],
  );
  const value = useMemo<LocaleContextValue>(
    () => ({
      language,
      isRTL: language === 'ar',
      setLanguage,
      t: (text) => translateCopy(text, language),
    }),
    [language, setLanguage],
  );
  return (
    <LocaleContext.Provider value={value}>
      <View style={{ flex: 1, direction: value.isRTL ? 'rtl' : 'ltr' }}>{children}</View>
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) throw new Error('useLocale must be used within LocaleProvider.');
  return context;
}
