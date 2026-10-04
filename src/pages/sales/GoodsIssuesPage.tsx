import { useCallback, useEffect, useState } from 'react';
import { goodsIssuesApi } from '@/api/trading';
import { warehousesApi } from '@/api/ops';
import type { GoodsIssueResponse, GoodsIssueStatus, WarehouseResponse } from '@/api/types';
import type { PageResponse } from '@/lib/api-client';
import { ApiError } from '@/lib/api-client';
import { Can } from '@/components/Can';
import { CustomerPicker } from '@/components/pickers/CustomerPicker';
import { MaterialPicker } from '@/components/pickers/MaterialPicker';
import type { CustomerResponse, MaterialResponse } from '@/api/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Plus, Trash2 } from 'lucide-react';

interface Row {
  key: number;
  material: MaterialResponse | null;
  qty: string;
}

let rowSeq = 0;
const newRow = (): Row => ({ key: ++rowSeq, material: null, qty: '' });

export default function GoodsIssuesPage() {
  const [page, setPage] = useState<PageResponse<GoodsIssueResponse> | null>(null);
  const [pageNum, setPageNum] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [warehouses, setWarehouses] = useState<WarehouseResponse[]>([]);
  const [warehouseId, setWarehouseId] = useState('');
  const [customer, setCustomer] = useState<CustomerResponse | null>(null);
  const [rows, setRows] = useState<Row[]>([newRow()]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [gins, wh] = await Promise.all([
        goodsIssuesApi.search({ page: pageNum, size: 10 }),
        warehousesApi.list(),
      ]);
      setPage(gins);
      setWarehouses(wh);
      if (wh.length > 0) setWarehouseId((cur) => cur || String(wh[0].id));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Tải thất bại');
    } finally {
      setLoading(false);
    }
  }, [pageNum]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (id: number, kind: 'confirm' | 'cancel' | 'invoice') => {
    if (!window.confirm(
      kind === 'confirm' ? 'Xác nhận phiếu xuất?' : kind === 'cancel' ? 'Hủy phiếu này?' : 'Xuất hóa đơn bán cho phiếu này?',
    )) return;
    setActing(true);
    setError(null);
    try {
      if (kind === 'confirm') await goodsIssuesApi.confirm(id);
      else if (kind === 'cancel') await goodsIssuesApi.cancel(id);
      else await goodsIssuesApi.invoice(id);
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Thao tác thất bại');
    } finally {
      setActing(false);
    }
  };

  const setRow = (key: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const submitQuick = async () => {
    setError(null);
    if (!customer) {
      setError('Chọn khách hàng');
      return;
    }
    if (!warehouseId) {
      setError('Chọn kho xuất');
      return;
    }
    const items = [];
    for (const r of rows) {
      if (!r.material) {
        setError('Chọn vật tư cho mọi dòng');
        return;
      }
      const qty = Number(r.qty);
      if (!qty || qty <= 0) {
        setError(`Số lượng dòng ${r.material.sku} phải > 0`);
        return;
      }
      items.push({ materialId: r.material.id, qty });
    }
    setActing(true);
    try {
      await goodsIssuesApi.quickSale({ warehouseId: Number(warehouseId), customerId: customer.id, items });
      setDialogOpen(false);
      setCustomer(null);
      setRows([newRow()]);
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Bán lẻ thất bại (kiểm tra tồn kho)');
    } finally {
      setActing(false);
    }
  };

  const statusBadge = (s: GoodsIssueStatus) =>
    s === 'CONFIRMED' ? <Badge variant="default">Đã xuất</Badge>
    : s === 'CANCELLED' ? <Badge variant="secondary">Đã hủy</Badge>
    : <Badge variant="outline">Nháp</Badge>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Phiếu xuất kho</h1>
        <Can permission="INVENTORY_WRITE">
          <Button onClick={() => setDialogOpen(true)}><Plus className="mr-2 h-4 w-4" /> Bán lẻ tại quầy</Button>
        </Can>
      </div>

      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-4 py-2">Mã</th>
                  <th className="px-4 py-2">Đơn bán</th>
                  <th className="px-4 py-2">Khách</th>
                  <th className="px-4 py-2">Loại</th>
                  <th className="px-4 py-2">Trạng thái</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">Đang tải...</td></tr>}
                {!loading && page?.content.map((g) => (
                  <tr key={g.id} className="border-b hover:bg-accent/50">
                    <td className="px-4 py-2 font-medium">{g.code}</td>
                    <td className="px-4 py-2">{g.salesOrderCode ?? '—'}</td>
                    <td className="px-4 py-2">{g.customerName ?? '—'}</td>
                    <td className="px-4 py-2">{g.type === 'EXPORT_SALE' ? 'Bán' : 'Trả lại'}</td>
                    <td className="px-4 py-2">{statusBadge(g.status)}</td>
                    <td className="px-4 py-2 text-right">
                      <Can permission="INVENTORY_WRITE">
                        {g.status === 'DRAFT' && (
                          <>
                            <Button variant="ghost" size="sm" disabled={acting} onClick={() => act(g.id, 'confirm')}>Xác nhận</Button>
                            <Button variant="ghost" size="sm" disabled={acting} onClick={() => act(g.id, 'cancel')}>Hủy</Button>
                          </>
                        )}
                      </Can>
                      <Can permission="INVOICE_WRITE">
                        {g.status === 'CONFIRMED' && g.type === 'EXPORT_SALE' && (
                          <Button variant="ghost" size="sm" disabled={acting} onClick={() => act(g.id, 'invoice')}>Xuất HĐ</Button>
                        )}
                      </Can>
                    </td>
                  </tr>
                ))}
                {!loading && (!page || page.content.length === 0) && (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">Chưa có phiếu xuất</td></tr>
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
            <SheetTitle>Bán lẻ tại quầy</SheetTitle>
            <SheetDescription>Xuất kho ngay + tự sinh hóa đơn. Khách bắt buộc có mã.</SheetDescription>
          </SheetHeader>
          <div className="grid gap-3 py-4 md:grid-cols-2">
            <div className="col-span-2 space-y-1">
              <Label>Khách hàng *</Label>
              <CustomerPicker value={customer} onChange={setCustomer} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Kho xuất *</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
              >
                {warehouses.map((w) => <option key={w.id} value={w.id}>{w.code} — {w.name}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-3">
            <Label>Dòng hàng *</Label>
            {rows.map((r) => (
              <div key={r.key} className="grid grid-cols-[2fr_1fr_auto] gap-2">
                <MaterialPicker value={r.material} onChange={(m) => setRow(r.key, { material: m })} />
                <Input type="number" min={1} placeholder="Số lượng" value={r.qty} onChange={(e) => setRow(r.key, { qty: e.target.value })} />
                <Button variant="ghost" size="sm" disabled={rows.length <= 1} onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setRows((rs) => [...rs, newRow()])}>+ Thêm dòng</Button>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button onClick={submitQuick} disabled={acting}>{acting ? 'Đang bán...' : 'Bán + xuất kho'}</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
