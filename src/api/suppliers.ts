import { apiClient, unwrap, type PageResponse } from '@/lib/api-client';
import { toParams, type SearchParams } from './auth';
import type { SupplierResponse, PaymentTerm } from './types';

export interface SearchSuppliersParams extends SearchParams {
  keyword?: string;
  isActive?: boolean;
}

export const suppliersApi = {
  search: (p: SearchSuppliersParams) =>
    unwrap<PageResponse<SupplierResponse>>(apiClient.get('/api/suppliers', { params: toParams(p) })),
  getById: (id: number) => unwrap<SupplierResponse>(apiClient.get(`/api/suppliers/${id}`)),
  create: (input: { code?: string | null; name: string; taxCode?: string | null; phone?: string | null; email?: string | null; address?: string | null; paymentTerm?: PaymentTerm }) =>
    unwrap<SupplierResponse>(apiClient.post('/api/suppliers', input)),
  update: (id: number, input: { name: string; taxCode?: string | null; phone?: string | null; email?: string | null; address?: string | null; paymentTerm?: PaymentTerm }) =>
    unwrap<SupplierResponse>(apiClient.put(`/api/suppliers/${id}`, input)),
  setActive: (id: number, active: boolean) =>
    unwrap<SupplierResponse>(apiClient.patch(`/api/suppliers/${id}/active`, { active })),
};
