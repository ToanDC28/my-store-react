import { useCallback, useEffect, useState } from 'react';import { useNavigate } from 'react-router-dom';
import { workOrdersApi } from '@/api/work-orders';
import type { WorkOrderResponse, WorkOrderStatus, WorkOrderType } from '@/api/types';
import type { PageResponse } from '@/lib/api-client';
import { ApiError } from '@/lib/api-client';
import { formatVND } from '@/lib/format';
import { Can } from '@/components/Can';
import { CustomerPicker } from '@/components/pickers/CustomerPicker';
import { MaterialPicker } from '@/components/pickers/MaterialPicker';
import type { CustomerResponse, MaterialResponse } from '@/api/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Plus, Search, Trash2 } from 'lucide-react';

const STATUS_VN: Record<WorkOrderStatus, string> = {
  DRAFT: 'Nháp', CONFIRMED: 'Đã duyệt', IN_PROGRESS: 'Đang làm',
  DONE: 'Nghiệm thu', INVOICED: 'Đã xuất HĐ', CANCELLED: 'Đã hủy',
};

interface ItemRow {
  key: number;
  material: MaterialResponse | null;
  qtyPlanned: string;
}

let rowSeq = 0;
const newRow = (): ItemRow => ({ key: ++rowSeq, material: null, qtyPlanned: '' });

