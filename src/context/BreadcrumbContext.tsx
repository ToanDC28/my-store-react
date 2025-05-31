import { createContext, useContext, ReactNode, useState } from 'react';

export interface Breadcrumb {
  label: string;
  href: string;
}

interface BreadcrumbContextType {
  breadcrumbs: Breadcrumb[];
  setBreadcrumbs: (breadcrumbs: Breadcrumb[]) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined);

export const useBreadcrumbs = () => {
  const context = useContext(BreadcrumbContext);
  if (!context) {
    throw new Error('useBreadcrumbs must be used within a BreadcrumbProvider');
  }
  return context;
};

interface BreadcrumbProviderProps {
  children: ReactNode;
  initialBreadcrumbs?: Breadcrumb[];
}

export const BreadcrumbProvider = ({ children, initialBreadcrumbs = [] }: BreadcrumbProviderProps) => {
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>(initialBreadcrumbs);

  return (
    <BreadcrumbContext.Provider value={{ breadcrumbs, setBreadcrumbs }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}; 