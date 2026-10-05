import { useCallback, useEffect, useState } from 'react';
import { payrollApi } from '@/api/ops';
import type { PayrollResponse, PayrollStatus } from '@/api/types';
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

const STATUS_VN: Record<PayrollStatus, string> = {
  PENDING: 'Nháp', READY_TO_PAY: 'Chờ duyệt', APPROVED: 'Đã duyệt',
  PAID: 'Đã chi', REJECTED: 'Từ chối',
};

function currentPeriod(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function PayrollsPage() {
  const [page, setPage] = useState<PageResponse<PayrollResponse> | null>(null);
  const [period, setPeriod] = useState(currentPeriod());
  const [pageNum, setPageNum] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const [detail, setDetail] = useState<PayrollResponse | null>(null);
  const [bonus, setBonus] = useState('');
  const [overtime, setOvertime] = useState('');
  const [tax, setTax] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPage(await payrollApi.search({ period: period || undefined, page: pageNum, size: 10 }));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Tải thất bại');
    } finally {
      setLoading(false);
    }
  }, [period, pageNum]);

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = (p: PayrollResponse) => {
    setDetail(p);
    setBonus(String(p.bonus));
    setOvertime(String(p.overtimeHours));
    setTax(String(p.taxDeduction));
  };

  const refreshDetail = async () => {
    // Tải lại list để phản ánh chỉnh sửa; chi tiết đang mở giữ nguyên bản đã cập nhật từ response
    await load();
  };

  const doUpdate = async () => {
    if (!detail) return;
    setActing(true);
    setError(null);
    try {
      const updated = await payrollApi.update(detail.id, {
        bonus: bonus === '' ? undefined : Number(bonus),
        overtimeHours: overtime === '' ? undefined : Number(overtime),
        taxDeduction: tax === '' ? undefined : Number(tax),
      });
      setDetail(updated);
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Cập nhật thất bại');
    } finally {
      setActing(false);
    }
  };

  const doAction = async (kind: 'approve' | 'reject' | 'pay') => {
    if (!detail) return;
    const msg =
      kind === 'approve' ? `Duyệt chi ${formatVND(detail.netPay)} cho ${detail.staffUsername}?`
      : kind === 'pay' ? `Xác nhận đã chi ${formatVND(detail.netPay)}?`
      : 'Từ chối bảng lương này (tính lại sau)?';
    if (!window.confirm(msg)) return;
    setActing(true);
    setError(null);
    try {
      if (kind === 'approve') setDetail(await payrollApi.approve(detail.id, {}));
      else if (kind === 'reject') setDetail(await payrollApi.reject(detail.id));
      else setDetail(await payrollApi.pay(detail.id));
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Thao tác thất bại');
    } finally {
      setActing(false);
    }
  };

  const generate = async () => {
    if (!window.confirm(`Tính lương tháng ${period}? (worker cũng tự chạy mùng 1)`)) return;
    setActing(true);
    setError(null);
    try {
      await payrollApi.generate(period || currentPeriod());
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Tính lương thất bại (kiểm tra bậc lương nhân sự)');
    } finally {
      setActing(false);
    }
  };

  const editable = detail && ['READY_TO_PAY', 'PENDING', 'REJECTED'].includes(detail.status);
  const approvable = detail && ['READY_TO_PAY', 'PENDING', 'REJECTED'].includes(detail.status);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Bảng lương</h1>
        <Can permission="PAYROLL_WRITE">
          <Button onClick={generate} disabled={acting}>Tính lương tháng này</Button>
        </Can>
      </div>

      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      <Card>
        <CardHeader><CardTitle className="text-base">Kỳ lương</CardTitle></CardHeader>
        <CardContent>
          <Input
            type="month" className="max-w-xs" value={period}
            onChange={(e) => { setPeriod(e.target.value); setPageNum(0); }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-4 py-2">Nhân sự</th>
                  <th className="px-4 py-2">Bậc</th>
                  <th className="px-4 py-2 text-right">Thực nhận</th>
                  <th className="px-4 py-2">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">Đang tải...</td></tr>}
                {!loading && page?.content.map((p) => (
                  <tr key={p.id} className="cursor-pointer border-b hover:bg-accent/50" onClick={() => openDetail(p)}>
                    <td className="px-4 py-2 font-medium">{p.staffUsername}</td>
                    <td className="px-4 py-2">{p.gradeLevel ?? '—'}</td>
                    <td className="px-4 py-2 text-right font-medium">{formatVND(p.netPay)}</td>
                    <td className="px-4 py-2">
                      <Badge variant={p.status === 'PAID' ? 'default' : p.status === 'REJECTED' ? 'destructive' : 'outline'}>
                        {STATUS_VN[p.status]}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {!loading && (!page || page.content.length === 0) && (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">Chưa tính lương kỳ này — bấm Tính lương</td></tr>
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

      <Sheet open={!!detail} onOpenChange={(o) => { if (!o) { setDetail(null); refreshDetail(); } }}>
        <SheetContent className="max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Lương {detail?.period} — {detail?.staffUsername}</SheetTitle>
            <SheetDescription>
              Căn cứ tính: lương cơ bản {formatVND(detail?.baseSalary ?? 0)}
              {detail && detail.leaveDays > 0 ? `, nghỉ ${detail.leaveDays} ngày (${detail.offDays})` : ', không nghỉ ngày nào'}
            </SheetDescription>
          </SheetHeader>
          {detail && (
            <div className="space-y-4 py-4">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span>Lương cơ bản ({detail.gradeLevel})</span><strong>{formatVND(detail.baseSalary)}</strong></div>
                <div className="flex justify-between"><span>Phụ cấp</span><strong>{formatVND(detail.allowance)}</strong></div>
                <div className="flex justify-between"><span>Tăng ca ({detail.overtimeHours}h)</span><strong>{formatVND(detail.overtimePay)}</strong></div>
                <div className="flex justify-between"><span>Thưởng</span><strong>{formatVND(detail.bonus)}</strong></div>
                <div className="flex justify-between"><span>Trừ nghỉ ({detail.leaveDays} ngày)</span><strong className="text-destructive">−{formatVND(detail.leaveDeduction)}</strong></div>
                <div className="flex justify-between"><span>BHXH 10.5%</span><strong className="text-destructive">−{formatVND(detail.insuranceDeduction)}</strong></div>
                <div className="flex justify-between"><span>Thuế TNCN</span><strong className="text-destructive">−{formatVND(detail.taxDeduction)}</strong></div>
                <div className="flex justify-between border-t pt-1 text-base"><span>Thực nhận</span><strong>{formatVND(detail.netPay)}</strong></div>
                <div className="text-xs text-muted-foreground">Trạng thái: {STATUS_VN[detail.status]}</div>
              </div>

              <Can permission="PAYROLL_WRITE">
                {editable && (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label>Thưởng</Label>
                      <Input type="number" min={0} value={bonus} onChange={(e) => setBonus(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label>Tăng ca (h)</Label>
                      <Input type="number" min={0} step="any" value={overtime} onChange={(e) => setOvertime(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label>Thuế</Label>
                      <Input type="number" min={0} value={tax} onChange={(e) => setTax(e.target.value)} />
                    </div>
                  </div>
                )}
              </Can>

              <SheetFooter>
                <Can permission="PAYROLL_WRITE">
                  <>
                    {editable && <Button variant="outline" disabled={acting} onClick={doUpdate}>Lưu chỉnh sửa</Button>}
                    {approvable && <Button disabled={acting} onClick={() => doAction('approve')}>Duyệt chi</Button>}
                    {detail.status !== 'PAID' && detail.status !== 'REJECTED' && (
                      <Button variant="outline" disabled={acting} onClick={() => doAction('reject')}>Từ chối</Button>
                    )}
                    {detail.status === 'APPROVED' && (
                      <Button disabled={acting} onClick={() => doAction('pay')}>Đã chi tiền</Button>
                    )}
                  </>
                </Can>
              </SheetFooter>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