export default function WorkOrdersPage() {
  const [page, setPage] = useState<PageResponse<WorkOrderResponse> | null>(null);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [pageNum, setPageNum] = useState(0);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [type, setType] = useState<WorkOrderType>('REPAIR');
  const [customer, setCustomer] = useState<CustomerResponse | null>(null);
  const [contractNo, setContractNo] = useState('');
  const [machineInfo, setMachineInfo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [laborCost, setLaborCost] = useState('');
  const [overheadCost, setOverheadCost] = useState('');
  const [agreedPrice, setAgreedPrice] = useState('');
  const [agreedTouched, setAgreedTouched] = useState(false);
  const [rows, setRows] = useState<ItemRow[]>([newRow()]);

  // Tổng dự toán live: vật tư (giá bán, chưa gồm giá riêng KH) + nhân công + phụ phí
  const estimate =
    rows.reduce((s, r) => s + (Number(r.qtyPlanned) || 0) * (r.material?.sellPrice ?? r.material?.costPrice ?? 0), 0) +
    (Number(laborCost) || 0) +
    (Number(overheadCost) || 0);

  // Tự điền giá chốt theo tổng dự toán cho dễ báo giá; người dùng sửa tay thì thôi
  useEffect(() => {
    if (!agreedTouched) {
      setAgreedPrice(estimate > 0 ? String(estimate) : '');
    }
  }, [estimate, agreedTouched]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPage(await workOrdersApi.search({
        keyword: keyword || undefined,
        status: (status || undefined) as WorkOrderStatus | undefined,
        page: pageNum, size: 10,
      }));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Tải thất bại');
    } finally {
      setLoading(false);
    }
  }, [keyword, status, pageNum]);

  useEffect(() => {
    load();
  }, [load]);

  const setRow = (key: number, patch: Partial<ItemRow>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const submit = async () => {
    setError(null);
    if (!customer) {
      setError('Chọn khách hàng (tạo mới ở màn Khách hàng nếu chưa có SĐT)');
      return;
    }
    const items = [];
    for (const r of rows) {
      if (!r.material) {
        setError('Chọn vật tư cho mọi dòng dự toán');
        return;
      }
      const qty = Number(r.qtyPlanned);
      if (!qty || qty <= 0) {
        setError(`Số lượng dự toán dòng ${r.material.sku} phải > 0`);
        return;
      }
      items.push({ materialId: r.material.id, qtyPlanned: qty });
    }
    if (items.length === 0) {
      setError('Thêm ít nhất 1 dòng vật tư dự toán');
      return;
    }
    setSaving(true);
    try {
      const wo = await workOrdersApi.create({
        type,
        contractNo: contractNo.trim() || null,
        customerId: customer.id,
        machineInfo: machineInfo.trim() || null,
        dueDate: dueDate || null,
        laborCost: laborCost === '' ? 0 : Number(laborCost),
        overheadCost: overheadCost === '' ? 0 : Number(overheadCost),
        agreedPrice: agreedPrice === '' ? null : Number(agreedPrice),
        items,
      });
      setDialogOpen(false);
      setCustomer(null);
      setRows([newRow()]);
      setContractNo('');
      setMachineInfo('');
      setDueDate('');
      setLaborCost('');
      setOverheadCost('');
      setAgreedPrice('');
      setAgreedTouched(false);
      load();
      void wo;
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Tạo đơn thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sửa chữa / Gia công</h1>
        <Can permission="ORDER_WRITE">
          <Button onClick={() => { setAgreedTouched(false); setDialogOpen(true); }}><Plus className="mr-2 h-4 w-4" /> Tạo đơn việc</Button>
        </Can>
      </div>

      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      <Card>
        <CardHeader><CardTitle className="text-base">Tìm kiếm</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="min-w-52 flex-1 space-y-1">
            <Label>Từ khóa (mã/khách/hợp đồng)</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-8" value={keyword} onChange={(e) => { setKeyword(e.target.value); setPageNum(0); }} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Trạng thái</Label>
            <select
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPageNum(0); }}
            >
              <option value="">Tất cả</option>
              {(Object.keys(STATUS_VN) as WorkOrderStatus[]).map((s) => (
                <option key={s} value={s}>{STATUS_VN[s]}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-4 py-2">Mã</th>
                  <th className="px-4 py-2">Loại</th>
                  <th className="px-4 py-2">Khách</th>
                  <th className="px-4 py-2 text-right">Nhân công</th>
                  <th className="px-4 py-2 text-right">Vật tư thực tế</th>
                  <th className="px-4 py-2">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">Đang tải...</td></tr>}
                {!loading && page?.content.map((w) => (
                  <tr
                    key={w.id}
                    className="cursor-pointer border-b hover:bg-accent/50"
                    onClick={() => navigate(`/work-orders/${w.id}`)}
                  >
                    <td className="px-4 py-2 font-medium text-primary">{w.code}</td>
                    <td className="px-4 py-2">{w.type === 'REPAIR' ? 'Sửa chữa' : 'Làm mới'}</td>
                    <td className="px-4 py-2">{w.customerName}</td>
                    <td className="px-4 py-2 text-right">{formatVND(w.laborCost)}</td>
                    <td className="px-4 py-2 text-right">{formatVND(w.materialActualCost)}</td>
                    <td className="px-4 py-2"><Badge variant={w.status === 'CANCELLED' ? 'secondary' : w.status === 'DONE' || w.status === 'INVOICED' ? 'default' : 'outline'}>{STATUS_VN[w.status]}</Badge></td>
                  </tr>
                ))}
                {!loading && (!page || page.content.length === 0) && (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">Chưa có đơn việc</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {page && page.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="text-muted-foreground">Tổng {page.totalElements} — trang {page.number + 1}/{page.totalPages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page.first} onClick={() => setPageNum(pageNum - 1)}>Trước</Button>
                <Button variant="outline" size="sm" disabled={page.last} onClick={() => setPageNum(pageNum + 1)}>Sau</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={dialogOpen} onOpenChange={setDialogOpen}>
        <SheetContent className="max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Tạo đơn việc (Nháp)</SheetTitle>
            <SheetDescription>Khách bắt buộc có mã — tạo mới ở màn Khách hàng nếu chưa có SĐT.</SheetDescription>
          </SheetHeader>
          <div className="grid gap-3 py-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label>Loại *</Label>
              <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={type} onChange={(e) => setType(e.target.value as WorkOrderType)}>
                <option value="REPAIR">Sửa chữa</option>
                <option value="MANUFACTURE_NEW">Làm mới theo hợp đồng</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>Số hợp đồng</Label>
              <Input value={contractNo} onChange={(e) => setContractNo(e.target.value)} placeholder="HD-2026-001 (tùy chọn)" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Khách hàng *</Label>
              <CustomerPicker value={customer} onChange={setCustomer} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Tình trạng máy nhận</Label>
              <Input value={machineInfo} onChange={(e) => setMachineInfo(e.target.value)} placeholder="VD: Máy xúc Komatsu PC200, gãy cần" />
            </div>
            <div className="space-y-1">
              <Label>Hẹn trả</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Phí Nhân công</Label>
              <Input type="number" min={0} value={laborCost} onChange={(e) => setLaborCost(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Chi phí chung</Label>
              <Input type="number" min={0} value={overheadCost} onChange={(e) => setOverheadCost(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Giá chốt với khách (đ)</Label>
              <Input
                type="number" min={0} value={agreedPrice}
                onChange={(e) => { setAgreedTouched(true); setAgreedPrice(e.target.value); }}
              />
            </div>
          </div>
          <div className="space-y-3">
            <Label>Vật tư dự toán *</Label>
            {rows.map((r) => (
              <div key={r.key} className="grid grid-cols-[2fr_1fr_auto] gap-2">
                <MaterialPicker value={r.material} onChange={(m) => setRow(r.key, { material: m })} />
                <Input type="number" min={1} placeholder="SL dự toán" value={r.qtyPlanned} onChange={(e) => setRow(r.key, { qtyPlanned: e.target.value })} />
                <Button variant="ghost" size="sm" disabled={rows.length <= 1} onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setRows((rs) => [...rs, newRow()])}>+ Thêm dòng</Button>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button onClick={submit} disabled={saving}>{saving ? 'Đang tạo...' : 'Tạo đơn'}</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
