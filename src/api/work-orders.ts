import { apiClient, unwrap, type PageResponse } from '@/lib/api-client';
import { toParams, type SearchParams } from './auth';
import type { WorkOrderAttachmentResponse, WorkOrderResponse, WorkOrderStatus, WorkOrderType } from './types';

export interface SearchWorkOrdersParams extends SearchParams {
  keyword?: string;
  type?: WorkOrderType;
  status?: WorkOrderStatus;
}

export interface WorkOrderMaterialInput {
  materialId: number;
  qtyPlanned: number;
}

export const workOrdersApi = {
  search: (p: SearchWorkOrdersParams) =>
    unwrap<PageResponse<WorkOrderResponse>>(apiClient.get('/api/work-orders', { params: toParams(p) })),
  getById: (id: number) => unwrap<WorkOrderResponse>(apiClient.get(`/api/work-orders/${id}`)),
  create: (input: { type: WorkOrderType; contractNo?: string | null; customerId: number; customerName?: string | null; customerPhone?: string | null; machineInfo?: string | null; dueDate?: string | null; laborCost?: number; overheadCost?: number; agreedPrice?: number | null; items: WorkOrderMaterialInput[] }) =>
    unwrap<WorkOrderResponse>(apiClient.post('/api/work-orders', input)),
  confirm: (id: number) => unwrap<WorkOrderResponse>(apiClient.post(`/api/work-orders/${id}/confirm`)),
  consume: (id: number, input: { warehouseId?: number | null; items: { materialId: number; qty: number }[] }) =>
    unwrap<WorkOrderResponse>(apiClient.post(`/api/work-orders/${id}/consume`, input)),
  done: (id: number) => unwrap<WorkOrderResponse>(apiClient.post(`/api/work-orders/${id}/done`)),
  cancel: (id: number) => unwrap<WorkOrderResponse>(apiClient.post(`/api/work-orders/${id}/cancel`)),
  attachments: (id: number) =>
    unwrap<WorkOrderAttachmentResponse[]>(apiClient.get(`/api/work-orders/${id}/attachments`)),
  uploadPhoto: (id: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return unwrap<WorkOrderAttachmentResponse>(
      apiClient.post(`/api/work-orders/${id}/attachments`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    );
  },
};
