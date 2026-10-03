export function formatVND(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('vi-VN').format(value) + ' đ';
}

export function formatQty(value: number | null | undefined, unit?: string | null): string {
  if (value === null || value === undefined) return '—';
  return `${new Intl.NumberFormat('vi-VN').format(value)}${unit ? ` ${unit}` : ''}`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
  return d.toLocaleDateString('vi-VN');
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
