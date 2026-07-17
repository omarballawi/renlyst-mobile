import {
  addAtomicNote,
  atomicNoteDate,
  readAtomicNotes,
  removeAtomicNote,
} from '@/domain/drugs/atomicNotes';
import { makeDrug } from '../fixtures/backup';

describe('atomic drug note parity', () => {
  it('writes Swift-compatible reference timestamps and restores them', () => {
    const createdAt = new Date('2025-06-15T12:00:00.000Z');
    const updated = addAtomicNote(makeDrug(), {
      id: '22222222-2222-4222-8222-222222222222',
      createdAt,
      kindRaw: 'Patient counseling',
      linkedField: 'Counseling',
      text: '  Take with a full glass of water.  ',
      context: '  Evening shift  ',
    });

    const raw = JSON.parse(updated.atomicNotesJSON) as Record<string, unknown>[];
    expect(typeof raw[0]?.createdAt).toBe('number');
    expect(raw[0]?.createdAt).toBe(771_681_600);

    const [note] = readAtomicNotes(updated);
    expect(note).toMatchObject({
      kindRaw: 'Patient counseling',
      linkedField: 'Counseling',
      text: 'Take with a full glass of water.',
      context: 'Evening shift',
    });
    expect(atomicNoteDate(note!)?.toISOString()).toBe(createdAt.toISOString());
  });

  it('falls back like Swift for invalid enums and ignores malformed records', () => {
    const drug = makeDrug({
      atomicNotesJSON: JSON.stringify([
        {
          id: 'valid',
          createdAt: 0,
          kindRaw: 'Future kind',
          linkedField: 'Future field',
          text: 'Still readable',
        },
        { id: 'missing-text' },
      ]),
    });

    expect(readAtomicNotes(drug)).toEqual([
      {
        id: 'valid',
        createdAt: 0,
        kindRaw: 'Confusing point',
        linkedField: 'General',
        text: 'Still readable',
        context: '',
      },
    ]);
  });

  it('removes only the selected note', () => {
    const first = addAtomicNote(makeDrug(), {
      id: 'first',
      kindRaw: 'Memory trick',
      linkedField: 'General',
      text: 'First',
      context: '',
    });
    const second = addAtomicNote(first, {
      id: 'second',
      kindRaw: 'Shelf observation',
      linkedField: 'Shelf',
      text: 'Second',
      context: '',
    });

    expect(readAtomicNotes(removeAtomicNote(second, 'second')).map((note) => note.id)).toEqual([
      'first',
    ]);
  });
});
