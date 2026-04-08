import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BarChart3, Users, Briefcase, TrendingUp, ScrollText, UserCircle, LogIn, LogOut, Contact, ShieldCheck, Info, FileText, Handshake, PiggyBank, CalendarDays, CalendarClock, Menu, X, Wallet } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";

const navItems = [
  { icon: BarChart3, label: "Dashboard", path: "/dashboard" },
  { icon: Users, label: "Investors", path: "/investors" },
  { icon: Contact, label: "Directory", path: "/directory" },
  { icon: Briefcase, label: "Startups", path: "/startups" },
  { icon: TrendingUp, label: "Performance", path: "/performance" },
  { icon: ScrollText, label: "Mission & Values", path: "/mission" },
  { icon: Handshake, label: "Deal Review", path: "/deals" },
  { icon: PiggyBank, label: "Capital Pool", path: "/contributions", adminOnly: true },
  { icon: CalendarDays, label: "Meetings", path: "/meetings" },
  { icon: CalendarClock, label: "Calendar", path: "/calendar" },
  { icon: Info, label: "Information", path: "/information" },
  { icon: FileText, label: "Disclosures", path: "/disclosures" },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, loading, isAdmin } = useAuth();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const { data: pendingCount = 0 } = useQuery({
    queryKey: ["info-requests-pending-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("startup_info_requests" as any)
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
      if (error) return 0;
      return count || 0;
    },
    enabled: isAdmin,
  });

  const closeSidebar = () => { if (isMobile) setOpen(false); };

  const sidebarContent = (
    <>
      <div className="p-6 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-gradient">Faithnancial</h1>
          <p className="text-xs text-muted-foreground mt-1">Investment Management</p>
        </div>
        {isMobile && (
          <button onClick={() => setOpen(false)} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.filter((item) => !(item as any).adminOnly || isAdmin).map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={closeSidebar}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-primary/10 text-primary glow-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border space-y-1">
        {!loading && user ? (
          <>
            {isAdmin && (
              <Link
                to="/admin"
                onClick={closeSidebar}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  location.pathname === "/admin" ? "bg-primary/10 text-primary glow-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                } w-full relative`}
              >
                <ShieldCheck className="w-4 h-4" />
                Admin
                {pendingCount > 0 && (
                  <span className="ml-auto w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold">
                    {pendingCount}
                  </span>
                )}
              </Link>
            )}
            <Link
              to={`/profile/${user.id}`}
              onClick={closeSidebar}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all w-full"
            >
              <UserCircle className="w-4 h-4" />
              My Profile
            </Link>
            <button
              onClick={async () => { await signOut(); navigate("/login", { replace: true }); closeSidebar(); }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all w-full"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </>
        ) : !loading ? (
          <>
            <Link
              to="/login"
              onClick={closeSidebar}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all w-full"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </Link>
            <Link
              to="/login?signup=true"
              onClick={closeSidebar}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-primary hover:bg-primary/10 transition-all w-full"
            >
              <UserCircle className="w-4 h-4" />
              Sign Up
            </Link>
          </>
        ) : null}
      </div>
    </>
  );

  // Desktop: fixed sidebar
  if (!isMobile) {
    return (
      <aside className="fixed left-0 top-0 h-screen w-64 bg-card border-r border-border flex flex-col z-50">
        {sidebarContent}
      </aside>
    );
  }

  // Mobile: top bar + drawer
  return (
    <>
      {/* Mobile top bar */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-card border-b border-border flex items-center justify-between px-4 z-50">
        <button onClick={() => setOpen(true)} className="p-2 text-muted-foreground hover:text-foreground">
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="font-display text-lg font-bold text-gradient">Faithnancial</h1>
        <div className="w-9" /> {/* spacer */}
      </header>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/60 z-50" onClick={() => setOpen(false)} />
      )}

      {/* Drawer */}
      <aside
        className={`fixed left-0 top-0 h-screen w-72 bg-card border-r border-border flex flex-col z-50 transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
