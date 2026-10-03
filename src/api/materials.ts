import { apiClient, unwrap, type PageResponse } from '@/lib/api-client';
import { toParams, type SearchParams } from './auth';
import type { MaterialResponse, MaterialUnit } from './types';

export interface SearchMaterialsParams extends SearchParams {
  keyword?: string;
  sku?: string;
  categoryId?: number;
  lowStockOnly?: boolean;
  active?: boolean;
}

export interface CreateMaterialInput {
  sku: string;
  name: string;
  categoryId?: number | null;
  brand?: string | null;
  unit: MaterialUnit;
  costPrice: number;
  sellPrice?: number | null;
  minStock?: number;
  location?: string | null;
}

export interface UpdateMaterialInput {
  name?: string;
  categoryId?: number | null;
  brand?: string | null;
  unit?: MaterialUnit;
  costPrice?: number;
  sellPrice?: number | null;
  minStock?: number;
  location?: string | null;
  active?: boolean;
}

export const materialsApi = {
  search: (p: SearchMaterialsParams) =>
    unwrap<PageResponse<MaterialResponse>>(apiClient.get('/api/materials', { params: toParams(p) })),
  getById: (id: number) => unwrap<MaterialResponse>(apiClient.get(`/api/materials/${id}`)),
  create: (input: CreateMaterialInput) =>
    unwrap<MaterialResponse>(apiClient.post('/api/materials', input)),
  update: (id: number, input: UpdateMaterialInput) =>
    unwrap<MaterialResponse>(apiClient.put(`/api/materials/${id}`, input)),
  setActive: (id: number, active: boolean) =>
    unwrap<MaterialResponse>(apiClient.patch(`/api/materials/${id}/active`, { active })),
};
