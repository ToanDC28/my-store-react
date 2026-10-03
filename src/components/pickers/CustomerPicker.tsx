import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { customersApi } from '@/api/customers';
import type { CustomerResponse } from '@/api/types';

interface Props {
  value: CustomerResponse | null;
  onChange: (c: CustomerResponse | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

/** Ô chọn khách hàng: gõ tên/SĐT để tìm. Chưa có → tạo mới ở màn Khách hàng trước. */
export function CustomerPicker({ value, onChange, placeholder, disabled }: Props) {
  const [keyword, setKeyword] = useState('');
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<CustomerResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        <div className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-md border bg-popover shadow-md">
          {loading && <div className="px-3 py-2 text-sm text-muted-foreground">Đang tìm...</div>}
          {!loading && options.length === 0 && (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              Chưa có khách — tạo mới ở màn Khách hàng trước
            </div>
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
        </div>
      )}
    </div>
  );
}
