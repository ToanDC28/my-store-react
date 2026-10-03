# Nhật ký fix frontend (`my-store-react`)

> Stack: Vite + React 19 + TS + axios + zustand + react-router + shadcn + Tailwind. Backend: Spring `:9000`, envelope `ApiResponse{statusCode,message,data}`.

## 1. API layer đấu sai backend (nghiêm trọng nhất)

- **Vấn đề:** FE scaffold cho backend .NET khác: gọi `/tokens`, header `tenant: root`, decode claims `.NET Identity` (`nameidentifier`, `emailaddress`...), trong khi Spring dùng `/api/auth/login {username,password}`, claims `sub/email/roles[]/permissions[]`, không có tenant.
- **Cách sửa:** `src/lib/api-client.ts` mới — Bearer token, interceptor tự refresh khi 401 (1 lượt refresh cho mọi request 401 đồng thời, không retry login/refresh để tránh vòng lặp), `unwrap<T>` bóc `ApiResponse`, `ApiError` mang `message` tiếng Việt + `fields` validation; `src/api/*` 13 module (auth/materials/customers/suppliers/work-orders/trading/ops) khớp DTO backend; `.env` → `http://localhost:9000`.
- **Giải thích:** mọi màn hình dùng chung 1 client + 1 kiểu lỗi, đổi backend chỉ sửa 1 chỗ.

## 2. Rewire auth

- **Vấn đề:** store login bằng email + `/tokens`, type `User` kiểu .NET, form có register/forgot-password trong khi backend không có endpoint đó.
- **Cách sửa:** `useAuthStore` login username → `/api/auth/login` → lưu pair → `/me` lấy fullName; quyền UI từ claim JWT (`hasPermission/hasRole`); logout gọi API (best-effort) + xóa token; `checkAuth` theo `exp` + refresh 1 lần; form login tiếng Việt (bỏ register/forgot + route `/forgot-password` chết).
- **Giải thích:** session sống qua refresh rotation; UI phân quyền ẩn/hiện đúng mà không cần gọi thêm API.

## 3. Sidebar đè lên nội dung (user báo, có ảnh)

- **Vấn đề (gốc ở tầng layout):** shadcn `Sidebar` gồm div giữ chỗ `relative w-[--sidebar-width]` + panel `fixed inset-y-0 z-10` — bắt buộc nằm trực tiếp trong flex row. `MainLayout` cũ nhét nó vào `ResizablePanel` (rộng 5–17% viewport) → panel fixed vẽ rộng 16rem đè lên main; cộng hack `w-16` khi collapse + `z-10` + remount `key` + double-toggle state riêng.
- **Cách sửa:** xóa toàn bộ `ResizablePanelGroup` khỏi layout (panel % xung khắc với sidebar fixed rem); cấu trúc `SidebarProvider > div.flex > (Sidebar + div.flex-1.min-w-0 > navbar + div.overflow-auto)`; collapse dùng đúng `SidebarTrigger` của context; bỏ class `w-16` cưỡng bức. Navbar ngoài vùng scroll nên đứng yên; không dùng `margin-left` vá.
- **Giải thích:** sidebar giữ cột riêng, main tự đầy phần còn lại và co theo viewport; % resize và fixed positioning không bao giờ đi chung được.

## 4. Click chuyển trang tải lại toàn bộ app

- **Vấn đề:** sidebar dùng `<a href>` → trình duyệt reload cả trang, React remount từ đầu (mất state, check auth lại, chớp trắng).
- **Cách sửa:** đổi sang `<Link>` react-router ở 4 chỗ (logo, 2 nhóm menu, footer); memo `BreadcrumbProvider value` bằng `useMemo` (trước đó object mới mỗi render kéo cả cây re-render theo).
- **Giải thích:** chuyển trang chỉ swap `Outlet`, layout + state giữ nguyên.

## 5. Hiển thị trạng thái tồn gây hiểu lầm (user báo)

- **Vấn đề:** vật tư mới (tồn 0, định mức 50) hiện 2 badge chồng "Đang dùng" + "Sắp hết" — tồn 0 bị gọi là "sắp hết".
- **Cách sửa (chỉ UI, dữ liệu đúng):** mỗi dòng 1 badge — `Hết hàng` (tồn = 0) / `Sắp hết` (`0 < tồn <= định mức`) / `Còn hàng` / `Đã ẩn`, áp dụng cả màn Vật tư và Tồn kho. Tồn 0 ở hàng mới là đúng (tồn chỉ tăng qua Nhập hàng, form không cho nhập tay).
- **Giải thích:** `lowStock = tồn <= định mức` của backend vẫn đúng cho cảnh báo nhập hàng; chỉ tách riêng trạng thái "hết hàng" cho đỡ nhầm.

## 6. Thiếu Dialog + màn NCC chặn luồng nhập hàng

- **Vấn đề:** không có `dialog.tsx` trong `ui/`; màn Nhập nhanh cần NCC nhưng chưa có màn NCC nào (sidebar trỏ route trống).
- **Cách sửa:** form vật tư dùng `Sheet` có sẵn; tạo mới `SuppliersPage` (list/search/tạo/sửa/ẩn-hiện, mã tự sinh) + route `/suppliers`. Luồng có hàng đầy đủ: Vật tư → NCC → Nhập nhanh → Tồn kho.
- **Giải thích:** tái dùng pattern có sẵn (table Tailwind + Sheet + `Can` gating theo quyền), không thêm lib.
