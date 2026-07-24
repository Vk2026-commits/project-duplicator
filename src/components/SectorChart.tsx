import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = [
  "hsl(217, 91%, 60%)",
  "hsl(160, 84%, 39%)",
  "hsl(38, 92%, 50%)",
  "hsl(280, 65%, 60%)",
  "hsl(350, 80%, 60%)",
  "hsl(215, 20%, 45%)",
  "hsl(190, 70%, 50%)",
  "hsl(30, 80%, 55%)",
];

export default function SectorChart() {
  const { data: startups = [] } = useQuery({
    queryKey: ["startups"],
    queryFn: async () => {
      const { data, error } = await supabase.from("startups").select("*");
      if (error) throw error;
      return data;
    },
  });

  const totalInvested = startups.reduce((sum, s) => sum + Number(s.invested), 0);

  const sectorMap = startups.reduce<Record<string, number>>((acc, s) => {
    acc[s.sector] = (acc[s.sector] || 0) + Number(s.invested);
    return acc;
  }, {});

  const sectorData = Object.entries(sectorMap)
    .map(([sector, value]) => ({
      sector,
      value: totalInvested > 0 ? Math.round((value / totalInvested) * 100) : 0,
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="glass-card rounded-xl p-6 animate-fade-in">
      <h3 className="font-display font-semibold mb-1">Sector Allocation</h3>
      <p className="text-sm text-muted-foreground mb-6">Investment distribution by sector</p>
      {sectorData.length === 0 ? (
        <p className="text-muted-foreground text-sm h-64 flex items-center justify-center">No data yet</p>
      ) : (
        <div className="h-64 flex items-center">
          <div className="w-1/2 h-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sectorData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                  {sectorData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(222, 47%, 9%)",
                    border: "1px solid hsl(222, 30%, 18%)",
                    borderRadius: "8px",
                    color: "hsl(210, 40%, 96%)",
                    fontSize: 13,
                  }}
                  formatter={(value: number) => [`${value}%`, "Allocation"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-1/2 space-y-2">
            {sectorData.map((s, i) => (
              <div key={s.sector} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-muted-foreground truncate">{s.sector}</span>
                <span className="ml-auto font-medium">{s.value}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
