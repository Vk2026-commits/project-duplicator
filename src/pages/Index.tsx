import Layout from "@/components/Layout";
import StatCard from "@/components/StatCard";
import PortfolioChart from "@/components/PortfolioChart";
import SectorChart from "@/components/SectorChart";
import InvestorTable from "@/components/InvestorTable";
import { investors, startups, formatCurrency } from "@/lib/mock-data";
import { DollarSign, TrendingUp, Users, Briefcase } from "lucide-react";

const totalInvested = investors.reduce((sum, i) => sum + i.totalInvested, 0);
const totalValue = investors.reduce((sum, i) => sum + i.portfolioValue, 0);
const overallRoi = ((totalValue - totalInvested) / totalInvested) * 100;

export default function Index() {
  return (
    <Layout>
      <div className="mb-8">
        <h2 className="font-display text-2xl font-bold">Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-1">Overview of your investment portfolio</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={DollarSign} title="Total Invested" value={formatCurrency(totalInvested)} change="+12.5% from last quarter" changeType="positive" />
        <StatCard icon={TrendingUp} title="Portfolio Value" value={formatCurrency(totalValue)} change={`ROI: +${overallRoi.toFixed(1)}%`} changeType="positive" />
        <StatCard icon={Users} title="Active Investors" value={String(investors.length)} change="2 new this quarter" changeType="positive" />
        <StatCard icon={Briefcase} title="Startup Investments" value={String(startups.length)} change="3 in pipeline" changeType="neutral" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <PortfolioChart />
        <SectorChart />
      </div>

      <InvestorTable limit={4} />
    </Layout>
  );
}
