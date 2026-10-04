import {
  Home, Package, Warehouse, ClipboardList, ShoppingCart, ReceiptText,
  Users, Truck, Wallet, CalendarClock, BarChart3, ShieldCheck, PackagePlus, PackageOpen,
} from "lucide-react"
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"
import useAuthStore from "@/store/auth/useAuthStore"

interface NavItem {
  title: string;
  url: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  permission?: string | string[];
}

const mainItems: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Vật tư", url: "/materials", icon: Package, permission: "PRODUCT_READ" },
  { title: "Tồn kho", url: "/stocks", icon: Warehouse, permission: "INVENTORY_READ" },
  { title: "Nhập nhanh", url: "/quick-import", icon: PackagePlus, permission: "INVENTORY_WRITE" },
  { title: "Sửa chữa", url: "/work-orders", icon: ClipboardList, permission: "ORDER_READ" },
  { title: "Bán hàng", url: "/sales", icon: ShoppingCart, permission: "ORDER_READ" },
  { title: "Phiếu xuất", url: "/goods-issues", icon: PackageOpen, permission: "INVENTORY_READ" },
  { title: "Hóa đơn", url: "/invoices", icon: ReceiptText, permission: "INVOICE_READ" },
  { title: "Thu chi", url: "/payments", icon: Wallet, permission: ["PAYMENT_MANAGE", "INVOICE_READ"] },
  { title: "Khách hàng", url: "/customers", icon: Users, permission: "CUSTOMER_READ" },
  { title: "Nhà cung cấp", url: "/suppliers", icon: Truck, permission: "SUPPLIER_READ" },
];

const manageItems: NavItem[] = [
  { title: "Lương", url: "/payrolls", icon: CalendarClock, permission: "PAYROLL_READ" },
  { title: "Báo cáo", url: "/reports", icon: BarChart3, permission: "INVOICE_READ" },
  { title: "Nhân sự", url: "/users", icon: ShieldCheck, permission: "USER_READ" },
];

function visible(items: NavItem[], perms: string[]) {
  return items.filter((i) => {
    if (!i.permission) return true;
    const need = Array.isArray(i.permission) ? i.permission : [i.permission];
    return need.some((p) => perms.includes(p));
  });
}

export default function Sidebar() {
  const { open } = useSidebar()
  const user = useAuthStore((s) => s.user);
  const perms = user?.permissions ?? [];

  return (
    <ShadcnSidebar
      collapsible="icon"
      className="border-r"
    >
      <SidebarHeader className={cn("transition-all duration-300", open ? "py-4" : "py-2")}>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <ShoppingCart className="size-4" />
                </div>
                {open && (
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Xưởng cơ khí</span>
                    <span className="truncate text-xs">Quản lý kho + sửa chữa</span>
                  </div>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {open && <SidebarGroupLabel>Nghiệp vụ</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {visible(mainItems, perms).map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={!open ? item.title : undefined}>
                    <Link to={item.url}>
                      <item.icon />
                      {open && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {visible(manageItems, perms).length > 0 && (
          <SidebarGroup>
            {open && <SidebarGroupLabel>Quản lý</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {visible(manageItems, perms).map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={!open ? item.title : undefined}>
                      <Link to={item.url}>
                        <item.icon />
                        {open && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={!open ? (user?.username ?? "Tôi") : undefined}>
              <Link to="/user-profile">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-accent">
                  <span className="text-sm font-medium">
                    {(user?.username ?? "?").slice(0, 2).toUpperCase()}
                  </span>
                </div>
                {open && (
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user?.username ?? "Tôi"}</span>
                    <span className="truncate text-xs">{user?.email ?? ""}</span>
                  </div>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </ShadcnSidebar>
  )
}
