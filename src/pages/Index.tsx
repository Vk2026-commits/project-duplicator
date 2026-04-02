import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import StatCard from "@/components/StatCard";
import PortfolioChart from "@/components/PortfolioChart";
import SectorChart from "@/components/SectorChart";
import InvestorTable from "@/components/InvestorTable";
import MyPortfolioCard from "@/components/MyPortfolioCard";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/mock-data";
import { useAuth } from "@/hooks/useAuth";
import { DollarSign, TrendingUp, Users, Briefcase } from "lucide-react";

export default function Index() {
  const { data: startups = [] } = useQuery({
    queryKey: ["startups"],
    queryFn: async () => {
      const { data, error } = await supabase.from("startups").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: allInvestors = [] } = useQuery({
    queryKey: ["all-startup-investors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("startup_investors").select("*");
      if (error) throw error;
      return data;
    },
  });

  const totalInvested = startups.reduce((sum, s) => sum + Number(s.invested), 0);
  const totalValue = startups.reduce((sum, s) => sum + Number(s.current_value), 0);
  const overallRoi = totalInvested > 0 ? ((totalValue - totalInvested) / totalInvested) * 100 : 0;

  // Unique investors by name
  const uniqueInvestorNames = new Set(allInvestors.map((i) => i.investor_name));

  return (
    <Layout>
      <div className="mb-8">
        <h2 className="font-display text-2xl font-bold">Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-1">Overview of your investment portfolio</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={DollarSign} title="Total Invested" value={formatCurrency(totalInvested)} />
        <StatCard icon={TrendingUp} title="Portfolio Value" value={formatCurrency(totalValue)} change={totalInvested > 0 ? `ROI: ${overallRoi >= 0 ? "+" : ""}${overallRoi.toFixed(1)}%` : "No investments yet"} changeType={overallRoi >= 0 ? "positive" : "negative"} />
        <StatCard icon={Users} title="Active Investors" value={String(uniqueInvestorNames.size)} />
        <StatCard icon={Briefcase} title="Startup Investments" value={String(startups.length)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <PortfolioChart />
        <SectorChart />
      </div>

      <div className="mb-8">
        <MyPortfolioCard />
      </div>

      <InvestorTable limit={5} />
    </Layout>
  );
}
