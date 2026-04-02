import { Link, useLocation, useNavigate } from "react-router-dom";
import { BarChart3, Users, Briefcase, TrendingUp, ScrollText, UserCircle, LogIn, LogOut, Contact, ShieldCheck, Info } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const navItems = [
  { icon: BarChart3, label: "Dashboard", path: "/" },
  { icon: Users, label: "Investors", path: "/investors" },
  { icon: Contact, label: "Directory", path: "/directory" },
  { icon: Briefcase, label: "Startups", path: "/startups" },
  { icon: TrendingUp, label: "Performance", path: "/performance" },
  { icon: ScrollText, label: "Mission & Values", path: "/mission" },
  { icon: Info, label: "Information", path: "/information" },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, loading, isAdmin } = useAuth();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-card border-r border-border flex flex-col z-50">
      <div className="p-6 border-b border-border">
        <h1 className="font-display text-xl font-bold text-gradient">Faithnancial</h1>
        <p className="text-xs text-muted-foreground mt-1">Investment Management</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
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
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  location.pathname === "/admin" ? "bg-primary/10 text-primary glow-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                } w-full`}
              >
                <ShieldCheck className="w-4 h-4" />
                Admin
              </Link>
            )}
            <Link
              to={`/profile/${user.id}`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all w-full"
            >
              <UserCircle className="w-4 h-4" />
              My Profile
            </Link>
            <button
              onClick={() => signOut()}
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
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all w-full"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </Link>
            <Link
              to="/login?signup=true"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-primary hover:bg-primary/10 transition-all w-full"
            >
              <UserCircle className="w-4 h-4" />
              Sign Up
            </Link>
          </>
        ) : null}
      </div>
    </aside>
  );
}
