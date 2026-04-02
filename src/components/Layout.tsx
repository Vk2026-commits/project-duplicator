import { ReactNode } from "react";
import Sidebar from "./Sidebar";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Sidebar />
      <main className="ml-64 p-8 flex-1">{children}</main>
      <footer className="ml-64 border-t border-border px-8 py-4">
        <p className="text-xs text-muted-foreground text-center">
          All investments involve risk. No returns are guaranteed. Participation in Faithnancial Investment Group LLC is voluntary.
        </p>
      </footer>
    </div>
  );
}
