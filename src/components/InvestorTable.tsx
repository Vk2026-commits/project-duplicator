import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/mock-data";
import { ArrowUpRight } from "lucide-react";

interface InvestorTableProps {
  limit?: number;
}

interface AggregatedInvestor {
  name: string;
  email: string | null;
  totalInvested: number;
  startupCount: number;
}

export default function InvestorTable({ limit }: InvestorTableProps) {
  const { data: investors = [], isLoading } = useQuery({
    queryKey: ["all-startup-investors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("startup_investors").select("*");
      if (error) throw error;
      return data;
    },
  });

  // Aggregate by investor name
  const aggregated = investors.reduce<Record<string, AggregatedInvestor>>((acc, inv) => {
    const key = inv.investor_name;
    if (!acc[key]) {
      acc[key] = { name: key, email: inv.email, totalInvested: 0, startupCount: 0 };
    }
    acc[key].totalInvested += Number(inv.amount_invested);
    acc[key].startupCount += 1;
    if (!acc[key].email && inv.email) acc[key].email = inv.email;
    return acc;
  }, {});

  const data = Object.values(aggregated).sort((a, b) => b.totalInvested - a.totalInvested);
  const display = limit ? data.slice(0, limit) : data;

  return (
    <div className="glass-card rounded-xl overflow-hidden animate-fade-in">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-display font-semibold">Investors</h3>
          <p className="text-sm text-muted-foreground mt-0.5">{data.length} active investor{data.length !== 1 ? "s" : ""}</p>
        </div>
        {limit && data.length > limit && (
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
                <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">Total Invested</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">Startups</th>
              </tr>
            </thead>
            <tbody>
              {display.map((inv) => (
                <tr key={inv.name} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-6 py-4">
                    <Link to={`/investors/${encodeURIComponent(inv.name)}`} className="flex items-center gap-3 group">
                      <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                        {inv.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm group-hover:text-primary transition-colors">{inv.name}</p>
                        {inv.email && <p className="text-xs text-muted-foreground">{inv.email}</p>}
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">{formatCurrency(inv.totalInvested)}</td>
                  <td className="px-6 py-4 text-right text-sm">{inv.startupCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
