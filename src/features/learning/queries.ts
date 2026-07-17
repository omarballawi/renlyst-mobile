import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';

import { LearningRepository } from '@/data/repositories';

export const learningQueryKeys = {
  all: ['learning'] as const,
  summary: () => [...learningQueryKeys.all, 'summary'] as const,
};

export function useLearningRepository(): LearningRepository {
  const db = useSQLiteContext();
  return useMemo(() => new LearningRepository(db), [db]);
}

export function useLearningSummary() {
  const repository = useLearningRepository();
  return useQuery({
    queryKey: learningQueryKeys.summary(),
    queryFn: () => repository.summary(),
  });
}
