/** Types khớp DTO backend Spring (xưởng cơ khí). Tiền: number (VND, long). */

export type MaterialUnit = 'CAI' | 'KG' | 'MET' | 'LIT' | 'BO' | 'HOP' | 'CUON';
export type PaymentTerm = 'PREPAID' | 'NET_30' | 'NET_60';
export type WorkOrderType = 'REPAIR' | 'MANUFACTURE_NEW';
export type WorkOrderStatus = 'DRAFT' | 'CONFIRMED' | 'IN_PROGRESS' | 'DONE' | 'INVOICED' | 'CANCELLED';
export type SalesOrderStatus = 'PENDING' | 'CONFIRMED' | 'DELIVERING' | 'COMPLETED' | 'CANCELLED';
export type GoodsIssueType = 'EXPORT_SALE' | 'EXPORT_RETURN';
export type GoodsIssueStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
export type PurchaseOrderStatus = 'DRAFT' | 'SENT' | 'PARTIAL' | 'COMPLETED' | 'CANCELLED';
export type GoodsReceiptType = 'IMPORT_PURCHASE' | 'IMPORT_RETURN_WORK' | 'IMPORT_RETURN_SALE';
export type GoodsReceiptStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
export type InvoiceType = 'WORK' | 'SALES' | 'PURCHASE';
export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'REFUNDED';
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER';
export type PaymentStatus = 'SUCCESS' | 'FAILED' | 'REFUNDED';
export type AdvanceStatus = 'ACTIVE' | 'APPLIED' | 'CANCELLED';
export type PayrollStatus = 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';
export type CustomerType = 'LE_QUEN' | 'HOP_DONG';
export type StockRefType = 'GRN' | 'GIN' | 'WORK_ORDER' | 'ADJUST' | 'TRANSFER';

export interface UserResponse {
  id: number;
  createdDate?: string;
  updatedDate?: string;
  username: string;
  email: string;
  fullName?: string;
  enabled: boolean;
  roles: string[];
}

export interface MaterialResponse {
  id: number;
  sku: string;
  name: string;
  categoryId?: number | null;
  categoryName?: string | null;
  brand?: string | null;
  unit: MaterialUnit;
  costPrice: number;
  sellPrice?: number | null;
  stockQty: number;
  minStock: number;
  location?: string | null;
  active: boolean;
  lowStock: boolean;
}

export interface SupplierResponse {
  id: number;
  code: string;
  name: string;
  taxCode?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  paymentTerm: PaymentTerm;
  active: boolean;
  currentDebt: number;
}

export interface CustomerResponse {
  id: number;
  code: string;
  name: string;
  phone: string;
  address?: string | null;
  type: CustomerType;
  active: boolean;
  openInvoiceCount: number;
  totalOwed: number;
}

export interface CustomerPriceResponse {
  id: number;
  materialId: number;
  materialSku: string;
  materialName: string;
  sellPrice: number;
  defaultSellPrice?: number | null;
}

export interface WorkOrderMaterialResponse {
  id: number;
  materialId: number;
  materialSku?: string | null;
  materialName?: string | null;
  qtyPlanned: number;
  qtyActual: number;
  unitCost: number;
  unitSellPrice?: number | null;
  plannedTotal: number;
  actualTotal: number;
}

export interface WorkOrderResponse {
  id: number;
  code: string;
  type: WorkOrderType;
  contractNo?: string | null;
  customerId?: number | null;
  customerName: string;
  customerPhone?: string | null;
  machineInfo?: string | null;
  dueDate?: string | null;
  status: WorkOrderStatus;
  laborCost: number;
  overheadCost: number;
  agreedPrice?: number | null;
  materialPlannedCost: number;
  materialActualCost: number;
  materials: WorkOrderMaterialResponse[];
}

export interface SalesOrderItemResponse {
  id: number;
  materialId: number;
  materialSku?: string | null;
  materialName?: string | null;
  qty: number;
  unitPrice: number;
  discount: number;
  lineTotal: number;
  issuedQty: number;
  returnedQty: number;
}

export interface SalesOrderResponse {
  id: number;
  code: string;
  customerId?: number | null;
  customerName: string;
  customerPhone?: string | null;
  orderDate: string;
  status: SalesOrderStatus;
  subTotal: number;
  discount: number;
  grandTotal: number;
  note?: string | null;
  items: SalesOrderItemResponse[];
}

export interface GoodsIssueItemResponse {
  id: number;
  materialId: number;
  materialSku?: string | null;
  materialName?: string | null;
  qty: number;
  unitPrice: number;
  lineTotal: number;
}

