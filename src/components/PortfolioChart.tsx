import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/mock-data";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function PortfolioChart() {
  const { data: startups = [] } = useQuery({
    queryKey: ["startups"],
    queryFn: async () => {
      const { data, error } = await supabase.from("startups").select("*").order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Build cumulative portfolio value over time based on startup creation dates
  const sorted = [...startups].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  let cumulative = 0;
  const chartData = sorted.map((s) => {
    cumulative += Number(s.current_value);
    const date = new Date(s.created_at);
    return {
      month: date.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      value: cumulative,
    };
  });

  // Add a starting zero point
  if (chartData.length > 0) {
    chartData.unshift({ month: "Start", value: 0 });
  }

  return (
    <div className="glass-card rounded-xl p-6 animate-fade-in">
      <h3 className="font-display font-semibold mb-1">Portfolio Growth</h3>
      <p className="text-sm text-muted-foreground mb-6">Cumulative portfolio value</p>
      {chartData.length <= 1 ? (
        <p className="text-muted-foreground text-sm h-64 flex items-center justify-center">No data yet</p>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="hsl(215, 20%, 55%)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis
                stroke="hsl(215, 20%, 55%)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => {
                  if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
                  if (v >= 1000) return `$${(v / 1000).toFixed(0)}K`;
                  return `$${v}`;
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(222, 47%, 9%)",
                  border: "1px solid hsl(222, 30%, 18%)",
                  borderRadius: "8px",
                  color: "hsl(210, 40%, 96%)",
                  fontSize: 13,
                }}
                formatter={(value: number) => [formatCurrency(value), "Value"]}
              />
              <Area type="monotone" dataKey="value" stroke="hsl(217, 91%, 60%)" strokeWidth={2} fill="url(#colorValue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
