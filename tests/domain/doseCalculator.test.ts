import {
  calculateDose,
  DoseCalculatorError,
  medianPediatricWeightKG,
  type DoseRegimen,
} from '@/domain/clinical/doseCalculator';

const base: DoseRegimen = {
  indication: 'Example infection',
  population: 'Child',
  formula: 'mg/kg/day',
  route: '',
  minimumAgeMonths: null,
  maximumAgeMonths: null,
  minimumWeightKG: null,
  maximumWeightKG: null,
  sexRestriction: null,
  fixedDoseMG: null,
  amountPerKG: 30,
  amountPerSquareMeter: null,
  dividedDoses: 3,
  intervalHours: null,
  maximumSingleDoseMG: null,
  maximumDailyDoseMG: 1000,
  durationText: '',
  renalAdjustment: '',
  hepaticAdjustment: '',
  requiresMeasuredWeight: false,
  sourceIDs: [],
};

const input = {
  ageMonths: 60,
  sexAtBirth: 'Female' as const,
  measuredWeightKG: null,
  estimatedWeightKG: 18.2193,
  heightCM: null,
  renalFunction: 'Normal',
  hepaticFunction: 'Normal',
  isPregnant: false,
};

describe('dose calculator parity', () => {
  it('uses the exact WHO reference through age ten', () => {
    expect(medianPediatricWeightKG(60, 'Female')).toBeCloseTo(18.2193, 4);
    expect(medianPediatricWeightKG(121, 'Male')).toBeNull();
  });

  it('shows the same mg/kg/day equation and values', () => {
    const result = calculateDose(base, input);
    expect(result.dosePerAdministrationMG).toBeCloseTo(182.193, 3);
    expect(result.totalDailyDoseMG).toBeCloseTo(546.579, 3);
    expect(result.equation).toContain('30 mg/kg/day');
    expect(result.usedEstimatedWeight).toBe(true);
  });

  it('requires measured weight when the regimen says so', () => {
    expect(() =>
      calculateDose(
        { ...base, formula: 'mg/kg/dose', amountPerKG: 2, requiresMeasuredWeight: true },
        input,
      ),
    ).toThrow(new DoseCalculatorError('weightRequired'));
  });

  it('applies single and daily caps', () => {
    const result = calculateDose(
      {
        ...base,
        formula: 'mg/kg/dose',
        amountPerKG: 50,
        maximumSingleDoseMG: 500,
        maximumDailyDoseMG: 1200,
      },
      { ...input, measuredWeightKG: 30, estimatedWeightKG: null },
    );
    expect(result.dosePerAdministrationMG).toBe(400);
    expect(result.totalDailyDoseMG).toBe(1200);
    expect(result.appliedMaximum).toBe(true);
  });
});