export interface GoodsIssueResponse {
  id: number;
  code: string;
  salesOrderId?: number | null;
  salesOrderCode?: string | null;
  customerId?: number | null;
  customerName?: string | null;
  warehouseId: number;
  warehouseName?: string | null;
  issueDate: string;
  type: GoodsIssueType;
  status: GoodsIssueStatus;
  items: GoodsIssueItemResponse[];
}

export interface PurchaseOrderItemResponse {
  id: number;
  materialId: number;
  materialSku?: string | null;
  materialName?: string | null;
  qty: number;
  unitCost: number;
  lineTotal: number;
  receivedQty: number;
}

export interface PurchaseOrderResponse {
  id: number;
  code: string;
  supplierId: number;
  supplierName?: string | null;
  orderDate: string;
  expectedDate?: string | null;
  status: PurchaseOrderStatus;
  totalAmount: number;
  note?: string | null;
  items: PurchaseOrderItemResponse[];
}

export interface GoodsReceiptItemResponse {
  id: number;
  materialId: number;
  materialSku?: string | null;
  materialName?: string | null;
  qty: number;
  unitCost: number;
  batchNo?: string | null;
  lineTotal: number;
}

export interface GoodsReceiptResponse {
  id: number;
  code: string;
  purchaseOrderId?: number | null;
  purchaseOrderCode?: string | null;
  warehouseId: number;
  warehouseName?: string | null;
  supplierId?: number | null;
  supplierName?: string | null;
  receiptDate: string;
  type: GoodsReceiptType;
  status: GoodsReceiptStatus;
  items: GoodsReceiptItemResponse[];
}

export interface InvoiceItemResponse {
  id: number;
  materialId?: number | null;
  description: string;
  qty: number;
  unitPrice: number;
  discount: number;
  lineTotal: number;
}

export interface InvoiceResponse {
  id: number;
  code: string;
  type: InvoiceType;
  workOrderId?: number | null;
  workOrderCode?: string | null;
  supplierId?: number | null;
  supplierName?: string | null;
  soId?: number | null;
  soCode?: string | null;
  refCode?: string | null;
  customerName?: string | null;
  customerId?: number | null;
  issueDate: string;
  dueDate?: string | null;
  subTotal: number;
  discountAmount: number;
  vatRate: number;
  vatAmount: number;
  grandTotal: number;
  paidAmount: number;
  status: InvoiceStatus;
  items: InvoiceItemResponse[];
}

export interface PaymentResponse {
  id: number;
  code: string;
  invoiceId: number;
  invoiceCode?: string | null;
  amount: number;
  method: PaymentMethod;
  paymentDate: string;
  status: PaymentStatus;
  transactionRef?: string | null;
  receivedBy?: string | null;
  note?: string | null;
}

export interface AdvanceResponse {
  id: number;
  code: string;
  customerId: number;
  customerName?: string | null;
  workOrderId?: number | null;
  salesOrderId?: number | null;
  amount: number;
  method: PaymentMethod;
  status: AdvanceStatus;
  appliedInvoiceId?: number | null;
  receivedBy?: string | null;
  note?: string | null;
}

export interface WarehouseResponse {
  id: number;
  code: string;
  name: string;
  address?: string | null;
  active: boolean;
}

export interface StockResponse {
  id: number;
  warehouseId: number;
  warehouseName?: string | null;
  materialId: number;
  materialSku?: string | null;
  materialName?: string | null;
  unit?: MaterialUnit | null;
  qtyOnHand: number;
  qtyReserved: number;
  minStock: number;
  lowStock: boolean;
}

export interface StockTransactionResponse {
  id: number;
  createdDate?: string | null;
  materialId: number;
  materialSku?: string | null;
  materialName?: string | null;
  warehouseName?: string | null;
  type: 'IN' | 'OUT';
  refType: StockRefType;
  refId: string;
  qtyBefore: number;
  qtyChange: number;
  qtyAfter: number;
  createdBy?: string | null;
}

export interface PayrollResponse {
  id: number;
  staffId: number;
  staffUsername?: string | null;
  period: string;
  gradeLevel?: string | null;
  baseSalary: number;
  allowance: number;
  overtimeRate: number;
  overtimeHours: number;
  overtimePay: number;
  grossPay: number;
  insuranceDeduction: number;
  taxDeduction: number;
  netPay: number;
  status: PayrollStatus;
  approvedBy?: string | null;
  paidAt?: string | null;
  note?: string | null;
}
