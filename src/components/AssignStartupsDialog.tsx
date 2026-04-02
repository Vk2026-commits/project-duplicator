import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  profileName: string;
  profileEmail?: string | null;
}

export default function AssignStartupsDialog({ open, onOpenChange, profileId, profileName, profileEmail }: Props) {
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);

  const { data: startups = [] } = useQuery({
    queryKey: ["all-startups"],
    queryFn: async () => {
      const { data, error } = await supabase.from("startups").select("id, name, sector").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: currentLinks = [], isLoading } = useQuery({
    queryKey: ["profile-startup-links", profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profile_startup_links" as any)
        .select("startup_id")
        .eq("profile_id", profileId);
      if (error) throw error;
      return (data as any[]).map((d: any) => d.startup_id as string);
    },
    enabled: open,
  });

  // Also fetch existing startup_investors records for this person
  const { data: existingInvestorRecords = [] } = useQuery({
    queryKey: ["investor-records-for-profile", profileName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("startup_investors")
        .select("startup_id")
        .eq("investor_name", profileName);
      if (error) throw error;
      return data.map((d) => d.startup_id);
    },
    enabled: open && !!profileName,
  });

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [newStartupData, setNewStartupData] = useState<Map<string, { amount: string; equity: string }>>(new Map());
  const [initialized, setInitialized] = useState(false);

  if (!isLoading && currentLinks.length >= 0 && !initialized) {
    setSelected(new Set(currentLinks));
    setInitialized(true);
  }

  const handleOpenChange = (o: boolean) => {
    if (!o) {
      setInitialized(false);
      setNewStartupData(new Map());
    }
    onOpenChange(o);
  };

  const toggle = (startupId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(startupId)) next.delete(startupId);
      else next.add(startupId);
      return next;
    });
  };

  const updateField = (startupId: string, field: "amount" | "equity", value: string) => {
    setNewStartupData((prev) => {
      const next = new Map(prev);
      const entry = next.get(startupId) || { amount: "", equity: "" };
      next.set(startupId, { ...entry, [field]: value });
      return next;
    });
  };

  // Startups that are newly selected (not already linked)
  const existingInvestorSet = new Set(existingInvestorRecords);
  const newlySelected = Array.from(selected).filter((id) => !existingInvestorSet.has(id));

  const handleSave = async () => {

    setSaving(true);
    try {
      // 1. Update profile_startup_links
      await supabase.from("profile_startup_links" as any).delete().eq("profile_id", profileId);
      if (selected.size > 0) {
        const linkRows = Array.from(selected).map((startup_id) => ({
          profile_id: profileId,
          startup_id,
        }));
        const { error } = await supabase.from("profile_startup_links" as any).insert(linkRows);
        if (error) throw error;
      }

      // 2. Create startup_investors records for newly added startups
      if (newlySelected.length > 0) {
        const investorRows = newlySelected.map((startup_id) => {
          const data = newStartupData.get(startup_id);
          return {
            investor_name: profileName,
            email: profileEmail || null,
            startup_id,
            amount_invested: parseFloat(data?.amount || "0") || 0,
            equity_percentage: parseFloat(data?.equity || "0") || 0,
          };
        });
        const { error } = await supabase.from("startup_investors").insert(investorRows);
        if (error) throw error;

        // Send assignment notification emails for each newly assigned startup
        for (const startupId of newlySelected) {
          const startupName = startups.find((s) => s.id === startupId)?.name || "a new group";
          const siteUrl = window.location.origin;
          const onboardingUrl = `${siteUrl}/onboarding/${startupId}`;

          await supabase.functions.invoke("send-transactional-email", {
            body: {
              templateName: "startup-assignment",
              recipientEmail: profileEmail,
              idempotencyKey: `startup-assign-${profileId}-${startupId}`,
              templateData: {
                memberName: profileName,
                startupName,
                onboardingUrl,
              },
            },
          });
        }
      }

      qc.invalidateQueries({ queryKey: ["profile-startup-links"] });
      qc.invalidateQueries({ queryKey: ["startup-investors"] });
      qc.invalidateQueries({ queryKey: ["admin-investors"] });
      qc.invalidateQueries({ queryKey: ["investor-records-for-profile"] });
      toast.success(`Startup assignments updated for ${profileName}`);
      handleOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display">Assign Startups — {profileName}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <p className="text-muted-foreground text-sm py-4">Loading...</p>
        ) : (
          <div className="space-y-2 overflow-y-auto flex-1 py-2 pr-1">
            {startups.map((s) => {
              const isSelected = selected.has(s.id);
              const alreadyHasRecord = existingInvestorSet.has(s.id);
              const isNew = isSelected && !alreadyHasRecord;

              return (
                <div key={s.id} className={`rounded-lg border p-3 transition-colors ${isSelected ? "border-primary/40 bg-secondary/30" : "border-border"}`}>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <Checkbox checked={isSelected} onCheckedChange={() => toggle(s.id)} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.sector}
                        {alreadyHasRecord && isSelected && <span className="ml-2 text-primary">(already invested)</span>}
                      </p>
                    </div>
                  </label>
                  {isNew && (
                    <div className="grid grid-cols-2 gap-3 mt-3 ml-8">
                      <div className="space-y-1">
                        <Label className="text-xs">Amount ($)</Label>
                        <Input
                          type="number"
                          placeholder="e.g. 50000"
                          value={newStartupData.get(s.id)?.amount || ""}
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
                          value={newStartupData.get(s.id)?.equity || ""}
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
            })}
            {startups.length === 0 && <p className="text-sm text-muted-foreground">No startups available.</p>}
          </div>
        )}
        <div className="flex justify-end gap-3 pt-3 border-t border-border">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-1.5" /> Saving...</> : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
