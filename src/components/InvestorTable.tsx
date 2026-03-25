import { Link } from "react-router-dom";
import { investors, formatCurrency } from "@/lib/mock-data";
import { ArrowUpRight } from "lucide-react";

interface InvestorTableProps {
  limit?: number;
}

export default function InvestorTable({ limit }: InvestorTableProps) {
  const data = limit ? investors.slice(0, limit) : investors;

  return (
    <div className="glass-card rounded-xl overflow-hidden animate-fade-in">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-display font-semibold">Investors</h3>
          <p className="text-sm text-muted-foreground mt-0.5">{investors.length} active investors</p>
        </div>
        {limit && (
          <Link to="/investors" className="text-sm text-primary hover:underline flex items-center gap-1">
            View all <ArrowUpRight className="w-3 h-3" />
          </Link>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Investor</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">Total Invested</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">Portfolio Value</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">ROI</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">Startups</th>
            </tr>
          </thead>
          <tbody>
            {data.map((inv) => {
              const roi = ((inv.portfolioValue - inv.totalInvested) / inv.totalInvested) * 100;
              return (
                <tr key={inv.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-6 py-4">
                    <Link to={`/investors/${inv.id}`} className="flex items-center gap-3 group">
                      <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                        {inv.avatar}
                      </div>
                      <div>
                        <p className="font-medium text-sm group-hover:text-primary transition-colors">{inv.name}</p>
                        <p className="text-xs text-muted-foreground">{inv.email}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">{formatCurrency(inv.totalInvested)}</td>
                  <td className="px-6 py-4 text-right text-sm font-medium">{formatCurrency(inv.portfolioValue)}</td>
                  <td className={`px-6 py-4 text-right text-sm font-medium ${roi >= 0 ? "text-accent" : "text-destructive"}`}>
                    {roi >= 0 ? "+" : ""}{roi.toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 text-right text-sm">{inv.startups}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
