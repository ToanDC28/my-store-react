import { useCallback, useEffect, useState } from 'react';
import { materialsApi, type CreateMaterialInput } from '@/api/materials';
import type { MaterialResponse, MaterialUnit } from '@/api/types';
import type { PageResponse } from '@/lib/api-client';
import { ApiError } from '@/lib/api-client';
import { formatVND, formatQty } from '@/lib/format';
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

const UNITS: MaterialUnit[] = ['CAI', 'KG', 'MET', 'LIT', 'BO', 'HOP', 'CUON'];

const emptyForm: CreateMaterialInput = {
  sku: '', name: '', unit: 'CAI', costPrice: 0, sellPrice: null, minStock: 0, location: '', brand: '',
};

export default function MaterialsPage() {
  const [page, setPage] = useState<PageResponse<MaterialResponse> | null>(null);
  const [keyword, setKeyword] = useState('');
  const [pageNum, setPageNum] = useState(0);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MaterialResponse | null>(null);
  const [form, setForm] = useState<CreateMaterialInput>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await materialsApi.search({ keyword: keyword || undefined, page: pageNum, size: 10, lowStockOnly: lowStockOnly || undefined });
      setPage(data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Tải thất bại');
    } finally {
      setLoading(false);
    }
  }, [keyword, pageNum, lowStockOnly]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (m: MaterialResponse) => {
    setEditing(m);
    setForm({
      sku: m.sku, name: m.name, unit: m.unit, costPrice: m.costPrice,
      sellPrice: m.sellPrice, minStock: m.minStock, location: m.location ?? '', brand: m.brand ?? '',
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.sku.trim() || !form.name.trim()) {
      setError('Nhập SKU và tên vật tư');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const { sku: _sku, ...payload } = form;
        await materialsApi.update(editing.id, payload);
      } else {
        await materialsApi.create(form);
      }
      setDialogOpen(false);
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (m: MaterialResponse) => {
    try {
      await materialsApi.setActive(m.id, !m.active);
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Đổi trạng thái thất bại');
    }
  };

  const set = <K extends keyof CreateMaterialInput>(k: K, v: CreateMaterialInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const num = (v: string): number => (v === '' ? 0 : Number(v));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Vật tư kho</h1>
        <Can permission="PRODUCT_WRITE">
          <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Thêm vật tư</Button>
        </Can>
      </div>

      {error && (
        <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tìm kiếm</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="min-w-52 flex-1 space-y-1">
            <Label>Từ khóa (mã/tên)</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="VD: thép, VT-THEP..."
                value={keyword}
                onChange={(e) => { setKeyword(e.target.value); setPageNum(0); }}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => { setLowStockOnly(e.target.checked); setPageNum(0); }}
            />
            Chỉ hàng sắp hết
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-4 py-2">SKU</th>
                  <th className="px-4 py-2">Tên</th>
                  <th className="px-4 py-2">ĐVT</th>
                  <th className="px-4 py-2 text-right">Giá vốn</th>
                  <th className="px-4 py-2 text-right">Giá bán</th>
                  <th className="px-4 py-2 text-right">Tồn</th>
                  <th className="px-4 py-2">Vị trí</th>
                  <th className="px-4 py-2">Trạng thái</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={9} className="px-4 py-6 text-center text-muted-foreground">Đang tải...</td></tr>
                )}
                {!loading && page?.content.map((m) => (
                  <tr key={m.id} className="border-b hover:bg-accent/50">
                    <td className="px-4 py-2 font-medium">{m.sku}</td>
                    <td className="px-4 py-2">{m.name}</td>
                    <td className="px-4 py-2">{m.unit}</td>
                    <td className="px-4 py-2 text-right">{formatVND(m.costPrice)}</td>
                    <td className="px-4 py-2 text-right">{formatVND(m.sellPrice)}</td>
                    <td className="px-4 py-2 text-right">
                      <span className={m.lowStock ? 'font-semibold text-destructive' : ''}>
                        {formatQty(m.stockQty, m.unit)}
                      </span>
                    </td>
                    <td className="px-4 py-2">{m.location || '—'}</td>
                    <td className="px-4 py-2">
                      {!m.active ? (
                        <Badge variant="secondary">Đã ẩn</Badge>
                      ) : m.stockQty === 0 ? (
                        <Badge variant="destructive">Hết hàng</Badge>
                      ) : m.lowStock ? (
                        <Badge variant="destructive">Sắp hết</Badge>
                      ) : (
                        <Badge variant="default">Còn hàng</Badge>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Can permission="PRODUCT_WRITE">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(m)}>Sửa</Button>
                        <Button variant="ghost" size="sm" onClick={() => toggleActive(m)}>
                          {m.active ? 'Ẩn' : 'Hiện'}
                        </Button>
                      </Can>
                    </td>
                  </tr>
                ))}
                {!loading && (!page || page.content.length === 0) && (
                  <tr><td colSpan={9} className="px-4 py-6 text-center text-muted-foreground">Chưa có vật tư</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {page && page.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="text-muted-foreground">
                Tổng {page.totalElements} — trang {page.number + 1}/{page.totalPages}
              </span>
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
            <SheetTitle>{editing ? 'Sửa vật tư' : 'Thêm vật tư'}</SheetTitle>
            <SheetDescription>Tồn kho chỉ thay đổi qua phiếu nhập/xuất, không nhập tay ở đây.</SheetDescription>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>SKU *</Label>
              <Input value={form.sku} disabled={!!editing} onChange={(e) => set('sku', e.target.value)} placeholder="VT-THEP-CT3-10MM" />
            </div>
            <div className="space-y-1">
              <Label>Tên *</Label>
              <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Thép tấm CT3 10mm" />
            </div>
            <div className="space-y-1">
              <Label>Đơn vị</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.unit}
                onChange={(e) => set('unit', e.target.value as MaterialUnit)}
              >
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Hãng (tùy chọn)</Label>
              <Input value={form.brand ?? ''} onChange={(e) => set('brand', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Giá vốn (đ)</Label>
              <Input type="number" min={0} value={form.costPrice} onChange={(e) => set('costPrice', num(e.target.value))} />
            </div>
            <div className="space-y-1">
              <Label>Giá bán (đ, trống = chỉ dùng nội bộ)</Label>
              <Input type="number" min={0} value={form.sellPrice ?? ''} onChange={(e) => set('sellPrice', e.target.value === '' ? null : num(e.target.value))} />
            </div>
            <div className="space-y-1">
              <Label>Tồn tối thiểu</Label>
              <Input type="number" min={0} value={form.minStock ?? 0} onChange={(e) => set('minStock', num(e.target.value))} />
            </div>
            <div className="space-y-1">
              <Label>Vị trí kệ</Label>
              <Input value={form.location ?? ''} onChange={(e) => set('location', e.target.value)} placeholder="Kệ A1" />
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
