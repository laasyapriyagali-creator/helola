import { ReactNode } from "react";
import { BottomNav } from "@/components/BottomNav";
import { DesktopNav } from "@/components/DesktopNav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <DesktopNav />
      <main className="mx-auto w-full max-w-7xl overflow-x-hidden pb-24 md:pb-12">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
