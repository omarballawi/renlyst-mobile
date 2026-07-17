import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';

import {
  DrugRepository,
  ProductRepository,
  RelationshipRepository,
  type DrugListOptions,
} from '@/data/repositories';

export const drugQueryKeys = {
  all: ['drugs'] as const,
  lists: () => [...drugQueryKeys.all, 'list'] as const,
  list: (options: DrugListOptions) => [...drugQueryKeys.lists(), options] as const,
  detail: (id: string) => [...drugQueryKeys.all, 'detail', id] as const,
  summary: () => [...drugQueryKeys.all, 'summary'] as const,
  images: () => [...drugQueryKeys.all, 'images'] as const,
  products: (id: string) => [...drugQueryKeys.all, 'products', id] as const,
  product: (id: string) => [...drugQueryKeys.all, 'product', id] as const,
  productImages: (id: string) => [...drugQueryKeys.all, 'product-images', id] as const,
  drugImages: (id: string) => [...drugQueryKeys.all, 'drug-images', id] as const,
  relationships: (id: string) => [...drugQueryKeys.all, 'relationships', id] as const,
};

export function useDrugRepository(): DrugRepository {
  const db = useSQLiteContext();
  return useMemo(() => new DrugRepository(db), [db]);
}

export function useProductRepository(): ProductRepository {
  const db = useSQLiteContext();
  return useMemo(() => new ProductRepository(db), [db]);
}

export function useRelationshipRepository(): RelationshipRepository {
  const db = useSQLiteContext();
  return useMemo(() => new RelationshipRepository(db), [db]);
}

export function useDrugList(options: DrugListOptions = {}) {
  const repository = useDrugRepository();
  return useQuery({
    queryKey: drugQueryKeys.list(options),
    queryFn: () => repository.list(options),
  });
}

export function useDrug(id: string) {
  const repository = useDrugRepository();
  return useQuery({ queryKey: drugQueryKeys.detail(id), queryFn: () => repository.get(id) });
}

export function useLibrarySummary() {
  const repository = useDrugRepository();
  return useQuery({ queryKey: drugQueryKeys.summary(), queryFn: () => repository.summary() });
}

export function usePrimaryImageUris() {
  const repository = useDrugRepository();
  return useQuery({
    queryKey: drugQueryKeys.images(),
    queryFn: () => repository.primaryImageUris(),
  });
}

export function useProducts(profileID: string) {
  const repository = useProductRepository();
  return useQuery({
    queryKey: drugQueryKeys.products(profileID),
    queryFn: () => repository.listItemsForProfile(profileID),
  });
}

export function useProduct(id: string) {
  const repository = useProductRepository();
  return useQuery({ queryKey: drugQueryKeys.product(id), queryFn: () => repository.get(id) });
}

export function useProductImageSources(id: string) {
  const repository = useProductRepository();
  return useQuery({
    queryKey: drugQueryKeys.productImages(id),
    queryFn: () => repository.listImageSources(id),
  });
}

export function useDrugImageSources(id: string) {
  const repository = useDrugRepository();
  return useQuery({
    queryKey: drugQueryKeys.drugImages(id),
    queryFn: () => repository.listImageSources(id),
  });
}

export function useRelationships(id: string) {
  const repository = useRelationshipRepository();
  return useQuery({
    queryKey: drugQueryKeys.relationships(id),
    queryFn: () => repository.listForDrug(id),
  });
}
