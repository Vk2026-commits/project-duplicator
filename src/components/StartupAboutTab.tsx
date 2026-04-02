import { formatCurrency } from "@/lib/mock-data";
import { Progress } from "@/components/ui/progress";

interface StartupAboutTabProps {
  startup: {
    name: string;
    sector: string;
    stage: string;
    status: string;
    description: string | null;
    founded: string | null;
    invested: number;
    current_value: number;
    progress: number;
    created_at: string;
  };
}

export default function StartupAboutTab({ startup }: StartupAboutTabProps) {
  const statusStyles: Record<string, string> = {
    "on-track": "bg-primary/10 text-primary",
    "at-risk": "bg-warning/10 text-warning",
    outperforming: "bg-accent/10 text-accent",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card rounded-xl p-6">
        <h3 className="font-display font-semibold text-lg mb-4">About {startup.name}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</span>
              <p className="text-sm mt-1">{startup.description || "No description provided."}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sector</span>
              <p className="text-sm mt-1 font-medium">{startup.sector}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Stage</span>
              <p className="text-sm mt-1 font-medium">{startup.stage}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Founded</span>
              <p className="text-sm mt-1 font-medium">{startup.founded || "Not specified"}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Added to Portfolio</span>
              <p className="text-sm mt-1 font-medium">
                {new Date(startup.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</span>
              <span className={`inline-block text-xs px-2.5 py-1 rounded-full mt-1 ${statusStyles[startup.status] || ""}`}>
                {startup.status.replace("-", " ")}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl p-6">
        <h3 className="font-display font-semibold text-lg mb-4">Financial Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-secondary/30">
            <span className="text-xs text-muted-foreground">Total Invested</span>
            <p className="text-lg font-bold mt-1">{formatCurrency(Number(startup.invested))}</p>
          </div>
          <div className="p-4 rounded-lg bg-secondary/30">
            <span className="text-xs text-muted-foreground">Current Value</span>
            <p className="text-lg font-bold mt-1">{formatCurrency(Number(startup.current_value))}</p>
          </div>
          <div className="p-4 rounded-lg bg-secondary/30">
            <span className="text-xs text-muted-foreground">ROI</span>
            <p className="text-lg font-bold mt-1">
              {(((Number(startup.current_value) - Number(startup.invested)) / Number(startup.invested)) * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-semibold">Milestone Progress</h3>
          <span className="text-sm font-medium">{startup.progress}%</span>
        </div>
        <Progress value={startup.progress} className="h-2" />
      </div>
    </div>
  );
}
