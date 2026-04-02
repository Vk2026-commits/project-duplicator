import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Briefcase } from "lucide-react";

export default function MyPortfolioCard() {
  const { user } = useAuth();

  // Get startups this user is linked to
  const { data: links = [] } = useQuery({
    queryKey: ["my-startup-links", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profile_startup_links")
        .select("startup_id")
        .eq("profile_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const linkedStartupIds = links.map((l) => l.startup_id);

  // Get the startups this user is invested in
  const { data: myStartups = [] } = useQuery({
    queryKey: ["my-startups", linkedStartupIds],
    queryFn: async () => {
      if (linkedStartupIds.length === 0) return [];
      const { data, error } = await supabase
        .from("startups")
        .select("*")
        .in("id", linkedStartupIds);
      if (error) throw error;
      return data;
    },
    enabled: linkedStartupIds.length > 0,
  });

  // Get this user's individual investment records
  const { data: myInvestments = [] } = useQuery({
    queryKey: ["my-investments", user?.id, linkedStartupIds],
    queryFn: async () => {
      if (linkedStartupIds.length === 0) return [];
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user!.id)
        .single();

      if (!profile?.full_name) return [];

      const { data, error } = await supabase
        .from("startup_investors")
        .select("*")
        .in("startup_id", linkedStartupIds)
        .eq("investor_name", profile.full_name)
        .eq("archived", false);
      if (error) throw error;
      return data;
    },
    enabled: !!user && linkedStartupIds.length > 0,
  });

  if (!user || linkedStartupIds.length === 0) {
    return (
      <Card className="glass-card animate-fade-in">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-display">My Portfolio</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            You are not linked to any startups yet. Contact an admin to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  const myTotalInvested = myInvestments.reduce(
    (sum, inv) => sum + Number(inv.amount_invested),
    0
  );

  // Portfolio value = proportional share of each startup's current value based on equity
  const myTotalEquityValue = myInvestments.reduce((sum, inv) => {
    const startup = myStartups.find((s) => s.id === inv.startup_id);
    if (!startup) return sum;
    const equityShare = Number(inv.equity_percentage) / 100;
    return sum + Number(startup.current_value) * equityShare;
  }, 0);

  const myGrowth =
    myTotalInvested > 0
      ? ((myTotalEquityValue - myTotalInvested) / myTotalInvested) * 100
      : 0;

  const isPositive = myGrowth >= 0;

  // Per-startup breakdown
  const startupBreakdown = myStartups.map((s) => {
    const invs = myInvestments.filter((i) => i.startup_id === s.id);
    const invested = invs.reduce((sum, i) => sum + Number(i.amount_invested), 0);
    const equity = invs.reduce((sum, i) => sum + Number(i.equity_percentage), 0);
    const value = Number(s.current_value) * (equity / 100);
    const growth = invested > 0 ? ((value - invested) / invested) * 100 : 0;
    return { name: s.name, invested, equity, value, growth };
  });

  return (
    <Card className="glass-card animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-display">My Portfolio</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <DollarSign className="w-3 h-3" /> My Total Invested
            </p>
            <p className="text-lg font-bold">{formatCurrency(myTotalInvested)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Briefcase className="w-3 h-3" /> Portfolio Value
            </p>
            <p className="text-lg font-bold">{formatCurrency(myTotalEquityValue)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {isPositive ? (
                <TrendingUp className="w-3 h-3 text-primary" />
              ) : (
                <TrendingDown className="w-3 h-3 text-destructive" />
              )}
              Growth
            </p>
            <p
              className={`text-lg font-bold ${
                isPositive ? "text-primary" : "text-destructive"
              }`}
            >
              {isPositive ? "+" : ""}
              {myGrowth.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Per-startup breakdown */}
        {startupBreakdown.length > 0 && (
          <div className="border-t border-border pt-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Breakdown by Startup
            </p>
            {startupBreakdown.map((s) => (
              <div
                key={s.name}
                className="flex items-center justify-between text-sm py-1.5 px-2 rounded-md hover:bg-secondary/30 transition-colors"
              >
                <span className="font-medium truncate mr-4">{s.name}</span>
                <div className="flex items-center gap-4 text-right shrink-0">
                  <span className="text-muted-foreground">
                    {formatCurrency(s.invested)}
                  </span>
                  <span className="text-muted-foreground">{s.equity.toFixed(1)}%</span>
                  <span
                    className={`font-medium min-w-[60px] ${
                      s.growth >= 0 ? "text-primary" : "text-destructive"
                    }`}
                  >
                    {s.growth >= 0 ? "+" : ""}
                    {s.growth.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
