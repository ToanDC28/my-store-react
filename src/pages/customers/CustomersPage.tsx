import { useCallback, useEffect, useState } from 'react';
import { customersApi } from '@/api/customers';
import type { CustomerResponse, CustomerType, InvoiceResponse, WorkOrderResponse } from '@/api/types';
import type { PageResponse } from '@/lib/api-client';
import { ApiError } from '@/lib/api-client';
import { formatVND, formatDate } from '@/lib/format';
import { Can } from '@/components/Can';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Plus, Search } from 'lucide-react';

interface Form {
  name: string;
  phone: string;
  address: string;
  type: CustomerType;
}

const emptyForm: Form = { name: '', phone: '', address: '', type: 'LE_QUEN' };

export default function CustomersPage() {
  const [page, setPage] = useState<PageResponse<CustomerResponse> | null>(null);
  const [keyword, setKeyword] = useState('');
  const [pageNum, setPageNum] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerResponse | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<CustomerResponse | null>(null);
  const [debts, setDebts] = useState<InvoiceResponse[] | null>(null);
  const [orders, setOrders] = useState<WorkOrderResponse[] | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPage(await customersApi.search({ keyword: keyword || undefined, page: pageNum, size: 10 }));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Tải thất bại');
    } finally {
      setLoading(false);
    }
  }, [keyword, pageNum]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (c: CustomerResponse) => {
    setEditing(c);
    setForm({ name: c.name, phone: c.phone, address: c.address ?? '', type: c.type });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      setError('Nhập tên và số điện thoại');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await customersApi.update(editing.id, { ...form, address: form.address || null });
      } else {
        await customersApi.create({ ...form, address: form.address || null });
      }
      setDialogOpen(false);
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Lưu thất bại (SĐT có thể đã tồn tại)');
    } finally {
      setSaving(false);
    }
  };

  const openDetail = async (c: CustomerResponse) => {
    setDetail(c);
    setDebts(null);
    setOrders(null);
    try {
      const [d, w] = await Promise.all([customersApi.debts(c.id), customersApi.workOrders(c.id)]);
      setDebts(d);
      setOrders(w);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Tải chi tiết thất bại');
    }
  };

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Khách hàng</h1>
        <Can permission="CUSTOMER_WRITE">
          <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Thêm khách</Button>
        </Can>
      </div>

      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      <Card>
        <CardHeader><CardTitle className="text-base">Tìm kiếm (tên/SĐT/mã)</CardTitle></CardHeader>
        <CardContent>
          <div className="relative max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" value={keyword} onChange={(e) => { setKeyword(e.target.value); setPageNum(0); }} />
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
                  <th className="px-4 py-2">Tên</th>
                  <th className="px-4 py-2">SĐT</th>
                  <th className="px-4 py-2">Loại</th>
                  <th className="px-4 py-2 text-right">Đang nợ</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">Đang tải...</td></tr>}
                {!loading && page?.content.map((c) => (
                  <tr key={c.id} className="border-b hover:bg-accent/50">
                    <td className="px-4 py-2 font-medium">{c.code}</td>
                    <td className="px-4 py-2">{c.name}</td>
                    <td className="px-4 py-2">{c.phone}</td>
                    <td className="px-4 py-2">{c.type === 'HOP_DONG' ? 'Hợp đồng' : 'Lẻ quen'}</td>
                    <td className="px-4 py-2 text-right">
                      {c.totalOwed > 0
                        ? <span className="font-semibold text-destructive">{formatVND(c.totalOwed)}</span>
                        : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Button variant="ghost" size="sm" onClick={() => openDetail(c)}>Nợ & lịch sử</Button>
                      <Can permission="CUSTOMER_WRITE">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>Sửa</Button>
                      </Can>
                    </td>
                  </tr>
                ))}
                {!loading && (!page || page.content.length === 0) && (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">Chưa có khách hàng</td></tr>
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
        <SheetContent className="max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editing ? 'Sửa khách hàng' : 'Thêm khách hàng'}</SheetTitle>
            <SheetDescription>Tên + SĐT bắt buộc, SĐT trùng báo mã cũ.</SheetDescription>
          </SheetHeader>
          <div className="grid gap-3 py-4">
            <div className="space-y-1">
              <Label>Tên *</Label>
              <Input value={form.name} onChange={(e) => set('name', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Số điện thoại *</Label>
              <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="09xxxxxxxx" />
            </div>
            <div className="space-y-1">
              <Label>Địa chỉ</Label>
              <Input value={form.address} onChange={(e) => set('address', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Loại</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.type}
                onChange={(e) => set('type', e.target.value as CustomerType)}
              >
                <option value="LE_QUEN">Lẻ quen</option>
                <option value="HOP_DONG">Hợp đồng</option>
              </select>
            </div>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu'}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={!!detail} onOpenChange={(o) => { if (!o) setDetail(null); }}>
        <SheetContent className="max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{detail?.code} — {detail?.name}</SheetTitle>
            <SheetDescription>
              {detail?.phone} · Đang nợ: <strong className="text-destructive">{formatVND(detail?.totalOwed ?? 0)}</strong>
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <div>
              <h3 className="mb-2 text-sm font-semibold">Hóa đơn chưa trả ({debts?.length ?? '...'})</h3>
              {debts && debts.length === 0 && <p className="text-sm text-muted-foreground">Không nợ.</p>}
              {debts?.map((inv) => (
                <div key={inv.id} className="flex justify-between border-b py-2 text-sm">
                  <span>{inv.code} <span className="text-muted-foreground">({inv.type})</span></span>
                  <span>Còn nợ <strong className="text-destructive">{formatVND(inv.grandTotal - inv.paidAmount)}</strong> / {formatVND(inv.grandTotal)}</span>
                </div>
              ))}
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold">Lịch sử đơn sửa ({orders?.length ?? '...'})</h3>
              {orders?.map((w) => (
                <div key={w.id} className="flex justify-between border-b py-2 text-sm">
                  <span>{w.code} <span className="text-muted-foreground">({w.status})</span></span>
                  <span>{formatDate(w.dueDate)}</span>
                </div>
              ))}
              {orders && orders.length === 0 && <p className="text-sm text-muted-foreground">Chưa có đơn sửa.</p>}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
