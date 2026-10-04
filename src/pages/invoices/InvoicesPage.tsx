import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { invoicesApi } from '@/api/ops';
import type { InvoiceResponse, InvoiceStatus, InvoiceType } from '@/api/types';
import type { PageResponse } from '@/lib/api-client';
import { ApiError } from '@/lib/api-client';
import { formatVND } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search } from 'lucide-react';

const TYPE_VN: Record<InvoiceType, string> = { WORK: 'Sửa chữa', SALES: 'Bán hàng', PURCHASE: 'Mua hàng' };
const STATUS_VN: Record<InvoiceStatus, string> = {
  DRAFT: 'Nháp', ISSUED: 'Đã xuất', PARTIAL: 'Trả góp', PAID: 'Đã trả hết',
  OVERDUE: 'Quá hạn', CANCELLED: 'Đã hủy', REFUNDED: 'Đã hoàn',
};

export default function InvoicesPage() {
  const [page, setPage] = useState<PageResponse<InvoiceResponse> | null>(null);
  const [keyword, setKeyword] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [pageNum, setPageNum] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPage(await invoicesApi.search({
        keyword: keyword || undefined,
        type: (type || undefined) as InvoiceType | undefined,
        status: (status || undefined) as InvoiceStatus | undefined,
        page: pageNum, size: 10,
      }));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Tải thất bại');
    } finally {
      setLoading(false);
    }
  }, [keyword, type, status, pageNum]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Hóa đơn</h1>
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      <Card>
        <CardHeader><CardTitle className="text-base">Tìm kiếm</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="min-w-52 flex-1 space-y-1">
            <Label>Từ khóa (mã/khách/NCC/đơn)</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-8" value={keyword} onChange={(e) => { setKeyword(e.target.value); setPageNum(0); }} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Loại</Label>
            <select className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={type} onChange={(e) => { setType(e.target.value); setPageNum(0); }}>
              <option value="">Tất cả</option>
              {(Object.keys(TYPE_VN) as InvoiceType[]).map((t) => <option key={t} value={t}>{TYPE_VN[t]}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <Label>Trạng thái</Label>
            <select className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={status} onChange={(e) => { setStatus(e.target.value); setPageNum(0); }}>
              <option value="">Tất cả</option>
              {(Object.keys(STATUS_VN) as InvoiceStatus[]).map((s) => <option key={s} value={s}>{STATUS_VN[s]}</option>)}
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
                  <th className="px-4 py-2">Loại</th>
                  <th className="px-4 py-2">Khách/NCC</th>
                  <th className="px-4 py-2 text-right">Tổng</th>
                  <th className="px-4 py-2 text-right">Đã trả</th>
                  <th className="px-4 py-2 text-right">Còn nợ</th>
                  <th className="px-4 py-2">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">Đang tải...</td></tr>}
                {!loading && page?.content.map((inv) => (
                  <tr key={inv.id} className="border-b hover:bg-accent/50">
                    <td className="px-4 py-2 font-medium">
                      <Link className="text-primary hover:underline" to={`/invoices/${inv.id}`}>{inv.code}</Link>
                    </td>
                    <td className="px-4 py-2">{TYPE_VN[inv.type]}</td>
                    <td className="px-4 py-2">{inv.customerName ?? inv.supplierName ?? '—'}</td>
                    <td className="px-4 py-2 text-right">{formatVND(inv.grandTotal)}</td>
                    <td className="px-4 py-2 text-right">{formatVND(inv.paidAmount)}</td>
                    <td className="px-4 py-2 text-right">
                      {inv.grandTotal - inv.paidAmount > 0
                        ? <span className="font-semibold text-destructive">{formatVND(inv.grandTotal - inv.paidAmount)}</span>
                        : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-2">
                      <Badge variant={inv.status === 'PAID' ? 'default' : inv.status === 'OVERDUE' ? 'destructive' : inv.status === 'CANCELLED' || inv.status === 'REFUNDED' ? 'secondary' : 'outline'}>
                        {STATUS_VN[inv.status]}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {!loading && (!page || page.content.length === 0) && (
                  <tr><td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">Chưa có hóa đơn</td></tr>
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
