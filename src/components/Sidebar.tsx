import { Link, useLocation } from "react-router-dom";
import { BarChart3, Users, Briefcase, TrendingUp, Settings, LogIn } from "lucide-react";

const navItems = [
  { icon: BarChart3, label: "Dashboard", path: "/" },
  { icon: Users, label: "Investors", path: "/investors" },
  { icon: Briefcase, label: "Startups", path: "/startups" },
  { icon: TrendingUp, label: "Performance", path: "/performance" },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-card border-r border-border flex flex-col z-50">
      <div className="p-6 border-b border-border">
        <h1 className="font-display text-xl font-bold text-gradient">InvestTrack</h1>
        <p className="text-xs text-muted-foreground mt-1">Portfolio Management</p>
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
        <Link
          to="/login"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
        >
          <LogIn className="w-4 h-4" />
          Investor Login
        </Link>
        <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all w-full">
          <Settings className="w-4 h-4" />
          Settings
        </button>
      </div>
    </aside>
  );
}
