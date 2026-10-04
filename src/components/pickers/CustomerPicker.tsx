import { useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { customersApi } from '@/api/customers';
import type { CustomerResponse, CustomerType } from '@/api/types';
import { ApiError } from '@/lib/api-client';
import useAuthStore from '@/store/auth/useAuthStore';

interface Props {
  value: CustomerResponse | null;
  onChange: (c: CustomerResponse | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

/** Ô chọn khách hàng: gõ tên/SĐT để tìm, nút + để tạo mới ngay tại chỗ. */
export function CustomerPicker({ value, onChange, placeholder, disabled }: Props) {
  const [keyword, setKeyword] = useState('');
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<CustomerResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [type, setType] = useState<CustomerType>('HOP_DONG');
  const [saving, setSaving] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const canCreate = (useAuthStore((s) => s.user)?.permissions ?? []).includes('CUSTOMER_WRITE');

  useEffect(() => {
    if (!open) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const page = await customersApi.search({ keyword: keyword || undefined, size: 8, active: true });
        setOptions(page.content);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [keyword, open]);

  const openCreate = () => {
    // Đoán trước: toàn số thì điền SĐT, còn lại điền tên
    const digits = keyword.replace(/\D/g, '');
    if (digits.length >= 6) {
      setPhone(keyword.trim());
      setName('');
    } else {
      setName(keyword.trim());
      setPhone('');
    }
    setAddress('');
    setType('HOP_DONG');
    setCreateError(null);
    setCreateOpen(true);
  };

  const submitCreate = async () => {
    if (!name.trim() || !phone.trim()) {
      setCreateError('Nhập tên và số điện thoại');
      return;
    }
    setSaving(true);
    setCreateError(null);
    try {
      const created = await customersApi.create({ name: name.trim(), phone: phone.trim(), address: address.trim() || null, type });
      onChange(created);
      setKeyword('');
      setOpen(false);
      setCreateOpen(false);
    } catch (e) {
      setCreateError(e instanceof ApiError ? e.message : 'Tạo khách thất bại (SĐT có thể đã tồn tại)');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative">
      <Input
        placeholder={placeholder ?? 'Gõ tên/SĐT khách...'}
        value={value ? `${value.code} — ${value.name} (${value.phone})` : keyword}
        disabled={disabled}
        onChange={(e) => {
          onChange(null);
          setKeyword(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && !value && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-md border bg-popover shadow-md">
          {loading && <div className="px-3 py-2 text-sm text-muted-foreground">Đang tìm...</div>}
          {!loading && options.length === 0 && (
            <div className="px-3 py-2 text-sm text-muted-foreground">Không thấy khách phù hợp</div>
          )}
          {options.map((c) => (
            <button
              key={c.id}
              type="button"
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent"
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(c);
                setKeyword('');
                setOpen(false);
              }}
            >
              <span>
                <span className="font-medium">{c.name}</span>
                <span className="text-muted-foreground"> — {c.phone}</span>
              </span>
              {c.totalOwed > 0 && (
                <span className="text-xs text-destructive">nợ {c.totalOwed.toLocaleString('vi-VN')}đ</span>
              )}
            </button>
          ))}
          {canCreate && !disabled && (
            <button
              type="button"
              className="flex w-full items-center gap-2 border-t px-3 py-2 text-left text-sm font-medium text-primary hover:bg-accent"
              onMouseDown={(e) => {
                e.preventDefault();
                setOpen(false);
                openCreate();
              }}
            >
              <Plus className="h-4 w-4" />
              {keyword.trim() ? `Tạo mới "${keyword.trim()}"` : 'Tạo khách hàng mới'}
            </button>
          )}
        </div>
      )}

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent className="max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Tạo khách hàng mới</SheetTitle>
            <SheetDescription>Tên + SĐT bắt buộc. SĐT trùng sẽ báo mã KH cũ.</SheetDescription>
          </SheetHeader>
          {createError && (
            <p className="py-2 text-sm text-destructive">{createError}</p>
          )}
          <div className="grid gap-3 py-4">
            <div className="space-y-1">
              <Label>Tên *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Anh Ba" />
            </div>
            <div className="space-y-1">
              <Label>Số điện thoại *</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09xxxxxxxx" />
            </div>
            <div className="space-y-1">
              <Label>Địa chỉ</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Loại</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={type}
                onChange={(e) => setType(e.target.value as CustomerType)}
              >
                <option value="HOP_DONG">Hợp đồng</option>
                <option value="LE_QUEN">Lẻ quen</option>
              </select>
            </div>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Hủy</Button>
            <Button onClick={submitCreate} disabled={saving}>{saving ? 'Đang tạo...' : 'Tạo khách'}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
