import { useCallback, useEffect, useState } from 'react';
import { payrollApi, type LeaveItem, type PayrollSetting, type SalaryGrade } from '@/api/ops';
import { usersApi } from '@/api/ops';
import type { UserResponse } from '@/api/types';
import { ApiError } from '@/lib/api-client';
import { Can } from '@/components/Can';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2 } from 'lucide-react';

const WEEKDAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const WEEKDAY_VN: Record<string, string> = {
  MONDAY: 'T2', TUESDAY: 'T3', WEDNESDAY: 'T4', THURSDAY: 'T5',
  FRIDAY: 'T6', SATURDAY: 'T7', SUNDAY: 'CN',
};

export default function LeavesPage() {
  const [leaves, setLeaves] = useState<LeaveItem[]>([]);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [grades, setGrades] = useState<SalaryGrade[]>([]);
  const [setting, setSetting] = useState<PayrollSetting | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [staffId, setStaffId] = useState('');
  const [leaveDate, setLeaveDate] = useState('');
  const [leaveNote, setLeaveNote] = useState('');
  const [offDays, setOffDays] = useState<string[]>(['SUNDAY']);
  const [stdDays, setStdDays] = useState('26');
  const [gradeLevel, setGradeLevel] = useState('');
  const [gradeBase, setGradeBase] = useState('');
  const [gradeAllow, setGradeAllow] = useState('');
  const [gradeOt, setGradeOt] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [lvs, st, grs] = await Promise.all([
        payrollApi.leaves(),
        usersApi.search({ size: 100 }),
        payrollApi.grades(),
      ]);
      setLeaves(lvs);
      setUsers(st.content);
      setGrades(grs);
      const s = await payrollApi.settings().catch(() => null);
      if (s) {
        setSetting(s);
        setOffDays(s.offWeekdays.split(',').filter(Boolean));
        setStdDays(String(s.standardMonthDays));
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Tải thất bại');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const recordLeave = async () => {
    if (!staffId || !leaveDate) {
      setError('Chọn nhân sự và ngày nghỉ');
      return;
    }
    try {
      await payrollApi.recordLeave({ staffId: Number(staffId), leaveDate, note: leaveNote || null });
      setLeaveDate('');
      setLeaveNote('');
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Chấm nghỉ thất bại (ngày này đã ghi rồi?)');
    }
  };

  const deleteLeave = async (id: number) => {
    if (!window.confirm('Xóa ngày nghỉ này?')) return;
    try {
      await payrollApi.deleteLeave(id);
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Xóa thất bại');
    }
  };

  const saveSettings = async () => {
    try {
      const s = await payrollApi.updateSettings({
        offWeekdays: offDays.join(','),
        standardMonthDays: Number(stdDays) || 26,
      });
      setSetting(s);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Lưu cấu hình thất bại');
    }
  };

  const createGrade = async () => {
    if (!gradeLevel.trim() || !gradeBase) {
      setError('Nhập bậc lương và lương cơ bản');
      return;
    }
    try {
      await payrollApi.createGrade({
        level: gradeLevel.trim().toUpperCase(),
        baseSalary: Number(gradeBase),
        allowance: Number(gradeAllow) || 0,
        overtimeRatePerHour: Number(gradeOt) || 0,
      });
      setGradeLevel('');
      setGradeBase('');
      setGradeAllow('');
      setGradeOt('');
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Tạo bậc lương thất bại (trùng mã?)');
    }
  };

  const toggleDay = (d: string) =>
    setOffDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Chấm nghỉ & cấu hình lương</h1>
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Chấm ngày nghỉ</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Nhân sự *</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
              >
                <option value="">— Chọn thợ —</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.username} ({u.fullName || u.email})</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Ngày nghỉ *</Label>
                <Input type="date" value={leaveDate} onChange={(e) => setLeaveDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Lý do</Label>
                <Input value={leaveNote} onChange={(e) => setLeaveNote(e.target.value)} placeholder="Ốm, việc gia đình..." />
              </div>
            </div>
            <Can permission="PAYROLL_WRITE">
              <Button onClick={recordLeave} disabled={loading}>Ghi nghỉ</Button>
            </Can>
            <div className="space-y-1 pt-2">
              <Label>Đã ghi gần đây ({leaves.length})</Label>
              {leaves.slice(0, 15).map((l) => (
                <div key={l.id} className="flex items-center justify-between border-b py-1 text-sm">
                  <span>{l.staffUsername} — {l.leaveDate}{l.note ? ` (${l.note})` : ''}</span>
                  <Can permission="PAYROLL_WRITE">
                    <Button variant="ghost" size="sm" onClick={() => deleteLeave(l.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </Can>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Ngày nghỉ hợp lệ trong tuần</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((d) => (
                  <label key={d} className="flex items-center gap-1 text-sm">
                    <input type="checkbox" checked={offDays.includes(d)} onChange={() => toggleDay(d)} />
                    {WEEKDAY_VN[d]}
                  </label>
                ))}
              </div>
              <div className="flex items-end gap-3">
                <div className="space-y-1">
                  <Label>Công chuẩn tháng</Label>
                  <Input type="number" min={1} max={31} value={stdDays} onChange={(e) => setStdDays(e.target.value)} />
                </div>
                <Can permission="PAYROLL_WRITE">
                  <Button onClick={saveSettings}>Lưu cấu hình</Button>
                </Can>
              </div>
              <p className="text-xs text-muted-foreground">
                Nghỉ rơi vào ngày đã tick thì không bị trừ lương. Hiện tại: {setting ? `${setting.offWeekdays} — công chuẩn ${setting.standardMonthDays}` : '...'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Bậc lương</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                {grades.map((g) => (
                  <div key={g.id} className="flex justify-between border-b py-1 text-sm">
                    <span><Badge variant="outline" className="mr-2">{g.level}</Badge></span>
                    <span>cơ bản {g.baseSalary.toLocaleString('vi-VN')}đ · OT {g.overtimeRatePerHour.toLocaleString('vi-VN')}đ/h</span>
                  </div>
                ))}
              </div>
              <Can permission="PAYROLL_WRITE">
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Mã bậc (L1...)" value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} />
                  <Input type="number" placeholder="Lương cơ bản" value={gradeBase} onChange={(e) => setGradeBase(e.target.value)} />
                  <Input type="number" placeholder="Phụ cấp" value={gradeAllow} onChange={(e) => setGradeAllow(e.target.value)} />
                  <Input type="number" placeholder="OT/giờ" value={gradeOt} onChange={(e) => setGradeOt(e.target.value)} />
                </div>
                <Button size="sm" onClick={createGrade}>Thêm bậc</Button>
              </Can>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
