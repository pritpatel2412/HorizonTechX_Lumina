import { Sidebar } from "./sidebar";
import { RightSidebar } from "./right-sidebar";
import { MobileNav } from "./mobile-nav";
import { ReactNode } from "react";

export function AppLayout({ children, showRightSidebar = true }: { children: ReactNode, showRightSidebar?: boolean }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex w-full relative">
      <Sidebar />
      
      <main className="flex-1 flex justify-center md:pl-[260px] pb-16 md:pb-0">
        <div className="w-full max-w-[600px] min-h-screen flex flex-col border-r border-white/5">
          {children}
        </div>
        
        {showRightSidebar && (
          <div className="hidden lg:block w-[300px] shrink-0 pl-6">
            <RightSidebar />
          </div>
        )}
      </main>

      <MobileNav />
    </div>
  );
}
