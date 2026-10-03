import { useEffect, useState } from 'react';
import { goodsReceiptsApi } from '@/api/trading';
import { suppliersApi } from '@/api/suppliers';
import { warehousesApi } from '@/api/ops';
import type { MaterialResponse, SupplierResponse, WarehouseResponse } from '@/api/types';
import { ApiError } from '@/lib/api-client';
import { formatVND } from '@/lib/format';
import { MaterialPicker } from '@/components/pickers/MaterialPicker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2 } from 'lucide-react';

interface Row {
  key: number;
  material: MaterialResponse | null;
  qty: string;
  unitCost: string;
  batchNo: string;
}

let rowSeq = 0;
const newRow = (): Row => ({ key: ++rowSeq, material: null, qty: '', unitCost: '', batchNo: '' });

export default function QuickImportPage() {
  const [warehouses, setWarehouses] = useState<WarehouseResponse[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierResponse[]>([]);
  const [warehouseId, setWarehouseId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [rows, setRows] = useState<Row[]>([newRow()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([warehousesApi.list(), suppliersApi.search({ size: 100 })])
      .then(([wh, sup]) => {
        setWarehouses(wh);
        if (wh.length > 0) setWarehouseId(String(wh[0].id));
        setSuppliers(sup.content);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Tải thất bại'));
  }, []);

  const setRow = (key: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const total = rows.reduce((s, r) => s + (Number(r.qty) || 0) * (Number(r.unitCost) || 0), 0);

  const submit = async () => {
    setError(null);
    setSuccess(null);
    if (!warehouseId) {
      setError('Chọn kho nhập');
      return;
    }
    if (!supplierId) {
      setError('Chọn nhà cung cấp');
      return;
    }
    const items = [];
    for (const r of rows) {
      if (!r.material) {
        setError('Chọn vật tư cho mọi dòng');
        return;
      }
      const qty = Number(r.qty);
      const unitCost = Number(r.unitCost);
      if (!qty || qty <= 0) {
        setError(`Số lượng dòng ${r.material.sku} phải > 0`);
        return;
      }
      if (unitCost < 0 || r.unitCost === '') {
        setError(`Nhập đơn giá dòng ${r.material.sku}`);
        return;
      }
      items.push({ materialId: r.material.id, qty, unitCost, batchNo: r.batchNo || null });
    }
    if (items.length === 0) {
      setError('Thêm ít nhất 1 dòng vật tư');
      return;
    }
    setSaving(true);
    try {
      const grn = await goodsReceiptsApi.quickImport({
        warehouseId: Number(warehouseId),
        supplierId: Number(supplierId),
        items,
      });
      setSuccess(`Nhập thành công phiếu ${grn.code} — tồn kho + hóa đơn mua đã tự sinh`);
      setRows([newRow()]);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Nhập hàng thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Nhập hàng nhanh</h1>
      <p className="text-sm text-muted-foreground">
        Hàng đã mua rồi — ghi 1 phiếu là tồn kho + hóa đơn mua tự tăng, không qua đặt hàng.
      </p>
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      {success && (
        <Alert><AlertDescription>{success}</AlertDescription></Alert>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Thông tin chung</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label>Kho nhập *</Label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
            >
              {warehouses.map((w) => <option key={w.id} value={w.id}>{w.code} — {w.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <Label>Nhà cung cấp *</Label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
            >
              <option value="">— Chọn NCC —</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Dòng vật tư</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {rows.map((r) => (
            <div key={r.key} className="grid gap-2 rounded-md border p-3 md:grid-cols-[2fr_1fr_1fr_1fr_auto]">
              <MaterialPicker value={r.material} onChange={(m) => setRow(r.key, { material: m })} />
              <Input type="number" min={1} placeholder="Số lượng" value={r.qty} onChange={(e) => setRow(r.key, { qty: e.target.value })} />
              <Input type="number" min={0} placeholder="Đơn giá" value={r.unitCost} onChange={(e) => setRow(r.key, { unitCost: e.target.value })} />
              <Input placeholder="Lô (tùy chọn)" value={r.batchNo} onChange={(e) => setRow(r.key, { batchNo: e.target.value })} />
              <Button variant="ghost" size="sm" disabled={rows.length <= 1} onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setRows((rs) => [...rs, newRow()])}>+ Thêm dòng</Button>
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-muted-foreground">Tổng dự tính: <strong className="text-foreground">{formatVND(total)}</strong></span>
            <Button onClick={submit} disabled={saving}>{saving ? 'Đang nhập...' : 'Nhập kho'}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
