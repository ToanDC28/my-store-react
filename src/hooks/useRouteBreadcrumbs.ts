import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useBreadcrumbs, Breadcrumb } from '@/context/BreadcrumbContext';
import { routes } from '@/pages/routes';

type RouteConfig = {
  path: string;
  element: React.ReactNode;
  breadcrumb?: Breadcrumb;
  children?: Array<{
    path: string;
    element: React.ReactNode;
    breadcrumb?: Breadcrumb;
  }>;
};

export const useRouteBreadcrumbs = () => {
  const location = useLocation();
  const { setBreadcrumbs } = useBreadcrumbs();

  useEffect(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const currentBreadcrumbs: Breadcrumb[] = [];

    // Find matching route and its breadcrumbs
    const findRouteBreadcrumbs = (
      routes: RouteConfig[],
      segments: string[],
      currentPath: string = ''
    ) => {
      for (const route of routes) {
        const routePath = route.path.replace(/^\//, '');
        const fullPath = currentPath ? `${currentPath}/${routePath}` : routePath;

        if (route.breadcrumb) {
          currentBreadcrumbs.push(route.breadcrumb);
        }

        if (route.children) {
          const childRoute = route.children.find(
            (child) => child.path === segments[0]
          );
          if (childRoute) {
            if (childRoute.breadcrumb) {
              currentBreadcrumbs.push(childRoute.breadcrumb);
            }
            break;
          }
        }

        if (fullPath === segments.join('/')) {
          break;
        }
      }
    };

    findRouteBreadcrumbs(routes, pathSegments);
    setBreadcrumbs(currentBreadcrumbs);
  }, [location.pathname, setBreadcrumbs]);
}; 