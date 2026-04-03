import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import StatCard from "@/components/StatCard";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/mock-data";
import { DollarSign, TrendingUp, Briefcase, ArrowLeft, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InvestorDetail() {
  const { id } = useParams();
  const investorName = decodeURIComponent(id || "");
  const [showArchived, setShowArchived] = useState(false);
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <Layout>
        <div className="text-center py-16">
          <p className="text-muted-foreground">You don't have permission to view this page.</p>
          <Link to="/investors" className="text-primary hover:underline text-sm mt-2 inline-block">Back to Investors</Link>
        </div>
      </Layout>
    );
  }

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

  const activeInvestments = investments.filter((i: any) => !i.archived);
  const archivedInvestments = investments.filter((i: any) => i.archived);
  const displayInvestments = showArchived ? archivedInvestments : activeInvestments;

  const totalInvested = activeInvestments.reduce((sum, i) => sum + Number(i.amount_invested), 0);
  const email = investments.find((i) => i.email)?.email || null;
  const startupCount = new Set(activeInvestments.map((i) => i.startup_id)).size;


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
        <StatCard icon={TrendingUp} title="Total Equity" value={`${activeInvestments.reduce((sum, i) => sum + Number(i.equity_percentage), 0).toFixed(1)}%`} />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-lg">
          {showArchived ? "Archived Investments" : "Investment Breakdown"}
        </h3>
        {archivedInvestments.length > 0 && (
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowArchived(!showArchived)}>
            {showArchived ? <Briefcase className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
            {showArchived ? `Active (${activeInvestments.length})` : `Archived (${archivedInvestments.length})`}
          </Button>
        )}
      </div>

      <div className="glass-card rounded-xl overflow-hidden animate-fade-in">
        {displayInvestments.length === 0 ? (
          <p className="p-6 text-muted-foreground text-sm">
            {showArchived ? "No archived investments." : "No active investments found."}
          </p>
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
              {displayInvestments.map((inv: any) => (
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
                  <td className="px-6 py-4 text-right">
                    <span className="text-xs text-muted-foreground">View only</span>
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
