import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import StatCard from "@/components/StatCard";
import AddInvestorDialog from "@/components/AddInvestorDialog";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/mock-data";
import { DollarSign, TrendingUp, Users, ArrowLeft, Calendar, Percent } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function StartupDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const { data: startup, isLoading: loadingStartup } = useQuery({
    queryKey: ["startup", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("startups")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: investors = [], isLoading: loadingInvestors } = useQuery({
    queryKey: ["startup-investors", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("startup_investors")
        .select("*")
        .eq("startup_id", id!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const addInvestorMutation = useMutation({
    mutationFn: async (investor: {
      investor_name: string;
      email: string;
      amount_invested: number;
      equity_percentage: number;
      investment_date: string;
      notes: string;
    }) => {
      const { error } = await supabase.from("startup_investors").insert({
        startup_id: id!,
        investor_name: investor.investor_name,
        email: investor.email || null,
        amount_invested: investor.amount_invested,
        equity_percentage: investor.equity_percentage,
        investment_date: investor.investment_date,
        notes: investor.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["startup-investors", id] });
    },
  });

  if (loadingStartup) {
    return <Layout><p className="text-muted-foreground">Loading...</p></Layout>;
  }

  if (!startup) {
    return <Layout><p className="text-muted-foreground">Startup not found.</p></Layout>;
  }

  const roi = ((Number(startup.current_value) - Number(startup.invested)) / Number(startup.invested)) * 100;
  const totalFromInvestors = investors.reduce((sum, inv) => sum + Number(inv.amount_invested), 0);
  const totalEquity = investors.reduce((sum, inv) => sum + Number(inv.equity_percentage), 0);

  const statusStyles: Record<string, string> = {
    "on-track": "bg-primary/10 text-primary",
    "at-risk": "bg-warning/10 text-warning",
    outperforming: "bg-accent/10 text-accent",
  };

  return (
    <Layout>
      <Link to="/startups" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Startups
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="font-display text-2xl font-bold">{startup.name}</h2>
            <span className={`text-xs px-2.5 py-1 rounded-full ${statusStyles[startup.status] || ""}`}>
              {startup.status.replace("-", " ")}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{startup.sector} · {startup.stage}</p>
          {startup.description && <p className="text-sm text-muted-foreground mt-2">{startup.description}</p>}
        </div>
        <AddInvestorDialog onAdd={(data) => addInvestorMutation.mutate(data)} isSubmitting={addInvestorMutation.isPending} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={DollarSign} title="Total Invested" value={formatCurrency(Number(startup.invested))} />
        <StatCard icon={TrendingUp} title="Current Value" value={formatCurrency(Number(startup.current_value))} change={`ROI: ${roi >= 0 ? "+" : ""}${roi.toFixed(1)}%`} changeType={roi >= 0 ? "positive" : "negative"} />
        <StatCard icon={Users} title="Investors" value={String(investors.length)} />
        <StatCard icon={Percent} title="Total Equity Allocated" value={`${totalEquity.toFixed(1)}%`} change={totalEquity > 0 ? `${(100 - totalEquity).toFixed(1)}% remaining` : "No equity allocated"} changeType="neutral" />
      </div>

      <div className="glass-card rounded-xl p-6 mb-8 animate-fade-in">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-semibold">Milestone Progress</h3>
          <span className="text-sm font-medium">{startup.progress}%</span>
        </div>
        <Progress value={startup.progress} className="h-2" />
      </div>

      <div className="glass-card rounded-xl overflow-hidden animate-fade-in">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="font-display font-semibold">Investor Breakdown</h3>
          {totalFromInvestors > 0 && (
            <span className="text-sm text-muted-foreground">Total: {formatCurrency(totalFromInvestors)}</span>
          )}
        </div>
        {loadingInvestors ? (
          <p className="p-6 text-muted-foreground text-sm">Loading investors...</p>
        ) : investors.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No investors added yet.</p>
            <p className="text-muted-foreground text-xs mt-1">Click "Add Investor" to track who has invested in this startup.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Investor</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">Amount</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">Equity</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">Date</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">Notes</th>
              </tr>
            </thead>
            <tbody>
              {investors.map((inv) => (
                <tr key={inv.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                        {inv.investor_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="text-sm font-medium">{inv.investor_name}</span>
                        {inv.email && <p className="text-xs text-muted-foreground">{inv.email}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">{formatCurrency(Number(inv.amount_invested))}</td>
                  <td className="px-6 py-4 text-right text-sm">{Number(inv.equity_percentage)}%</td>
                  <td className="px-6 py-4 text-right text-sm text-muted-foreground">
                    {new Date(inv.investment_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-muted-foreground max-w-[200px] truncate">
                    {inv.notes || "—"}
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
