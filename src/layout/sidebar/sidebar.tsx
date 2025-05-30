import { BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

import { AppSidebar } from "@/components/sidebar/app-sidebar"
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import React from "react";

interface SidebarProps {
  breadcrumbs?: Array<{ label: string; href?: string }>;
  title?: string;
}

export default function Sidebar({ breadcrumbs, title }: SidebarProps) {
  return (
    <SidebarProvider>
      <div className="flex h-screen">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <SidebarInset>
              {/* Header with trigger and breadcrumbs - Fixed spacing */}
              <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />

                {/* Breadcrumbs container */}
                <div className="flex items-center gap-2">
                  {breadcrumbs && breadcrumbs.length > 0 && (
                    <Breadcrumb>
                      <BreadcrumbList>
                        {breadcrumbs.map((crumb, index) => (
                          <React.Fragment key={index}>
                            <BreadcrumbItem
                              className={index === 0 ? "hidden md:block" : ""}
                            >
                              {crumb.href ? (
                                <BreadcrumbLink href={crumb.href}>
                                  {crumb.label}
                                </BreadcrumbLink>
                              ) : (
                                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                              )}
                            </BreadcrumbItem>
                            {index < breadcrumbs.length - 1 && (
                              <BreadcrumbSeparator className="hidden md:block" />
                            )}
                          </React.Fragment>
                        ))}
                      </BreadcrumbList>
                    </Breadcrumb>
                  )}

                  {/* Page title if no breadcrumbs */}
                  {title && !breadcrumbs && (
                    <h1 className="text-lg font-semibold">{title}</h1>
                  )}
                </div>
              </header>
            </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
