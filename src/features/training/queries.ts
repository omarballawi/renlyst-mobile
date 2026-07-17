import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';

import { TrainingRepository } from '@/data/repositories';

export const trainingQueryKeys = {
  all: ['training'] as const,
  dashboard: () => [...trainingQueryKeys.all, 'dashboard'] as const,
  analytics: () => [...trainingQueryKeys.all, 'analytics'] as const,
  report: (id: string) => [...trainingQueryKeys.all, 'report', id] as const,
};

export function useTrainingRepository(): TrainingRepository {
  const db = useSQLiteContext();
  return useMemo(() => new TrainingRepository(db), [db]);
}

export function useTrainingDashboard() {
  const repository = useTrainingRepository();
  return useQuery({
    queryKey: trainingQueryKeys.dashboard(),
    queryFn: () => repository.dashboard(),
  });
}

export function useTrainingAnalytics() {
  const repository = useTrainingRepository();
  return useQuery({
    queryKey: trainingQueryKeys.analytics(),
    queryFn: () => repository.analytics(),
  });
}

export function useTrainingReport(id: string) {
  const repository = useTrainingRepository();
  return useQuery({
    queryKey: trainingQueryKeys.report(id),
    queryFn: () => repository.getReport(id),
  });
}
