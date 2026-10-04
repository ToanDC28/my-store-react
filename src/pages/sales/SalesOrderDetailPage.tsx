import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { goodsIssuesApi, salesOrdersApi } from '@/api/trading';
import { advancesApi, warehousesApi } from '@/api/ops';
import type { AdvanceResponse, PaymentMethod, SalesOrderResponse, SalesOrderStatus, WarehouseResponse } from '@/api/types';
import { ApiError } from '@/lib/api-client';
import { formatVND, formatQty, formatDate } from '@/lib/format';
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

const STATUS_VN: Record<SalesOrderStatus, string> = {
  PENDING: 'Chờ duyệt', CONFIRMED: 'Đã duyệt', DELIVERING: 'Đang giao',
  COMPLETED: 'Hoàn tất', CANCELLED: 'Đã hủy',
};

export default function SalesOrderDetailPage() {
  const { id } = useParams();
  const [so, setSo] = useState<SalesOrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const [ginOpen, setGinOpen] = useState(false);
  const [advances, setAdvances] = useState<AdvanceResponse[]>([]);
  const [advOpen, setAdvOpen] = useState(false);
  const [advAmount, setAdvAmount] = useState('');
  const [advMethod, setAdvMethod] = useState<PaymentMethod>('CASH');
  const [advNote, setAdvNote] = useState('');
  const [warehouses, setWarehouses] = useState<WarehouseResponse[]>([]);
  const [warehouseId, setWarehouseId] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [data, wh, advs] = await Promise.all([
        salesOrdersApi.getById(Number(id)),
        warehousesApi.list(),
        advancesApi.search({ salesOrderId: Number(id), size: 20 }),
      ]);
      setSo(data);
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

  const act = async (fn: (n: number) => Promise<SalesOrderResponse>, okMsg: string) => {
    if (!so) return;
    if (!window.confirm(okMsg)) return;
    setActing(true);
    setError(null);
    try {
      setSo(await fn(so.id));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Thao tác thất bại');
    } finally {
      setActing(false);
    }
  };

  const submitGin = async () => {
    if (!so || !warehouseId) {
      setError('Chọn kho xuất');
      return;
    }
    // Xuất hết phần còn lại của đơn
    const items = so.items
      .filter((l) => l.qty - l.issuedQty > 0)
      .map((l) => ({ materialId: l.materialId, qty: l.qty - l.issuedQty }));
    if (items.length === 0) {
      setError('Đơn đã xuất hết');
      return;
    }
    setActing(true);
    setError(null);
    try {
      const gin = await goodsIssuesApi.create({ salesOrderId: so.id, warehouseId: Number(warehouseId), items });
      await goodsIssuesApi.confirm(gin.id);
      setGinOpen(false);
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Xuất kho thất bại (kiểm tra tồn kho)');
    } finally {
      setActing(false);
    }
  };

  if (loading) return <p className="text-muted-foreground">Đang tải...</p>;
  if (!so) return <Alert variant="destructive"><AlertDescription>{error ?? 'Không thấy đơn'}</AlertDescription></Alert>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">{so.code}</h1>
          <p className="text-sm text-muted-foreground">
            {so.customerName} · đặt {formatDate(so.orderDate)} · tổng {formatVND(so.grandTotal)}
          </p>
        </div>
        <Badge variant={so.status === 'CANCELLED' ? 'secondary' : 'default'}>{STATUS_VN[so.status]}</Badge>
      </div>

      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      <div className="flex flex-wrap gap-2">
        <Can permission="ORDER_WRITE">
          {so.status === 'PENDING' && (
            <Button disabled={acting} onClick={() => act((n) => salesOrdersApi.confirm(n), 'Duyệt đơn này?')}>Duyệt đơn</Button>
          )}
          {(so.status === 'CONFIRMED' || so.status === 'DELIVERING') && (
            <Button disabled={acting} onClick={() => setGinOpen(true)}>Tạo phiếu xuất</Button>
          )}
          {(so.status === 'PENDING' || so.status === 'CONFIRMED' || so.status === 'DELIVERING') && (
            <Button variant="destructive" disabled={acting} onClick={() => act((n) => salesOrdersApi.cancel(n), 'Hủy đơn này?')}>Hủy đơn</Button>
          )}
        </Can>
        <Can permission="PAYMENT_MANAGE">
          {!['CANCELLED', 'COMPLETED'].includes(so.status) && (
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

      <Card>
        <CardHeader><CardTitle className="text-base">Dòng hàng (đặt / đã xuất / đã trả)</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-4 py-2">Vật tư</th>
                  <th className="px-4 py-2 text-right">Đặt</th>
                  <th className="px-4 py-2 text-right">Đã xuất</th>
                  <th className="px-4 py-2 text-right">Đã trả</th>
                  <th className="px-4 py-2 text-right">Đơn giá</th>
                </tr>
              </thead>
              <tbody>
                {so.items.map((l) => (
                  <tr key={l.id} className="border-b hover:bg-accent/50">
                    <td className="px-4 py-2">{l.materialSku} — {l.materialName}</td>
                    <td className="px-4 py-2 text-right">{formatQty(l.qty)}</td>
                    <td className="px-4 py-2 text-right font-medium">{formatQty(l.issuedQty)}</td>
                    <td className="px-4 py-2 text-right">{formatQty(l.returnedQty)}</td>
                    <td className="px-4 py-2 text-right">{formatVND(l.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Sheet open={ginOpen} onOpenChange={setGinOpen}>
        <SheetContent className="max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Xuất kho cho đơn</SheetTitle>
            <SheetDescription>Xuất hết phần còn lại, trừ kho ngay + tự sinh hóa đơn bán.</SheetDescription>
          </SheetHeader>
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
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setGinOpen(false)}>Hủy</Button>
            <Button onClick={() => submitGin()} disabled={acting}>{acting ? 'Đang xuất...' : 'Xuất hết + xác nhận'}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

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

      <Sheet open={advOpen} onOpenChange={setAdvOpen}>
        <SheetContent className="max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Ghi cọc cho {so.code}</SheetTitle>
            <SheetDescription>Khách: {so.customerName} — cấn trừ khi xuất hóa đơn.</SheetDescription>
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
              <Input value={advNote} onChange={(e) => setAdvNote(e.target.value)} placeholder="VD: cọc 30% đơn hàng" />
            </div>
          </div>
          <SheetFooter>
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
                  await advancesApi.create({ salesOrderId: so.id, amount, method: advMethod, note: advNote || null });
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
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
