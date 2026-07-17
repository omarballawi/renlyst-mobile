import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import type { DrugBackup } from '@/domain/backup';
import {
  adverseIncidenceLabel,
  structuredClinicalForDrug,
  type DrugInteractionEntry,
  type InteractionCategory,
} from '@/domain/clinical/structuredClinical';
import {
  fallbackPharmacologyPosition,
  formatPharmacologyValue,
  normalizedPharmacologyValue,
  pharmacologyBounds,
  type PharmacologyScale,
} from '@/domain/clinical/pharmacologyScale';
import { normalizeIdentity } from '@/domain/drugs/identity';
import { useDrug, useDrugList } from '@/features/library/queries';
import { useLocale } from '@/localization/LocaleProvider';
import { AppText, Icon, PressableScale, Screen } from '@/ui/components';
import { radii, spacing, useTheme, type ThemeColors } from '@/ui/theme';

const categoryOrder: readonly InteractionCategory[] = [
  'Contraindicated',
  'Serious - Use Alternative',
  'Monitor Closely',
  'Minor',
  'Uncategorized',
];

function categoryColor(category: InteractionCategory, colors: ThemeColors): string {
  if (category === 'Contraindicated') return colors.danger;
  if (category === 'Serious - Use Alternative') return colors.coral;
  if (category === 'Monitor Closely') return colors.saffron;
  if (category === 'Minor') return colors.aqua;
  return colors.mutedInk;
}

function severityColor(value: string, colors: ThemeColors): string {
  const normalized = value.toLocaleLowerCase();
  if (normalized.includes('high') || normalized.includes('severe')) return colors.danger;
  if (normalized.includes('medium') || normalized.includes('moderate')) return colors.saffron;
  if (normalized.includes('low') || normalized.includes('minor')) return colors.aqua;
  return colors.mutedInk;
}

function ClinicalSection({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.line }]}>
      <View style={styles.sectionHeader}>
        <AppText variant="label" color={colors.aqua}>
          {eyebrow.toLocaleUpperCase()}
        </AppText>
        <AppText variant="heading" color={colors.ink}>
          {title}
        </AppText>
      </View>
      {children}
    </View>
  );
}

function EmptyValue({ children }: { children: string }) {
  const { colors } = useTheme();
  return <AppText color={colors.mutedInk}>{children}</AppText>;
}

function DetailBlock({ label, values }: { label: string; values: readonly string[] }) {
  const { colors } = useTheme();
  const cleaned = values.filter((value) => value.trim());
  if (cleaned.length === 0) return null;
  return (
    <View style={styles.detailBlock}>
      <AppText variant="label" color={colors.mutedInk}>
        {label.toLocaleUpperCase()}
      </AppText>
      {cleaned.map((value, index) => (
        <AppText key={`${label}-${index}-${value}`} color={colors.ink}>
          {value}
        </AppText>
      ))}
    </View>
  );
}

