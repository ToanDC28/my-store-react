import { useCallback, useEffect, useState } from 'react';
import { stocksApi, warehousesApi } from '@/api/ops';
import type { PageResponse } from '@/lib/api-client';
import { ApiError } from '@/lib/api-client';
import type { StockResponse, StockTransactionResponse, WarehouseResponse } from '@/api/types';
import { formatQty } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function StocksPage() {
  const [warehouses, setWarehouses] = useState<WarehouseResponse[]>([]);
  const [warehouseId, setWarehouseId] = useState<string>('');
  const [page, setPage] = useState<PageResponse<StockResponse> | null>(null);
  const [lowOnly, setLowOnly] = useState(false);
  const [pageNum, setPageNum] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txns, setTxns] = useState<PageResponse<StockTransactionResponse> | null>(null);
  const [txnMaterialId, setTxnMaterialId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [wh, stocks] = await Promise.all([
        warehousesApi.list(),
        stocksApi.search({
          warehouseId: warehouseId ? Number(warehouseId) : undefined,
          page: pageNum, size: 10, lowStockOnly: lowOnly || undefined,
        }),
      ]);
      setWarehouses(wh);
      if (!warehouseId && wh.length > 0) setWarehouseId(String(wh[0].id));
      setPage(stocks);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Tải thất bại');
    } finally {
      setLoading(false);
    }
  }, [warehouseId, pageNum, lowOnly]);

  useEffect(() => {
    load();
  }, [load]);

  const loadTxns = async () => {
    setError(null);
    try {
      const data = await stocksApi.transactions({
        materialId: txnMaterialId ? Number(txnMaterialId) : undefined,
        warehouseId: warehouseId ? Number(warehouseId) : undefined,
        page: 0, size: 20,
      });
      setTxns(data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Tải lịch sử thất bại');
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Tồn kho</h1>
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      <Card>
        <CardHeader><CardTitle className="text-base">Bộ lọc</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label>Kho</Label>
            <select
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={warehouseId}
              onChange={(e) => { setWarehouseId(e.target.value); setPageNum(0); }}
            >
              <option value="">Tất cả kho</option>
              {warehouses.map((w) => <option key={w.id} value={w.id}>{w.code} — {w.name}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={lowOnly} onChange={(e) => { setLowOnly(e.target.checked); setPageNum(0); }} />
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
                  <th className="px-4 py-2">Kho</th>
                  <th className="px-4 py-2 text-right">Tồn</th>
                  <th className="px-4 py-2 text-right">Định mức</th>
                  <th className="px-4 py-2">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">Đang tải...</td></tr>}
                {!loading && page?.content.map((s) => (
                  <tr key={s.id} className="border-b hover:bg-accent/50">
                    <td className="px-4 py-2 font-medium">{s.materialSku}</td>
                    <td className="px-4 py-2">{s.materialName}</td>
                    <td className="px-4 py-2">{s.warehouseName}</td>
                    <td className="px-4 py-2 text-right">{formatQty(s.qtyOnHand, s.unit)}</td>
                    <td className="px-4 py-2 text-right">{formatQty(s.minStock, s.unit)}</td>
                    <td className="px-4 py-2">
                      {s.qtyOnHand === 0 ? (
                        <Badge variant="destructive">Hết hàng</Badge>
                      ) : s.lowStock ? (
                        <Badge variant="destructive">Sắp hết</Badge>
                      ) : (
                        <Badge variant="default">Còn hàng</Badge>
                      )}
                    </td>
                  </tr>
                ))}
                {!loading && (!page || page.content.length === 0) && (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">Kho trống (nhập hàng để có tồn)</td></tr>
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

      <Card>
        <CardHeader><CardTitle className="text-base">Lịch sử nhập/xuất</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label>ID vật tư (tùy chọn)</Label>
              <Input placeholder="VD: 1" value={txnMaterialId} onChange={(e) => setTxnMaterialId(e.target.value)} />
            </div>
            <Button variant="outline" onClick={loadTxns}>Xem lịch sử</Button>
          </div>
          {txns && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="px-4 py-2">Thời gian</th>
                    <th className="px-4 py-2">Vật tư</th>
                    <th className="px-4 py-2">Nhập/Xuất</th>
                    <th className="px-4 py-2">Phiếu</th>
                    <th className="px-4 py-2 text-right">Trước</th>
                    <th className="px-4 py-2 text-right">Thay đổi</th>
                    <th className="px-4 py-2 text-right">Sau</th>
                    <th className="px-4 py-2">Người làm</th>
                  </tr>
                </thead>
                <tbody>
                  {txns.content.map((t) => (
                    <tr key={t.id} className="border-b hover:bg-accent/50">
                      <td className="px-4 py-2">{t.createdDate ? new Date(t.createdDate).toLocaleString('vi-VN') : '—'}</td>
                      <td className="px-4 py-2">{t.materialSku} — {t.materialName}</td>
                      <td className="px-4 py-2">
                        <Badge variant={t.type === 'IN' ? 'default' : 'secondary'}>{t.type === 'IN' ? 'Nhập' : 'Xuất'}</Badge>
                        <span className="ml-1 text-xs text-muted-foreground">{t.refType}:{t.refId}</span>
                      </td>
                      <td className="px-4 py-2">{t.refId}</td>
                      <td className="px-4 py-2 text-right">{t.qtyBefore}</td>
                      <td className="px-4 py-2 text-right">{t.qtyChange > 0 ? `+${t.qtyChange}` : t.qtyChange}</td>
                      <td className="px-4 py-2 text-right font-medium">{t.qtyAfter}</td>
                      <td className="px-4 py-2">{t.createdBy || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
