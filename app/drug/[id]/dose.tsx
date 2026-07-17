import { useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Linking, ScrollView, StyleSheet, Switch, View } from 'react-native';

import {
  calculateDose,
  medianPediatricWeightKG,
  pediatricWeightReference,
  readDoseRegimens,
  type DoseCalculationResult,
  type DoseRegimen,
  type PatientSexAtBirth,
} from '@/domain/clinical/doseCalculator';
import { useDrug } from '@/features/library/queries';
import { useLocale } from '@/localization/LocaleProvider';
import {
  AppText,
  AppTextInput as TextInput,
  Icon,
  PressableScale,
  PrimaryButton,
  Screen,
} from '@/ui/components';
import { fonts, radii, spacing, useTheme } from '@/ui/theme';

function numberValue(value: string): number | null {
  const parsed = Number(value.trim().replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function regimenSummary(regimen: DoseRegimen): string {
  if (regimen.formula === 'Fixed dose')
    return `${regimen.fixedDoseMG ?? '—'} mg · ${regimen.route}`;
  if (regimen.formula === 'mg/kg/dose')
    return `${regimen.amountPerKG ?? '—'} mg/kg/dose · ${regimen.dividedDoses ?? 1}× daily`;
  if (regimen.formula === 'mg/kg/day')
    return `${regimen.amountPerKG ?? '—'} mg/kg/day ÷ ${regimen.dividedDoses ?? 1}`;
  return `${regimen.amountPerSquareMeter ?? '—'} mg/m²/dose`;
}

function Choice({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress(): void;
}) {
  const { colors } = useTheme();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.choice,
        {
          borderColor: selected ? colors.coral : colors.line,
          backgroundColor: selected ? colors.saffronSoft : colors.surface,
        },
      ]}
    >
      <AppText variant="caption" color={selected ? colors.coral : colors.ink}>
        {label}
      </AppText>
    </PressableScale>
  );
}

