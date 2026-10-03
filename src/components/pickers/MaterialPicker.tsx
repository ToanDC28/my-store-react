import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { materialsApi } from '@/api/materials';
import type { MaterialResponse } from '@/api/types';

interface Props {
  value: MaterialResponse | null;
  onChange: (m: MaterialResponse | null) => void;
  placeholder?: string;
  disabled?: boolean;
  activeOnly?: boolean;
}

/** Ô chọn vật tư: gõ tên/SKU để tìm, click để chọn. */
export function MaterialPicker({ value, onChange, placeholder, disabled, activeOnly = true }: Props) {
  const [keyword, setKeyword] = useState('');
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<MaterialResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const page = await materialsApi.search({ keyword: keyword || undefined, size: 8, active: activeOnly ? true : undefined });
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
  }, [keyword, open, activeOnly]);

  return (
    <div className="relative">
      <Input
        placeholder={placeholder ?? 'Gõ tên/SKU vật tư...'}
        value={value ? `${value.sku} — ${value.name}` : keyword}
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
            <div className="px-3 py-2 text-sm text-muted-foreground">Không thấy vật tư</div>
          )}
          {options.map((m) => (
            <button
              key={m.id}
              type="button"
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent"
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(m);
                setKeyword('');
                setOpen(false);
              }}
            >
              <span>
                <span className="font-medium">{m.sku}</span>
                <span className="text-muted-foreground"> — {m.name}</span>
              </span>
              <span className="text-xs text-muted-foreground">
                tồn {m.stockQty}{m.unit ? ` ${m.unit}` : ''}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
