import type { DrugBackup } from '@/domain/backup';

export type PatientSexAtBirth = 'Female' | 'Male';
export type DosePopulation = 'Adult' | 'Child' | 'Older adult' | 'Special population';
export type DoseFormulaKind = 'Fixed dose' | 'mg/kg/dose' | 'mg/kg/day' | 'mg/m²';

export type DoseRegimen = {
  indication: string;
  population: DosePopulation;
  formula: DoseFormulaKind;
  route: string;
  minimumAgeMonths: number | null;
  maximumAgeMonths: number | null;
  minimumWeightKG: number | null;
  maximumWeightKG: number | null;
  sexRestriction: PatientSexAtBirth | null;
  fixedDoseMG: number | null;
  amountPerKG: number | null;
  amountPerSquareMeter: number | null;
  dividedDoses: number | null;
  intervalHours: number | null;
  maximumSingleDoseMG: number | null;
  maximumDailyDoseMG: number | null;
  durationText: string;
  renalAdjustment: string;
  hepaticAdjustment: string;
  requiresMeasuredWeight: boolean;
  sourceIDs: string[];
};

export type DosePatientInput = {
  ageMonths: number;
  sexAtBirth: PatientSexAtBirth | null;
  measuredWeightKG: number | null;
  estimatedWeightKG: number | null;
  heightCM: number | null;
  renalFunction: string;
  hepaticFunction: string;
  isPregnant: boolean;
};

export type DoseCalculationResult = {
  dosePerAdministrationMG: number;
  totalDailyDoseMG: number;
  administrationsPerDay: number;
  equation: string;
  usedEstimatedWeight: boolean;
  appliedMaximum: boolean;
  cautions: string[];
};

export type DoseCalculatorErrorCode =
  | 'ageOutsideRegimen'
  | 'sexOutsideRegimen'
  | 'weightRequired'
  | 'heightRequired'
  | 'invalidRegimen';

const errorMessages: Record<DoseCalculatorErrorCode, string> = {
  ageOutsideRegimen: 'This regimen does not cover the entered age.',
  sexOutsideRegimen: 'This regimen does not cover the selected sex.',
  weightRequired:
    'A measured weight is required for this regimen. WHO estimates are available only through age 10.',
  heightRequired: 'Height is required for a body-surface-area regimen.',
  invalidRegimen: 'This regimen does not contain enough structured dose data.',
};

export class DoseCalculatorError extends Error {
  constructor(readonly code: DoseCalculatorErrorCode) {
    super(errorMessages[code]);
    this.name = 'DoseCalculatorError';
  }
}

export const pediatricWeightReference = {
  sourceName: 'WHO weight-for-age standards',
  sourceURL: 'https://www.who.int/tools/child-growth-standards/standards/weight-for-age',
} as const;

const femaleMedianKG = [
  3.2322, 4.1873, 5.1282, 5.8458, 6.4237, 6.8985, 7.297, 7.6422, 7.9487, 8.2254, 8.48, 8.7192,
  8.9481, 9.1699, 9.387, 9.6008, 9.8124, 10.0226, 10.2315, 10.4393, 10.6464, 10.8534, 11.0608,
  11.2688, 11.4775, 11.6864, 11.8947, 12.1015, 12.3059, 12.5073, 12.7055, 12.9006, 13.093, 13.2837,
  13.4731, 13.6618, 13.8503, 14.0385, 14.2265, 14.414, 14.601, 14.7873, 14.9727, 15.1573, 15.341,
  15.524, 15.7064, 15.8882, 16.0697, 16.2511, 16.4322, 16.6133, 16.7942, 16.9748, 17.1551, 17.3347,
  17.5136, 17.6916, 17.8686, 18.0445, 18.2193, 18.2579, 18.4329, 18.6073, 18.7811, 18.9545, 19.1276,
  19.3004, 19.473, 19.6455, 19.818, 19.9908, 20.1639, 20.3377, 20.5124, 20.6885, 20.8661, 21.0457,
  21.2274, 21.4113, 21.5979, 21.7872, 21.9795, 22.1751, 22.374, 22.5762, 22.7816, 22.9904, 23.2025,
  23.418, 23.6369, 23.8593, 24.0853, 24.3149, 24.5482, 24.7853, 25.0262, 25.271, 25.5197, 25.7721,
  26.0284, 26.2883, 26.5519, 26.819, 27.0896, 27.3635, 27.6406, 27.9208, 28.204, 28.4901, 28.7791,
  29.0711, 29.3663, 29.6646, 29.9663, 30.2715, 30.5805, 30.8934, 31.2105, 31.5319, 31.8578,
] as const;

