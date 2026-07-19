import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useLocale } from '@/localization/LocaleProvider';
import { AppText, Icon, PressableScale, Screen } from '@/ui/components';
import { radii, spacing, useTheme } from '@/ui/theme';

export default function AboutScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLocale();
  const appVersion = Constants.expoConfig?.version ?? 'unknown';
  const buildVersion =
    Constants.nativeBuildVersion ?? Constants.expoConfig?.ios?.buildNumber ?? 'unknown';
  return (
    <Screen safeBottom>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => router.back()}
            style={[styles.close, { borderColor: colors.line }]}
          >
            <AppText variant="heading" color={colors.ink}>
              ‹
            </AppText>
          </PressableScale>
          <View style={styles.headerCopy}>
            <AppText variant="label" color={colors.aqua}>
              ABOUT RENLYST
            </AppText>
            <AppText variant="title" color={colors.ink}>
              Learn safely. Keep ownership.
            </AppText>
          </View>
        </View>

        <View
          testID="installed-build-identity"
          accessible
          accessibilityLabel={t('INSTALLED BUILD')}
          style={[
            styles.buildIdentity,
            { borderColor: colors.aqua, backgroundColor: colors.aquaSoft },
          ]}
        >
          <AppText variant="label" color={colors.aqua}>
            INSTALLED BUILD
          </AppText>
          <AppText variant="heading" color={colors.ink}>
            {`Renlyst Next ${appVersion} (${buildVersion})`}
          </AppText>
          <AppText variant="caption" color={colors.mutedInk}>
            Photo-first Gemini preview · com.renlyst.app.next
          </AppText>
        </View>

        <View style={[styles.hero, { backgroundColor: colors.ink }]}>
          <Icon name="warning" color={colors.aqua} size={26} />
          <AppText variant="heading" color={colors.canvas}>
            Offline-first training companion
          </AppText>
          <AppText color={colors.canvas}>
            Renlyst is for personal pharmacy learning. Confirm clinical decisions and dispensing
            with your supervising pharmacist and current local references.
          </AppText>
        </View>

        <View style={styles.section}>
          <AppText variant="heading" color={colors.ink}>
            Clinical boundary
          </AppText>
          <AppText color={colors.mutedInk}>
            Saved notes, generated drafts, dose calculations, and imported evidence are educational
            aids—not a diagnosis, prescription, or substitute for professional judgment. Always
            verify patient-specific decisions.
          </AppText>
        </View>

        <View style={styles.section}>
          <AppText variant="heading" color={colors.ink}>
            Your data
          </AppText>
          <AppText color={colors.mutedInk}>
            Your library, photos, learning history, encounters, and reports remain on this device
            unless you choose to export or explicitly invoke an online provider. API credentials are
            kept in protected device storage and excluded from backups.
          </AppText>
        </View>

        <View
          style={[styles.arabic, { backgroundColor: colors.aquaSoft }]}
          accessibilityLanguage="ar"
        >
          <AppText variant="heading" color={colors.ink} style={styles.rtl}>
            للتعلّم الصيدلاني الشخصي
          </AppText>
          <AppText color={colors.mutedInk} style={styles.rtl}>
            رينليست مخصّص للتعلّم الشخصي أثناء التدريب. أكّد القرارات السريرية وصرف الأدوية مع
            الصيدلي المشرف وبالرجوع إلى المراجع الحالية.
          </AppText>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.section, gap: spacing.xxl },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  headerCopy: { flex: 1, gap: spacing.xxs },
  close: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buildIdentity: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.xxs,
  },
  hero: { borderRadius: radii.xl, padding: spacing.xl, gap: spacing.sm },
  section: { gap: spacing.sm },
  arabic: { borderRadius: radii.lg, padding: spacing.lg, gap: spacing.sm },
  rtl: { textAlign: 'right', writingDirection: 'rtl' },
});
