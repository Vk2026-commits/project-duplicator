import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import StatCard from "@/components/StatCard";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/mock-data";
import { DollarSign, TrendingUp, Briefcase, ArrowLeft } from "lucide-react";

export default function InvestorDetail() {
  const { id } = useParams(); // id is the investor name (URL-encoded)
  const investorName = decodeURIComponent(id || "");

  const { data: investments = [], isLoading } = useQuery({
    queryKey: ["investor-investments", investorName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("startup_investors")
        .select("*, startups(*)")
        .eq("investor_name", investorName);
      if (error) throw error;
      return data;
    },
    enabled: !!investorName,
  });

  const totalInvested = investments.reduce((sum, i) => sum + Number(i.amount_invested), 0);
  const email = investments.find((i) => i.email)?.email || null;
  const startupCount = new Set(investments.map((i) => i.startup_id)).size;

  if (isLoading) return <Layout><p className="text-muted-foreground">Loading...</p></Layout>;

  return (
    <Layout>
      <Link to="/investors" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Investors
      </Link>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center text-lg font-bold text-primary-foreground">
          {investorName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold">{investorName}</h2>
          {email && <p className="text-sm text-muted-foreground">{email}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard icon={DollarSign} title="Total Invested" value={formatCurrency(totalInvested)} />
        <StatCard icon={Briefcase} title="Startups" value={String(startupCount)} />
        <StatCard icon={TrendingUp} title="Total Equity" value={`${investments.reduce((sum, i) => sum + Number(i.equity_percentage), 0).toFixed(1)}%`} />
      </div>

      <h3 className="font-display font-semibold text-lg mb-4">Investment Breakdown</h3>
      <div className="glass-card rounded-xl overflow-hidden animate-fade-in">
        {investments.length === 0 ? (
          <p className="p-6 text-muted-foreground text-sm">No investments found.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Startup</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">Amount</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">Equity</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {investments.map((inv: any) => (
                <tr key={inv.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-6 py-4">
                    <Link to={`/startups/${inv.startup_id}`} className="text-sm font-medium hover:text-primary transition-colors">
                      {inv.startups?.name || "Unknown"}
                    </Link>
                    <p className="text-xs text-muted-foreground">{inv.startups?.sector}</p>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">{formatCurrency(Number(inv.amount_invested))}</td>
                  <td className="px-6 py-4 text-right text-sm">{Number(inv.equity_percentage)}%</td>
                  <td className="px-6 py-4 text-right text-sm text-muted-foreground">
                    {new Date(inv.investment_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}
