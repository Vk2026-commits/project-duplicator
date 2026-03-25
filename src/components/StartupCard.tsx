import { Link } from "react-router-dom";
import { formatCurrency } from "@/lib/mock-data";
import type { Startup } from "@/lib/mock-data";
import { Progress } from "@/components/ui/progress";

interface StartupCardProps {
  startup: Startup;
}

export default function StartupCard({ startup }: StartupCardProps) {
  const roi = ((startup.currentValue - startup.invested) / startup.invested) * 100;

  const statusStyles = {
    "on-track": "bg-primary/10 text-primary",
    "at-risk": "bg-warning/10 text-warning",
    "outperforming": "bg-accent/10 text-accent",
  };

  const stageStyles = {
    "Pre-Seed": "border-muted-foreground/30 text-muted-foreground",
    "Seed": "border-primary/30 text-primary",
    "Series A": "border-accent/30 text-accent",
    "Series B": "border-warning/30 text-warning",
    "Series C": "border-destructive/30 text-destructive",
  };

  return (
    <Link to={`/startups/${startup.id}`} className="glass-card rounded-xl p-5 hover:border-primary/30 transition-all group animate-fade-in block">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-display font-semibold group-hover:text-primary transition-colors">{startup.name}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">{startup.sector}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full border ${stageStyles[startup.stage]}`}>
          {startup.stage}
        </span>
      </div>

      <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{startup.description}</p>

      <div className="flex items-center justify-between text-sm mb-3">
        <span className="text-muted-foreground">Progress</span>
        <span className="font-medium">{startup.progress}%</span>
      </div>
      <Progress value={startup.progress} className="h-1.5 mb-4" />

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Invested</p>
          <p className="text-sm font-medium">{formatCurrency(startup.invested)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">ROI</p>
          <p className={`text-sm font-medium ${roi >= 0 ? "text-accent" : "text-destructive"}`}>
            {roi >= 0 ? "+" : ""}{roi.toFixed(1)}%
          </p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${statusStyles[startup.status]}`}>
          {startup.status.replace("-", " ")}
        </span>
      </div>
    </Link>
  );
}
