import { apiClient, unwrap, type PageResponse } from '@/lib/api-client';
import { toParams, type SearchParams } from './auth';
import type { CustomerPriceResponse, CustomerResponse, CustomerType, InvoiceResponse, WorkOrderResponse } from './types';

export interface SearchCustomersParams extends SearchParams {
  keyword?: string;
  type?: CustomerType;
  active?: boolean;
}

export const customersApi = {
  search: (p: SearchCustomersParams) =>
    unwrap<PageResponse<CustomerResponse>>(apiClient.get('/api/customers', { params: toParams(p) })),
  getById: (id: number) => unwrap<CustomerResponse>(apiClient.get(`/api/customers/${id}`)),
  create: (input: { name: string; phone: string; address?: string | null; type?: CustomerType }) =>
    unwrap<CustomerResponse>(apiClient.post('/api/customers', input)),
  update: (id: number, input: { name?: string; phone?: string; address?: string | null; type?: CustomerType; active?: boolean }) =>
    unwrap<CustomerResponse>(apiClient.put(`/api/customers/${id}`, input)),
  setActive: (id: number, active: boolean) =>
    unwrap<CustomerResponse>(apiClient.patch(`/api/customers/${id}/active`, { active })),
  debts: (id: number) =>
    unwrap<InvoiceResponse[]>(apiClient.get(`/api/customers/${id}/debts`)),
  workOrders: (id: number) =>
    unwrap<WorkOrderResponse[]>(apiClient.get(`/api/customers/${id}/work-orders`)),
  prices: (id: number) =>
    unwrap<CustomerPriceResponse[]>(apiClient.get(`/api/customers/${id}/prices`)),
  setPrice: (id: number, input: { materialId: number; sellPrice: number }) =>
    unwrap<CustomerPriceResponse>(apiClient.post(`/api/customers/${id}/prices`, input)),
  deletePrice: (id: number, materialId: number) =>
    unwrap<void>(apiClient.delete(`/api/customers/${id}/prices/${materialId}`)),
};
