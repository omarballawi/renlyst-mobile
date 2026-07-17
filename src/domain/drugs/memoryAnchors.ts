import type { DrugBackup } from '@/domain/backup';

export type MemoryAnchorKind = 'mustKnow' | 'use' | 'safety' | 'mechanism' | 'counseling' | 'empty';

export type MemoryAnchor = {
  id: string;
  kind: MemoryAnchorKind;
  title: string;
  content: string | null;
};

export function memoryAnchorsFor(drug: DrugBackup): MemoryAnchor[] {
  const anchors: MemoryAnchor[] = [];
  const normalizedValues = new Set<string>();
  const append = (kind: MemoryAnchorKind, title: string, raw?: string | null) => {
    if (anchors.length >= 3) return;
    const content = raw?.trim() ?? '';
    const normalized = content.normalize('NFKD').toLocaleLowerCase();
    if (!content || normalizedValues.has(normalized)) return;
    normalizedValues.add(normalized);
    anchors.push({ id: `${anchors.length}-${kind}`, kind, title, content });
  };

  drug.mustKnow.forEach((value, index) =>
    append('mustKnow', index === 0 ? 'Must remember' : 'Key recall', value),
  );
  append('use', 'Main use', drug.indications[0]);
  append('safety', 'Safety cue', drug.warnings[0] ?? drug.contraindications[0]);
  append('mechanism', 'How it works', drug.mechanism);
  append('counseling', 'Patient cue', drug.counselingSentence);

  while (anchors.length < 3) {
    anchors.push({
      id: `${anchors.length}-empty`,
      kind: 'empty',
      title: `Memory anchor ${anchors.length + 1}`,
      content: null,
    });
  }
  return anchors;
}
