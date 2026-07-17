import type { DrugBackup } from '@/domain/backup';
import { dateFromLegacy, swiftReferenceTime } from '@/domain/shared/dates';

export const atomicNoteKinds = [
  'Memory trick',
  'Patient counseling',
  'Shelf observation',
  'Confusing point',
  'Source correction',
] as const;

export const atomicNoteFields = [
  'General',
  'Identity',
  'Uses',
  'Mechanism',
  'PK',
  'Safety',
  'Counseling',
  'Shelf',
] as const;

export type AtomicNoteKind = (typeof atomicNoteKinds)[number];
export type AtomicNoteField = (typeof atomicNoteFields)[number];

export type AtomicDrugNote = {
  id: string;
  createdAt: string | number;
  kindRaw: AtomicNoteKind;
  text: string;
  linkedField: AtomicNoteField;
  context: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readKind(value: unknown): AtomicNoteKind {
  return atomicNoteKinds.includes(value as AtomicNoteKind)
    ? (value as AtomicNoteKind)
    : 'Confusing point';
}

function readField(value: unknown): AtomicNoteField {
  return atomicNoteFields.includes(value as AtomicNoteField)
    ? (value as AtomicNoteField)
    : 'General';
}

export function readAtomicNotes(drug: Pick<DrugBackup, 'atomicNotesJSON'>): AtomicDrugNote[] {
  if (!drug.atomicNotesJSON.trim()) return [];
  try {
    const decoded: unknown = JSON.parse(drug.atomicNotesJSON);
    if (!Array.isArray(decoded)) return [];
    return decoded.flatMap((value): AtomicDrugNote[] => {
      if (!isRecord(value) || typeof value.id !== 'string' || typeof value.text !== 'string') {
        return [];
      }
      const createdAt =
        typeof value.createdAt === 'string' || typeof value.createdAt === 'number'
          ? value.createdAt
          : 0;
      return [
        {
          id: value.id,
          createdAt,
          kindRaw: readKind(value.kindRaw),
          text: value.text,
          linkedField: readField(value.linkedField),
          context: typeof value.context === 'string' ? value.context : '',
        },
      ];
    });
  } catch {
    return [];
  }
}

export function addAtomicNote(
  drug: DrugBackup,
  input: Omit<AtomicDrugNote, 'createdAt'> & { createdAt?: Date },
): DrugBackup {
  const note: AtomicDrugNote = {
    id: input.id,
    createdAt: swiftReferenceTime(input.createdAt ?? new Date()),
    kindRaw: input.kindRaw,
    text: input.text.trim(),
    linkedField: input.linkedField,
    context: input.context.trim(),
  };
  return { ...drug, atomicNotesJSON: JSON.stringify([note, ...readAtomicNotes(drug)]) };
}

export function removeAtomicNote(drug: DrugBackup, noteID: string): DrugBackup {
  return {
    ...drug,
    atomicNotesJSON: JSON.stringify(readAtomicNotes(drug).filter((note) => note.id !== noteID)),
  };
}

export function atomicNoteDate(note: AtomicDrugNote): Date | null {
  return dateFromLegacy(note.createdAt);
}
