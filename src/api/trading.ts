import { apiClient, unwrap, type PageResponse } from '@/lib/api-client';
import { toParams, type SearchParams } from './auth';
import type {
  GoodsIssueResponse, GoodsIssueStatus, InvoiceResponse, PurchaseOrderResponse, PurchaseOrderStatus,
  GoodsReceiptResponse, GoodsReceiptStatus, GoodsReceiptType, SalesOrderResponse, SalesOrderStatus,
} from './types';

export interface SearchSalesOrdersParams extends SearchParams {
  keyword?: string;
  status?: SalesOrderStatus;
}

export const salesOrdersApi = {
  search: (p: SearchSalesOrdersParams) =>
    unwrap<PageResponse<SalesOrderResponse>>(apiClient.get('/api/sales-orders', { params: toParams(p) })),
  getById: (id: number) => unwrap<SalesOrderResponse>(apiClient.get(`/api/sales-orders/${id}`)),
  create: (input: { customerId: number; customerName?: string | null; customerPhone?: string | null; discount?: number; note?: string | null; items: { materialId: number; qty: number; discount?: number }[] }) =>
    unwrap<SalesOrderResponse>(apiClient.post('/api/sales-orders', input)),
  confirm: (id: number) => unwrap<SalesOrderResponse>(apiClient.post(`/api/sales-orders/${id}/confirm`)),
  cancel: (id: number) => unwrap<SalesOrderResponse>(apiClient.post(`/api/sales-orders/${id}/cancel`)),
};

export interface SearchGoodsIssuesParams extends SearchParams {
  keyword?: string;
  status?: GoodsIssueStatus;
  salesOrderId?: number;
  warehouseId?: number;
}

export const goodsIssuesApi = {
  search: (p: SearchGoodsIssuesParams) =>
    unwrap<PageResponse<GoodsIssueResponse>>(apiClient.get('/api/goods-issues', { params: toParams(p) })),
  getById: (id: number) => unwrap<GoodsIssueResponse>(apiClient.get(`/api/goods-issues/${id}`)),
  create: (input: { salesOrderId?: number | null; warehouseId: number; customerId?: number | null; customerName?: string | null; type?: 'EXPORT_SALE' | 'EXPORT_RETURN'; items: { materialId: number; qty: number }[] }) =>
    unwrap<GoodsIssueResponse>(apiClient.post('/api/goods-issues', input)),
  confirm: (id: number) => unwrap<GoodsIssueResponse>(apiClient.post(`/api/goods-issues/${id}/confirm`)),
  cancel: (id: number) => unwrap<GoodsIssueResponse>(apiClient.post(`/api/goods-issues/${id}/cancel`)),
  quickSale: (input: { warehouseId: number; customerId: number; items: { materialId: number; qty: number }[] }) =>
    unwrap<GoodsIssueResponse>(apiClient.post('/api/goods-issues/quick-sale', input)),
  invoice: (id: number) =>
    unwrap<InvoiceResponse>(apiClient.post(`/api/goods-issues/${id}/invoice`)),
};

export interface SearchPurchaseOrdersParams extends SearchParams {
  keyword?: string;
  supplierId?: number;
  status?: PurchaseOrderStatus;
}

export const purchaseOrdersApi = {
  search: (p: SearchPurchaseOrdersParams) =>
    unwrap<PageResponse<PurchaseOrderResponse>>(apiClient.get('/api/purchase-orders', { params: toParams(p) })),
  getById: (id: number) => unwrap<PurchaseOrderResponse>(apiClient.get(`/api/purchase-orders/${id}`)),
  create: (input: { supplierId: number; expectedDate?: string | null; note?: string | null; items: { materialId: number; qty: number; unitCost: number }[] }) =>
    unwrap<PurchaseOrderResponse>(apiClient.post('/api/purchase-orders', input)),
  send: (id: number) => unwrap<PurchaseOrderResponse>(apiClient.post(`/api/purchase-orders/${id}/send`)),
  cancel: (id: number) => unwrap<PurchaseOrderResponse>(apiClient.post(`/api/purchase-orders/${id}/cancel`)),
};

export interface SearchGoodsReceiptsParams extends SearchParams {
  keyword?: string;
  status?: GoodsReceiptStatus;
  purchaseOrderId?: number;
  warehouseId?: number;
}

export const goodsReceiptsApi = {
  search: (p: SearchGoodsReceiptsParams) =>
    unwrap<PageResponse<GoodsReceiptResponse>>(apiClient.get('/api/goods-receipts', { params: toParams(p) })),
  getById: (id: number) => unwrap<GoodsReceiptResponse>(apiClient.get(`/api/goods-receipts/${id}`)),
  create: (input: { purchaseOrderId?: number | null; warehouseId: number; supplierId?: number | null; type?: GoodsReceiptType; items: { materialId: number; qty: number; unitCost: number; batchNo?: string | null }[] }) =>
    unwrap<GoodsReceiptResponse>(apiClient.post('/api/goods-receipts', input)),
  confirm: (id: number) => unwrap<GoodsReceiptResponse>(apiClient.post(`/api/goods-receipts/${id}/confirm`)),
  cancel: (id: number) => unwrap<GoodsReceiptResponse>(apiClient.post(`/api/goods-receipts/${id}/cancel`)),
  quickImport: (input: { warehouseId: number; supplierId?: number | null; purchaseOrderId?: number | null; type?: GoodsReceiptType; items: { materialId: number; qty: number; unitCost: number; batchNo?: string | null }[] }) =>
    unwrap<GoodsReceiptResponse>(apiClient.post('/api/goods-receipts/quick-import', input)),
  invoice: (id: number) =>
    unwrap<InvoiceResponse>(apiClient.post(`/api/goods-receipts/${id}/invoice`)),
};
