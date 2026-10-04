import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { workOrdersApi } from '@/api/work-orders';
import { advancesApi } from '@/api/ops';
import type { AdvanceResponse, PaymentMethod } from '@/api/types';
import { invoicesApi } from '@/api/ops';
import { materialsApi } from '@/api/materials';
import { warehousesApi } from '@/api/ops';
import type { MaterialResponse, WarehouseResponse, WorkOrderAttachmentResponse, WorkOrderResponse, WorkOrderStatus } from '@/api/types';
import { ApiError } from '@/lib/api-client';
import { formatVND, formatQty, formatDate } from '@/lib/format';
import { Can } from '@/components/Can';
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
import { Trash2 } from 'lucide-react';

const STATUS_VN: Record<WorkOrderStatus, string> = {
  DRAFT: 'Nháp', CONFIRMED: 'Đã duyệt', IN_PROGRESS: 'Đang làm',
  DONE: 'Nghiệm thu', INVOICED: 'Đã xuất HĐ', CANCELLED: 'Đã hủy',
};

interface ConsumeRow {
  key: number;
  material: MaterialResponse | null;
  qty: string;
}

let rowSeq = 0;
const newRow = (): ConsumeRow => ({ key: ++rowSeq, material: null, qty: '' });

function PhotoThumb({ file }: { file: WorkOrderAttachmentResponse }) {
  if (!file.url) {
    return (
      <div className="flex h-24 w-24 items-center justify-center rounded-md border text-xs text-muted-foreground">
        {file.fileName}
      </div>
    );
  }
  return (
    <a href={file.url} target="_blank" rel="noreferrer" title={file.fileName}>
      <img src={file.url} alt={file.fileName} className="h-24 w-24 rounded-md border object-cover" loading="lazy" />
    </a>
  );
}

