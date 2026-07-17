import {
  generateDeepSeekPracticePack,
  generateDeepSeekDrugDraft,
  parseAIDrugDraftPayload,
  parsePackageRecognitionPayload,
  ProviderFailure,
  recognizePackageWithOpenRouter,
  testDeepSeekConnection,
} from '@/services/providers/providerClients';
import { makeDrug } from '../fixtures/backup';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('optional provider clients', () => {
  it('keeps combination components separate from the marketed package strength', () => {
    const result = parsePackageRecognitionPayload({
      scientificName: '',
      tradeNames: ['Savesto'],
      ingredientComponents: [
        { name: 'Sacubitril', displayStrength: '24 mg' },
        { name: 'Valsartan', displayStrength: '26 mg' },
      ],
      marketedStrengthLabel: '50 mg',
      dosageForm: 'Tablet',
      route: 'Oral',
      confidence: 'high',
    });
    expect(result.scientificName).toBe('Sacubitril + Valsartan');
    expect(result.ingredientComponents.map((item) => item.displayStrength)).toEqual([
      '24 mg',
      '26 mg',
    ]);
    expect(result.marketedStrengthLabel).toBe('50 mg');
  });

  it('repairs incomplete AI cards, normalizes dose types, and rejects invented source IDs', () => {
    const result = parseAIDrugDraftPayload({
      scientificName: 'Sacubitril + Valsartan',
      activeIngredients: [{ name: 'Sacubitril' }, { name: 'Valsartan' }],
      chapterRaw: 'not a chapter',
      halfLifeBandRaw: 'nonsense',
      commonSideEffects: ['Headache (7%)', 'Dizziness'],
      doseRegimens: [
        {
          indication: 'Heart failure',
          population: 'pediatric',
          formula: 'mg per kg per day',
          amountPerKG: '2.5',
          dividedDoses: '2',
          requiresMeasuredWeight: 'true',
          sourceIDs: ['invented'],
        },
      ],
      dosageFormGroups: [
        { dosageForm: 'Tablet', strengths: [{ strength: '50 mg', tradeNames: ['Savesto'] }] },
      ],
      clinicalDoses: [
        {
          indication: 'Heart failure',
          population: 'Adult',
          doseText: 'Use the sourced titration regimen',
          sourceIDs: ['invented'],
        },
      ],
      prodrugInfo: { classification: 'Active drug', sourceIDs: ['invented'] },
      eliminationInfo: {
        dominantPathway: 'Kidneys / urine',
        routes: [{ pathway: 'Renal', percentage: '95', detail: '' }],
        sourceIDs: ['invented'],
      },
    });
    expect(result.activeIngredients).toEqual(['Sacubitril', 'Valsartan']);
    expect(result.chapterRaw).toBe('Other');
    expect(result.halfLifeBandRaw).toBe('Unknown');
    expect(result.doseRegimens[0]).toMatchObject({
      population: 'Child',
      formula: 'mg/kg/day',
      amountPerKG: 2.5,
      dividedDoses: 2,
      requiresMeasuredWeight: true,
      sourceIDs: [],
    });
    expect(result.adverseEffectEntries[0]).toMatchObject({
      name: 'Headache',
      incidence: '7%',
    });
    expect(result.clinicalDoses[0]?.sourceIDs).toEqual([]);
    expect(result.eliminationInfo.routes[0]?.percentage).toBe(95);
    expect(result.eliminationInfo.sourceIDs).toEqual([]);
  });

  it('creates a validated unverified drug draft while preserving confirmed identity', async () => {
    const fetchMock = jest.fn(async (..._args: Parameters<typeof fetch>) =>
      jsonResponse({
        choices: [
          {
            message: {
              content: JSON.stringify({
                scientificName: 'Wrong model spelling',
                chapterRaw: 'Cardiovascular',
                drugClass: 'Loop diuretic',
                activeIngredients: ['Furosemide'],
                indications: ['Edema'],
                warnings: ['Monitor electrolytes'],
                counselingSentence: 'Rise slowly.',
                arabicExplanation: 'مدر للبول',
                doseRegimens: [],
                interactionEntries: [],
                adverseEffectEntries: [],
              }),
            },
          },
        ],
      }),
    );
    const fetcher = fetchMock as unknown as typeof fetch;

    const draft = await generateDeepSeekDrugDraft({
      confirmedScientificName: 'Furosemide',
      confirmedIdentity: {
        tradeNames: ['Lasix'],
        strength: '40 mg',
        dosageForm: 'Tablet',
        route: 'Oral',
        chapterRaw: 'Cardiovascular',
        drugClass: 'Confirmed loop diuretic',
      },
      apiKey: 'secret',
      model: 'deepseek-v4-flash',
      fetcher,
    });
    expect(draft.scientificName).toBe('Furosemide');
    expect(draft.drugClass).toBe('Confirmed loop diuretic');
    expect(draft.tradeNames).toEqual(['Lasix']);
    expect(draft.strengths).toEqual(['40 mg']);
    expect(draft.dosageForms).toEqual(['Tablet']);
    expect(draft.routes).toEqual(['Oral']);
    expect(draft.indications).toEqual(['Edema']);
    const request = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)) as {
      max_tokens: number;
      messages: { content: string }[];
    };
    expect(request.max_tokens).toBe(7_000);
    expect(request.messages[0]?.content).toContain('unverified educational draft');
    expect(request.messages[1]?.content).toContain('Student-confirmed package context');
  });

  it('accepts only grounded DeepSeek questions and fills the rest locally', async () => {
    const drug = makeDrug();
    const fetcher = jest.fn(async () =>
      jsonResponse({
        choices: [
          {
            message: {
              content: JSON.stringify({
                questions: [
                  {
                    sourceDrugID: drug.id,
                    prompt: 'Which class is this drug in?',
                    answer: drug.drugClass,
                    choices: [],
                    explanation: drug.drugClass,
                    questionType: 'Class',
                  },
                  {
                    sourceDrugID: drug.id,
                    prompt: 'Invent a dose',
                    answer: '999 mg',
                    choices: [],
                    explanation: 'Invented',
                    questionType: 'Use',
                  },
                ],
              }),
            },
          },
        ],
      }),
    ) as unknown as typeof fetch;

    const result = await generateDeepSeekPracticePack({
      drugs: [drug],
      apiKey: 'secret',
      model: 'deepseek-v4-flash',
      fetcher,
    });
    expect(result.questions).toHaveLength(5);
    expect(result.questions.some((question) => question.correctAnswer === '999 mg')).toBe(false);
    expect(result.source).toBe('deepSeek');
  });

  it('falls back to a local five with an actionable warning on provider failure', async () => {
    const fetcher = jest.fn(async () =>
      jsonResponse({ error: { message: 'rate limited' } }, 429),
    ) as unknown as typeof fetch;
    const result = await generateDeepSeekPracticePack({
      drugs: [makeDrug()],
      apiKey: 'secret',
      model: 'deepseek-v4-flash',
      fetcher,
    });
    expect(result.questions).toHaveLength(5);
    expect(result.source).toBe('local');
    expect(result.warning).toContain('HTTP 429');
  });

  it('parses package facts and rejects missing OpenRouter credentials before a request', async () => {
    const fetcher = jest.fn(async () =>
      jsonResponse({
        choices: [
          {
            message: {
              content: JSON.stringify({
                scientificName: 'Furosemide',
                tradeNames: ['Lasix'],
                marketedStrengthLabel: '40 mg',
                confidence: 'high',
              }),
            },
          },
        ],
      }),
    ) as unknown as typeof fetch;
    const result = await recognizePackageWithOpenRouter({
      dataUrls: ['data:image/jpeg;base64,abc'],
      apiKey: 'secret',
      model: 'vision-model',
      fetcher,
    });
    expect(result).toMatchObject({ scientificName: 'Furosemide', tradeNames: ['Lasix'] });
    await expect(
      recognizePackageWithOpenRouter({
        dataUrls: ['data:image/jpeg;base64,abc'],
        apiKey: '',
        model: 'vision-model',
        fetcher,
      }),
    ).rejects.toBeInstanceOf(ProviderFailure);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('checks configured model availability without exposing credentials', async () => {
    const fetcher = jest.fn(async () =>
      jsonResponse({ data: [{ id: 'deepseek-v4-flash' }] }),
    ) as unknown as typeof fetch;
    await expect(testDeepSeekConnection('secret', 'deepseek-v4-flash', fetcher)).resolves.toBe(
      'DeepSeek is ready with deepseek-v4-flash.',
    );
  });
});
