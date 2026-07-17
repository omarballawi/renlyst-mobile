import { XMLParser } from 'fast-xml-parser';
import { z } from 'zod';

type FetchLike = typeof fetch;

export type TrustedSourceName = 'RxNorm' | 'DailyMed' | 'openFDA' | 'Altibbi';

export type TrustedDrugSearchResult = {
  id: string;
  displayName: string;
  activeIngredient: string;
  dosageForm: string;
  sourceName: TrustedSourceName;
  lastUpdatedText: string | null;
};

export type TrustedSearchIdentity = {
  scientificName: string;
  tradeNames?: readonly string[];
  strength?: string;
  dosageForm?: string;
};

function searchMatchScore(
  result: TrustedDrugSearchResult,
  identity: TrustedSearchIdentity,
): number {
  const scientificName = normalized(identity.scientificName);
  const displayName = normalized(result.displayName);
  const activeIngredient = normalized(result.activeIngredient);
  const dosageForm = normalized(result.dosageForm);
  const wantedForm = normalized(identity.dosageForm ?? '');
  const wantedStrength = normalized(identity.strength ?? '');
  const tradeNames = (identity.tradeNames ?? []).map(normalized).filter(Boolean);
  let score = 0;
  if (scientificName && activeIngredient === scientificName) score += 100;
  else if (scientificName && activeIngredient.includes(scientificName)) score += 65;
  if (scientificName && displayName === scientificName) score += 60;
  else if (scientificName && displayName.includes(scientificName)) score += 35;
  if (tradeNames.some((tradeName) => displayName.includes(tradeName))) score += 55;
  if (wantedForm && dosageForm === wantedForm) score += 35;
  else if (wantedForm && (dosageForm.includes(wantedForm) || displayName.includes(wantedForm)))
    score += 20;
  if (wantedStrength && displayName.includes(wantedStrength)) score += 15;
  return score;
}

export function rankTrustedSearchResults(
  results: readonly TrustedDrugSearchResult[],
  identity: TrustedSearchIdentity,
): TrustedDrugSearchResult[] {
  return results
    .map((result, index) => ({ result, index, score: searchMatchScore(result, identity) }))
    .sort((first, second) => second.score - first.score || first.index - second.index)
    .map(({ result }) => result);
}

export type TrustedDrugSourcePacket = {
  sourceName: TrustedSourceName;
  sourceURL: string;
  indicationsText: string;
  dosageText: string;
  contraindicationsText: string;
  warningsText: string;
  adverseReactionsText: string;
  interactionsText: string;
  pharmacokineticsText: string;
  pregnancyText: string;
  dosageFormsText: string;
  routeText: string;
  activeIngredientText: string;
  lastUpdatedText: string | null;
  isTruncated: boolean;
  conceptID: string | null;
  leafletText: string;
};

export class TrustedSourceFailure extends Error {
  constructor(
    readonly source: TrustedSourceName,
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'TrustedSourceFailure';
  }
}

const rxNormSearchSchema = z.object({
  approximateGroup: z.object({
    candidate: z
      .array(
        z.object({
          rxcui: z.string(),
          name: z.string().optional().default(''),
        }),
      )
      .optional()
      .default([]),
  }),
});
const rxNormNameSchema = z.object({ idGroup: z.object({ name: z.string().optional() }) });

const dailyMedSearchSchema = z.object({
  data: z.array(
    z.object({
      setid: z.string(),
      title: z.string(),
      published_date: z.string().optional().default(''),
    }),
  ),
});

