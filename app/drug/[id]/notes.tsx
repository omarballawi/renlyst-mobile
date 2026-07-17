import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import {
  addAtomicNote,
  atomicNoteDate,
  atomicNoteFields,
  atomicNoteKinds,
  readAtomicNotes,
  removeAtomicNote,
  type AtomicNoteField,
  type AtomicNoteKind,
} from '@/domain/drugs/atomicNotes';
import { drugQueryKeys, useDrug, useDrugRepository } from '@/features/library/queries';
import { useLocale } from '@/localization/LocaleProvider';
import {
  AppText,
  AppTextInput as TextInput,
  EmptyState,
  PressableScale,
  PrimaryButton,
  Screen,
} from '@/ui/components';
import { fonts, radii, spacing, useTheme } from '@/ui/theme';

function ChoiceChip({
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
        styles.chip,
        {
          backgroundColor: selected ? colors.ink : colors.surface,
          borderColor: selected ? colors.ink : colors.line,
        },
      ]}
    >
      <AppText variant="caption" color={selected ? colors.canvas : colors.ink}>
        {label}
      </AppText>
    </PressableScale>
  );
}

export default function AtomicNotesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const repository = useDrugRepository();
  const drug = useDrug(id);
  const [kind, setKind] = useState<AtomicNoteKind>('Memory trick');
  const [field, setField] = useState<AtomicNoteField>('General');
  const [text, setText] = useState('');
  const [context, setContext] = useState('');
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async () => {
      if (!drug.data) throw new Error('The profile is no longer available.');
      if (!text.trim()) throw new Error('Write one small, specific note first.');
      const updated = addAtomicNote(drug.data, {
        id: Crypto.randomUUID(),
        kindRaw: kind,
        linkedField: field,
        text,
        context,
      });
      await repository.save(updated);
      return updated;
    },
    onSuccess: async (updated) => {
      queryClient.setQueryData(drugQueryKeys.detail(id), updated);
      await queryClient.invalidateQueries({ queryKey: drugQueryKeys.lists() });
      setText('');
      setContext('');
      setError(null);
    },
    onError: (reason) =>
      setError(reason instanceof Error ? reason.message : 'The note could not be saved.'),
  });

  const remove = useMutation({
    mutationFn: async (noteID: string) => {
      if (!drug.data) throw new Error('The profile is no longer available.');
      const updated = removeAtomicNote(drug.data, noteID);
      await repository.save(updated);
      return updated;
    },
    onSuccess: async (updated) => {
      queryClient.setQueryData(drugQueryKeys.detail(id), updated);
      await queryClient.invalidateQueries({ queryKey: drugQueryKeys.lists() });
      setError(null);
    },
    onError: (reason) =>
      setError(reason instanceof Error ? reason.message : 'The note could not be deleted.'),
  });

  const notes = drug.data ? readAtomicNotes(drug.data) : [];
  const confirmDelete = (noteID: string) => {
    Alert.alert(
      t('Delete linked note?'),
      t('This removes the note from this profile and future backups.'),
      [
        { text: t('Cancel'), style: 'cancel' },
        { text: t('Delete'), style: 'destructive', onPress: () => remove.mutate(noteID) },
      ],
    );
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
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

          <View style={styles.header}>
            <AppText variant="label" color={colors.coral}>
              ONE FACT AT A TIME
            </AppText>
            <AppText variant="display" color={colors.ink}>
              Atomic notes
            </AppText>
            <AppText color={colors.mutedInk}>
              Attach a small memory, correction, or shelf observation to one part of{' '}
              {drug.data?.scientificName || 'this profile'}.
            </AppText>
          </View>

          <View
            style={[styles.editor, { backgroundColor: colors.surface, borderColor: colors.line }]}
          >
            <View style={styles.fieldGroup}>
              <AppText variant="label" color={colors.mutedInk}>
                NOTE TYPE
              </AppText>
              <View style={styles.chips}>
                {atomicNoteKinds.map((value) => (
                  <ChoiceChip
                    key={value}
                    label={value}
                    selected={kind === value}
                    onPress={() => setKind(value)}
                  />
                ))}
              </View>
            </View>
            <View style={styles.fieldGroup}>
              <AppText variant="label" color={colors.mutedInk}>
                LINKED FIELD
              </AppText>
              <View style={styles.chips}>
                {atomicNoteFields.map((value) => (
                  <ChoiceChip
                    key={value}
                    label={value}
                    selected={field === value}
                    onPress={() => setField(value)}
                  />
                ))}
              </View>
            </View>
            <View style={styles.fieldGroup}>
              <AppText variant="label" color={colors.mutedInk}>
                SPECIFIC NOTE
              </AppText>
              <TextInput
                accessibilityLabel="One small specific note"
                value={text}
                onChangeText={setText}
                multiline
                placeholder="Example: Take with a full glass of water."
                placeholderTextColor={colors.mutedInk}
                style={[
                  styles.input,
                  styles.noteInput,
                  { color: colors.ink, borderColor: colors.line },
                ]}
              />
            </View>
            <View style={styles.fieldGroup}>
              <AppText variant="label" color={colors.mutedInk}>
                CONTEXT OR SHIFT · OPTIONAL
              </AppText>
              <TextInput
                accessibilityLabel="Optional note context"
                value={context}
                onChangeText={setContext}
                placeholder="Where did this become useful?"
                placeholderTextColor={colors.mutedInk}
                style={[styles.input, { color: colors.ink, borderColor: colors.line }]}
              />
            </View>
            {error ? (
              <View
                accessibilityRole="alert"
                style={[styles.alert, { backgroundColor: colors.saffronSoft }]}
              >
                <AppText color={colors.ink}>{error}</AppText>
              </View>
            ) : null}
            <PrimaryButton
              label={save.isPending ? 'Saving note…' : 'Save linked note'}
              icon="add"
              disabled={!text.trim() || save.isPending}
              onPress={() => save.mutate()}
            />
          </View>

          <View style={styles.notesSection}>
            <View style={styles.notesHeading}>
              <AppText variant="heading" color={colors.ink}>
                Linked notes
              </AppText>
              <AppText variant="label" color={colors.mutedInk}>
                {notes.length}
              </AppText>
            </View>
            {notes.map((note) => {
              const created = atomicNoteDate(note);
              return (
                <View
                  key={note.id}
                  style={[
                    styles.note,
                    { backgroundColor: colors.surface, borderColor: colors.line },
                  ]}
                >
                  <View style={styles.noteMeta}>
                    <AppText variant="label" color={colors.aqua}>
                      {note.kindRaw.toLocaleUpperCase()}
                    </AppText>
                    <AppText variant="caption" color={colors.mutedInk}>
                      {note.linkedField}
                      {created ? ` · ${created.toLocaleDateString()}` : ''}
                    </AppText>
                  </View>
                  <AppText color={colors.ink}>{note.text}</AppText>
                  {note.context.trim() ? (
                    <AppText variant="caption" color={colors.mutedInk}>
                      {note.context}
                    </AppText>
                  ) : null}
                  <PressableScale
                    accessibilityRole="button"
                    accessibilityLabel={`Delete ${note.kindRaw} note`}
                    onPress={() => confirmDelete(note.id)}
                    style={[styles.delete, { borderColor: colors.danger }]}
                  >
                    <AppText variant="caption" color={colors.danger}>
                      Delete
                    </AppText>
                  </PressableScale>
                </View>
              );
            })}
            {!drug.isLoading && notes.length === 0 ? (
              <EmptyState
                icon="practice"
                title="No atomic notes yet"
                body="Save one precise fact above. Small linked notes are easier to retrieve during practice."
              />
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.section, gap: spacing.xl },
  back: {
    alignSelf: 'flex-start',
    minHeight: 44,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  header: { gap: spacing.xs },
  editor: { borderWidth: 1, borderRadius: radii.xl, padding: spacing.lg, gap: spacing.lg },
  fieldGroup: { gap: spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    minHeight: 42,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderRadius: radii.pill,
    justifyContent: 'center',
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: fonts.body,
    fontSize: 16,
  },
  noteInput: { minHeight: 104, textAlignVertical: 'top' },
  alert: { padding: spacing.md, borderRadius: radii.md },
  notesSection: { gap: spacing.sm },
  notesHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  note: { borderWidth: 1, borderRadius: radii.lg, padding: spacing.md, gap: spacing.sm },
  noteMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  delete: {
    alignSelf: 'flex-end',
    minHeight: 40,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
