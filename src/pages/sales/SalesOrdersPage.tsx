import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { salesOrdersApi } from '@/api/trading';
import type { MaterialResponse, CustomerResponse, SalesOrderResponse, SalesOrderStatus } from '@/api/types';
import type { PageResponse } from '@/lib/api-client';
import { ApiError } from '@/lib/api-client';
import { formatVND } from '@/lib/format';
import { Can } from '@/components/Can';
import { CustomerPicker } from '@/components/pickers/CustomerPicker';
import { MaterialPicker } from '@/components/pickers/MaterialPicker';
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

const STATUS_VN: Record<SalesOrderStatus, string> = {
  PENDING: 'Chờ duyệt', CONFIRMED: 'Đã duyệt', DELIVERING: 'Đang giao',
  COMPLETED: 'Hoàn tất', CANCELLED: 'Đã hủy',
};

interface ItemRow {
  key: number;
  material: MaterialResponse | null;
  qty: string;
}

let rowSeq = 0;
const newRow = (): ItemRow => ({ key: ++rowSeq, material: null, qty: '' });

export default function SalesOrdersPage() {
  const [page, setPage] = useState<PageResponse<SalesOrderResponse> | null>(null);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [pageNum, setPageNum] = useState(0);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [customer, setCustomer] = useState<CustomerResponse | null>(null);
  const [discount, setDiscount] = useState('');
  const [note, setNote] = useState('');
  const [rows, setRows] = useState<ItemRow[]>([newRow()]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPage(await salesOrdersApi.search({
        keyword: keyword || undefined,
        status: (status || undefined) as SalesOrderStatus | undefined,
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
      setError('Chọn khách hàng (tạo mới nếu chưa có SĐT)');
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
    setSaving(true);
    try {
      await salesOrdersApi.create({
        customerId: customer.id,
        discount: discount === '' ? 0 : Number(discount),
        note: note.trim() || null,
        items,
      });
      setDialogOpen(false);
      setCustomer(null);
      setRows([newRow()]);
      setDiscount('');
      setNote('');
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Tạo đơn thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Bán hàng</h1>
        <Can permission="ORDER_WRITE">
          <Button onClick={() => setDialogOpen(true)}><Plus className="mr-2 h-4 w-4" /> Tạo đơn bán</Button>
        </Can>
      </div>

      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      <Card>
        <CardHeader><CardTitle className="text-base">Tìm kiếm</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="min-w-52 flex-1 space-y-1">
            <Label>Từ khóa (mã/khách)</Label>
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
              {(Object.keys(STATUS_VN) as SalesOrderStatus[]).map((s) => (
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
                  <th className="px-4 py-2">Khách</th>
                  <th className="px-4 py-2 text-right">Tổng tiền</th>
                  <th className="px-4 py-2">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">Đang tải...</td></tr>}
                {!loading && page?.content.map((o) => (
                  <tr
                    key={o.id}
                    className="cursor-pointer border-b hover:bg-accent/50"
                    onClick={() => navigate(`/sales/${o.id}`)}
                  >
                    <td className="px-4 py-2 font-medium text-primary">{o.code}</td>
                    <td className="px-4 py-2">{o.customerName}</td>
                    <td className="px-4 py-2 text-right">{formatVND(o.grandTotal)}</td>
                    <td className="px-4 py-2"><Badge variant={o.status === 'CANCELLED' ? 'secondary' : 'default'}>{STATUS_VN[o.status]}</Badge></td>
                  </tr>
                ))}
                {!loading && (!page || page.content.length === 0) && (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">Chưa có đơn bán</td></tr>
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
            <SheetTitle>Tạo đơn bán</SheetTitle>
            <SheetDescription>Giá theo giá bán (ưu tiên giá riêng của khách). Khách bắt buộc có mã.</SheetDescription>
          </SheetHeader>
          <div className="grid gap-3 py-4 md:grid-cols-2">
            <div className="col-span-2 space-y-1">
              <Label>Khách hàng *</Label>
              <CustomerPicker value={customer} onChange={setCustomer} />
            </div>
            <div className="space-y-1">
              <Label>Giảm giá đơn (đ)</Label>
              <Input type="number" min={0} value={discount} onChange={(e) => setDiscount(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Ghi chú</Label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} />
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
            <Button onClick={submit} disabled={saving}>{saving ? 'Đang tạo...' : 'Tạo đơn'}</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
