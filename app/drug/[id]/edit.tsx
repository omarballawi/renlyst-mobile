import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Controller, useForm, type Control, type FieldPath } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { z } from 'zod';

import { masteryCount, requiredMasteryCount } from '@/domain/drugs/mastery';
import { drugQueryKeys, useDrug, useDrugRepository } from '@/features/library/queries';
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

const chapters = [
  'Cardiovascular',
  'Respiratory',
  'Endocrine',
  'Musculoskeletal',
  'Eye',
  'Ear/Nose/Oropharynx',
  'Gastrointestinal',
  'Dermatology',
  'Antibiotics',
  'OTC',
  'Vitamins/Supplements',
  'Other',
] as const;
const bands = ['Unknown', 'Short', 'Medium', 'Long', 'Very long'] as const;
const onsetBands = ['Unknown', 'Fast', 'Moderate', 'Slow'] as const;
const frequency = [
  'Unknown',
  'Once daily',
  'Twice daily',
  'Three times daily',
  'Four times daily',
  'PRN',
  'Other',
] as const;
const prodrugStatuses = ['Unknown', 'Active', 'Prodrug'] as const;
const excretionRoutes = ['Unknown', 'Renal', 'Hepatic', 'Mixed'] as const;
const severities = ['Unknown', 'Low', 'Medium', 'High'] as const;
const safetyFlags = [
  'Anticoagulant / antiplatelet',
  'Insulin',
  'Corticosteroid',
  'Pregnancy',
  'Children',
  'Controlled drug',
  'Severe symptoms',
] as const;

const editorSchema = z.object({
  isUnknown: z.boolean(),
  captureLabel: z.string(),
  scientificName: z.string(),
  chapterRaw: z.string(),
  drugClass: z.string(),
  dosageForms: z.string(),
  strengths: z.string(),
  routes: z.string(),
  shelfLocation: z.string(),
  indications: z.string(),
  mechanism: z.string(),
  howToTake: z.string(),
  foodInstruction: z.string(),
  dosingFrequencyRaw: z.string(),
  timesPerDay: z.string(),
  arabicExplanation: z.string(),
  arabicMechanism: z.string(),
  halfLifeHours: z.string(),
  halfLifeBandRaw: z.string(),
  halfLifeText: z.string(),
  onsetMinutes: z.string(),
  onsetBandRaw: z.string(),
  onsetText: z.string(),
  durationHours: z.string(),
  durationBandRaw: z.string(),
  durationText: z.string(),
  prodrugStatusRaw: z.string(),
  excretionRouteRaw: z.string(),
  excretionNotes: z.string(),
  contraindications: z.string(),
  contraindicationSeverityRaw: z.string(),
  toxicity: z.string(),
  toxicitySeverityRaw: z.string(),
  warnings: z.string(),
  warningSeverityRaw: z.string(),
  interactions: z.string(),
  interactionSeverityRaw: z.string(),
  renalCaution: z.string(),
  renalSeverityRaw: z.string(),
  hepaticCaution: z.string(),
  hepaticSeverityRaw: z.string(),
  pregnancyCaution: z.string(),
  pregnancySeverityRaw: z.string(),
  safetyFlagsRaw: z.array(z.string()),
  counselingSentence: z.string(),
  arabicCounseling: z.string(),
  patientQuestions: z.string(),
  commonSideEffects: z.string(),
  seriousSideEffects: z.string(),
  notes: z.string(),
  arabicPersonalNotes: z.string(),
  masteryScientificName: z.boolean(),
  masteryTradeName: z.boolean(),
  masteryClass: z.boolean(),
  masteryUse: z.boolean(),
  masteryWarning: z.boolean(),
  masteryCounseling: z.boolean(),
});

type EditorValues = z.infer<typeof editorSchema>;
type EditorSection = 'Basics' | 'Uses' | 'PK' | 'Safety' | 'Counseling' | 'My notes';
const editorSections: readonly EditorSection[] = [
  'Basics',
  'Uses',
  'PK',
  'Safety',
  'Counseling',
  'My notes',
];

function lines(value: string): string[] {
  return value
    .split(/\n|,/u)
    .map((item) => item.trim())
    .filter(Boolean);
}

function optionalNumber(value: string, label: string): number | null {
  if (!value.trim()) return null;
  const number = Number(value.replace(',', '.'));
  if (!Number.isFinite(number) || number < 0)
    throw new Error(`${label} must be a positive number.`);
  return number;
}

