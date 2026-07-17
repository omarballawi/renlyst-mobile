import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { readDoseRegimens } from '@/domain/clinical/doseCalculator';
import { useDrug } from '@/features/library/queries';
import { AppText, Icon, PressableScale, PrimaryButton, Screen } from '@/ui/components';
import { radii, spacing, useTheme } from '@/ui/theme';

export default function ImportCompleteScreen() {
  const { id, source } = useLocalSearchParams<{ id: string; source?: 'trusted' | 'ai' }>();
  const router = useRouter();
  const { colors } = useTheme();
  const drug = useDrug(id);

  if (drug.isLoading) {
    return (
      <Screen>
        <View style={styles.center}>
          <AppText color={colors.mutedInk}>Preparing the saved card…</AppText>
        </View>
      </Screen>
    );
  }
  if (!drug.data) {
    return (
      <Screen>
        <View style={styles.center}>
          <AppText color={colors.mutedInk}>The saved profile could not be opened.</AppText>
        </View>
      </Screen>
    );
  }

  const profile = drug.data;
  const factCount =
    profile.mustKnow.length +
    profile.indications.length +
    profile.warnings.length +
    readDoseRegimens(profile).length;

  return (
    <Screen safeBottom>
      <View style={styles.content}>
        <View style={[styles.seal, { backgroundColor: colors.aquaSoft }]}>
          <Icon name="check" color={colors.aqua} size={30} />
        </View>
        <View style={styles.copy}>
          <AppText variant="label" color={colors.aqua}>
            CARD SAVED
          </AppText>
          <AppText variant="display" color={colors.ink}>
            Lock in {profile.scientificName || profile.captureLabel}.
          </AppText>
          <AppText color={colors.mutedInk}>
            Start a focused five now, or open the profile and continue reviewing every saved field.
          </AppText>
        </View>

        <View style={[styles.summary, { borderColor: colors.line }]}>
          <View style={styles.metric}>
            <AppText variant="title" color={colors.ink}>
              5
            </AppText>
            <AppText variant="caption" color={colors.mutedInk}>
              grounded questions
            </AppText>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.line }]} />
          <View style={styles.metric}>
            <AppText variant="title" color={colors.ink}>
              {factCount}
            </AppText>
            <AppText variant="caption" color={colors.mutedInk}>
              useful facts saved
            </AppText>
          </View>
        </View>

        <View
          style={[
            styles.evidence,
            { backgroundColor: source === 'ai' ? colors.saffronSoft : colors.aquaSoft },
          ]}
        >
          <Icon name={source === 'ai' ? 'warning' : 'database'} color={colors.ink} size={20} />
          <AppText color={colors.ink} style={styles.evidenceCopy}>
            {source === 'ai'
              ? 'AI fields remain explicitly unverified. Practice helps recall; it does not verify clinical accuracy.'
              : 'Questions use only facts saved on this profile. Source-review flags remain visible on the card.'}
          </AppText>
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            label="Start quick review"
            icon="practice"
            onPress={() =>
              router.replace(
                `/practice/session?mode=Smart%20Session&drug=${encodeURIComponent(profile.id)}`,
              )
            }
          />
          <PressableScale
            accessibilityRole="button"
            onPress={() => router.replace(`/drug/${profile.id}`)}
            style={[styles.open, { borderColor: colors.line }]}
          >
            <AppText variant="bodyStrong" color={colors.ink}>
              Open drug profile
            </AppText>
          </PressableScale>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  content: { flex: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.xxl },
  seal: {
    width: 68,
    height: 68,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { gap: spacing.sm },
  summary: {
    minHeight: 104,
    borderWidth: 1,
    borderRadius: radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  metric: { flex: 1, alignItems: 'center' },
  divider: { width: StyleSheet.hairlineWidth, height: 52 },
  evidence: {
    borderRadius: radii.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  evidenceCopy: { flex: 1 },
  actions: { gap: spacing.sm },
  open: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
