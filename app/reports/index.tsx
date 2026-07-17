import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line, Polygon, Text as SvgText } from 'react-native-svg';

import type { TrainingBreakdown } from '@/data/repositories';
import { dateFromLegacy } from '@/domain/shared/dates';
import {
  trainingQueryKeys,
  useTrainingAnalytics,
  useTrainingDashboard,
  useTrainingRepository,
} from '@/features/training/queries';
import { useLocale } from '@/localization/LocaleProvider';
import { AppText, Icon, PressableScale, PrimaryButton, Screen } from '@/ui/components';
import { radii, spacing, useTheme } from '@/ui/theme';

const radarLabels = ['Scientific', 'Trade', 'Class', 'Use', 'Warning', 'Counsel'] as const;

function radarPoint(index: number, scale: number, radius = 84) {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / radarLabels.length;
  return { x: 160 + Math.cos(angle) * radius * scale, y: 132 + Math.sin(angle) * radius * scale };
}

function polygonPoints(values: readonly number[]) {
  return values
    .map((value, index) => {
      const point = radarPoint(index, value);
      return `${point.x},${point.y}`;
    })
    .join(' ');
}

function MasteryRadar({ values }: { values: readonly number[] }) {
  const { colors } = useTheme();
  const { t } = useLocale();
  const accessibility = radarLabels
    .map((label, index) => `${label} ${Math.round((values[index] ?? 0) * 100)} percent`)
    .join(', ');
  return (
    <View accessibilityRole="image" accessibilityLabel={t(`Mastery radar: ${accessibility}`)}>
      <Svg width="100%" height={280} viewBox="0 0 320 280">
        {[0.25, 0.5, 0.75, 1].map((level) => (
          <Polygon
            key={level}
            points={polygonPoints(radarLabels.map(() => level))}
            fill="none"
            stroke={colors.line}
            strokeWidth={1}
          />
        ))}
        {radarLabels.map((label, index) => {
          const end = radarPoint(index, 1);
          const text = radarPoint(index, 1.27);
          return (
            <G key={label}>
              <Line x1={160} y1={132} x2={end.x} y2={end.y} stroke={colors.line} />
              <SvgText
                x={text.x}
                y={text.y}
                fill={colors.mutedInk}
                fontSize={11}
                fontWeight="600"
                textAnchor="middle"
                alignmentBaseline="middle"
              >
                {label}
              </SvgText>
            </G>
          );
        })}
        <Polygon
          points={polygonPoints(values)}
          fill={colors.aquaSoft}
          fillOpacity={0.72}
          stroke={colors.aqua}
          strokeWidth={3}
        />
        {values.map((value, index) => {
          const point = radarPoint(index, value);
          return (
            <Circle key={radarLabels[index]} cx={point.x} cy={point.y} r={4} fill={colors.aqua} />
          );
        })}
      </Svg>
    </View>
  );
}

function Breakdown({ title, values }: { title: string; values: TrainingBreakdown[] }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { borderColor: colors.line }]}>
      <AppText variant="heading" color={colors.ink}>
        {title}
      </AppText>
      {values.length === 0 ? (
        <AppText color={colors.mutedInk}>No data yet.</AppText>
      ) : (
        values.map((entry) => (
          <View key={entry.label} style={[styles.breakdownRow, { borderBottomColor: colors.line }]}>
            <AppText color={colors.ink} style={styles.breakdownLabel}>
              {entry.label}
            </AppText>
            <AppText variant="bodyStrong" color={colors.mutedInk}>
              {entry.count}
            </AppText>
          </View>
        ))
      )}
    </View>
  );
}