export default function DoseCalculatorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLocale();
  const drug = useDrug(id);
  const regimens = useMemo(() => (drug.data ? readDoseRegimens(drug.data) : []), [drug.data]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [ageYears, setAgeYears] = useState('5');
  const [extraMonths, setExtraMonths] = useState('0');
  const [sex, setSex] = useState<PatientSexAtBirth>('Female');
  const [measuredWeight, setMeasuredWeight] = useState('');
  const [height, setHeight] = useState('');
  const [renalFunction, setRenalFunction] = useState('Normal');
  const [hepaticFunction, setHepaticFunction] = useState('Normal');
  const [isPregnant, setIsPregnant] = useState(false);
  const [result, setResult] = useState<DoseCalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const selected = regimens[selectedIndex] ?? regimens[0];
  const ageMonths = Math.max(
    0,
    Math.trunc(Number(ageYears) || 0) * 12 +
      Math.min(11, Math.max(0, Math.trunc(Number(extraMonths) || 0))),
  );
  const estimatedWeight = medianPediatricWeightKG(ageMonths, sex);

  const runCalculation = () => {
    if (!selected) return;
    const measured = numberValue(measuredWeight);
    try {
      setResult(
        calculateDose(selected, {
          ageMonths,
          sexAtBirth: sex,
          measuredWeightKG: measured,
          estimatedWeightKG: measured === null ? estimatedWeight : null,
          heightCM: numberValue(height),
          renalFunction,
          hepaticFunction,
          isPregnant,
        }),
      );
      setError(null);
    } catch (reason) {
      setResult(null);
      setError(reason instanceof Error ? reason.message : 'The dose could not be calculated.');
    }
  };

  if (drug.isLoading)
    return (
      <Screen>
        <View style={styles.center}>
          <AppText color={colors.mutedInk}>Opening dose tools…</AppText>
        </View>
      </Screen>
    );
  return (
    <Screen safeBottom>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Close dose tools"
            onPress={() => router.back()}
            style={[styles.close, { borderColor: colors.line }]}
          >
            <AppText variant="heading" color={colors.ink}>
              ‹
            </AppText>
          </PressableScale>
          <View style={styles.headerCopy}>
            <AppText variant="label" color={colors.aqua}>
              CLINICAL STUDY TOOL
            </AppText>
            <AppText variant="title" color={colors.ink}>
              Dose regimens.
            </AppText>
            <AppText color={colors.mutedInk}>
              {drug.data?.scientificName || 'Drug profile'} · calculation inputs are never saved.
            </AppText>
          </View>
        </View>

        <View style={styles.regimenSection}>
          <AppText variant="heading" color={colors.ink}>
            Standard regimens
          </AppText>
          {regimens.length === 0 ? (
            <View style={[styles.empty, { borderColor: colors.line }]}>
              <AppText variant="bodyStrong" color={colors.ink}>
                Not found
              </AppText>
              <AppText color={colors.mutedInk}>
                Import or enter an indication- and age-specific structured regimen before using the
                calculator.
              </AppText>
            </View>
          ) : (
            regimens.map((regimen, index) => (
              <PressableScale
                key={`${regimen.population}|${regimen.indication}|${regimen.route}|${regimen.formula}`}
                accessibilityRole="button"
                accessibilityState={{ selected: selectedIndex === index }}
                onPress={() => {
                  setSelectedIndex(index);
                  setResult(null);
                  setError(null);
                }}
                style={[
                  styles.regimen,
                  {
                    borderColor: selectedIndex === index ? colors.aqua : colors.line,
                    backgroundColor: selectedIndex === index ? colors.aquaSoft : colors.surface,
                  },
                ]}
              >
                <View style={styles.regimenHeading}>
                  <AppText variant="bodyStrong" color={colors.ink} style={styles.regimenTitle}>
                    {regimen.indication}
                  </AppText>
                  <AppText variant="caption" color={colors.aqua}>
                    {regimen.population.toLocaleUpperCase()}
                  </AppText>
                </View>
                <AppText color={colors.mutedInk}>{regimenSummary(regimen)}</AppText>
                {regimen.durationText ? (
                  <AppText variant="caption" color={colors.mutedInk}>
                    {regimen.durationText}
                  </AppText>
                ) : null}
              </PressableScale>
            ))
          )}
        </View>

        {selected ? (
          <View style={[styles.calculator, { borderColor: colors.line }]}>
            <View style={styles.calculatorTitle}>
              <View style={[styles.calculatorIcon, { backgroundColor: colors.saffronSoft }]}>
                <AppText variant="title" color={colors.saffron}>
                  ƒ
                </AppText>
              </View>
              <View style={styles.calculatorCopy}>
                <AppText variant="heading" color={colors.ink}>
                  Educational dose calculator
                </AppText>
                <AppText variant="caption" color={colors.mutedInk}>
                  Verify the current clinical reference, indication, and product.
                </AppText>
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.field}>
                <AppText variant="bodyStrong" color={colors.ink}>
                  Age years
                </AppText>
                <TextInput
                  value={ageYears}
                  onChangeText={setAgeYears}
                  keyboardType="number-pad"
                  accessibilityLabel="Age years"
                  style={[styles.input, { color: colors.ink, borderColor: colors.line }]}
                />
              </View>
              <View style={styles.field}>
                <AppText variant="bodyStrong" color={colors.ink}>
                  Extra months
                </AppText>
                <TextInput
                  value={extraMonths}
                  onChangeText={setExtraMonths}
                  keyboardType="number-pad"
                  accessibilityLabel="Extra months"
                  style={[styles.input, { color: colors.ink, borderColor: colors.line }]}
                />
              </View>
            </View>
            <View style={styles.field}>
              <AppText variant="bodyStrong" color={colors.ink}>
                Sex at birth
              </AppText>
              <View style={styles.choices}>
                <Choice
                  label="Female"
                  selected={sex === 'Female'}
                  onPress={() => setSex('Female')}
                />
                <Choice
                  label="Male"
                  selected={sex === 'Male'}
                  onPress={() => {
                    setSex('Male');
                    setIsPregnant(false);
                  }}
                />
              </View>
            </View>
            <View style={styles.field}>
              <AppText variant="bodyStrong" color={colors.ink}>
                Measured weight kg{' '}
                <AppText color={colors.mutedInk}>(optional through age 10)</AppText>
              </AppText>
              <TextInput
                value={measuredWeight}
                onChangeText={setMeasuredWeight}
                keyboardType="decimal-pad"
                accessibilityLabel="Measured weight in kilograms"
                placeholder="Measured weight"
                placeholderTextColor={colors.mutedInk}
                style={[styles.input, { color: colors.ink, borderColor: colors.line }]}
              />
              {!measuredWeight.trim() && estimatedWeight !== null ? (
                <PressableScale
                  accessibilityRole="link"
                  onPress={() => void Linking.openURL(pediatricWeightReference.sourceURL)}
                >
                  <AppText variant="caption" color={colors.aqua}>
                    WHO median estimate: {estimatedWeight.toFixed(1)} kg · view source
                  </AppText>
                </PressableScale>
              ) : !measuredWeight.trim() ? (
                <AppText variant="caption" color={colors.saffron}>
                  Enter a measured weight. WHO estimates stop after age 10.
                </AppText>
              ) : null}
            </View>
            {selected.formula === 'mg/m²' ? (
              <View style={styles.field}>
                <AppText variant="bodyStrong" color={colors.ink}>
                  Height cm
                </AppText>
                <TextInput
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="decimal-pad"
                  accessibilityLabel="Height in centimeters"
                  style={[styles.input, { color: colors.ink, borderColor: colors.line }]}
                />
              </View>
            ) : null}
            <View style={styles.field}>
              <AppText variant="bodyStrong" color={colors.ink}>
                Kidney function
              </AppText>
              <View style={styles.choices}>
                <Choice
                  label="Normal"
                  selected={renalFunction === 'Normal'}
                  onPress={() => setRenalFunction('Normal')}
                />
                <Choice
                  label="Reduced / unknown"
                  selected={renalFunction !== 'Normal'}
                  onPress={() => setRenalFunction('Reduced / unknown')}
                />
              </View>
            </View>
            <View style={styles.field}>
              <AppText variant="bodyStrong" color={colors.ink}>
                Liver function
              </AppText>
              <View style={styles.choices}>
                <Choice
                  label="Normal"
                  selected={hepaticFunction === 'Normal'}
                  onPress={() => setHepaticFunction('Normal')}
                />
                <Choice
                  label="Reduced / unknown"
                  selected={hepaticFunction !== 'Normal'}
                  onPress={() => setHepaticFunction('Reduced / unknown')}
                />
              </View>
            </View>
            <View style={styles.switchRow}>
              <View style={styles.switchCopy}>
                <AppText variant="bodyStrong" color={colors.ink}>
                  Pregnant
                </AppText>
                <AppText variant="caption" color={colors.mutedInk}>
                  Adds a clinician-review caution.
                </AppText>
              </View>
              <Switch
                accessibilityLabel={t('Pregnant')}
                accessibilityHint={t('Adds a clinician-review caution.')}
                value={isPregnant}
                disabled={sex === 'Male'}
                onValueChange={setIsPregnant}
                trackColor={{ true: colors.coral }}
              />
            </View>
            <PrimaryButton
              label="Calculate from selected regimen"
              icon="check"
              onPress={runCalculation}
            />
            {error ? (
              <View
                accessibilityRole="alert"
                style={[styles.alert, { backgroundColor: colors.saffronSoft }]}
              >
                <AppText color={colors.ink}>{error}</AppText>
              </View>
            ) : null}
            {result ? (
              <View
                accessibilityLiveRegion="polite"
                style={[styles.result, { backgroundColor: colors.aquaSoft }]}
              >
                <AppText variant="title" color={colors.ink}>
                  {result.dosePerAdministrationMG.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}{' '}
                  mg per administration
                </AppText>
                <AppText variant="heading" color={colors.ink}>
                  {result.totalDailyDoseMG.toLocaleString(undefined, { maximumFractionDigits: 2 })}{' '}
                  mg/day in {result.administrationsPerDay} dose(s)
                </AppText>
                <AppText variant="caption" color={colors.mutedInk} selectable>
                  {result.equation}
                </AppText>
                {result.appliedMaximum ? (
                  <AppText variant="bodyStrong" color={colors.saffron}>
                    Maximum dose cap applied
                  </AppText>
                ) : null}
                {result.cautions.map((caution) => (
                  <View key={caution} style={styles.caution}>
                    <Icon name="warning" color={colors.saffron} size={16} />
                    <AppText variant="caption" color={colors.ink} style={styles.cautionCopy}>
                      {caution}
                    </AppText>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.lg, paddingBottom: spacing.section, gap: spacing.xxl },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  close: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: { flex: 1, gap: spacing.xs },
  regimenSection: { gap: spacing.sm },
  empty: { borderWidth: 1, borderRadius: radii.lg, padding: spacing.lg, gap: spacing.xs },
  regimen: { borderWidth: 1, borderRadius: radii.lg, padding: spacing.md, gap: spacing.xs },
  regimenHeading: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  regimenTitle: { flex: 1 },
  calculator: { borderWidth: 1, borderRadius: radii.xl, padding: spacing.lg, gap: spacing.lg },
  calculatorTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  calculatorIcon: {
    width: 52,
    height: 52,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calculatorCopy: { flex: 1 },
  row: { flexDirection: 'row', gap: spacing.sm },
  field: { flex: 1, gap: spacing.xs },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    fontFamily: fonts.body,
    fontSize: 16,
  },
  choices: { flexDirection: 'row', gap: spacing.xs },
  choice: {
    flex: 1,
    minHeight: 46,
    borderWidth: 1,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  switchCopy: { flex: 1 },
  alert: { padding: spacing.md, borderRadius: radii.md },
  result: { borderRadius: radii.lg, padding: spacing.lg, gap: spacing.sm },
  caution: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  cautionCopy: { flex: 1 },
});
