import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AddInvestorDialogProps {
  onAdd: (data: {
    investor_name: string;
    email: string;
    amount_invested: number;
    equity_percentage: number;
    investment_date: string;
    notes: string;
  }) => void;
  isSubmitting?: boolean;
  fundingGoal?: number;
  totalEquityAllocated?: number;
}

export default function AddInvestorDialog({ onAdd, isSubmitting, fundingGoal = 0, totalEquityAllocated = 0 }: AddInvestorDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [equity, setEquity] = useState("");
  const [equityManuallySet, setEquityManuallySet] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  const remainingEquity = 100 - totalEquityAllocated;

  const { data: profiles = [] } = useQuery({
    queryKey: ["all-profiles-for-investor"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .order("full_name");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // When a profile is selected, auto-fill name and email
  useEffect(() => {
    if (selectedProfileId && selectedProfileId !== "__manual__") {
      const profile = profiles.find((p) => p.id === selectedProfileId);
      if (profile) {
        setName(profile.full_name || "");
        setEmail(profile.email || "");
      }
    }
  }, [selectedProfileId, profiles]);

  // Auto-calculate equity when amount changes (if not manually overridden)
  useEffect(() => {
    if (!equityManuallySet && fundingGoal > 0 && amount) {
      const parsedAmount = parseFloat(amount);
      if (!isNaN(parsedAmount) && parsedAmount > 0) {
        const autoEquity = Math.min((parsedAmount / fundingGoal) * 100, remainingEquity);
        setEquity(autoEquity.toFixed(2));
      }
    }
  }, [amount, fundingGoal, equityManuallySet, remainingEquity]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !amount || !equity) {
      toast.error("Please fill in name, amount, and equity percentage");
      return;
    }

    const parsedAmount = parseFloat(amount);
    const parsedEquity = parseFloat(equity);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please enter a valid investment amount");
      return;
    }
    if (isNaN(parsedEquity) || parsedEquity <= 0 || parsedEquity > 100) {
      toast.error("Equity must be between 0 and 100%");
      return;
    }
    if (parsedEquity > remainingEquity + 0.01) {
      toast.error(`Only ${remainingEquity.toFixed(2)}% equity remaining`);
      return;
    }

    onAdd({
      investor_name: name.trim(),
      email: email.trim(),
      amount_invested: parsedAmount,
      equity_percentage: parsedEquity,
      investment_date: date,
      notes: notes.trim(),
    });

    toast.success(`Investor "${name.trim()}" added successfully`);
    setSelectedProfileId("");
    setName("");
    setEmail("");
    setAmount("");
    setEquity("");
    setEquityManuallySet(false);
    setDate(new Date().toISOString().slice(0, 10));
    setNotes("");
    setOpen(false);
  };

  const isManualEntry = selectedProfileId === "__manual__";

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEquityManuallySet(false); setSelectedProfileId(""); } }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <UserPlus className="w-4 h-4" />
          Add Investor
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="font-display">Add Investor</DialogTitle>
        </DialogHeader>
        {remainingEquity < 100 && (
          <p className="text-xs text-muted-foreground">
            Equity available: <span className="font-semibold text-primary">{remainingEquity.toFixed(1)}%</span> of 100%
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Select Investor *</Label>
            <Select value={selectedProfileId} onValueChange={(val) => {
              setSelectedProfileId(val);
              if (val === "__manual__") {
                setName("");
                setEmail("");
              }
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a registered member..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__manual__">✏️ Enter manually</SelectItem>
                {profiles.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.full_name || "Unnamed"} {p.email ? `(${p.email})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isManualEntry && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inv-name">Investor Name *</Label>
                <Input id="inv-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. John Smith" maxLength={100} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inv-email">Email</Label>
                <Input id="inv-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" maxLength={255} />
              </div>
            </div>
          )}

          {selectedProfileId && !isManualEntry && (
            <div className="rounded-lg border border-border bg-secondary/30 p-3">
              <p className="text-sm"><span className="text-muted-foreground">Name:</span> <span className="font-medium">{name}</span></p>
              {email && <p className="text-sm"><span className="text-muted-foreground">Email:</span> {email}</p>}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inv-amount">Amount Invested ($) *</Label>
              <Input id="inv-amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 50000" min="1" step="any" />
              {fundingGoal > 0 && <p className="text-xs text-muted-foreground">Funding goal: ${fundingGoal.toLocaleString()}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-equity">Equity (%) *</Label>
              <Input
                id="inv-equity"
                type="number"
                value={equity}
                onChange={(e) => { setEquity(e.target.value); setEquityManuallySet(true); }}
                placeholder="e.g. 5"
                min="0.01"
                max="100"
                step="any"
              />
              {!equityManuallySet && fundingGoal > 0 && amount && <p className="text-xs text-muted-foreground">Auto-calculated from investment</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="inv-date">Investment Date</Label>
            <Input id="inv-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="inv-notes">Notes</Label>
            <Textarea id="inv-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any additional notes about this investment..." maxLength={500} rows={2} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || (!selectedProfileId)}>{isSubmitting ? "Adding..." : "Add Investor"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
