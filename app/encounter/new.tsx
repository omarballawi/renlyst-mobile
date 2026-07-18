import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { useDrugList, usePrimaryImageUris } from '@/features/library/queries';
import { trainingQueryKeys, useTrainingRepository } from '@/features/training/queries';
import {
  AppText,
  AppTextInput as TextInput,
  DrugThumbnail,
  Icon,
  PressableScale,
  PrimaryButton,
  Screen,
} from '@/ui/components';
import { fonts, radii, spacing, useTheme } from '@/ui/theme';

function NoteField({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText(value: string): void;
  placeholder: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.field}>
      <AppText variant="bodyStrong" color={colors.ink}>
        {label}
      </AppText>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedInk}
        multiline
        textAlignVertical="top"
        style={[
          styles.textArea,
          { color: colors.ink, borderColor: colors.line, backgroundColor: colors.surface },
        ]}
      />
    </View>
  );
}

export default function NewEncounterScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const repository = useTrainingRepository();
  const drugs = useDrugList({ sort: 'name' });
  const primaryImages = usePrimaryImageUris();
  const [topic, setTopic] = useState('');
  const [relatedDrugID, setRelatedDrugID] = useState<string | null>(null);
  const [whatHappened, setWhatHappened] = useState('');
  const [whatILearned, setWhatILearned] = useState('');
  const [pharmacistNote, setPharmacistNote] = useState('');
  const [privacyConfirmed, setPrivacyConfirmed] = useState(false);
  const save = useMutation({
    mutationFn: () =>
      repository.saveEncounter({
        topic,
        relatedDrugID,
        whatHappened,
        whatILearned,
        pharmacistNote,
        privacyConfirmed,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: trainingQueryKeys.all });
      router.back();
    },
  });

  return (
    <Screen safeBottom>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Close encounter note"
              onPress={() => router.back()}
              style={[styles.close, { borderColor: colors.line }]}
            >
              <AppText variant="heading" color={colors.ink}>
                ×
              </AppText>
            </PressableScale>
            <View style={styles.headerCopy}>
              <AppText variant="label" color={colors.aqua}>
                SUPERVISED LEARNING
              </AppText>
              <AppText variant="title" color={colors.ink}>
                Educational encounter.
              </AppText>
              <AppText color={colors.mutedInk}>
                Record what you observed and learned—not who the patient was.
              </AppText>
            </View>
          </View>

          <View style={[styles.privacyNotice, { backgroundColor: colors.saffronSoft }]}>
            <Icon name="warning" color={colors.saffron} />
            <AppText color={colors.ink} style={styles.privacyCopy}>
              Never enter a patient name, phone number, email, address, prescription number, or
              other identifying detail.
            </AppText>
          </View>

          <View style={styles.field}>
            <AppText variant="bodyStrong" color={colors.ink}>
              Topic
            </AppText>
            <TextInput
              accessibilityLabel="Encounter topic"
              value={topic}
              onChangeText={setTopic}
              placeholder="e.g. inhaler counseling"
              placeholderTextColor={colors.mutedInk}
              style={[
                styles.input,
                { color: colors.ink, borderColor: colors.line, backgroundColor: colors.surface },
              ]}
            />
          </View>

          <View style={styles.field}>
            <AppText variant="bodyStrong" color={colors.ink}>
              Related drug <AppText color={colors.mutedInk}>(optional)</AppText>
            </AppText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
            >
              <PressableScale
                accessibilityRole="button"
                accessibilityState={{ selected: relatedDrugID === null }}
                onPress={() => setRelatedDrugID(null)}
                style={[
                  styles.chip,
                  { borderColor: relatedDrugID === null ? colors.coral : colors.line },
                ]}
              >
                <AppText
                  variant="caption"
                  color={relatedDrugID === null ? colors.coral : colors.ink}
                >
                  None
                </AppText>
              </PressableScale>
              {drugs.data?.map((drug) => {
                const selected = drug.id === relatedDrugID;
                return (
                  <PressableScale
                    key={drug.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setRelatedDrugID(drug.id)}
                    style={[styles.chip, { borderColor: selected ? colors.coral : colors.line }]}
                  >
                    <DrugThumbnail
                      id={drug.id}
                      name={drug.scientificName || drug.captureLabel}
                      uri={primaryImages.data?.[drug.id]}
                      size={30}
                      unknown={drug.isUnknown}
                    />
                    <AppText variant="caption" color={selected ? colors.coral : colors.ink}>
                      {drug.scientificName.trim() || drug.captureLabel}
                    </AppText>
                  </PressableScale>
                );
              })}
            </ScrollView>
          </View>

          <NoteField
            label="What happened"
            value={whatHappened}
            onChangeText={setWhatHappened}
            placeholder="No patient details"
          />
          <NoteField
            label="What I learned"
            value={whatILearned}
            onChangeText={setWhatILearned}
            placeholder="The clinical or counseling lesson"
          />
          <NoteField
            label="Pharmacist note"
            value={pharmacistNote}
            onChangeText={setPharmacistNote}
            placeholder="Supervising pharmacist’s educational point"
          />

          <PressableScale
            accessibilityRole="switch"
            accessibilityLabel="No identifying data"
            accessibilityHint="Confirms this note contains no patient-identifying information."
            accessibilityState={{ checked: privacyConfirmed }}
            onPress={() => setPrivacyConfirmed((value) => !value)}
            style={[
              styles.confirmation,
              {
                borderColor: privacyConfirmed ? colors.aqua : colors.line,
                backgroundColor: privacyConfirmed ? colors.aquaSoft : colors.surface,
              },
            ]}
          >
            <View style={styles.confirmCopy}>
              <AppText variant="bodyStrong" color={colors.ink}>
                No identifying data
              </AppText>
              <AppText variant="caption" color={colors.mutedInk}>
                I confirm this note contains no patient-identifying information.
              </AppText>
            </View>
            <Switch
              accessible={false}
              value={privacyConfirmed}
              onValueChange={setPrivacyConfirmed}
              trackColor={{ true: colors.aqua }}
            />
          </PressableScale>

          {save.error ? (
            <View
              accessibilityRole="alert"
              style={[styles.error, { backgroundColor: colors.saffronSoft }]}
            >
              <AppText color={colors.ink}>
                {save.error instanceof Error ? save.error.message : 'The note could not be saved.'}
              </AppText>
            </View>
          ) : null}
          <PrimaryButton
            label={save.isPending ? 'Saving note…' : 'Save encounter note'}
            icon="check"
            disabled={save.isPending || !topic.trim() || !privacyConfirmed}
            onPress={() => save.mutate()}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.section, gap: spacing.xl },
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
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  privacyCopy: { flex: 1 },
  field: { gap: spacing.xs },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    fontFamily: fonts.body,
    fontSize: 16,
  },
  textArea: {
    minHeight: 112,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    fontFamily: fonts.body,
    fontSize: 16,
  },
  chips: { gap: spacing.xs, paddingRight: spacing.lg },
  chip: {
    minHeight: 42,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    justifyContent: 'center',
  },
  confirmation: {
    minHeight: 76,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  confirmCopy: { flex: 1 },
  error: { padding: spacing.md, borderRadius: radii.md },
});
