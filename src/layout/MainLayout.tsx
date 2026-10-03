import type { ReactNode } from "react"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import AppNavbar from "@/components/navbar/AppNavBar"
import Sidebar from "@/components/sidebar/app-sidebar"
import BreadcrumbNav from '@/components/Breadcrumb'
import { useRouteBreadcrumbs } from '@/hooks/useRouteBreadcrumbs'

interface MainLayoutProps {
  children: ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  useRouteBreadcrumbs()

  return (
    <SidebarProvider>
      {/* Flex row: sidebar chiếm cột riêng, main chiếm phần còn lại */}
      <div className="flex h-svh w-full overflow-hidden">
        <Sidebar />
        {/* Cột main: min-w-0 để flex item co đúng khi viewport hẹp */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-14 shrink-0 items-center border-b bg-background px-4">
            <SidebarTrigger className="mr-4" />
            <AppNavbar />
          </div>
          <div className="min-h-0 flex-1 overflow-auto">
            <div className="p-4">
              <BreadcrumbNav />
              <main className="w-full max-w-full">{children}</main>
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  )
}
