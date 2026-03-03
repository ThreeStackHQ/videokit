import type { ReactNode } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { WorkspaceProvider } from "@/contexts/workspace-context";

export default function DashboardRootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <WorkspaceProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </WorkspaceProvider>
  );
}