function PharmacologyMeter({
  title,
  scale,
  value,
  fallback,
  detail,
}: {
  title: string;
  scale: PharmacologyScale;
  value: number | null;
  fallback: string;
  detail: string;
}) {
  const { colors } = useTheme();
  const { t } = useLocale();
  const [lower, upper] = pharmacologyBounds[scale];
  const position =
    value == null
      ? fallbackPharmacologyPosition(fallback)
      : normalizedPharmacologyValue(scale, value);
  const displayValue =
    value == null ? fallback.trim() || 'Unknown' : formatPharmacologyValue(scale, value);
  const accessibilityDetail = detail.trim() ? `, ${detail.trim()}` : '';

  return (
    <View
      accessible
      accessibilityLabel={t(`${title}, ${displayValue}${accessibilityDetail}`)}
      style={[styles.meter, { borderColor: colors.line, backgroundColor: colors.surfaceStrong }]}
    >
      <View style={styles.meterHeader}>
        <AppText variant="bodyStrong" color={colors.ink}>
          {title}
        </AppText>
        <AppText variant="bodyStrong" color={colors.aqua} style={styles.tabular}>
          {displayValue}
        </AppText>
      </View>
      <View style={[styles.meterTrack, { backgroundColor: colors.line }]}>
        <View
          style={[
            styles.meterFill,
            {
              width: `${Math.max(position * 100, position > 0 ? 2 : 0)}%`,
              backgroundColor: colors.aqua,
            },
          ]}
        />
        <View
          style={[
            styles.meterMarker,
            {
              left: `${position * 100}%`,
              marginLeft: position <= 0 ? 0 : position >= 1 ? -18 : -9,
              backgroundColor: colors.aqua,
              borderColor: colors.surfaceStrong,
            },
          ]}
        />
      </View>
      <View style={styles.meterBounds}>
        <AppText variant="caption" color={colors.mutedInk}>
          {formatPharmacologyValue(scale, lower)}
        </AppText>
        <AppText variant="caption" color={colors.mutedInk}>
          {formatPharmacologyValue(scale, upper)}
        </AppText>
      </View>
      {detail.trim() ? (
        <AppText variant="caption" color={colors.mutedInk}>
          {detail}
        </AppText>
      ) : null}
    </View>
  );
}

function relatedProfileID(
  name: string,
  profiles: readonly DrugBackup[],
  currentID: string,
): string | null {
  const target = normalizeIdentity(name);
  if (!target) return null;
  return (
    profiles.find(
      (candidate) =>
        candidate.id !== currentID &&
        [
          candidate.scientificName,
          ...(candidate.activeIngredients ?? []),
          ...candidate.tradeNames,
        ].some((value) => normalizeIdentity(value) === target),
    )?.id ?? null
  );
}

function InteractionRow({
  entry,
  linkedID,
}: {
  entry: DrugInteractionEntry;
  linkedID: string | null;
}) {
  const router = useRouter();
  const { colors } = useTheme();
  const content = (
    <>
      <View style={styles.interactionCopy}>
        <AppText variant="bodyStrong" color={colors.ink}>
          {entry.drugName}
        </AppText>
        {entry.effect ? (
          <AppText variant="caption" color={colors.mutedInk}>
            {entry.effect}
          </AppText>
        ) : null}
        {entry.management ? (
          <AppText variant="caption" color={colors.ink}>
            Management: {entry.management}
          </AppText>
        ) : null}
      </View>
      {linkedID ? <Icon name="chevron" color={colors.aqua} size={17} /> : null}
    </>
  );
  if (linkedID) {
    return (
      <PressableScale
        accessibilityRole="link"
        accessibilityLabel={`Open saved profile for ${entry.drugName}`}
        onPress={() => router.push(`/drug/${linkedID}`)}
        style={[styles.interactionRow, { borderBottomColor: colors.line }]}
      >
        {content}
      </PressableScale>
    );
  }
  return <View style={[styles.interactionRow, { borderBottomColor: colors.line }]}>{content}</View>;
}

