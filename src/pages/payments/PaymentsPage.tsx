import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { advancesApi, paymentsApi } from '@/api/ops';
import type { AdvanceResponse, AdvanceStatus, PaymentMethod, PaymentResponse, PaymentStatus } from '@/api/types';
import type { PageResponse } from '@/lib/api-client';
import { ApiError } from '@/lib/api-client';
import { formatVND, todayISO } from '@/lib/format';
import { Can } from '@/components/Can';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Summary {
  from: string;
  to: string;
  lines: { date: string; method: PaymentMethod; totalAmount: number; count: number }[];
  totalCash: number;
  totalBank: number;
  grandTotal: number;
  count: number;
}

export default function PaymentsPage() {
  const [page, setPage] = useState<PageResponse<PaymentResponse> | null>(null);
  const [pageNum, setPageNum] = useState(0);
  const [method, setMethod] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [advances, setAdvances] = useState<PageResponse<AdvanceResponse> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const today = todayISO();
      const [pays, sum, advs] = await Promise.all([
        paymentsApi.search({ page: pageNum, size: 10, method: (method || undefined) as PaymentMethod | undefined }),
        paymentsApi.summary(today, today),
        advancesApi.search({ page: 0, size: 5, status: 'ACTIVE' as AdvanceStatus }),
      ]);
      setPage(pays);
      setSummary(sum);
      setAdvances(advs);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Tải thất bại');
    } finally {
      setLoading(false);
    }
  }, [pageNum, method]);

  useEffect(() => {
    load();
  }, [load]);

  const refund = async (id: number) => {
    if (!window.confirm('Hoàn lại khoản thu này?')) return;
    try {
      await paymentsApi.refund(id);
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Hoàn tiền thất bại');
    }
  };

  const statusBadge = (s: PaymentStatus) =>
    s === 'SUCCESS' ? <Badge variant="default">Thành công</Badge>
    : s === 'REFUNDED' ? <Badge variant="secondary">Đã hoàn</Badge>
    : <Badge variant="destructive">Thất bại</Badge>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Thu chi</h1>
        <span className="text-sm text-muted-foreground">Cọc ghi từ chi tiết đơn sửa/bán</span>
      </div>

      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-base">Thu hôm nay (tiền mặt)</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatVND(summary?.totalCash ?? 0)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Thu hôm nay (CK)</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatVND(summary?.totalBank ?? 0)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Cọc đang giữ ({advances?.totalElements ?? 0})</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatVND((advances?.content ?? []).reduce((s, a) => s + a.amount, 0))}
            </div>
            <div className="mt-1 space-y-1">
              {(advances?.content ?? []).slice(0, 5).map((a) => (
                <div key={a.id} className="flex justify-between text-xs">
                  <span>{a.code} — {a.workOrderCode ?? a.salesOrderCode ?? a.customerName}</span>
                  <span>{formatVND(a.amount)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Lịch sử thu chi</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="flex flex-wrap gap-3 px-4 py-3">
            <div className="space-y-1">
              <Label>Hình thức</Label>
              <select
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={method}
                onChange={(e) => { setMethod(e.target.value); setPageNum(0); }}
              >
                <option value="">Tất cả</option>
                <option value="CASH">Tiền mặt</option>
                <option value="BANK_TRANSFER">Chuyển khoản</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-4 py-2">Mã thu</th>
                  <th className="px-4 py-2">Hóa đơn</th>
                  <th className="px-4 py-2 text-right">Số tiền</th>
                  <th className="px-4 py-2">Hình thức</th>
                  <th className="px-4 py-2">Người thu</th>
                  <th className="px-4 py-2">Trạng thái</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">Đang tải...</td></tr>}
                {!loading && page?.content.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-accent/50">
                    <td className="px-4 py-2 font-medium">{p.code}</td>
                    <td className="px-4 py-2">
                      <Link className="text-primary hover:underline" to={`/invoices/${p.invoiceId}`}>{p.invoiceCode}</Link>
                    </td>
                    <td className="px-4 py-2 text-right">{formatVND(p.amount)}</td>
                    <td className="px-4 py-2">{p.method === 'CASH' ? 'Tiền mặt' : 'CK'}</td>
                    <td className="px-4 py-2">{p.receivedBy ?? '—'}</td>
                    <td className="px-4 py-2">{statusBadge(p.status)}</td>
                    <td className="px-4 py-2 text-right">
                      <Can permission="PAYMENT_MANAGE">
                        {p.status === 'SUCCESS' && (
                          <Button variant="ghost" size="sm" onClick={() => refund(p.id)}>Hoàn lại</Button>
                        )}
                      </Can>
                    </td>
                  </tr>
                ))}
                {!loading && (!page || page.content.length === 0) && (
                  <tr><td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">Chưa có giao dịch</td></tr>
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

    </div>
  );
}
