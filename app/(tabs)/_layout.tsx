import { Tabs } from 'expo-router';

import { Icon, type AppIconName } from '@/ui/components';
import { fonts, useTheme } from '@/ui/theme';
import { useLocale } from '@/localization/LocaleProvider';

const icons: Record<string, AppIconName> = {
  today: 'today',
  library: 'library',
  practice: 'practice',
  training: 'training',
  you: 'profile',
};

export default function TabLayout() {
  const { colors } = useTheme();
  const { isRTL, t } = useLocale();
  return (
    <Tabs
      initialRouteName="today"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.coral,
        tabBarInactiveTintColor: colors.mutedInk,
        tabBarStyle: {
          height: 84,
          paddingTop: 8,
          paddingBottom: 12,
          backgroundColor: colors.surface,
          borderTopColor: colors.line,
        },
        tabBarLabelStyle: {
          fontFamily: isRTL ? fonts.arabicSemiBold : fonts.bodySemiBold,
          fontSize: 11,
        },
        tabBarIcon: ({ color, size }) => (
          <Icon name={icons[route.name] ?? 'today'} color={color} size={size} />
        ),
      })}
    >
      <Tabs.Screen name="today" options={{ title: t('Today') }} />
      <Tabs.Screen name="library" options={{ title: t('Library') }} />
      <Tabs.Screen name="practice" options={{ title: t('Practice') }} />
      <Tabs.Screen name="training" options={{ href: null, title: t('Training') }} />
      <Tabs.Screen name="you" options={{ title: t('You') }} />
    </Tabs>
  );
}