export default function WorkOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [wo, setWo] = useState<WorkOrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const [consumeOpen, setConsumeOpen] = useState(false);
  const [consumeLoading, setConsumeLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [advances, setAdvances] = useState<AdvanceResponse[]>([]);
  const [advOpen, setAdvOpen] = useState(false);
  const [advAmount, setAdvAmount] = useState('');
  const [advMethod, setAdvMethod] = useState<PaymentMethod>('CASH');
  const [advNote, setAdvNote] = useState('');
  const [warehouses, setWarehouses] = useState<WarehouseResponse[]>([]);
  const [warehouseId, setWarehouseId] = useState('');
  const [rows, setRows] = useState<ConsumeRow[]>([newRow()]);

  // Mở dialog: điền sẵn vật tư dự toán (SL = còn lại = dự toán - đã xuất)
  const openConsume = async () => {
    if (!wo) return;
    setConsumeOpen(true);
    const planned = wo.materials.filter((m) => m.qtyPlanned - m.qtyActual > 0);
    if (planned.length === 0) {
      setRows([newRow()]);
      return;
    }
    setConsumeLoading(true);
    try {
      const materials = await Promise.all(planned.map((m) => materialsApi.getById(m.materialId)));
      setRows(
        planned.map((m, i) => ({
          key: ++rowSeq,
          material: materials[i],
          qty: String(m.qtyPlanned - m.qtyActual),
        })),
      );
    } catch {
      setRows([newRow()]);
    } finally {
      setConsumeLoading(false);
    }
  };

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [data, wh, advs] = await Promise.all([
        workOrdersApi.getById(Number(id)),
        warehousesApi.list(),
        advancesApi.search({ workOrderId: Number(id), size: 20 }),
      ]);
      setWo(data);
      setAdvances(advs.content);
      setWarehouses(wh);
      if (wh.length > 0) setWarehouseId((cur) => cur || String(wh[0].id));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Tải thất bại');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (fn: (n: number) => Promise<WorkOrderResponse>, okMsg: string) => {
    if (!wo) return;
    if (!window.confirm(okMsg)) return;
    setActing(true);
    setError(null);
    try {
      setWo(await fn(wo.id));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Thao tác thất bại');
    } finally {
      setActing(false);
    }
  };

  const setRow = (key: number, patch: Partial<ConsumeRow>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const uploadPhotos = async (files: FileList | null) => {
    if (!wo || !files || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      for (const f of Array.from(files)) {
        await workOrdersApi.uploadPhoto(wo.id, f);
      }
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Upload ảnh thất bại (chỉ JPG/PNG/WEBP, tối đa 10MB)');
    } finally {
      setUploading(false);
    }
  };

  const submitConsume = async () => {
    if (!wo) return;
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
    setError(null);
    try {
      setWo(await workOrdersApi.consume(wo.id, { warehouseId: Number(warehouseId), items }));
      setConsumeOpen(false);
      setRows([newRow()]);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Xuất vật tư thất bại');
    } finally {
      setActing(false);
    }
  };

  if (loading) return <p className="text-muted-foreground">Đang tải...</p>;
  if (!wo) return <Alert variant="destructive"><AlertDescription>{error ?? 'Không thấy đơn'}</AlertDescription></Alert>;

  const canWork = wo.status === 'CONFIRMED' || wo.status === 'IN_PROGRESS';
  const planned = wo.materials.reduce((s, m) => s + m.qtyPlanned * m.unitCost, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">{wo.code}</h1>
          <p className="text-sm text-muted-foreground">
            {wo.type === 'REPAIR' ? 'Sửa chữa' : 'Làm mới'} — {wo.customerName}
            {wo.contractNo ? ` — HĐ ${wo.contractNo}` : ''}
          </p>
        </div>
        <Badge variant={wo.status === 'CANCELLED' ? 'secondary' : 'default'}>{STATUS_VN[wo.status]}</Badge>
      </div>

      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      <div className="flex flex-wrap gap-2">
        <Can permission="ORDER_WRITE">
          {wo.status === 'DRAFT' && (
            <Button disabled={acting} onClick={() => act((n) => workOrdersApi.confirm(n), 'Duyệt đơn này?')}>Duyệt đơn</Button>
          )}
          {canWork && (
            <>
              <Button disabled={acting} onClick={openConsume}>Xuất vật tư</Button>
              <Button variant="outline" disabled={acting} onClick={() => act((n) => workOrdersApi.done(n), 'Chốt nghiệm thu? (khóa số liệu thực tế)')}>Nghiệm thu</Button>
            </>
          )}
          {(wo.status === 'DRAFT' || wo.status === 'CONFIRMED') && (
            <Button variant="destructive" disabled={acting} onClick={() => act((n) => workOrdersApi.cancel(n), 'Hủy đơn này?')}>Hủy đơn</Button>
          )}
          {wo.status === 'DONE' && (
            <Can permission="INVOICE_WRITE">
              <Button
                disabled={acting}
                onClick={async () => {
                  setActing(true);
                  setError(null);
                  try {
                    const inv = await invoicesApi.createWork({ workOrderId: wo.id, vatRate: 10 });
                    navigate(`/invoices/${inv.id}`);
                  } catch (e) {
                    setError(e instanceof ApiError ? e.message : 'Xuất hóa đơn thất bại');
                  } finally {
                    setActing(false);
                  }
                }}
              >
                Xuất hóa đơn
              </Button>
            </Can>
          )}
        </Can>
        <Can permission="PAYMENT_MANAGE">
          {!['CANCELLED', 'INVOICED'].includes(wo.status) && (
            <Button
              variant="outline"
              disabled={acting}
              onClick={() => {
                setAdvAmount('');
                setAdvNote('');
                setAdvOpen(true);
              }}
            >
              Ghi cọc
            </Button>
          )}
        </Can>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-base">Thông tin</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div>Máy/Thiết bị: <strong>{wo.machineInfo || '—'}</strong></div>
            <div>Hẹn trả: <strong>{formatDate(wo.dueDate)}</strong></div>
            <div>Nhân công: <strong>{formatVND(wo.laborCost)}</strong></div>
            <div>Chi phí chung: <strong>{formatVND(wo.overheadCost)}</strong></div>
            {wo.agreedPrice != null && <div>Giá chốt HĐ: <strong>{formatVND(wo.agreedPrice)}</strong></div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Vật tư dự toán</CardTitle></CardHeader>
          <CardContent className="text-sm">
            <div className="text-2xl font-bold">{formatVND(planned)}</div>
            <p className="text-xs text-muted-foreground">Theo giá vốn lúc tạo đơn</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Vật tư thực tế</CardTitle></CardHeader>
          <CardContent className="text-sm">
            <div className="text-2xl font-bold">{formatVND(wo.materialActualCost)}</div>
            <p className="text-xs text-muted-foreground">Đã xuất trừ kho</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Vật tư (dự toán / thực xuất)</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-4 py-2">Vật tư</th>
                  <th className="px-4 py-2 text-right">Dự toán</th>
                  <th className="px-4 py-2 text-right">Thực xuất</th>
                  <th className="px-4 py-2 text-right">Đơn giá tính</th>
                </tr>
              </thead>
              <tbody>
                {wo.materials.map((m) => (
                  <tr key={m.id} className="border-b hover:bg-accent/50">
                    <td className="px-4 py-2">{m.materialSku} — {m.materialName}</td>
                    <td className="px-4 py-2 text-right">{formatQty(m.qtyPlanned)}</td>
                    <td className="px-4 py-2 text-right font-medium">{formatQty(m.qtyActual)}</td>
                    <td className="px-4 py-2 text-right">{formatVND(m.unitSellPrice ?? m.unitCost)}</td>
                  </tr>
                ))}
                {wo.materials.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">Chưa có dòng vật tư</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Ảnh nghiệm thu ({wo.attachments?.length ?? 0})</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {(wo.attachments?.length ?? 0) === 0 && (
            <p className="text-sm text-muted-foreground">
              Chưa có ảnh — chụp máy sau khi sửa xong. Nghiệm thu yêu cầu ít nhất 1 ảnh.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {(wo.attachments ?? []).map((a) => (
              <PhotoThumb key={a.id} file={a} />
            ))}
          </div>
          <Can permission={['ORDER_WRITE', 'INVENTORY_WRITE']}>
            {(wo.status === 'CONFIRMED' || wo.status === 'IN_PROGRESS') && (
              <div className="space-y-1">
                <Label htmlFor="wo-photo">Thêm ảnh (JPG/PNG/WEBP, tối đa 10MB/ảnh)</Label>
                <Input
                  id="wo-photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  disabled={uploading}
                  onChange={(e) => {
                    uploadPhotos(e.target.files);
                    e.target.value = '';
                  }}
                />
                {uploading && <p className="text-sm text-muted-foreground">Đang tải ảnh lên...</p>}
              </div>
            )}
          </Can>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Tiền cọc ({advances.length})</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {advances.length === 0 && (
            <p className="text-sm text-muted-foreground">Chưa ghi cọc nào cho đơn này.</p>
          )}
          {advances.map((a) => (
            <div key={a.id} className="flex justify-between border-b py-2 text-sm">
              <span>
                {a.code} <span className="text-muted-foreground">({a.method === 'CASH' ? 'Tiền mặt' : 'CK'})</span>
              </span>
              <span>
                <strong>{formatVND(a.amount)}</strong>{' '}
                <Badge variant={a.status === 'ACTIVE' ? 'default' : 'secondary'}>
                  {a.status === 'ACTIVE' ? 'Còn giữ' : a.status === 'APPLIED' ? 'Đã cấn trừ' : 'Đã hủy'}
                </Badge>
              </span>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">Cấn trừ cọc vào hóa đơn ở màn Hóa đơn.</p>
        </CardContent>
      </Card>

      <Sheet open={consumeOpen} onOpenChange={setConsumeOpen}>
        <SheetContent className="max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Xuất vật tư thực tế</SheetTitle>
            <SheetDescription>Đã điền sẵn theo dự toán (SL = còn lại). Trừ kho ngay + cộng vào thực xuất.</SheetDescription>
          </SheetHeader>
          {consumeLoading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Đang tải vật tư dự toán...</p>
          ) : (
          <>
          <div className="space-y-3 py-4">
            <div className="space-y-1">
              <Label>Kho xuất *</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
              >
                {warehouses.map((w) => <option key={w.id} value={w.id}>{w.code} — {w.name}</option>)}
              </select>
            </div>
            {rows.map((r) => (
              <div key={r.key} className="grid grid-cols-[2fr_1fr_auto] gap-2">
                <MaterialPicker value={r.material} onChange={(m) => setRow(r.key, { material: m })} />
                <Input type="number" min={1} placeholder="SL thực xuất" value={r.qty} onChange={(e) => setRow(r.key, { qty: e.target.value })} />
                <Button variant="ghost" size="sm" disabled={rows.length <= 1} onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setRows((rs) => [...rs, newRow()])}>+ Thêm dòng</Button>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConsumeOpen(false)}>Hủy</Button>
            <Button onClick={submitConsume} disabled={acting}>{acting ? 'Đang xuất...' : 'Xuất kho'}</Button>
          </div>
          </>
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={advOpen} onOpenChange={setAdvOpen}>
        <SheetContent className="max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Ghi cọc cho {wo.code}</SheetTitle>
            <SheetDescription>Khách: {wo.customerName} — cấn trừ khi xuất hóa đơn.</SheetDescription>
          </SheetHeader>
          <div className="grid gap-3 py-4">
            <div className="space-y-1">
              <Label>Số tiền *</Label>
              <Input type="number" min={1} value={advAmount} onChange={(e) => setAdvAmount(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Hình thức</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={advMethod}
                onChange={(e) => setAdvMethod(e.target.value as PaymentMethod)}
              >
                <option value="CASH">Tiền mặt</option>
                <option value="BANK_TRANSFER">Chuyển khoản</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>Ghi chú</Label>
              <Input value={advNote} onChange={(e) => setAdvNote(e.target.value)} placeholder="VD: cọc 30% hợp đồng" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAdvOpen(false)}>Hủy</Button>
            <Button
              disabled={acting}
              onClick={async () => {
                const amount = Number(advAmount);
                if (!amount || amount <= 0) {
                  setError('Nhập số tiền cọc > 0');
                  return;
                }
                setActing(true);
                setError(null);
                try {
                  await advancesApi.create({ workOrderId: wo.id, amount, method: advMethod, note: advNote || null });
                  setAdvOpen(false);
                  setAdvAmount('');
                  setAdvNote('');
                  load();
                } catch (e) {
                  setError(e instanceof ApiError ? e.message : 'Ghi cọc thất bại');
                } finally {
                  setActing(false);
                }
              }}
            >
              {acting ? 'Đang ghi...' : 'Ghi cọc'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
