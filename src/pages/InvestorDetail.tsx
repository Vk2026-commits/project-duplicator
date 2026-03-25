import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import StatCard from "@/components/StatCard";
import StartupCard from "@/components/StartupCard";
import { investors, investments, startups, formatCurrency } from "@/lib/mock-data";
import { DollarSign, TrendingUp, Briefcase, ArrowLeft } from "lucide-react";

export default function InvestorDetail() {
  const { id } = useParams();
  const investor = investors.find((i) => i.id === id);

  if (!investor) {
    return (
      <Layout>
        <p className="text-muted-foreground">Investor not found.</p>
      </Layout>
    );
  }

  const investorInvestments = investments.filter((i) => i.investorId === investor.id);
  const investorStartups = investorInvestments
    .map((inv) => startups.find((s) => s.id === inv.startupId)!)
    .filter(Boolean);

  const roi = ((investor.portfolioValue - investor.totalInvested) / investor.totalInvested) * 100;

  return (
    <Layout>
      <Link to="/investors" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Investors
      </Link>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center text-lg font-bold text-primary-foreground">
          {investor.avatar}
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold">{investor.name}</h2>
          <p className="text-sm text-muted-foreground">{investor.email} · Joined {new Date(investor.joinDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard icon={DollarSign} title="Total Invested" value={formatCurrency(investor.totalInvested)} />
        <StatCard icon={TrendingUp} title="Portfolio Value" value={formatCurrency(investor.portfolioValue)} change={`ROI: +${roi.toFixed(1)}%`} changeType="positive" />
        <StatCard icon={Briefcase} title="Startups" value={String(investorStartups.length)} />
      </div>

      <h3 className="font-display font-semibold text-lg mb-4">Investment Portfolio</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {investorStartups.map((startup) => (
          <StartupCard key={startup.id} startup={startup} />
        ))}
      </div>
    </Layout>
  );
}
