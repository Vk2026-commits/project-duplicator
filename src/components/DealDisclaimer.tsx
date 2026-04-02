import { Info } from "lucide-react";

export default function DealDisclaimer() {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-secondary/50 border border-border p-3">
      <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
      <p className="text-xs text-muted-foreground leading-relaxed">
        This opportunity is provided for informational purposes only. Members are responsible for conducting their own due diligence before making any investment decisions.
      </p>
    </div>
  );
}
