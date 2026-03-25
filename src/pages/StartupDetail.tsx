import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import StatCard from "@/components/StatCard";
import { startups, investments, investors, formatCurrency } from "@/lib/mock-data";
import { DollarSign, TrendingUp, Users, ArrowLeft, Calendar } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function StartupDetail() {
  const { id } = useParams();
  const startup = startups.find((s) => s.id === id);

  if (!startup) {
    return (
      <Layout>
        <p className="text-muted-foreground">Startup not found.</p>
      </Layout>
    );
  }

  const startupInvestments = investments.filter((i) => i.startupId === startup.id);
  const startupInvestors = startupInvestments
    .map((inv) => ({ ...investors.find((i) => i.id === inv.investorId)!, investment: inv }))
    .filter((i) => i.id);

  const roi = ((startup.currentValue - startup.invested) / startup.invested) * 100;

  const statusStyles = {
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
            <span className={`text-xs px-2.5 py-1 rounded-full ${statusStyles[startup.status]}`}>
              {startup.status.replace("-", " ")}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{startup.sector} · {startup.stage}</p>
          <p className="text-sm text-muted-foreground mt-2">{startup.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={DollarSign} title="Total Invested" value={formatCurrency(startup.invested)} />
        <StatCard icon={TrendingUp} title="Current Value" value={formatCurrency(startup.currentValue)} change={`ROI: ${roi >= 0 ? "+" : ""}${roi.toFixed(1)}%`} changeType={roi >= 0 ? "positive" : "negative"} />
        <StatCard icon={Users} title="Investors" value={String(startupInvestors.length)} />
        <StatCard icon={Calendar} title="Founded" value={startup.founded} />
      </div>

      <div className="glass-card rounded-xl p-6 mb-8 animate-fade-in">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-semibold">Milestone Progress</h3>
          <span className="text-sm font-medium">{startup.progress}%</span>
        </div>
        <Progress value={startup.progress} className="h-2" />
      </div>

      <div className="glass-card rounded-xl overflow-hidden animate-fade-in">
        <div className="p-6 border-b border-border">
          <h3 className="font-display font-semibold">Investor Breakdown</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Investor</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">Amount</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">Equity</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {startupInvestors.map((inv) => (
              <tr key={inv.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                <td className="px-6 py-4">
                  <Link to={`/investors/${inv.id}`} className="flex items-center gap-3 group">
                    <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                      {inv.avatar}
                    </div>
                    <span className="text-sm font-medium group-hover:text-primary transition-colors">{inv.name}</span>
                  </Link>
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium">{formatCurrency(inv.investment.amount)}</td>
                <td className="px-6 py-4 text-right text-sm">{inv.investment.equity}%</td>
                <td className="px-6 py-4 text-right text-sm text-muted-foreground">
                  {new Date(inv.investment.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