const stringList = z.array(z.string()).optional().default([]);
const openFDALabelSchema = z.looseObject({
  id: z.string().optional(),
  set_id: z.string().optional(),
  effective_time: z.string().optional(),
  indications_and_usage: stringList,
  purpose: stringList,
  dosage_and_administration: stringList,
  dosage_forms_and_strengths: stringList,
  contraindications: stringList,
  warnings: stringList,
  warnings_and_precautions: stringList,
  warnings_and_cautions: stringList,
  boxed_warning: stringList,
  adverse_reactions: stringList,
  drug_interactions: stringList,
  clinical_pharmacology: stringList,
  pharmacokinetics: stringList,
  mechanism_of_action: stringList,
  pregnancy: stringList,
  pregnancy_or_breast_feeding: stringList,
  use_in_specific_populations: stringList,
  openfda: z
    .object({
      generic_name: stringList,
      brand_name: stringList,
      dosage_form: stringList,
      route: stringList,
    })
    .optional()
    .default({ generic_name: [], brand_name: [], dosage_form: [], route: [] }),
});
const openFDAResponseSchema = z.object({ results: z.array(openFDALabelSchema) });

const sectionCodes: Record<string, string> = {
  '34067-9': 'indications',
  '34068-7': 'dosage',
  '34070-3': 'contraindications',
  '43685-7': 'warnings',
  '34071-1': 'warnings',
  '34084-4': 'adverse',
  '34073-7': 'interactions',
  '43679-0': 'mechanism',
  '43682-4': 'pharmacokinetics',
  '88828-9': 'renal',
  '88829-5': 'hepatic',
  '42228-7': 'pregnancy',
  '88436-1': 'counseling',
};

const sectionLimit = 1_800;
let altibbiURLCache: string[] | null = null;

function normalized(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function compact(text: string, limit: number): { value: string; truncated: boolean } {
  const value = text.replace(/\s+/gu, ' ').trim();
  if (value.length <= limit) return { value, truncated: false };
  const prefix = value.slice(0, limit);
  const sentence = Math.max(
    prefix.lastIndexOf('.'),
    prefix.lastIndexOf(';'),
    prefix.lastIndexOf(':'),
  );
  return {
    value: (sentence > 200 ? prefix.slice(0, sentence + 1) : prefix).trim(),
    truncated: true,
  };
}

export function buildTrustedPacket({
  sourceName,
  sourceURL,
  sections,
  dosageForms = [],
  routes = [],
  activeIngredients = [],
  lastUpdatedText = null,
  conceptID = null,
  leafletText = '',
}: {
  sourceName: TrustedSourceName;
  sourceURL: string;
  sections: Readonly<Record<string, string>>;
  dosageForms?: readonly string[];
  routes?: readonly string[];
  activeIngredients?: readonly string[];
  lastUpdatedText?: string | null;
  conceptID?: string | null;
  leafletText?: string;
}): TrustedDrugSourcePacket {
  let isTruncated = false;
  const read = (keys: readonly string[], limit = sectionLimit) => {
    const result = compact(
      keys
        .map((key) => sections[key] ?? '')
        .filter((value) => value.trim())
        .join('\n\n'),
      limit,
    );
    isTruncated ||= result.truncated;
    return result.value;
  };
  return {
    sourceName,
    sourceURL,
    indicationsText: read(['indications', '34067-9', 'purpose']),
    dosageText: read(['dosage', '34068-7', 'dosage_and_administration']),
    contraindicationsText: read(['contraindications', '34070-3']),
    warningsText: read([
      'warnings',
      '43685-7',
      '34071-1',
      'warnings_and_precautions',
      'boxed_warning',
    ]),
    adverseReactionsText: read(['adverse', '34084-4', 'adverse_reactions']),
    interactionsText: read(['interactions', '34073-7', 'drug_interactions'], 12_000),
    pharmacokineticsText: read([
      'pharmacokinetics',
      '43682-4',
      'clinical_pharmacology',
      'mechanism',
    ]),
    pregnancyText: read([
      'pregnancy',
      '42228-7',
      'pregnancy_or_breast_feeding',
      'use_in_specific_populations',
    ]),
    dosageFormsText: compact(dosageForms.join(', '), 800).value,
    routeText: compact(routes.join(', '), 500).value,
    activeIngredientText: compact(activeIngredients.join(', '), 800).value,
    lastUpdatedText,
    isTruncated,
    conceptID,
    leafletText,
  };
}

async function checkedJSON<T>(
  source: TrustedSourceName,
  url: string,
  schema: z.ZodType<T>,
  fetcher: FetchLike,
): Promise<T> {
  const response = await fetcher(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new TrustedSourceFailure(
      source,
      `${source} returned HTTP ${response.status}. Try again in a moment.`,
      response.status,
    );
  }
  const parsed = schema.safeParse(await response.json());
  if (!parsed.success) {
    throw new TrustedSourceFailure(source, `${source} returned an unexpected response.`);
  }
  return parsed.data;
}

async function checkedText(
  source: TrustedSourceName,
  url: string,
  fetcher: FetchLike,
): Promise<string> {
  const response = await fetcher(url, {
    headers: { Accept: 'application/xml,text/xml,text/html', 'User-Agent': 'Renlyst/2' },
  });
  if (!response.ok) {
    throw new TrustedSourceFailure(
      source,
      `${source} returned HTTP ${response.status}. Try again in a moment.`,
      response.status,
    );
  }
  return response.text();
}

function dailyMedTitle(title: string): { generic: string; form: string } {
  const withoutOwner = title.replace(/\s*\[[^\]]+\]\s*$/u, '').trim();
  const formWords = [
    'TABLET',
    'CAPSULE',
    'INJECTION',
    'SOLUTION',
    'SUSPENSION',
    'CREAM',
    'OINTMENT',
    'GEL',
    'SPRAY',
    'PATCH',
    'POWDER',
    'AEROSOL',
    'LOTION',
    'DROPS',
    'SYRUP',
  ];
  const upper = withoutOwner.toLocaleUpperCase();
  const form = formWords.find((candidate) => upper.includes(` ${candidate}`)) ?? '';
  const formAt = form ? upper.indexOf(` ${form}`) : -1;
  const generic = (formAt >= 0 ? withoutOwner.slice(0, formAt) : withoutOwner).trim();
  return {
    generic: generic
      .toLocaleLowerCase()
      .replace(/(^|\s)\p{L}/gu, (letter) => letter.toLocaleUpperCase()),
    form: form.toLocaleLowerCase().replace(/^\p{L}/u, (letter) => letter.toLocaleUpperCase()),
  };
}

