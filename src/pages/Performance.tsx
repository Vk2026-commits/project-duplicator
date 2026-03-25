import Layout from "@/components/Layout";
import PortfolioChart from "@/components/PortfolioChart";
import SectorChart from "@/components/SectorChart";
import { startups, formatCurrency } from "@/lib/mock-data";
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const roiData = startups.map((s) => ({
  name: s.name.split(" ")[0],
  roi: ((s.currentValue - s.invested) / s.invested) * 100,
}));

export default function Performance() {
  return (
    <Layout>
      <div className="mb-8">
        <h2 className="font-display text-2xl font-bold">Performance</h2>
        <p className="text-sm text-muted-foreground mt-1">Analytics and performance metrics across all investments</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <PortfolioChart />
        <SectorChart />
      </div>

      <div className="glass-card rounded-xl p-6 animate-fade-in">
        <h3 className="font-display font-semibold mb-1">ROI by Startup</h3>
        <p className="text-sm text-muted-foreground mb-6">Return on investment comparison</p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={roiData}>
              <XAxis dataKey="name" stroke="hsl(215, 20%, 55%)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(222, 47%, 9%)",
                  border: "1px solid hsl(222, 30%, 18%)",
                  borderRadius: "8px",
                  color: "hsl(210, 40%, 96%)",
                  fontSize: 13,
                }}
                formatter={(value: number) => [`${value.toFixed(1)}%`, "ROI"]}
              />
              <Bar dataKey="roi" radius={[6, 6, 0, 0]}>
                {roiData.map((entry, index) => (
                  <Cell key={index} fill={entry.roi >= 0 ? "hsl(160, 84%, 39%)" : "hsl(0, 72%, 51%)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Layout>
  );
}
