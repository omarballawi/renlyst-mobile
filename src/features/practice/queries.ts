import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';

import { PracticeRepository } from '@/data/repositories';

export const practiceQueryKeys = {
  all: ['practice-tools'] as const,
  dailyRefresh: () => [...practiceQueryKeys.all, 'daily-refresh'] as const,
  mistakes: () => [...practiceQueryKeys.all, 'mistakes'] as const,
  pack: (id = 'ai-practice-pack-v1') => [...practiceQueryKeys.all, 'pack', id] as const,
};

export function usePracticeRepository(): PracticeRepository {
  const db = useSQLiteContext();
  return useMemo(() => new PracticeRepository(db), [db]);
}

export function useDailyRefresh() {
  const repository = usePracticeRepository();
  return useQuery({
    queryKey: practiceQueryKeys.dailyRefresh(),
    queryFn: () => repository.dailyRefresh(),
  });
}

export function useMistakeVault() {
  const repository = usePracticeRepository();
  return useQuery({
    queryKey: practiceQueryKeys.mistakes(),
    queryFn: () => repository.mistakeVault(),
  });
}

export function useCachedPracticePack(id = 'ai-practice-pack-v1') {
  const repository = usePracticeRepository();
  return useQuery({
    queryKey: practiceQueryKeys.pack(id),
    queryFn: () => repository.loadPack(id),
  });
}