type XMLNode = Record<string, unknown>;

function xmlNodes(value: unknown): XMLNode[] {
  return Array.isArray(value)
    ? (value.filter((item) => typeof item === 'object' && item) as XMLNode[])
    : [];
}

function nodeText(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(nodeText).join(' ');
  if (value && typeof value === 'object') {
    return Object.entries(value as XMLNode)
      .filter(([key]) => key !== ':@')
      .map(([, child]) => nodeText(child))
      .join(' ');
  }
  return '';
}

function walkXML(nodes: readonly XMLNode[], visit: (name: string, node: XMLNode) => void): void {
  for (const node of nodes) {
    for (const [name, value] of Object.entries(node)) {
      if (name === ':@') continue;
      visit(name.toLocaleLowerCase(), node);
      walkXML(xmlNodes(value), visit);
    }
  }
}

function firstAttribute(nodes: readonly XMLNode[], element: string, attribute: string): string {
  let result = '';
  walkXML(nodes, (name, node) => {
    if (result || name !== element.toLocaleLowerCase()) return;
    const attributes = node[':@'];
    if (attributes && typeof attributes === 'object') {
      const value = (attributes as XMLNode)[`@_${attribute}`];
      if (typeof value === 'string') result = value;
    }
  });
  return result;
}

export function parseDailyMedSPL(
  xml: string,
  setID: string,
  lastUpdatedText: string | null,
): TrustedDrugSourcePacket {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    preserveOrder: true,
    trimValues: true,
    processEntities: true,
  });
  const nodes = xmlNodes(parser.parse(xml));
  const sections: Record<string, string> = {};
  const forms = new Set<string>();
  const routes = new Set<string>();
  const ingredients = new Set<string>();

  walkXML(nodes, (name, node) => {
    if (name === 'section') {
      const children = xmlNodes(node.section);
      const code = firstAttribute(children, 'code', 'code');
      const key = sectionCodes[code];
      if (key) sections[key] = `${sections[key] ?? ''} ${nodeText(children)}`.trim();
    }
    if (name === 'formcode') {
      const value = (node[':@'] as XMLNode | undefined)?.['@_displayName'];
      if (typeof value === 'string' && value.trim()) forms.add(value.trim());
    }
    if (name === 'routecode') {
      const value = (node[':@'] as XMLNode | undefined)?.['@_displayName'];
      if (typeof value === 'string' && value.trim()) routes.add(value.trim());
    }
    if (name === 'genericmedicine') {
      const value = nodeText(node.genericMedicine).replace(/\s+/gu, ' ').trim();
      if (value) ingredients.add(value);
    }
  });

  return buildTrustedPacket({
    sourceName: 'DailyMed',
    sourceURL: `https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=${encodeURIComponent(setID)}`,
    sections,
    dosageForms: [...forms],
    routes: [...routes],
    activeIngredients: [...ingredients],
    lastUpdatedText,
    leafletText: compact(nodeText(nodes), 40_000).value,
  });
}

