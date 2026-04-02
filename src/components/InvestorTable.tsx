import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/mock-data";
import { ArrowUpRight } from "lucide-react";

interface InvestorTableProps {
  limit?: number;
}

export default function InvestorTable({ limit }: InvestorTableProps) {
  const { data: investments = [], isLoading } = useQuery({
    queryKey: ["all-startup-investors-with-startups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("startup_investors")
        .select("*, startups(name, sector)")
        .order("amount_invested", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

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
                <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">Amount</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">Equity</th>
              </tr>
            </thead>
            <tbody>
              {display.map((inv: any) => (
                <tr key={inv.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-6 py-4">
                    <Link to={`/investors/${encodeURIComponent(inv.investor_name)}`} className="flex items-center gap-3 group">
                      <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                        {inv.investor_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm group-hover:text-primary transition-colors">{inv.investor_name}</p>
                        {inv.email && <p className="text-xs text-muted-foreground">{inv.email}</p>}
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <Link to={`/startups/${inv.startup_id}`} className="text-sm hover:text-primary transition-colors">
                      {inv.startups?.name || "Unknown"}
                    </Link>
                    <p className="text-xs text-muted-foreground">{inv.startups?.sector}</p>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">{formatCurrency(Number(inv.amount_invested))}</td>
                  <td className="px-6 py-4 text-right text-sm">{Number(inv.equity_percentage)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
