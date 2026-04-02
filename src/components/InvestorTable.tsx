import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/mock-data";
import { ArrowUpRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface InvestorTableProps {
  limit?: number;
}

function maskName(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0] + ".";
  return parts[0][0] + ". " + parts[parts.length - 1];
}

export default function InvestorTable({ limit }: InvestorTableProps) {
  const { user, isAdmin } = useAuth();

  const { data: investments = [], isLoading } = useQuery({
    queryKey: ["all-startup-investors-with-startups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("startup_investors")
        .select("*, startups(name, sector)")
        .eq("archived", false)
        .order("amount_invested", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch profile_startup_links to determine co-investor status
  const { data: allLinks = [] } = useQuery({
    queryKey: ["all-profile-startup-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profile_startup_links")
        .select("profile_id, startup_id");
      if (error) throw error;
      return data as { profile_id: string; startup_id: string }[];
    },
  });

  // Get the startups the current user is invested in
  const myStartupIds = new Set(
    allLinks.filter((l) => l.profile_id === user?.id).map((l) => l.startup_id)
  );

  // Build a set of startup_ids where this investor record is a co-investor
  // An investment is "co-invested" if the current user is linked to the same startup_id
  const isCoInvestor = (startupId: string) => myStartupIds.has(startupId);

  const display = limit ? investments.slice(0, limit) : investments;

  return (
    <div className="glass-card rounded-xl overflow-hidden animate-fade-in">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-display font-semibold">Investors</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {investments.length} investment{investments.length !== 1 ? "s" : ""} across startups
          </p>
        </div>
        {limit && investments.length > limit && (
          <Link to="/investors" className="text-sm text-primary hover:underline flex items-center gap-1">
            View all <ArrowUpRight className="w-3 h-3" />
          </Link>
        )}
      </div>
      {isLoading ? (
        <p className="p-6 text-muted-foreground text-sm">Loading investors...</p>
      ) : display.length === 0 ? (
        <p className="p-6 text-muted-foreground text-sm">No investors yet. Add investors to your startups to see them here.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Investor</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Startup</th>
                {isAdmin && (
                  <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">Amount</th>
                )}
                <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">Equity</th>
              </tr>
            </thead>
            <tbody>
              {display.map((inv: any) => {
                const displayName = isAdmin ? inv.investor_name : maskName(inv.investor_name);
                const initials = displayName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

                return (
                  <tr key={inv.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4">
                      {isAdmin ? (
                        <Link to={`/investors/${encodeURIComponent(inv.investor_name)}`} className="flex items-center gap-3 group">
                          <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                            {initials}
                          </div>
                          <div>
                            <p className="font-medium text-sm group-hover:text-primary transition-colors">{displayName}</p>
                            {inv.email && <p className="text-xs text-muted-foreground">{inv.email}</p>}
                          </div>
                        </Link>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                            {initials}
                          </div>
                          <p className="font-medium text-sm text-muted-foreground">{displayName}</p>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm">{inv.startups?.name || "Unknown"}</span>
                      {isAdmin && <p className="text-xs text-muted-foreground">{inv.startups?.sector}</p>}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right text-sm font-medium">{formatCurrency(Number(inv.amount_invested))}</td>
                    )}
                    {isAdmin && (
                      <td className="px-6 py-4 text-right text-sm">{Number(inv.equity_percentage)}%</td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