function openFDAPacket(item: z.infer<typeof openFDALabelSchema>): TrustedDrugSourcePacket {
  return buildTrustedPacket({
    sourceName: 'openFDA',
    sourceURL: 'https://open.fda.gov/apis/drug/label/',
    sections: {
      indications: [...item.indications_and_usage, ...item.purpose].join('\n'),
      dosage: item.dosage_and_administration.join('\n'),
      contraindications: item.contraindications.join('\n'),
      warnings: [
        ...item.boxed_warning,
        ...item.warnings,
        ...item.warnings_and_precautions,
        ...item.warnings_and_cautions,
      ].join('\n'),
      adverse: item.adverse_reactions.join('\n'),
      interactions: item.drug_interactions.join('\n'),
      pharmacokinetics: [
        ...item.mechanism_of_action,
        ...item.clinical_pharmacology,
        ...item.pharmacokinetics,
      ].join('\n'),
      pregnancy: [
        ...item.pregnancy,
        ...item.pregnancy_or_breast_feeding,
        ...item.use_in_specific_populations,
      ].join('\n'),
    },
    dosageForms: [...item.openfda.dosage_form, ...item.dosage_forms_and_strengths.slice(0, 3)],
    routes: item.openfda.route,
    activeIngredients: item.openfda.generic_name,
    lastUpdatedText: item.effective_time ?? null,
    conceptID: item.id ?? item.set_id ?? null,
  });
}

function escapeOpenFDA(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll('"', '\\"');
}

async function searchRxNorm(query: string, fetcher: FetchLike): Promise<TrustedDrugSearchResult[]> {
  const params = new URLSearchParams({ term: query, maxEntries: '8', option: '1' });
  const payload = await checkedJSON(
    'RxNorm',
    `https://rxnav.nlm.nih.gov/REST/approximateTerm.json?${params}`,
    rxNormSearchSchema,
    fetcher,
  );
  const unique = new Map<string, TrustedDrugSearchResult>();
  for (const candidate of payload.approximateGroup.candidate) {
    if (unique.has(candidate.rxcui)) continue;
    let name = candidate.name.trim();
    if (!name) {
      const namePayload = await checkedJSON(
        'RxNorm',
        `https://rxnav.nlm.nih.gov/REST/rxcui/${encodeURIComponent(candidate.rxcui)}/name.json`,
        rxNormNameSchema,
        fetcher,
      );
      name = namePayload.idGroup.name?.trim() || candidate.rxcui;
    }
    unique.set(candidate.rxcui, {
      id: candidate.rxcui,
      displayName: name,
      activeIngredient: name,
      dosageForm: '',
      sourceName: 'RxNorm',
      lastUpdatedText: null,
    });
  }
  return [...unique.values()];
}

