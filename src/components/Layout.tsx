import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Layout({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      <Sidebar />
      <main className={`${isMobile ? "mt-14 px-3 py-4 sm:px-5 sm:py-6" : "ml-64 p-8"} flex-1 min-w-0 w-full`}>
        <div className="mx-auto w-full max-w-[1440px] min-w-0">{children}</div>
      </main>
      <footer className={`${isMobile ? "" : "ml-64"} border-t border-border px-4 sm:px-6 md:px-8 py-4`}>
        <p className="text-xs text-muted-foreground text-center">
          All investments involve risk. No returns are guaranteed. Participation in Faithnancial Investment Group LLC is voluntary.
        </p>
      </footer>
    </div>
  );
}
