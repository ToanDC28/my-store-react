import { useCallback, useEffect, useState } from 'react';
import { suppliersApi } from '@/api/suppliers';
import type { SupplierResponse, PaymentTerm } from '@/api/types';
import type { PageResponse } from '@/lib/api-client';
import { ApiError } from '@/lib/api-client';
import { formatVND } from '@/lib/format';
import { Can } from '@/components/Can';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Plus, Search } from 'lucide-react';

const TERMS: PaymentTerm[] = ['PREPAID', 'NET_30', 'NET_60'];

interface Form {
  code: string;
  name: string;
  taxCode: string;
  phone: string;
  email: string;
  address: string;
  paymentTerm: PaymentTerm;
}

const emptyForm: Form = {
  code: '', name: '', taxCode: '', phone: '', email: '', address: '', paymentTerm: 'NET_30',
};

export default function SuppliersPage() {
  const [page, setPage] = useState<PageResponse<SupplierResponse> | null>(null);
  const [keyword, setKeyword] = useState('');
  const [pageNum, setPageNum] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SupplierResponse | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPage(await suppliersApi.search({ keyword: keyword || undefined, page: pageNum, size: 10 }));
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

  const openEdit = (s: SupplierResponse) => {
    setEditing(s);
    setForm({
      code: s.code, name: s.name, taxCode: s.taxCode ?? '', phone: s.phone ?? '',
      email: s.email ?? '', address: s.address ?? '', paymentTerm: s.paymentTerm,
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      setError('Nhập tên nhà cung cấp');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const { code: _code, ...payload } = form;
        await suppliersApi.update(editing.id, payload);
      } else {
        await suppliersApi.create({ ...form, code: form.code.trim() || null });
      }
      setDialogOpen(false);
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (s: SupplierResponse) => {
    try {
      await suppliersApi.setActive(s.id, !s.active);
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Đổi trạng thái thất bại');
    }
  };

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Nhà cung cấp</h1>
        <Can permission="SUPPLIER_WRITE">
          <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Thêm NCC</Button>
        </Can>
      </div>

      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      <Card>
        <CardHeader><CardTitle className="text-base">Tìm kiếm</CardTitle></CardHeader>
        <CardContent>
          <div className="relative max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Mã/tên/SĐT..."
              value={keyword}
              onChange={(e) => { setKeyword(e.target.value); setPageNum(0); }}
            />
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
                  <th className="px-4 py-2">Thanh toán</th>
                  <th className="px-4 py-2 text-right">Công nợ NCC</th>
                  <th className="px-4 py-2">Trạng thái</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">Đang tải...</td></tr>}
                {!loading && page?.content.map((s) => (
                  <tr key={s.id} className="border-b hover:bg-accent/50">
                    <td className="px-4 py-2 font-medium">{s.code}</td>
                    <td className="px-4 py-2">{s.name}</td>
                    <td className="px-4 py-2">{s.phone || '—'}</td>
                    <td className="px-4 py-2">{s.paymentTerm}</td>
                    <td className="px-4 py-2 text-right">{formatVND(s.currentDebt)}</td>
                    <td className="px-4 py-2">
                      {s.active ? <Badge variant="default">Đang hợp tác</Badge> : <Badge variant="secondary">Đã ngưng</Badge>}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Can permission="SUPPLIER_WRITE">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(s)}>Sửa</Button>
                        <Button variant="ghost" size="sm" onClick={() => toggleActive(s)}>{s.active ? 'Ngưng' : 'Mở lại'}</Button>
                      </Can>
                    </td>
                  </tr>
                ))}
                {!loading && (!page || page.content.length === 0) && (
                  <tr><td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">Chưa có NCC — thêm NCC đầu tiên để nhập hàng</td></tr>
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
        <SheetContent className="max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editing ? 'Sửa nhà cung cấp' : 'Thêm nhà cung cấp'}</SheetTitle>
            <SheetDescription>Bỏ trống mã để tự sinh (SUP-001...).</SheetDescription>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-3 py-4">
            <div className="space-y-1">
              <Label>Mã</Label>
              <Input value={form.code} disabled={!!editing} onChange={(e) => set('code', e.target.value)} placeholder="SUP-001 (tự sinh)" />
            </div>
            <div className="space-y-1">
              <Label>Tên *</Label>
              <Input value={form.name} onChange={(e) => set('name', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>SĐT</Label>
              <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input value={form.email} onChange={(e) => set('email', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Mã số thuế</Label>
              <Input value={form.taxCode} onChange={(e) => set('taxCode', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Thanh toán</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.paymentTerm}
                onChange={(e) => set('paymentTerm', e.target.value as PaymentTerm)}
              >
                {TERMS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Địa chỉ</Label>
              <Input value={form.address} onChange={(e) => set('address', e.target.value)} />
            </div>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu'}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