async function searchDailyMed(
  query: string,
  fetcher: FetchLike,
): Promise<TrustedDrugSearchResult[]> {
  const params = new URLSearchParams({ drug_name: query, pagesize: '25' });
  const payload = await checkedJSON(
    'DailyMed',
    `https://dailymed.nlm.nih.gov/dailymed/services/v2/spls.json?${params}`,
    dailyMedSearchSchema,
    fetcher,
  );
  return payload.data.map((item) => {
    const parsed = dailyMedTitle(item.title);
    return {
      id: item.setid,
      displayName: item.title,
      activeIngredient: parsed.generic,
      dosageForm: parsed.form,
      sourceName: 'DailyMed',
      lastUpdatedText: item.published_date || null,
    };
  });
}

async function searchOpenFDA(
  query: string,
  fetcher: FetchLike,
): Promise<TrustedDrugSearchResult[]> {
  const safe = escapeOpenFDA(query);
  const params = new URLSearchParams({
    search: `openfda.generic_name:"${safe}" OR openfda.brand_name:"${safe}"`,
    limit: '10',
  });
  const payload = await checkedJSON(
    'openFDA',
    `https://api.fda.gov/drug/label.json?${params}`,
    openFDAResponseSchema,
    fetcher,
  );
  return payload.results.map((item, index) => ({
    id: item.id ?? item.set_id ?? `openfda-${index}-${query}`,
    displayName: item.openfda.brand_name[0] ?? item.openfda.generic_name[0] ?? query,
    activeIngredient: item.openfda.generic_name[0] ?? '',
    dosageForm: item.openfda.dosage_form[0] ?? '',
    sourceName: 'openFDA',
    lastUpdatedText: item.effective_time ?? null,
  }));
}

function decodeHTML(value: string): string {
  return value
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
}

function plainHTML(value: string): string {
  return decodeHTML(
    value
      .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/giu, ' ')
      .replace(/<\/?(?:p|li|tr|h[1-6]|br|td)[^>]*>/giu, '\n')
      .replace(/<[^>]+>/gu, ' '),
  )
    .replace(/[ \t]+/gu, ' ')
    .replace(/\n{3,}/gu, '\n\n')
    .trim();
}

function altibbiSlug(url: string): string {
  const pathname = new URL(url).pathname;
  return decodeURIComponent(pathname.split('/').filter(Boolean).at(-1) ?? '')
    .replace(/-علمي$/u, '')
    .replaceAll('-', ' ')
    .trim();
}

async function searchAltibbi(
  query: string,
  fetcher: FetchLike,
): Promise<TrustedDrugSearchResult[]> {
  try {
    const direct = new URL(query);
    if (direct.hostname.toLocaleLowerCase().endsWith('altibbi.com')) {
      const name = altibbiSlug(direct.toString());
      return [
        {
          id: direct.toString(),
          displayName: name,
          activeIngredient: name,
          dosageForm: '',
          sourceName: 'Altibbi',
          lastUpdatedText: null,
        },
      ];
    }
  } catch {
    // Search the public drug sitemap below.
  }
  if (!altibbiURLCache) {
    const sitemap = await checkedText(
      'Altibbi',
      'https://altibbi.com/sitemap/full/drugs_1.xml',
      fetcher,
    );
    altibbiURLCache = [...sitemap.matchAll(/<loc>([\s\S]*?)<\/loc>/giu)].map((match) =>
      decodeHTML(match[1] ?? '').trim(),
    );
  }
  const needle = normalized(query);
  return altibbiURLCache
    .filter((url) => normalized(altibbiSlug(url)).includes(needle))
    .slice(0, 12)
    .map((url) => {
      const name = altibbiSlug(url);
      return {
        id: url,
        displayName: name,
        activeIngredient: name,
        dosageForm: '',
        sourceName: 'Altibbi' as const,
        lastUpdatedText: null,
      };
    });
}

