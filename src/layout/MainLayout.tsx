import React from "react"
import { useState, useEffect } from "react"
import type { ReactNode } from "react"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import AppNavbar from "@/components/navbar/AppNavBar"
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import Sidebar from "@/components/sidebar/app-sidebar"
import { useMediaQuery } from "@/hooks/use-media-query"

interface MainLayoutProps {
  children: ReactNode
  title?: string
  breadcrumbs?: Array<{ label: string; href?: string }>
}

export default function MainLayout({ children, title, breadcrumbs }: MainLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const isMobile = useMediaQuery("(max-width: 768px)")

  const handleSidebarToggle = () => {
    setIsCollapsed(!isCollapsed)
  }

  useEffect(() => {
    if (isMobile) {
      setIsCollapsed(true)
    } else {
      setIsCollapsed(false)
    }
  }, [isMobile])

  const sidebarSize = isCollapsed ? 5 : 17
  const mainSize = isCollapsed ? 95 : 83

  return (
    <SidebarProvider open={!isCollapsed}>
      <div className="h-screen w-full overflow-hidden">
        <ResizablePanelGroup
          direction="horizontal"
          className="h-full w-full"
          // Add key to force re-render when state changes
          key={`layout-${isCollapsed}`}
        >
          {/* Sidebar Panel - Dynamic sizing */}
          <ResizablePanel defaultSize={sidebarSize} minSize={5} maxSize={30} className="transition-all duration-300">
            <Sidebar />
          </ResizablePanel>

          {/* Main Content Panel - Takes remaining space */}
          <ResizablePanel defaultSize={mainSize} className="flex-1 transition-all duration-300">
            <ResizablePanelGroup direction="vertical" className="h-full">
              {/* Navbar Panel */}
              <ResizablePanel defaultSize={10} minSize={8} maxSize={15}>
                <div className="h-full border-b bg-background">
                  <div className="flex h-full items-center px-4">
                    <SidebarTrigger className="mr-4" onClick={handleSidebarToggle} />
                    <AppNavbar />
                  </div>
                </div>
              </ResizablePanel>

              {/* Content Panel */}
              <ResizablePanel defaultSize={90} className="flex-1">
                <div className="h-full w-full overflow-auto">
                  <div className="p-4 w-full">
                    {breadcrumbs && breadcrumbs.length > 0 && (
                      <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4 mb-4">
                        <Breadcrumb>
                          <BreadcrumbList>
                            {breadcrumbs.map((crumb, index) => (
                              <React.Fragment key={index}>
                                <BreadcrumbItem className={index === 0 ? "hidden md:block" : ""}>
                                  {crumb.href ? (
                                    <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                                  ) : (
                                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                                  )}
                                </BreadcrumbItem>
                                {index < breadcrumbs.length - 1 && <BreadcrumbSeparator className="hidden md:block" />}
                              </React.Fragment>
                            ))}
                          </BreadcrumbList>
                        </Breadcrumb>
                      </header>
                    )}

                    {title && !breadcrumbs && (
                      <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4 mb-4">
                        <h1 className="text-lg font-semibold">{title}</h1>
                      </header>
                    )}

                    <main className="w-full max-w-full">{children}</main>
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </SidebarProvider>
  )
}
