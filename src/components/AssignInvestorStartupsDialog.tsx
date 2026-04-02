import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investorName: string;
  investorEmail: string | null;
  onSaved: () => void;
}

export default function AssignInvestorStartupsDialog({ open, onOpenChange, investorName, investorEmail, onSaved }: Props) {
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Map<string, { amount: string; equity: string }>>(new Map());

  const { data: startups = [] } = useQuery({
    queryKey: ["all-startups-for-assign"],
    queryFn: async () => {
      const { data, error } = await supabase.from("startups").select("id, name, sector").order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch which startups this investor is already in
  const { data: existingStartupIds = [] } = useQuery({
    queryKey: ["investor-existing-startups", investorName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("startup_investors")
        .select("startup_id")
        .eq("investor_name", investorName);
      if (error) throw error;
      return data.map((d) => d.startup_id);
    },
    enabled: open,
  });

  const existingSet = new Set(existingStartupIds);

  const toggle = (startupId: string) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(startupId)) {
        next.delete(startupId);
      } else {
        next.set(startupId, { amount: "0", equity: "0" });
      }
      return next;
    });
  };

  const updateField = (startupId: string, field: "amount" | "equity", value: string) => {
    setSelected((prev) => {
      const next = new Map(prev);
      const entry = next.get(startupId);
      if (entry) {
        next.set(startupId, { ...entry, [field]: value });
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (selected.size === 0) {
      toast.error("Select at least one startup");
      return;
    }

    // Validate entries - allow zero/empty for amount & equity
    for (const [startupId, data] of selected) {
      const amount = parseFloat(data.amount) || 0;
      const equity = parseFloat(data.equity) || 0;
      if (amount < 0) {
        const startup = startups.find((s) => s.id === startupId);
        toast.error(`Amount cannot be negative for ${startup?.name || "selected startup"}`);
        return;
      }
      if (equity < 0 || equity > 100) {
        const startup = startups.find((s) => s.id === startupId);
        toast.error(`Equity must be 0-100% for ${startup?.name || "selected startup"}`);
        return;
      }
    }

    setSaving(true);
    try {
      const rows = Array.from(selected).map(([startup_id, data]) => ({
        investor_name: investorName,
        email: investorEmail || null,
        startup_id,
        amount_invested: parseFloat(data.amount),
        equity_percentage: parseFloat(data.equity),
      }));

      const { error } = await supabase.from("startup_investors").insert(rows);
      if (error) throw error;

      toast.success(`Added ${rows.length} startup investment(s) for ${investorName}`);
      setSelected(new Map());
      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = (o: boolean) => {
    if (!o) setSelected(new Map());
    onOpenChange(o);
  };

  // Filter out startups already assigned
  const availableStartups = startups.filter((s) => !existingSet.has(s.id));

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[520px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display">Assign Startups — {investorName}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Select startups and enter the investment amount &amp; equity for each.
          {existingSet.size > 0 && ` (${existingSet.size} startup(s) already assigned)`}
        </p>

        <div className="space-y-2 overflow-y-auto flex-1 py-2 pr-1">
          {availableStartups.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {startups.length === 0 ? "No startups exist yet." : "This investor is already assigned to all startups."}
            </p>
          ) : (
            availableStartups.map((s) => {
              const isSelected = selected.has(s.id);
              return (
                <div key={s.id} className={`rounded-lg border p-3 transition-colors ${isSelected ? "border-primary/40 bg-secondary/30" : "border-border"}`}>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <Checkbox checked={isSelected} onCheckedChange={() => toggle(s.id)} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.sector}</p>
                    </div>
                  </label>
                  {isSelected && (
                    <div className="grid grid-cols-2 gap-3 mt-3 ml-8">
                      <div className="space-y-1">
                        <Label className="text-xs">Amount ($)</Label>
                        <Input
                          type="number"
                          placeholder="e.g. 50000"
                          value={selected.get(s.id)?.amount || ""}
                          onChange={(e) => updateField(s.id, "amount", e.target.value)}
                          min="1"
                          step="any"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Equity (%)</Label>
                        <Input
                          type="number"
                          placeholder="e.g. 5"
                          value={selected.get(s.id)?.equity || ""}
                          onChange={(e) => updateField(s.id, "equity", e.target.value)}
                          min="0.01"
                          max="100"
                          step="any"
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-border">
          <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || selected.size === 0} className="gap-1.5">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {saving ? "Saving..." : `Add ${selected.size} Investment${selected.size !== 1 ? "s" : ""}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