export async function searchTrustedSource(
  source: TrustedSourceName,
  query: string,
  fetcher: FetchLike = fetch,
): Promise<TrustedDrugSearchResult[]> {
  const value = query.trim();
  if (!value) throw new TrustedSourceFailure(source, 'Enter a confirmed drug name first.');
  switch (source) {
    case 'RxNorm':
      return searchRxNorm(value, fetcher);
    case 'DailyMed':
      return searchDailyMed(value, fetcher);
    case 'openFDA':
      return searchOpenFDA(value, fetcher);
    case 'Altibbi':
      return searchAltibbi(value, fetcher);
  }
}

export async function fetchTrustedSourceDetails(
  result: TrustedDrugSearchResult,
  fetcher: FetchLike = fetch,
): Promise<TrustedDrugSourcePacket> {
  switch (result.sourceName) {
    case 'RxNorm': {
      const payload = await checkedJSON(
        'RxNorm',
        `https://rxnav.nlm.nih.gov/REST/rxcui/${encodeURIComponent(result.id)}/name.json`,
        rxNormNameSchema,
        fetcher,
      );
      const name = payload.idGroup.name?.trim() || result.activeIngredient || result.displayName;
      return buildTrustedPacket({
        sourceName: 'RxNorm',
        sourceURL: `https://mor.nlm.nih.gov/RxNav/search?searchBy=RXCUI&searchTerm=${encodeURIComponent(result.id)}`,
        sections: {},
        activeIngredients: [name],
        conceptID: result.id,
      });
    }
    case 'DailyMed': {
      const xml = await checkedText(
        'DailyMed',
        `https://dailymed.nlm.nih.gov/dailymed/services/v2/spls/${encodeURIComponent(result.id)}.xml`,
        fetcher,
      );
      const packet = parseDailyMedSPL(xml, result.id, result.lastUpdatedText);
      if (!packet.activeIngredientText.trim() && result.activeIngredient.trim()) {
        packet.activeIngredientText = result.activeIngredient.trim();
      }
      if (!packet.dosageFormsText.trim() && result.dosageForm.trim()) {
        packet.dosageFormsText = result.dosageForm.trim();
      }
      return packet;
    }
    case 'openFDA': {
      const params = new URLSearchParams({
        search: `id:"${escapeOpenFDA(result.id)}"`,
        limit: '1',
      });
      const payload = await checkedJSON(
        'openFDA',
        `https://api.fda.gov/drug/label.json?${params}`,
        openFDAResponseSchema,
        fetcher,
      );
      const item = payload.results[0];
      if (!item)
        throw new TrustedSourceFailure('openFDA', 'The selected label is no longer available.');
      return openFDAPacket(item);
    }
    case 'Altibbi': {
      const html = await checkedText('Altibbi', result.id, fetcher);
      const article = (id: string) => {
        const match = new RegExp(
          `<article[^>]*id=["']${id}["'][^>]*>([\\s\\S]*?)<\\/article>`,
          'iu',
        ).exec(html);
        return plainHTML(match?.[1] ?? '');
      };
      return buildTrustedPacket({
        sourceName: 'Altibbi',
        sourceURL: result.id,
        sections: {
          indications: article('termText0'),
          contraindications: article('termText1'),
          adverse: article('termText2'),
          warnings: article('termText3'),
          interactions: article('termText4'),
          dosage: article('termText6'),
        },
        dosageForms: [article('termText7')].filter(Boolean),
        activeIngredients: [result.activeIngredient || result.displayName],
        leafletText: plainHTML(html),
      });
    }
  }
}
