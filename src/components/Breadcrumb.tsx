import React from 'react';
import { useBreadcrumbs } from '@/context/BreadcrumbContext';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const BreadcrumbNav = () => {
  const { breadcrumbs } = useBreadcrumbs();

  if (breadcrumbs.length === 0) return null;

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4 mb-4">
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              <BreadcrumbItem className={index === 0 ? "hidden md:block" : ""}>
                {index < breadcrumbs.length - 1 ? (
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
  );
};

export default BreadcrumbNav; 