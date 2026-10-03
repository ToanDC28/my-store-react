import { apiClient, unwrap, type PageResponse } from '@/lib/api-client';
import { toParams, type SearchParams } from './auth';
import type {
  AdvanceResponse, AdvanceStatus, InvoiceResponse, InvoiceStatus, InvoiceType,
  PaymentMethod, PaymentResponse, PaymentStatus, PayrollResponse, PayrollStatus,
  StockResponse, StockRefType, StockTransactionResponse, UserResponse, WarehouseResponse,
} from './types';

export interface SearchInvoicesParams extends SearchParams {
  keyword?: string;
  type?: InvoiceType;
  status?: InvoiceStatus;
}

export const invoicesApi = {
  search: (p: SearchInvoicesParams) =>
    unwrap<PageResponse<InvoiceResponse>>(apiClient.get('/api/invoices', { params: toParams(p) })),
  getById: (id: number) => unwrap<InvoiceResponse>(apiClient.get(`/api/invoices/${id}`)),
  createWork: (input: { workOrderId: number; vatRate?: number; discountAmount?: number; dueDays?: number }) =>
    unwrap<InvoiceResponse>(apiClient.post('/api/invoices/work', input)),
  issue: (id: number) => unwrap<InvoiceResponse>(apiClient.post(`/api/invoices/${id}/issue`)),
  cancel: (id: number) => unwrap<InvoiceResponse>(apiClient.post(`/api/invoices/${id}/cancel`)),
};

export interface SearchPaymentsParams extends SearchParams {
  invoiceId?: number;
  method?: PaymentMethod;
  status?: PaymentStatus;
  from?: string;
  to?: string;
}

export const paymentsApi = {
  pay: (invoiceId: number, input: { amount: number; method: PaymentMethod; transactionRef?: string | null; note?: string | null }) =>
    unwrap<PaymentResponse>(apiClient.post(`/api/invoices/${invoiceId}/payments`, input)),
  listByInvoice: (invoiceId: number) =>
    unwrap<PaymentResponse[]>(apiClient.get(`/api/invoices/${invoiceId}/payments`)),
  search: (p: SearchPaymentsParams) =>
    unwrap<PageResponse<PaymentResponse>>(apiClient.get('/api/payments', { params: toParams(p) })),
  summary: (from?: string, to?: string) =>
    unwrap<{ from: string; to: string; lines: { date: string; method: PaymentMethod; totalAmount: number; count: number }[]; totalCash: number; totalBank: number; grandTotal: number; count: number }>(
      apiClient.get('/api/payments/summary', { params: toParams({ from, to }) })),
  refund: (id: number) => unwrap<PaymentResponse>(apiClient.post(`/api/payments/${id}/refund`)),
};

export interface SearchAdvancesParams extends SearchParams {
  customerId?: number;
  status?: AdvanceStatus;
}

export const advancesApi = {
  search: (p: SearchAdvancesParams) =>
    unwrap<PageResponse<AdvanceResponse>>(apiClient.get('/api/advances', { params: toParams(p) })),
  getById: (id: number) => unwrap<AdvanceResponse>(apiClient.get(`/api/advances/${id}`)),
  create: (input: { customerId: number; workOrderId?: number | null; salesOrderId?: number | null; amount: number; method: PaymentMethod; transactionRef?: string | null; note?: string | null }) =>
    unwrap<AdvanceResponse>(apiClient.post('/api/advances', input)),
  apply: (id: number, invoiceId: number) =>
    unwrap<PaymentResponse>(apiClient.post(`/api/advances/${id}/apply`, { invoiceId })),
  cancel: (id: number) => unwrap<AdvanceResponse>(apiClient.post(`/api/advances/${id}/cancel`)),
};

export const warehousesApi = {
  list: () => unwrap<WarehouseResponse[]>(apiClient.get('/api/warehouses')),
  getById: (id: number) => unwrap<WarehouseResponse>(apiClient.get(`/api/warehouses/${id}`)),
  create: (input: { code: string; name: string; address?: string | null }) =>
    unwrap<WarehouseResponse>(apiClient.post('/api/warehouses', input)),
};

export interface SearchStocksParams extends SearchParams {
  warehouseId?: number;
  materialId?: number;
  lowStockOnly?: boolean;
}

export const stocksApi = {
  search: (p: SearchStocksParams) =>
    unwrap<PageResponse<StockResponse>>(apiClient.get('/api/stocks', { params: toParams(p) })),
  lowStock: (warehouseId?: number) =>
    unwrap<StockResponse[]>(apiClient.get('/api/stocks/low-stock', { params: toParams({ warehouseId }) })),
  transactions: (p: SearchParams & { materialId?: number; warehouseId?: number; refType?: StockRefType }) =>
    unwrap<PageResponse<StockTransactionResponse>>(apiClient.get('/api/stocks/transactions', { params: toParams(p) })),
};