export default function ReportsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const repository = useTrainingRepository();
  const dashboard = useTrainingDashboard();
  const analytics = useTrainingAnalytics();
  const [periodEnd, setPeriodEnd] = useState(new Date());
  const [periodStart, setPeriodStart] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 29);
    return date;
  });
  const generate = useMutation({
    mutationFn: () => repository.generateReport(periodStart, periodEnd),
    onSuccess: async (report) => {
      await queryClient.invalidateQueries({ queryKey: trainingQueryKeys.all });
      router.push(`/reports/${report.id}`);
    },
  });

  return (
    <Screen safeBottom>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Back to Training"
            onPress={() => router.back()}
            style={[styles.close, { borderColor: colors.line }]}
          >
            <AppText variant="heading" color={colors.ink}>
              ‹
            </AppText>
          </PressableScale>
          <View style={styles.headerCopy}>
            <AppText variant="label" color={colors.aqua}>
              PLACEMENT RECORD
            </AppText>
            <AppText variant="title" color={colors.ink}>
              Training reports.
            </AppText>
            <AppText color={colors.mutedInk}>
              Generate from your saved shifts, encounters, reviews, and library—then edit before
              sharing.
            </AppText>
          </View>
        </View>

        <View style={styles.metrics} accessibilityLabel={t('Training totals')}>
          {[
            ['Total drugs', analytics.data?.totalDrugs ?? 0],
            ['Mastered', analytics.data?.mastered ?? 0],
            ['Weak', analytics.data?.weak ?? 0],
            ['Reviews', analytics.data?.reviews ?? 0],
            ['Shifts', analytics.data?.completedShifts ?? 0],
          ].map(([label, value]) => (
            <View key={label} style={[styles.metric, { borderColor: colors.line }]}>
              <AppText variant="title" color={label === 'Weak' ? colors.coral : colors.ink}>
                {value}
              </AppText>
              <AppText variant="caption" color={colors.mutedInk}>
                {label}
              </AppText>
            </View>
          ))}
        </View>

        <View style={[styles.analyticsCard, { borderColor: colors.line }]}>
          <AppText variant="heading" color={colors.ink}>
            Mastery radar
          </AppText>
          <AppText variant="caption" color={colors.mutedInk}>
            A shorter axis shows the knowledge area that needs more practice.
          </AppText>
          <MasteryRadar values={analytics.data?.masteryValues ?? [0, 0, 0, 0, 0, 0]} />
        </View>

        <Breakdown title="Drugs by chapter" values={analytics.data?.chapters ?? []} />
        <Breakdown title="Drugs by class" values={analytics.data?.classes ?? []} />

        <View style={[styles.generator, { backgroundColor: colors.ink }]}>
          <AppText variant="label" color={colors.aqua}>
            NEW EDITABLE REPORT
          </AppText>
          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <AppText variant="caption" color={colors.canvas}>
                FROM
              </AppText>
              <DateTimePicker
                value={periodStart}
                mode="date"
                display="compact"
                maximumDate={periodEnd}
                onChange={(_, value) => {
                  if (value) setPeriodStart(value);
                }}
                accentColor={colors.coral}
                themeVariant="dark"
              />
            </View>
            <View style={styles.dateField}>
              <AppText variant="caption" color={colors.canvas}>
                TO
              </AppText>
              <DateTimePicker
                value={periodEnd}
                mode="date"
                display="compact"
                minimumDate={periodStart}
                maximumDate={new Date()}
                onChange={(_, value) => {
                  if (value) setPeriodEnd(value);
                }}
                accentColor={colors.coral}
                themeVariant="dark"
              />
            </View>
          </View>
          <PrimaryButton
            label={generate.isPending ? 'Generating report…' : 'Generate editable report'}
            icon="database"
            disabled={generate.isPending || periodEnd < periodStart}
            onPress={() => generate.mutate()}
          />
        </View>

        <View style={styles.reports}>
          <AppText variant="heading" color={colors.ink}>
            Saved reports
          </AppText>
          {(dashboard.data?.reports.length ?? 0) === 0 ? (
            <AppText color={colors.mutedInk}>No reports generated yet.</AppText>
          ) : (
            dashboard.data?.reports.map((report) => {
              const start = dateFromLegacy(report.periodStart);
              const end = dateFromLegacy(report.periodEnd);
              return (
                <PressableScale
                  key={report.id}
                  accessibilityRole="button"
                  onPress={() => router.push(`/reports/${report.id}`)}
                  style={[styles.reportRow, { borderBottomColor: colors.line }]}
                >
                  <View style={[styles.reportIcon, { backgroundColor: colors.aquaSoft }]}>
                    <Icon name="database" color={colors.aqua} size={20} />
                  </View>
                  <View style={styles.reportCopy}>
                    <AppText variant="bodyStrong" color={colors.ink}>
                      {start?.toLocaleDateString()} – {end?.toLocaleDateString()}
                    </AppText>
                    <AppText variant="caption" color={colors.mutedInk} numberOfLines={1}>
                      {report.trainingSummary}
                    </AppText>
                  </View>
                  <Icon name="chevron" color={colors.mutedInk} size={17} />
                </PressableScale>
              );
            })
          )}
        </View>
        {generate.error ? (
          <View
            accessibilityRole="alert"
            style={[styles.error, { backgroundColor: colors.saffronSoft }]}
          >
            <AppText color={colors.ink}>
              {generate.error instanceof Error
                ? generate.error.message
                : 'The report could not be generated.'}
            </AppText>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  metric: {
    minWidth: '30%',
    flexGrow: 1,
    minHeight: 94,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    justifyContent: 'center',
  },
  analyticsCard: { borderWidth: 1, borderRadius: radii.xl, padding: spacing.lg, gap: spacing.sm },
  breakdownRow: {
    minHeight: 46,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  breakdownLabel: { flex: 1 },
  generator: { borderRadius: radii.xl, padding: spacing.xl, gap: spacing.lg },
  dateRow: { flexDirection: 'row', gap: spacing.sm },
  dateField: { flex: 1, gap: spacing.xs },
  reports: { gap: spacing.md },
  reportRow: {
    minHeight: 76,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  reportIcon: {
    width: 46,
    height: 46,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportCopy: { flex: 1 },
  error: { padding: spacing.md, borderRadius: radii.md },
});
