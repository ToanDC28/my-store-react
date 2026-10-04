import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { invoicesApi, paymentsApi, advancesApi } from '@/api/ops';
import type { AdvanceResponse, InvoiceResponse, PaymentMethod, PaymentResponse } from '@/api/types';
import { ApiError } from '@/lib/api-client';
import { formatVND, formatDate } from '@/lib/format';
import { Can } from '@/components/Can';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const [inv, setInv] = useState<InvoiceResponse | null>(null);
  const [payments, setPayments] = useState<PaymentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [txnRef, setTxnRef] = useState('');
  const [note, setNote] = useState('');
  const [advances, setAdvances] = useState<AdvanceResponse[]>([]);
  const [useAdvanceId, setUseAdvanceId] = useState<string>('');

  const openPay = async () => {
    setPayOpen(true);
    setUseAdvanceId('');
    setAdvances([]);
    // Cọc ACTIVE của đúng khách trên hóa đơn (nếu có) để cấn trừ thay vì thu tiền mới
    if (inv?.customerId) {
      try {
        const data = await advancesApi.search({ customerId: inv.customerId, status: 'ACTIVE', size: 20 });
        setAdvances(data.content);
      } catch {
        setAdvances([]);
      }
    }
  };

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [data, pays] = await Promise.all([
        invoicesApi.getById(Number(id)),
        paymentsApi.listByInvoice(Number(id)),
      ]);
      setInv(data);
      setPayments(pays);
      setAmount(String(data.grandTotal - data.paidAmount));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Tải thất bại');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const remaining = inv ? inv.grandTotal - inv.paidAmount : 0;
  const canPay = inv && ['ISSUED', 'PARTIAL', 'OVERDUE'].includes(inv.status) && remaining > 0;

  const submitPay = async () => {
    if (!inv) return;
    // Cấn trừ cọc: không cần nhập số tiền/hình thức
    if (useAdvanceId) {
      setActing(true);
      setError(null);
      try {
        await advancesApi.apply(Number(useAdvanceId), inv.id);
        setPayOpen(false);
        load();
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'Cấn trừ cọc thất bại (cọc phải <= số còn nợ)');
      } finally {
        setActing(false);
      }
      return;
    }
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      setError('Nhập số tiền > 0');
      return;
    }
    if (method === 'BANK_TRANSFER' && !txnRef.trim()) {
      setError('Chuyển khoản phải nhập mã CK');
      return;
    }
    setActing(true);
    setError(null);
    try {
      await paymentsApi.pay(inv.id, {
        amount: amt,
        method,
        transactionRef: txnRef.trim() || null,
        note: note.trim() || null,
      });
      setPayOpen(false);
      setTxnRef('');
      setNote('');
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Thu tiền thất bại');
    } finally {
      setActing(false);
    }
  };

  const act = async (fn: () => Promise<InvoiceResponse>, msg: string, confirmMsg?: string) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setActing(true);
    setError(null);
    try {
      setInv(await fn());
      if (id) {
        setPayments(await paymentsApi.listByInvoice(Number(id)));
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : msg);
    } finally {
      setActing(false);
    }
  };

  const refund = async (paymentId: number) => {
    if (!window.confirm('Hoàn lại khoản thu này?')) return;
    setActing(true);
    setError(null);
    try {
      await paymentsApi.refund(paymentId);
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Hoàn tiền thất bại');
    } finally {
      setActing(false);
    }
  };

  if (loading) return <p className="text-muted-foreground">Đang tải...</p>;
  if (!inv) return <Alert variant="destructive"><AlertDescription>{error ?? 'Không thấy hóa đơn'}</AlertDescription></Alert>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">{inv.code}</h1>
          <p className="text-sm text-muted-foreground">
            {inv.customerName ?? inv.supplierName} · xuất {formatDate(inv.issueDate)}
            {inv.dueDate ? ` · hạn ${formatDate(inv.dueDate)}` : ''}
          </p>
        </div>
        <Badge variant={inv.status === 'PAID' ? 'default' : inv.status === 'OVERDUE' ? 'destructive' : 'outline'}>{inv.status}</Badge>
      </div>

      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      <div className="flex flex-wrap gap-2">
        <Can permission="PAYMENT_MANAGE">
          {canPay && <Button disabled={acting} onClick={openPay}>Thu tiền (còn nợ {formatVND(remaining)})</Button>}
        </Can>
        <Can permission="INVOICE_WRITE">
          {inv.status === 'DRAFT' && (
            <Button variant="outline" disabled={acting} onClick={() => act(() => invoicesApi.issue(inv.id), 'Xuất hóa đơn thất bại', 'Chốt xuất hóa đơn? (khóa dòng hàng)')}>Chốt xuất</Button>
          )}
          {!['PAID', 'CANCELLED', 'REFUNDED'].includes(inv.status) && (
            <Button variant="destructive" disabled={acting} onClick={() => act(() => invoicesApi.cancel(inv.id), 'Hủy thất bại', 'Hủy hóa đơn này?')}>Hủy HĐ</Button>
          )}
        </Can>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-base">Tổng tiền</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between"><span>Tạm tính</span><strong>{formatVND(inv.subTotal)}</strong></div>
            <div className="flex justify-between"><span>Giảm giá</span><strong>{formatVND(inv.discountAmount)}</strong></div>
            <div className="flex justify-between"><span>VAT {inv.vatRate}%</span><strong>{formatVND(inv.vatAmount)}</strong></div>
            <div className="flex justify-between border-t pt-1"><span>Tổng cộng</span><strong>{formatVND(inv.grandTotal)}</strong></div>
            <div className="flex justify-between"><span>Đã trả</span><strong>{formatVND(inv.paidAmount)}</strong></div>
            <div className="flex justify-between"><span>Còn nợ</span><strong className="text-destructive">{formatVND(remaining)}</strong></div>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader><CardTitle className="text-base">Dòng hàng</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-4 py-2">Diễn giải</th>
                  <th className="px-4 py-2 text-right">SL</th>
                  <th className="px-4 py-2 text-right">Đơn giá</th>
                  <th className="px-4 py-2 text-right">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {inv.items.map((l, i) => (
                  <tr key={l.id || i} className="border-b">
                    <td className="px-4 py-2">{l.description}</td>
                    <td className="px-4 py-2 text-right">{l.qty}</td>
                    <td className="px-4 py-2 text-right">{formatVND(l.unitPrice)}</td>
                    <td className="px-4 py-2 text-right">{formatVND(l.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Lịch sử thu ({payments.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="px-4 py-2">Mã thu</th>
                <th className="px-4 py-2 text-right">Số tiền</th>
                <th className="px-4 py-2">Hình thức</th>
                <th className="px-4 py-2">Người thu</th>
                <th className="px-4 py-2">Trạng thái</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b">
                  <td className="px-4 py-2 font-medium">{p.code}</td>
                  <td className="px-4 py-2 text-right">{formatVND(p.amount)}</td>
                  <td className="px-4 py-2">{p.method === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'}</td>
                  <td className="px-4 py-2">{p.receivedBy ?? '—'}</td>
                  <td className="px-4 py-2">{p.status}</td>
                  <td className="px-4 py-2 text-right">
                    <Can permission="PAYMENT_MANAGE">
                      {p.status === 'SUCCESS' && (
                        <Button variant="ghost" size="sm" disabled={acting} onClick={() => refund(p.id)}>Hoàn lại</Button>
                      )}
                    </Can>
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">Chưa thu lần nào</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Sheet open={payOpen} onOpenChange={setPayOpen}>
        <SheetContent className="max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Thu tiền — còn nợ {formatVND(remaining)}</SheetTitle>
          </SheetHeader>
          <div className="grid gap-3 py-4">
            {advances.length > 0 && (
              <div className="space-y-1">
                <Label>Cấn trừ từ cọc có sẵn (thay vì thu tiền mới)</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={useAdvanceId}
                  onChange={(e) => setUseAdvanceId(e.target.value)}
                >
                  <option value="">— Thu tiền mới —</option>
                  {advances.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code} — {formatVND(a.amount)}{a.amount > remaining ? ' (vượt số nợ!)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {useAdvanceId === '' && (
              <>
            <div className="space-y-1">
              <Label>Số tiền *</Label>
              <Input type="number" min={1} max={remaining} value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Hình thức</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              >
                <option value="CASH">Tiền mặt</option>
                <option value="BANK_TRANSFER">Chuyển khoản</option>
              </select>
            </div>
            {method === 'BANK_TRANSFER' && (
              <div className="space-y-1">
                <Label>Mã CK *</Label>
                <Input value={txnRef} onChange={(e) => setTxnRef(e.target.value)} placeholder="Mã giao dịch ngân hàng" />
              </div>
            )}
            <div className="space-y-1">
              <Label>Ghi chú</Label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="VD: khách trả 1 phần" />
            </div>
              </>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPayOpen(false)}>Hủy</Button>
            <Button onClick={submitPay} disabled={acting}>
              {acting ? 'Đang xử lý...' : useAdvanceId ? 'Cấn trừ cọc' : 'Thu tiền'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