function optionalInteger(value: string, label: string): number | null {
  const number = optionalNumber(value, label);
  if (number !== null && !Number.isInteger(number))
    throw new Error(`${label} must be a whole number.`);
  return number;
}

function Field({
  label,
  value,
  onChangeText,
  multiline = false,
  hint,
  rtl = false,
}: {
  label: string;
  value: string;
  onChangeText(value: string): void;
  multiline?: boolean;
  hint?: string;
  rtl?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.field}>
      <AppText variant="bodyStrong" color={colors.ink}>
        {label}
      </AppText>
      {hint ? (
        <AppText variant="caption" color={colors.mutedInk}>
          {hint}
        </AppText>
      ) : null}
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        textAlign={rtl ? 'right' : 'left'}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[
          styles.input,
          multiline && styles.multiline,
          rtl && styles.rtl,
          { color: colors.ink, borderColor: colors.line, backgroundColor: colors.surface },
        ]}
      />
    </View>
  );
}

function ControlledField({
  control,
  name,
  label,
  multiline,
  hint,
  rtl,
}: {
  control: Control<EditorValues>;
  name: FieldPath<EditorValues>;
  label: string;
  multiline?: boolean;
  hint?: string;
  rtl?: boolean;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Field
          label={label}
          value={typeof field.value === 'string' ? field.value : ''}
          onChangeText={field.onChange}
          {...(multiline === undefined ? {} : { multiline })}
          {...(hint === undefined ? {} : { hint })}
          {...(rtl === undefined ? {} : { rtl })}
        />
      )}
    />
  );
}

function ChoiceField({
  control,
  name,
  label,
  values,
}: {
  control: Control<EditorValues>;
  name: FieldPath<EditorValues>;
  label: string;
  values: readonly string[];
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.field}>
      <AppText variant="bodyStrong" color={colors.ink}>
        {label}
      </AppText>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <View style={styles.choices}>
            {values.map((value) => {
              const selected = field.value === value;
              return (
                <PressableScale
                  key={value}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => field.onChange(value)}
                  style={[
                    styles.choice,
                    {
                      backgroundColor: selected ? colors.ink : colors.surface,
                      borderColor: selected ? colors.ink : colors.line,
                    },
                  ]}
                >
                  <AppText variant="caption" color={selected ? colors.canvas : colors.ink}>
                    {value}
                  </AppText>
                </PressableScale>
              );
            })}
          </View>
        )}
      />
    </View>
  );
}

function ToggleField({
  control,
  name,
  label,
  detail,
}: {
  control: Control<EditorValues>;
  name: FieldPath<EditorValues>;
  label: string;
  detail?: string;
}) {
  const { colors } = useTheme();
  const { t } = useLocale();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <View style={[styles.toggleRow, { borderBottomColor: colors.line }]}>
          <View style={styles.toggleCopy}>
            <AppText variant="bodyStrong" color={colors.ink}>
              {label}
            </AppText>
            {detail ? (
              <AppText variant="caption" color={colors.mutedInk}>
                {detail}
              </AppText>
            ) : null}
          </View>
          <Switch
            accessibilityLabel={t(label)}
            value={Boolean(field.value)}
            onValueChange={field.onChange}
            trackColor={{ true: colors.aqua }}
          />
        </View>
      )}
    />
  );
}

function SectionHeading({ title, detail }: { title: string; detail: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.sectionHeading}>
      <AppText variant="heading" color={colors.ink}>
        {title}
      </AppText>
      <AppText color={colors.mutedInk}>{detail}</AppText>
    </View>
  );
}

