import AppNavbar from "@/components/navbar/AppNavBar";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import type { ReactNode } from "react";
import Sidebar from "./sidebar/sidebar";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({
  children
}: MainLayoutProps) {
  return (
    <>
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={20}>
        <Sidebar />
      </ResizablePanel>
      <ResizablePanel defaultSize={90}>
      <ResizablePanelGroup direction="vertical">
        <ResizablePanel defaultSize={8}>
          <AppNavbar />
        </ResizablePanel>
        <ResizablePanel defaultSize={72}>
          {children}
        </ResizablePanel>
      </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
    </>
  );
}
