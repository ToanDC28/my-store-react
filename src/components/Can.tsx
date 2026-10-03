import type { ReactNode } from 'react';
import useAuthStore from '@/store/auth/useAuthStore';

/** Ẩn UI khi thiếu quyền (backend vẫn chặn ở API). */
export function Can({ permission, children }: { permission: string | string[]; children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const perms = user?.permissions ?? [];
  const ok = Array.isArray(permission) ? permission.some((p) => perms.includes(p)) : perms.includes(permission);
  if (!ok) return null;
  return <>{children}</>;
}