export default function DrugEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const repository = useDrugRepository();
  const queryClient = useQueryClient();
  const drug = useDrug(id);
  const [section, setSection] = useState<EditorSection>('Basics');
  const form = useForm<EditorValues>({
    defaultValues: {
      isUnknown: false,
      captureLabel: '',
      scientificName: '',
      chapterRaw: 'Other',
      drugClass: '',
      dosageForms: '',
      strengths: '',
      routes: '',
      shelfLocation: '',
      indications: '',
      mechanism: '',
      howToTake: '',
      foodInstruction: '',
      dosingFrequencyRaw: 'Unknown',
      timesPerDay: '',
      arabicExplanation: '',
      arabicMechanism: '',
      halfLifeHours: '',
      halfLifeBandRaw: 'Unknown',
      halfLifeText: '',
      onsetMinutes: '',
      onsetBandRaw: 'Unknown',
      onsetText: '',
      durationHours: '',
      durationBandRaw: 'Unknown',
      durationText: '',
      prodrugStatusRaw: 'Unknown',
      excretionRouteRaw: 'Unknown',
      excretionNotes: '',
      contraindications: '',
      contraindicationSeverityRaw: 'Unknown',
      toxicity: '',
      toxicitySeverityRaw: 'Unknown',
      warnings: '',
      warningSeverityRaw: 'Unknown',
      interactions: '',
      interactionSeverityRaw: 'Unknown',
      renalCaution: '',
      renalSeverityRaw: 'Unknown',
      hepaticCaution: '',
      hepaticSeverityRaw: 'Unknown',
      pregnancyCaution: '',
      pregnancySeverityRaw: 'Unknown',
      safetyFlagsRaw: [],
      counselingSentence: '',
      arabicCounseling: '',
      patientQuestions: '',
      commonSideEffects: '',
      seriousSideEffects: '',
      notes: '',
      arabicPersonalNotes: '',
      masteryScientificName: false,
      masteryTradeName: false,
      masteryClass: false,
      masteryUse: false,
      masteryWarning: false,
      masteryCounseling: false,
    },
  });

  useEffect(() => {
    const value = drug.data;
    if (!value) return;
    form.reset({
      isUnknown: value.isUnknown,
      captureLabel: value.captureLabel,
      scientificName: value.scientificName,
      chapterRaw: value.chapterRaw || 'Other',
      drugClass: value.drugClass,
      dosageForms: value.dosageForms.join('\n'),
      strengths: value.strengths.join('\n'),
      routes: value.routes.join('\n'),
      shelfLocation: value.shelfLocation,
      indications: value.indications.join('\n'),
      mechanism: value.mechanism,
      howToTake: value.howToTake,
      foodInstruction: value.foodInstruction,
      dosingFrequencyRaw: value.dosingFrequencyRaw,
      timesPerDay: value.timesPerDay?.toString() ?? '',
      arabicExplanation: value.arabicExplanation,
      arabicMechanism: value.arabicMechanism,
      halfLifeHours: value.halfLifeHours?.toString() ?? '',
      halfLifeBandRaw: value.halfLifeBandRaw,
      halfLifeText: value.halfLifeText,
      onsetMinutes: value.onsetMinutes?.toString() ?? '',
      onsetBandRaw: value.onsetBandRaw,
      onsetText: value.onsetText,
      durationHours: value.durationHours?.toString() ?? '',
      durationBandRaw: value.durationBandRaw,
      durationText: value.durationText,
      prodrugStatusRaw: value.prodrugStatusRaw,
      excretionRouteRaw: value.excretionRouteRaw,
      excretionNotes: value.excretionNotes,
      contraindications: value.contraindications.join('\n'),
      contraindicationSeverityRaw: value.contraindicationSeverityRaw,
      toxicity: value.toxicity,
      toxicitySeverityRaw: value.toxicitySeverityRaw,
      warnings: value.warnings.join('\n'),
      warningSeverityRaw: value.warningSeverityRaw,
      interactions: value.interactions.join('\n'),
      interactionSeverityRaw: value.interactionSeverityRaw,
      renalCaution: value.renalCaution,
      renalSeverityRaw: value.renalSeverityRaw,
      hepaticCaution: value.hepaticCaution,
      hepaticSeverityRaw: value.hepaticSeverityRaw,
      pregnancyCaution: value.pregnancyCaution,
      pregnancySeverityRaw: value.pregnancySeverityRaw,
      safetyFlagsRaw: value.safetyFlagsRaw,
      counselingSentence: value.counselingSentence,
      arabicCounseling: value.arabicCounseling,
      patientQuestions: value.patientQuestions.join('\n'),
      commonSideEffects: value.commonSideEffects.join('\n'),
      seriousSideEffects: value.seriousSideEffects.join('\n'),
      notes: value.notes,
      arabicPersonalNotes: value.arabicPersonalNotes,
      masteryScientificName: value.masteryScientificName,
      masteryTradeName: value.masteryTradeName,
      masteryClass: value.masteryClass,
      masteryUse: value.masteryUse,
      masteryWarning: value.masteryWarning,
      masteryCounseling: value.masteryCounseling,
    });
  }, [drug.data, form]);

  const save = useMutation({
    mutationFn: async (input: EditorValues) => {
      const values = editorSchema.parse(input);
      if (!drug.data) throw new Error('This profile is no longer available.');
      const name = values.scientificName.trim();
      if (!values.isUnknown && !name) {
        throw new Error('Add the active-drug name, or keep this profile marked Unknown.');
      }
      const learningBefore = JSON.stringify({
        indications: drug.data.indications,
        mechanism: drug.data.mechanism,
        warnings: drug.data.warnings,
        counselingSentence: drug.data.counselingSentence,
      });
      let updated = {
        ...drug.data,
        isUnknown: !name && values.isUnknown,
        captureLabel: values.captureLabel.trim(),
        scientificName: name,
        activeIngredients: name
          ? name
              .split(/\s*\+\s*/u)
              .map((ingredient) => ingredient.trim())
              .filter(Boolean)
          : [],
        chapterRaw: values.chapterRaw,
        drugClass: values.drugClass.trim(),
        dosageForms: lines(values.dosageForms),
        strengths: lines(values.strengths),
        routes: lines(values.routes),
        shelfLocation: values.shelfLocation.trim(),
        indications: lines(values.indications),
        mechanism: values.mechanism.trim(),
        howToTake: values.howToTake.trim(),
        foodInstruction: values.foodInstruction.trim(),
        dosingFrequencyRaw: values.dosingFrequencyRaw,
        timesPerDay: optionalInteger(values.timesPerDay, 'Times per day'),
        arabicExplanation: values.arabicExplanation.trim(),
        arabicMechanism: values.arabicMechanism.trim(),
        halfLifeHours: optionalNumber(values.halfLifeHours, 'Half-life'),
        halfLifeBandRaw: values.halfLifeBandRaw,
        halfLifeText: values.halfLifeText.trim(),
        onsetMinutes: optionalNumber(values.onsetMinutes, 'Onset'),
        onsetBandRaw: values.onsetBandRaw,
        onsetText: values.onsetText.trim(),
        durationHours: optionalNumber(values.durationHours, 'Duration'),
        durationBandRaw: values.durationBandRaw,
        durationText: values.durationText.trim(),
        prodrugStatusRaw: values.prodrugStatusRaw,
        excretionRouteRaw: values.excretionRouteRaw,
        excretionNotes: values.excretionNotes.trim(),
        contraindications: lines(values.contraindications),
        contraindicationSeverityRaw: values.contraindicationSeverityRaw,
        toxicity: values.toxicity.trim(),
        toxicitySeverityRaw: values.toxicitySeverityRaw,
        warnings: lines(values.warnings),
        warningSeverityRaw: values.warningSeverityRaw,
        interactions: lines(values.interactions),
        interactionSeverityRaw: values.interactionSeverityRaw,
        renalCaution: values.renalCaution.trim(),
        renalSeverityRaw: values.renalSeverityRaw,
        hepaticCaution: values.hepaticCaution.trim(),
        hepaticSeverityRaw: values.hepaticSeverityRaw,
        pregnancyCaution: values.pregnancyCaution.trim(),
        pregnancySeverityRaw: values.pregnancySeverityRaw,
        safetyFlagsRaw: values.safetyFlagsRaw,
        counselingSentence: values.counselingSentence.trim(),
        arabicCounseling: values.arabicCounseling.trim(),
        patientQuestions: lines(values.patientQuestions),
        commonSideEffects: lines(values.commonSideEffects),
        seriousSideEffects: lines(values.seriousSideEffects),
        notes: values.notes.trim(),
        arabicPersonalNotes: values.arabicPersonalNotes.trim(),
        masteryScientificName: values.masteryScientificName,
        masteryTradeName: values.masteryTradeName,
        masteryClass: values.masteryClass,
        masteryUse: values.masteryUse,
        masteryWarning: values.masteryWarning,
        masteryCounseling: values.masteryCounseling,
      };
      const count = masteryCount(updated);
      const required = requiredMasteryCount(updated);
      updated = {
        ...updated,
        confidenceRaw:
          count >= required ? 'Mastered' : count >= 4 ? 'Strong' : count >= 2 ? 'Medium' : 'Weak',
      };
      const learningAfter = JSON.stringify({
        indications: updated.indications,
        mechanism: updated.mechanism,
        warnings: updated.warnings,
        counselingSentence: updated.counselingSentence,
      });
      if (updated.reviewQuestionsJSON.trim() && learningBefore !== learningAfter) {
        updated.reviewQuestionsNeedRegeneration = true;
      }
      await repository.save(updated);
      return updated;
    },
    onSuccess: async (updated) => {
      queryClient.setQueryData(drugQueryKeys.detail(updated.id), updated);
      await queryClient.invalidateQueries({ queryKey: drugQueryKeys.lists() });
      await queryClient.invalidateQueries({ queryKey: drugQueryKeys.summary() });
      router.back();
    },
  });

  if (!drug.data) {
    return (
      <Screen>
        <View style={styles.center}>
          <AppText color={colors.mutedInk}>
            {drug.isLoading ? 'Opening editor…' : 'Profile not found.'}
          </AppText>
        </View>
      </Screen>
    );
  }

  const controls = form.control;
  return (
    <Screen safeBottom>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          stickyHeaderIndices={[1]}
          contentContainerStyle={styles.content}
        >
          <View style={styles.header}>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Cancel editing"
              onPress={() => router.back()}
            >
              <AppText variant="bodyStrong" color={colors.aqua}>
                Cancel
              </AppText>
            </PressableScale>
            <View style={styles.headerTitle}>
              <AppText variant="label" color={colors.coral}>
                MANUAL CORRECTION
              </AppText>
              <AppText variant="heading" color={colors.ink}>
                Edit profile
              </AppText>
            </View>
            <View style={styles.headerSpacer} />
          </View>
          <View style={[styles.tabsShell, { backgroundColor: colors.canvas }]}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabs}
            >
              {editorSections.map((value) => (
                <PressableScale
                  key={value}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: value === section }}
                  onPress={() => setSection(value)}
                  style={[
                    styles.tab,
                    {
                      backgroundColor: value === section ? colors.ink : colors.surface,
                      borderColor: value === section ? colors.ink : colors.line,
                    },
                  ]}
                >
                  <AppText variant="caption" color={value === section ? colors.canvas : colors.ink}>
                    {value}
                  </AppText>
                </PressableScale>
              ))}
            </ScrollView>
          </View>

          {section === 'Basics' ? (
            <View style={styles.section}>
              <SectionHeading
                title="Identity & package context"
                detail="Brand names and product strengths remain authoritative in their separate brand records."
              />
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Edit profile package photos"
                onPress={() => router.push(`/drug/${id}/photos`)}
                style={[
                  styles.photoLink,
                  { borderColor: colors.line, backgroundColor: colors.surface },
                ]}
              >
                <View style={styles.photoLinkCopy}>
                  <AppText variant="bodyStrong" color={colors.ink}>
                    Package photos
                  </AppText>
                  <AppText variant="caption" color={colors.mutedInk}>
                    Camera, library, crop, rotate, remove · up to eight
                  </AppText>
                </View>
                <Icon name="chevron" color={colors.aqua} size={18} />
              </PressableScale>
              <ToggleField
                control={controls}
                name="isUnknown"
                label="Unknown drug"
                detail="Keep this on only while the active ingredient is missing."
              />
              <ControlledField control={controls} name="captureLabel" label="Capture label" />
              <ControlledField control={controls} name="scientificName" label="Active ingredient" />
              <ChoiceField
                control={controls}
                name="chapterRaw"
                label="System / chapter"
                values={chapters}
              />
              <ControlledField control={controls} name="drugClass" label="Drug class" />
              <ControlledField
                control={controls}
                name="dosageForms"
                label="Dosage forms"
                hint="One per line"
                multiline
              />
              <ControlledField
                control={controls}
                name="strengths"
                label="Strengths"
                hint="One per line"
                multiline
              />
              <ControlledField
                control={controls}
                name="routes"
                label="Routes"
                hint="One per line"
                multiline
              />
              <ControlledField control={controls} name="shelfLocation" label="Shelf location" />
            </View>
          ) : null}

          {section === 'Uses' ? (
            <View style={styles.section}>
              <SectionHeading
                title="Uses & mechanism"
                detail="Changing reviewable learning content marks generated questions for regeneration."
              />
              <ControlledField
                control={controls}
                name="indications"
                label="Indications / uses"
                hint="One per line"
                multiline
              />
              <ControlledField control={controls} name="mechanism" label="Mechanism" multiline />
              <ControlledField control={controls} name="howToTake" label="How to take" multiline />
              <ControlledField
                control={controls}
                name="foodInstruction"
                label="Food instructions"
                multiline
              />
              <ChoiceField
                control={controls}
                name="dosingFrequencyRaw"
                label="Dosing frequency"
                values={frequency}
              />
              <ControlledField
                control={controls}
                name="timesPerDay"
                label="Times per day · optional"
              />
              <ControlledField
                control={controls}
                name="arabicExplanation"
                label="الشرح بالعربية"
                multiline
                rtl
              />
              <ControlledField
                control={controls}
                name="arabicMechanism"
                label="شرح آلية العمل بالعربية"
                multiline
                rtl
              />
            </View>
          ) : null}

          {section === 'PK' ? (
            <View style={styles.section}>
              <SectionHeading
                title="Pharmacokinetics"
                detail="Keep numeric scales separate from exact source notes."
              />
              <ControlledField control={controls} name="halfLifeHours" label="Half-life · hours" />
              <ChoiceField
                control={controls}
                name="halfLifeBandRaw"
                label="Half-life band"
                values={bands}
              />
              <ControlledField
                control={controls}
                name="halfLifeText"
                label="Half-life note"
                multiline
              />
              <ControlledField control={controls} name="onsetMinutes" label="Onset · minutes" />
              <ChoiceField
                control={controls}
                name="onsetBandRaw"
                label="Onset band"
                values={onsetBands}
              />
              <ControlledField control={controls} name="onsetText" label="Onset note" multiline />
              <ControlledField control={controls} name="durationHours" label="Duration · hours" />
              <ChoiceField
                control={controls}
                name="durationBandRaw"
                label="Duration band"
                values={bands.slice(0, 4)}
              />
              <ControlledField
                control={controls}
                name="durationText"
                label="Duration note"
                multiline
              />
              <ChoiceField
                control={controls}
                name="prodrugStatusRaw"
                label="Active drug or prodrug"
                values={prodrugStatuses}
              />
              <ChoiceField
                control={controls}
                name="excretionRouteRaw"
                label="Dominant excretion"
                values={excretionRoutes}
              />
              <ControlledField
                control={controls}
                name="excretionNotes"
                label="Metabolism & excretion notes"
                multiline
              />
            </View>
          ) : null}

          {section === 'Safety' ? (
            <View style={styles.section}>
              <SectionHeading
                title="Safety"
                detail="Severity is stored separately from the evidence text."
              />
              <ChoiceField
                control={controls}
                name="contraindicationSeverityRaw"
                label="Contraindication severity"
                values={severities}
              />
              <ControlledField
                control={controls}
                name="contraindications"
                label="Contraindications"
                hint="One per line"
                multiline
              />
              <ChoiceField
                control={controls}
                name="toxicitySeverityRaw"
                label="Toxicity severity"
                values={severities}
              />
              <ControlledField control={controls} name="toxicity" label="Toxicity" multiline />
              <ChoiceField
                control={controls}
                name="warningSeverityRaw"
                label="Warning severity"
                values={severities}
              />
              <ControlledField
                control={controls}
                name="warnings"
                label="Warnings"
                hint="One per line"
                multiline
              />
              <ChoiceField
                control={controls}
                name="interactionSeverityRaw"
                label="Interaction severity"
                values={severities}
              />
              <ControlledField
                control={controls}
                name="interactions"
                label="Interactions"
                hint="One per line"
                multiline
              />
              <ChoiceField
                control={controls}
                name="renalSeverityRaw"
                label="Renal severity"
                values={severities}
              />
              <ControlledField
                control={controls}
                name="renalCaution"
                label="Renal caution"
                multiline
              />
              <ChoiceField
                control={controls}
                name="hepaticSeverityRaw"
                label="Hepatic severity"
                values={severities}
              />
              <ControlledField
                control={controls}
                name="hepaticCaution"
                label="Hepatic caution"
                multiline
              />
              <ChoiceField
                control={controls}
                name="pregnancySeverityRaw"
                label="Pregnancy severity"
                values={severities}
              />
              <ControlledField
                control={controls}
                name="pregnancyCaution"
                label="Pregnancy caution"
                multiline
              />
              <View style={styles.field}>
                <AppText variant="bodyStrong" color={colors.ink}>
                  Legacy safety flags
                </AppText>
                <Controller
                  control={controls}
                  name="safetyFlagsRaw"
                  render={({ field }) => (
                    <View style={styles.choices}>
                      {safetyFlags.map((flag) => {
                        const selected = field.value.includes(flag);
                        return (
                          <PressableScale
                            key={flag}
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: selected }}
                            onPress={() =>
                              field.onChange(
                                selected
                                  ? field.value.filter((value) => value !== flag)
                                  : [...field.value, flag],
                              )
                            }
                            style={[
                              styles.choice,
                              {
                                backgroundColor: selected ? colors.saffronSoft : colors.surface,
                                borderColor: selected ? colors.saffron : colors.line,
                              },
                            ]}
                          >
                            <AppText variant="caption" color={colors.ink}>
                              {flag}
                            </AppText>
                          </PressableScale>
                        );
                      })}
                    </View>
                  )}
                />
              </View>
            </View>
          ) : null}

          {section === 'Counseling' ? (
            <View style={styles.section}>
              <SectionHeading
                title="Counseling & adverse effects"
                detail="Use concise, patient-facing language and keep serious effects separate."
              />
              <ControlledField
                control={controls}
                name="counselingSentence"
                label="Counseling sentence"
                multiline
              />
              <ControlledField
                control={controls}
                name="arabicCounseling"
                label="جملة الإرشاد بالعربية"
                multiline
                rtl
              />
              <ControlledField
                control={controls}
                name="patientQuestions"
                label="Patient questions"
                hint="One per line"
                multiline
              />
              <ControlledField
                control={controls}
                name="commonSideEffects"
                label="Common adverse effects"
                hint="One per line"
                multiline
              />
              <ControlledField
                control={controls}
                name="seriousSideEffects"
                label="Serious adverse effects"
                hint="One per line"
                multiline
              />
            </View>
          ) : null}

          {section === 'My notes' ? (
            <View style={styles.section}>
              <SectionHeading
                title="Personal notes & mastery"
                detail="Private notes stay local. Mastery changes recalculate confidence immediately."
              />
              <ControlledField control={controls} name="notes" label="My notes" multiline />
              <ControlledField
                control={controls}
                name="arabicPersonalNotes"
                label="ملاحظاتي بالعربية"
                multiline
                rtl
              />
              <ToggleField
                control={controls}
                name="masteryScientificName"
                label="Scientific name"
              />
              <ToggleField control={controls} name="masteryTradeName" label="Trade name" />
              <ToggleField control={controls} name="masteryClass" label="Class" />
              <ToggleField control={controls} name="masteryUse" label="Use" />
              <ToggleField control={controls} name="masteryWarning" label="Warning" />
              <ToggleField control={controls} name="masteryCounseling" label="Counseling" />
            </View>
          ) : null}

          {save.error ? (
            <View
              accessibilityRole="alert"
              style={[styles.error, { backgroundColor: colors.saffronSoft }]}
            >
              <AppText color={colors.ink}>
                {save.error instanceof Error
                  ? save.error.message
                  : 'The profile could not be saved.'}
              </AppText>
            </View>
          ) : null}
          <PrimaryButton
            label={save.isPending ? 'Saving changes…' : 'Save profile'}
            icon="check"
            disabled={save.isPending}
            onPress={() => void form.handleSubmit((values) => save.mutate(values))()}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.lg, paddingBottom: spacing.section, gap: spacing.lg },
  header: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { alignItems: 'center' },
  headerSpacer: { width: 52 },
  tabsShell: { marginHorizontal: -spacing.lg, paddingVertical: spacing.sm },
  tabs: { paddingHorizontal: spacing.lg, gap: spacing.xs },
  tab: {
    minHeight: 42,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderRadius: radii.pill,
    justifyContent: 'center',
  },
  section: { gap: spacing.lg },
  sectionHeading: { gap: spacing.xs },
  field: { gap: spacing.xs },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: fonts.body,
    fontSize: 16,
  },
  multiline: { minHeight: 112 },
  rtl: { writingDirection: 'rtl' },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  choice: {
    minHeight: 42,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderRadius: radii.pill,
    justifyContent: 'center',
  },
  toggleRow: {
    minHeight: 64,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  toggleCopy: { flex: 1, gap: 2 },
  photoLink: {
    minHeight: 72,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  photoLinkCopy: { flex: 1 },
  error: { padding: spacing.md, borderRadius: radii.md },
});