const maleMedianKG = [
  3.3464, 4.4709, 5.5675, 6.3762, 7.0023, 7.5105, 7.934, 8.297, 8.6151, 8.9014, 9.1649, 9.4122,
  9.6479, 9.8749, 10.0953, 10.3108, 10.5228, 10.7319, 10.9385, 11.143, 11.3462, 11.5486, 11.7504,
  11.9514, 12.1515, 12.3502, 12.5466, 12.7401, 12.9303, 13.1169, 13.3, 13.4798, 13.6567, 13.8309,
  14.0031, 14.1736, 14.3429, 14.5113, 14.6791, 14.8466, 15.014, 15.1813, 15.3486, 15.5158, 15.6828,
  15.8497, 16.0163, 16.1827, 16.3489, 16.515, 16.6811, 16.8471, 17.0132, 17.1792, 17.3452, 17.5111,
  17.6768, 17.8422, 18.0073, 18.1722, 18.3366, 18.5057, 18.6802, 18.8563, 19.034, 19.2132, 19.394,
  19.5765, 19.7607, 19.9468, 20.1344, 20.3235, 20.5137, 20.7052, 20.8979, 21.0918, 21.287, 21.4833,
  21.681, 21.8799, 22.08, 22.2813, 22.4837, 22.6872, 22.8915, 23.0968, 23.3029, 23.5101, 23.7182,
  23.9272, 24.1371, 24.3479, 24.5595, 24.7722, 24.9858, 25.2005, 25.4163, 25.6332, 25.8513, 26.0706,
  26.2911, 26.5128, 26.7358, 26.9602, 27.1861, 27.4137, 27.6432, 27.875, 28.1092, 28.3459, 28.5854,
  28.8277, 29.0731, 29.3217, 29.5736, 29.8289, 30.0877, 30.3501, 30.616, 30.8854, 31.1586,
] as const;

export function medianPediatricWeightKG(ageMonths: number, sex: PatientSexAtBirth): number | null {
  if (!Number.isInteger(ageMonths) || ageMonths < 0 || ageMonths > 120) return null;
  return (sex === 'Female' ? femaleMedianKG : maleMedianKG)[ageMonths] ?? null;
}

function positive(value: number | null): value is number {
  return value !== null && value > 0;
}

function format(number: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(number);
}

export function calculateDose(
  regimen: DoseRegimen,
  input: DosePatientInput,
): DoseCalculationResult {
  if (regimen.minimumAgeMonths !== null && input.ageMonths < regimen.minimumAgeMonths) {
    throw new DoseCalculatorError('ageOutsideRegimen');
  }
  if (regimen.maximumAgeMonths !== null && input.ageMonths > regimen.maximumAgeMonths) {
    throw new DoseCalculatorError('ageOutsideRegimen');
  }
  if (regimen.sexRestriction !== null && input.sexAtBirth !== regimen.sexRestriction) {
    throw new DoseCalculatorError('sexOutsideRegimen');
  }

  const dosesPerDay = Math.max(
    1,
    regimen.dividedDoses ??
      (regimen.intervalHours ? Math.max(1, Math.round(24 / regimen.intervalHours)) : 1),
  );
  const weight = input.measuredWeightKG ?? input.estimatedWeightKG;
  const usedEstimatedWeight = input.measuredWeightKG === null && input.estimatedWeightKG !== null;
  let perDose: number;
  let daily: number;
  let equation: string;

  if (regimen.formula === 'Fixed dose') {
    if (!positive(regimen.fixedDoseMG)) throw new DoseCalculatorError('invalidRegimen');
    perDose = regimen.fixedDoseMG;
    daily = perDose * dosesPerDay;
    equation = `${format(perDose)} mg × ${dosesPerDay} dose(s)/day`;
  } else if (regimen.formula === 'mg/kg/dose' || regimen.formula === 'mg/kg/day') {
    if (!positive(weight) || (regimen.requiresMeasuredWeight && input.measuredWeightKG === null)) {
      throw new DoseCalculatorError('weightRequired');
    }
    if (!positive(regimen.amountPerKG)) throw new DoseCalculatorError('invalidRegimen');
    if (regimen.formula === 'mg/kg/dose') {
      perDose = regimen.amountPerKG * weight;
      daily = perDose * dosesPerDay;
      equation = `${format(regimen.amountPerKG)} mg/kg/dose × ${format(weight)} kg`;
    } else {
      daily = regimen.amountPerKG * weight;
      perDose = daily / dosesPerDay;
      equation = `(${format(regimen.amountPerKG)} mg/kg/day × ${format(weight)} kg) ÷ ${dosesPerDay}`;
    }
  } else {
    if (!positive(weight) || (regimen.requiresMeasuredWeight && input.measuredWeightKG === null)) {
      throw new DoseCalculatorError('weightRequired');
    }
    if (!positive(input.heightCM)) throw new DoseCalculatorError('heightRequired');
    if (!positive(regimen.amountPerSquareMeter)) {
      throw new DoseCalculatorError('invalidRegimen');
    }
    const bsa = Math.sqrt((input.heightCM * weight) / 3600);
    perDose = regimen.amountPerSquareMeter * bsa;
    daily = perDose * dosesPerDay;
    equation = `${format(regimen.amountPerSquareMeter)} mg/m² × √((${format(input.heightCM)} cm × ${format(weight)} kg) ÷ 3600)`;
  }

  let appliedMaximum = false;
  if (positive(regimen.maximumSingleDoseMG) && perDose > regimen.maximumSingleDoseMG) {
    perDose = regimen.maximumSingleDoseMG;
    appliedMaximum = true;
  }
  if (positive(regimen.maximumDailyDoseMG) && daily > regimen.maximumDailyDoseMG) {
    daily = regimen.maximumDailyDoseMG;
    perDose = Math.min(perDose, regimen.maximumDailyDoseMG / dosesPerDay);
    appliedMaximum = true;
  } else {
    daily = perDose * dosesPerDay;
  }

  const cautions = [
    'Educational calculation only. Verify the indication, product, renal/hepatic function, and current clinical reference.',
  ];
  if (usedEstimatedWeight) {
    cautions.push("Uses the WHO median weight for age and sex, not this child's measured weight.");
  }
  if (input.renalFunction.trim() && input.renalFunction !== 'Normal') {
    cautions.push(regimen.renalAdjustment.trim() || 'No structured renal adjustment is available.');
  }
  if (input.hepaticFunction.trim() && input.hepaticFunction !== 'Normal') {
    cautions.push(
      regimen.hepaticAdjustment.trim() || 'No structured hepatic adjustment is available.',
    );
  }
  if (input.isPregnant) {
    cautions.push('Pregnancy requires an indication-specific clinician review.');
  }
  return {
    dosePerAdministrationMG: perDose,
    totalDailyDoseMG: daily,
    administrationsPerDay: dosesPerDay,
    equation,
    usedEstimatedWeight,
    appliedMaximum,
    cautions,
  };
}

function nullableNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function readDoseRegimens(drug: DrugBackup): DoseRegimen[] {
  if (!drug.doseRegimensJSON?.trim()) return [];
  try {
    const value = JSON.parse(drug.doseRegimensJSON) as unknown;
    if (!Array.isArray(value)) return [];
    return value.flatMap((candidate): DoseRegimen[] => {
      if (!candidate || typeof candidate !== 'object') return [];
      const raw = candidate as Record<string, unknown>;
      if (
        typeof raw.indication !== 'string' ||
        !['Adult', 'Child', 'Older adult', 'Special population'].includes(String(raw.population)) ||
        !['Fixed dose', 'mg/kg/dose', 'mg/kg/day', 'mg/m²'].includes(String(raw.formula))
      ) {
        return [];
      }
      return [
        {
          indication: raw.indication,
          population: raw.population as DosePopulation,
          formula: raw.formula as DoseFormulaKind,
          route: typeof raw.route === 'string' ? raw.route : '',
          minimumAgeMonths: nullableNumber(raw.minimumAgeMonths),
          maximumAgeMonths: nullableNumber(raw.maximumAgeMonths),
          minimumWeightKG: nullableNumber(raw.minimumWeightKG),
          maximumWeightKG: nullableNumber(raw.maximumWeightKG),
          sexRestriction:
            raw.sexRestriction === 'Female' || raw.sexRestriction === 'Male'
              ? raw.sexRestriction
              : null,
          fixedDoseMG: nullableNumber(raw.fixedDoseMG),
          amountPerKG: nullableNumber(raw.amountPerKG),
          amountPerSquareMeter: nullableNumber(raw.amountPerSquareMeter),
          dividedDoses: nullableNumber(raw.dividedDoses),
          intervalHours: nullableNumber(raw.intervalHours),
          maximumSingleDoseMG: nullableNumber(raw.maximumSingleDoseMG),
          maximumDailyDoseMG: nullableNumber(raw.maximumDailyDoseMG),
          durationText: typeof raw.durationText === 'string' ? raw.durationText : '',
          renalAdjustment: typeof raw.renalAdjustment === 'string' ? raw.renalAdjustment : '',
          hepaticAdjustment: typeof raw.hepaticAdjustment === 'string' ? raw.hepaticAdjustment : '',
          requiresMeasuredWeight: raw.requiresMeasuredWeight === true,
          sourceIDs: Array.isArray(raw.sourceIDs)
            ? raw.sourceIDs.filter((item): item is string => typeof item === 'string')
            : [],
        },
      ];
    });
  } catch {
    return [];
  }
}