export default function StructuredClinicalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const drug = useDrug(id);
  const allDrugs = useDrugList({ scope: 'all', sort: 'name' });

  if (drug.isLoading) {
    return (
      <Screen>
        <View style={styles.center}>
          <AppText color={colors.mutedInk}>Preparing clinical evidence…</AppText>
        </View>
      </Screen>
    );
  }
  if (!drug.data) {
    return (
      <Screen safeBottom>
        <View style={styles.centerCopy}>
          <AppText variant="title" color={colors.ink}>
            This profile is unavailable.
          </AppText>
          <PressableScale accessibilityRole="button" onPress={() => router.back()}>
            <AppText variant="bodyStrong" color={colors.coral}>
              Go back
            </AppText>
          </PressableScale>
        </View>
      </Screen>
    );
  }

  const profile = drug.data;
  const clinical = structuredClinicalForDrug(profile);
  const safetyScale = [
    ['Contraindications', profile.contraindicationSeverityRaw],
    ['Toxicity', profile.toxicitySeverityRaw],
    ['Warnings', profile.warningSeverityRaw],
    ['Interactions', profile.interactionSeverityRaw],
    ['Renal', profile.renalSeverityRaw],
    ['Hepatic', profile.hepaticSeverityRaw],
    ['Pregnancy', profile.pregnancySeverityRaw],
  ] as const;
  const pkDetails = [
    ['Frequency', profile.dosingFrequencyRaw, ''],
    ['Prodrug', clinical.prodrug.classification, clinical.prodrug.explanation],
    ['Elimination', clinical.elimination.dominantPathway, clinical.elimination.summary],
  ] as const;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Back to drug profile"
          onPress={() => router.back()}
          style={[styles.back, { borderColor: colors.line }]}
        >
          <AppText variant="bodyStrong" color={colors.ink}>
            Back
          </AppText>
        </PressableScale>
        <View style={styles.hero}>
          <AppText variant="label" color={colors.coral}>
            STRUCTURED CLINICAL EVIDENCE
          </AppText>
          <AppText variant="display" color={colors.ink}>
            {profile.scientificName || profile.captureLabel}
          </AppText>
          <AppText color={colors.mutedInk}>
            Imported structure, legacy fallbacks, and explicit unknown states—kept separate from
            personal notes.
          </AppText>
        </View>

        <ClinicalSection eyebrow="Risk scale" title="Safety at a glance">
          <View style={styles.scaleGrid}>
            {safetyScale.map(([label, value]) => (
              <View key={label} style={[styles.scaleItem, { borderColor: colors.line }]}>
                <View
                  style={[styles.scaleMark, { backgroundColor: severityColor(value, colors) }]}
                />
                <AppText variant="caption" color={colors.mutedInk}>
                  {label}
                </AppText>
                <AppText variant="bodyStrong" color={colors.ink}>
                  {value || 'Unknown'}
                </AppText>
              </View>
            ))}
          </View>
          <DetailBlock label="Renal caution" values={[profile.renalCaution]} />
          <DetailBlock label="Hepatic caution" values={[profile.hepaticCaution]} />
          <DetailBlock label="Toxicity" values={[profile.toxicity]} />
        </ClinicalSection>

        <ClinicalSection eyebrow="PK memory" title="Pharmacology scale">
          <View style={styles.meterList}>
            <PharmacologyMeter
              title="Half-life"
              scale="halfLife"
              value={profile.halfLifeHours}
              fallback={profile.halfLifeBandRaw}
              detail={profile.halfLifeText}
            />
            <PharmacologyMeter
              title="Onset"
              scale="onset"
              value={profile.onsetMinutes}
              fallback={profile.onsetBandRaw}
              detail={profile.onsetText}
            />
            <PharmacologyMeter
              title="Duration"
              scale="duration"
              value={profile.durationHours}
              fallback={profile.durationBandRaw}
              detail={profile.durationText}
            />
          </View>
          <View style={styles.pkList}>
            {pkDetails.map(([label, value, detail]) => (
              <View key={label} style={[styles.pkRow, { borderBottomColor: colors.line }]}>
                <AppText variant="caption" color={colors.mutedInk} style={styles.pkLabel}>
                  {label}
                </AppText>
                <View style={styles.pkCopy}>
                  <AppText variant="bodyStrong" color={colors.ink}>
                    {value || 'Unknown'}
                  </AppText>
                  {detail ? (
                    <AppText variant="caption" color={colors.mutedInk}>
                      {detail}
                    </AppText>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        </ClinicalSection>

        <ClinicalSection eyebrow="Products" title="Dosage forms & strengths">
          {clinical.dosageFormGroups.length > 0 ? (
            clinical.dosageFormGroups.map((group) => (
              <View key={group.dosageForm} style={styles.detailBlock}>
                <AppText variant="bodyStrong" color={colors.aqua}>
                  {group.dosageForm}
                </AppText>
                {group.strengths.map((item, index) => (
                  <View key={`${item.strength}-${index}`}>
                    <AppText color={colors.ink}>{item.strength}</AppText>
                    {item.tradeNames.length > 0 ? (
                      <AppText variant="caption" color={colors.mutedInk}>
                        {item.tradeNames.join(', ')}
                      </AppText>
                    ) : null}
                  </View>
                ))}
              </View>
            ))
          ) : (
            <EmptyValue>No structured dosage forms or strengths are saved.</EmptyValue>
          )}
        </ClinicalSection>

        <ClinicalSection eyebrow="By indication" title="Clinical dosing">
          {clinical.clinicalDoses.length > 0 ? (
            clinical.clinicalDoses.map((dose, index) => (
              <View
                key={`${dose.indication}-${dose.population}-${index}`}
                style={[styles.dose, { borderBottomColor: colors.line }]}
              >
                <AppText variant="bodyStrong" color={colors.ink}>
                  {dose.indication}
                </AppText>
                {dose.population ? (
                  <AppText variant="label" color={colors.aqua}>
                    {dose.population.toLocaleUpperCase()}
                  </AppText>
                ) : null}
                <AppText color={colors.ink}>{dose.doseText}</AppText>
                <AppText variant="caption" color={colors.mutedInk}>
                  {[dose.route, dose.frequency, dose.duration].filter(Boolean).join(' · ')}
                </AppText>
                <DetailBlock label="Adjuncts" values={dose.adjuncts} />
                <DetailBlock label="Considerations" values={dose.considerations} />
              </View>
            ))
          ) : (
            <EmptyValue>No indication-specific clinical dosing is saved.</EmptyValue>
          )}
        </ClinicalSection>

        <ClinicalSection eyebrow="Medicine pairs" title="Interactions">
          {clinical.interactions.length > 0 ? (
            categoryOrder.map((category) => {
              const entries = clinical.interactions.filter((entry) => entry.category === category);
              if (entries.length === 0) return null;
              return (
                <View key={category} style={styles.interactionGroup}>
                  <AppText variant="bodyStrong" color={categoryColor(category, colors)}>
                    {category} ({entries.length})
                  </AppText>
                  {entries.map((entry, index) => (
                    <InteractionRow
                      key={`${entry.drugName}-${index}`}
                      entry={entry}
                      linkedID={relatedProfileID(entry.drugName, allDrugs.data ?? [], profile.id)}
                    />
                  ))}
                </View>
              );
            })
          ) : (
            <EmptyValue>No structured interaction list is saved.</EmptyValue>
          )}
        </ClinicalSection>

        <ClinicalSection eyebrow="Frequency" title="Adverse effects">
          {clinical.adverseEffects.length > 0 ? (
            clinical.adverseEffects.map((effect, index) => (
              <View
                key={`${effect.name}-${index}`}
                style={[styles.adverseRow, { borderBottomColor: colors.line }]}
              >
                <View style={styles.adverseCopy}>
                  <AppText color={colors.ink}>{effect.name}</AppText>
                  {effect.isSerious ? (
                    <AppText variant="label" color={colors.danger}>
                      SERIOUS
                    </AppText>
                  ) : null}
                </View>
                <AppText
                  variant="bodyStrong"
                  color={effect.incidence ? colors.aqua : colors.mutedInk}
                >
                  {adverseIncidenceLabel(effect.incidence)}
                </AppText>
              </View>
            ))
          ) : (
            <EmptyValue>No structured adverse-effect list is saved.</EmptyValue>
          )}
        </ClinicalSection>

        <ClinicalSection eyebrow="Reproductive safety" title="Pregnancy & lactation">
          <DetailBlock label="Pregnancy" values={[clinical.reproductiveSafety.pregnancy]} />
          <DetailBlock
            label="ملاحظة الحمل"
            values={[clinical.reproductiveSafety.pregnancyArabicNote]}
          />
          <DetailBlock label="Lactation" values={[clinical.reproductiveSafety.lactation]} />
          <DetailBlock
            label="ملاحظة الرضاعة"
            values={[clinical.reproductiveSafety.lactationArabicNote]}
          />
          {!clinical.reproductiveSafety.pregnancy && !clinical.reproductiveSafety.lactation ? (
            <EmptyValue>No structured pregnancy or lactation evidence is saved.</EmptyValue>
          ) : null}
        </ClinicalSection>

        <ClinicalSection eyebrow="ADME" title="Clinical pharmacology">
          <DetailBlock
            label="Mechanism of action"
            values={[clinical.pharmacology.mechanismOfAction]}
          />
          <DetailBlock label="Absorption" values={clinical.pharmacology.absorption} />
          <DetailBlock label="Distribution" values={clinical.pharmacology.distribution} />
          <DetailBlock label="Metabolism" values={clinical.pharmacology.metabolism} />
          <DetailBlock label="Elimination" values={clinical.pharmacology.elimination} />
          <DetailBlock
            label="Prodrug activation"
            values={[
              clinical.prodrug.administeredCompound,
              clinical.prodrug.activeCompound,
              clinical.prodrug.activationSite,
              clinical.prodrug.activationPathway,
              clinical.prodrug.explanation,
            ]}
          />
          <DetailBlock
            label="Elimination summary"
            values={[
              clinical.elimination.metabolismSite,
              clinical.elimination.metabolismEnzymes.join(', '),
              clinical.elimination.summary,
            ]}
          />
          {clinical.elimination.routes.map((route, index) => (
            <View key={`${route.pathway}-${index}`} style={styles.routeRow}>
              <AppText variant="bodyStrong" color={colors.ink}>
                {route.pathway || 'Unknown route'}
              </AppText>
              {route.percentage != null ? (
                <AppText variant="bodyStrong" color={colors.aqua}>
                  {route.percentage}%
                </AppText>
              ) : null}
              {route.detail ? (
                <AppText variant="caption" color={colors.mutedInk} style={styles.routeDetail}>
                  {route.detail}
                </AppText>
              ) : null}
            </View>
          ))}
        </ClinicalSection>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.section, gap: spacing.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  centerCopy: { flex: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.lg },
  back: {
    alignSelf: 'flex-start',
    minHeight: 44,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  hero: { gap: spacing.xs },
  section: { borderWidth: 1, borderRadius: radii.lg, padding: spacing.lg, gap: spacing.lg },
  sectionHeader: { gap: 2 },
  detailBlock: { gap: spacing.xs },
  scaleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  scaleItem: {
    minWidth: '47%',
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.sm,
    gap: 2,
  },
  scaleMark: { width: 24, height: 5, borderRadius: radii.pill, marginBottom: spacing.xs },
  meterList: { gap: spacing.sm },
  meter: { borderWidth: 1, borderRadius: radii.md, padding: spacing.md, gap: spacing.xs },
  meterHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  meterTrack: { height: 8, borderRadius: radii.pill, marginVertical: spacing.xs },
  meterFill: { height: 8, borderRadius: radii.pill },
  meterMarker: {
    position: 'absolute',
    top: -5,
    width: 18,
    height: 18,
    borderWidth: 3,
    borderRadius: radii.pill,
  },
  meterBounds: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tabular: { fontVariant: ['tabular-nums'] },
  pkList: { gap: 0 },
  pkRow: {
    minHeight: 66,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  pkLabel: { width: 76 },
  pkCopy: { flex: 1, gap: 2 },
  dose: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  interactionGroup: { gap: spacing.xs },
  interactionRow: {
    minHeight: 58,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  interactionCopy: { flex: 1, gap: 2 },
  adverseRow: {
    minHeight: 52,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  adverseCopy: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  routeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  routeDetail: { width: '100%' },
});
