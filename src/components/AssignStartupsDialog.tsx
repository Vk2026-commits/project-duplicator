import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  profileName: string;
}

export default function AssignStartupsDialog({ open, onOpenChange, profileId, profileName }: Props) {
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

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [initialized, setInitialized] = useState(false);

  // Sync current links to selected state when loaded
  if (!isLoading && currentLinks.length >= 0 && !initialized) {
    setSelected(new Set(currentLinks));
    setInitialized(true);
  }

  // Reset when dialog closes
  const handleOpenChange = (o: boolean) => {
    if (!o) setInitialized(false);
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

  const handleSave = async () => {
    setSaving(true);
    try {
      // Delete all current links for this profile
      await supabase.from("profile_startup_links" as any).delete().eq("profile_id", profileId);

      // Insert new links
      if (selected.size > 0) {
        const rows = Array.from(selected).map((startup_id) => ({
          profile_id: profileId,
          startup_id,
        }));
        const { error } = await supabase.from("profile_startup_links" as any).insert(rows);
        if (error) throw error;
      }

      qc.invalidateQueries({ queryKey: ["profile-startup-links"] });
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
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="font-display">Assign Startups — {profileName}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <p className="text-muted-foreground text-sm py-4">Loading...</p>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto py-2">
            {startups.map((s) => (
              <label key={s.id} className="flex items-center gap-3 cursor-pointer hover:bg-secondary/30 rounded-lg px-3 py-2 transition-colors">
                <Checkbox checked={selected.has(s.id)} onCheckedChange={() => toggle(s.id)} />
                <div>
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.sector}</p>
                </div>
              </label>
            ))}
            {startups.length === 0 && <p className="text-sm text-muted-foreground">No startups available.</p>}
          </div>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-1.5" /> Saving...</> : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
