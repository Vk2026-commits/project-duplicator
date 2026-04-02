import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const sectors = ["Artificial Intelligence", "CleanTech", "HealthTech", "FinTech", "AgriTech", "EdTech", "CyberSecurity", "Real Estate", "Retail"];
const stages = ["Pre-Seed", "Seed", "Series A", "Series B", "Series C"] as const;

interface EditStartupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  startup: { id: string; name: string; sector: string; stage: string; invested: number; current_value: number; description: string | null; progress: number; funding_goal: number };
  onSave: (data: { id: string; name: string; sector: string; stage: string; invested: number; current_value: number; description: string; progress: number; funding_goal: number }) => void;
  isSubmitting?: boolean;
}

export default function EditStartupDialog({ open, onOpenChange, startup, onSave, isSubmitting }: EditStartupDialogProps) {
  const [name, setName] = useState(startup.name);
  const [sector, setSector] = useState(startup.sector);
  const [stage, setStage] = useState(startup.stage);
  const [invested, setInvested] = useState(String(startup.invested));
  const [currentValue, setCurrentValue] = useState(String(startup.current_value));
  const [description, setDescription] = useState(startup.description || "");
  const [progress, setProgress] = useState(String(startup.progress));
  const [fundingGoal, setFundingGoal] = useState(String(startup.funding_goal));

  useEffect(() => {
    setName(startup.name);
    setSector(startup.sector);
    setStage(startup.stage);
    setInvested(String(startup.invested));
    setCurrentValue(String(startup.current_value));
    setDescription(startup.description || "");
    setProgress(String(startup.progress));
    setFundingGoal(String(startup.funding_goal));
  }, [startup]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sector || !stage) {
      toast.error("Please fill in all required fields");
      return;
    }
    onSave({
      id: startup.id,
      name: name.trim(),
      sector,
      stage,
      invested: parseFloat(invested),
      current_value: parseFloat(currentValue) || 0,
      description: description.trim(),
      progress: parseInt(progress) || 0,
      funding_goal: parseFloat(fundingGoal) || 0,
    });
    toast.success("Startup updated");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="font-display">Edit Startup</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Startup Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Sector *</Label>
              <Select value={sector} onValueChange={setSector}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{sectors.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Stage *</Label>
              <Select value={stage} onValueChange={setStage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{stages.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Funding Goal ($)</Label>
            <Input type="number" value={fundingGoal} onChange={(e) => setFundingGoal(e.target.value)} min="0" step="any" placeholder="e.g. 50000" />
            <p className="text-xs text-muted-foreground">Capital target for this round. Investor contributions subtract from this.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Invested ($)</Label>
              <Input type="number" value={invested} onChange={(e) => setInvested(e.target.value)} min="0" step="any" />
            </div>
            <div className="space-y-2">
              <Label>Current Value ($)</Label>
              <Input type="number" value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} min="0" step="any" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Progress (%)</Label>
            <Input type="number" value={progress} onChange={(e) => setProgress(e.target.value)} min="0" max="100" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} rows={3} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save Changes"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