export interface SearchUsersParams extends SearchParams {
  keyword?: string;
  role?: string;
  enabled?: boolean;
}

export const usersApi = {
  search: (p: SearchUsersParams) =>
    unwrap<PageResponse<UserResponse>>(apiClient.get('/api/users', { params: toParams(p) })),
  getById: (id: number) => unwrap<UserResponse>(apiClient.get(`/api/users/${id}`)),
  create: (input: { username: string; email: string; password: string; fullName?: string | null; roles: string[] }) =>
    unwrap<UserResponse>(apiClient.post('/api/users', input)),
  assignRoles: (id: number, roles: string[]) =>
    unwrap<UserResponse>(apiClient.put(`/api/users/${id}/roles`, { roles })),
  setEnabled: (id: number, enabled: boolean) =>
    unwrap<UserResponse>(apiClient.patch(`/api/users/${id}/enabled`, { enabled })),
  delete: (id: number) => unwrap<void>(apiClient.delete(`/api/users/${id}`)),
  resetPassword: (id: number, newPassword: string) =>
    unwrap<UserResponse>(apiClient.post(`/api/users/${id}/reset-password`, { newPassword })),
  roles: () => unwrap<string[]>(apiClient.get('/api/users/roles')),
};

export interface SearchPayrollsParams extends SearchParams {
  period?: string;
  staffId?: number;
  status?: PayrollStatus;
}

export const payrollApi = {
  grades: () => unwrap<{ id: number; level: string; baseSalary: number; allowance: number; overtimeRatePerHour: number; active: boolean }[]>(apiClient.get('/api/salary-grades')),
  createGrade: (input: { level: string; baseSalary: number; allowance?: number; overtimeRatePerHour: number }) =>
    unwrap<{ id: number; level: string }>(apiClient.post('/api/salary-grades', input)),
  attendances: (period?: string, staffId?: number) =>
    unwrap<unknown[]>(apiClient.get('/api/attendances', { params: toParams({ period, staffId }) })),
  upsertAttendance: (input: { staffId: number; period: string; salaryGradeId: number; workingDays?: number; overtimeHours?: number; leaveDays?: number; note?: string | null }) =>
    unwrap<unknown>(apiClient.post('/api/attendances', input)),
  search: (p: SearchPayrollsParams) =>
    unwrap<PageResponse<PayrollResponse>>(apiClient.get('/api/payrolls', { params: toParams(p) })),
  my: (period?: string) =>
    unwrap<PayrollResponse[]>(apiClient.get('/api/payrolls/my', { params: toParams({ period }) })),
  generate: (period: string) =>
    unwrap<PayrollResponse[]>(apiClient.post('/api/payrolls/generate', null, { params: { period } })),
  approve: (id: number, input?: { taxDeduction?: number; note?: string | null }) =>
    unwrap<PayrollResponse>(apiClient.post(`/api/payrolls/${id}/approve`, input ?? {})),
  reject: (id: number, note?: string) =>
    unwrap<PayrollResponse>(apiClient.post(`/api/payrolls/${id}/reject`, { note })),
  pay: (id: number) => unwrap<PayrollResponse>(apiClient.post(`/api/payrolls/${id}/pay`)),
};

export const reportsApi = {
  revenue: (from?: string, to?: string, groupBy: 'day' | 'month' = 'day') =>
    unwrap<{ label: string; total: number; count: number }[]>(apiClient.get('/api/reports/revenue', { params: toParams({ from, to, groupBy }) })),
  revenueByType: (from?: string, to?: string) =>
    unwrap<{ workTotal: number; workCount: number; salesTotal: number; salesCount: number; grandTotal: number }>(apiClient.get('/api/reports/revenue-by-type', { params: toParams({ from, to }) })),
  topMaterials: (limit = 10, from?: string, to?: string) =>
    unwrap<unknown[]>(apiClient.get('/api/reports/top-materials', { params: toParams({ limit, from, to }) })),
  stockValue: () => unwrap<{ totalValue: number; materialCount: number; lowStock: unknown[] }>(apiClient.get('/api/reports/stock-value')),
  supplierDebt: () => unwrap<unknown[]>(apiClient.get('/api/reports/supplier-debt')),
  customerDebt: () => unwrap<unknown[]>(apiClient.get('/api/reports/customer-debt')),
  salaryCost: (period: string) => unwrap<unknown>(apiClient.get('/api/reports/salary-cost', { params: { period } })),
  profit: (from?: string, to?: string) => unwrap<unknown>(apiClient.get('/api/reports/profit', { params: toParams({ from, to }) })),
  workOrderProfit: (from?: string, to?: string) => unwrap<unknown[]>(apiClient.get('/api/reports/workorder-profit', { params: toParams({ from, to }) })),
};
