import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calculateInvestorEquity } from "@/lib/investor-equity";
import { toast } from "sonner";

interface Investor {
  id: string;
  investor_name: string;
  email: string | null;
  amount_invested: number;
  equity_percentage: number;
  investment_date: string;
  notes: string | null;
  pledge_amount?: number | null;
  investment_round?: string | null;
}

interface EditInvestorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investor: Investor;
  onSave: (data: Investor) => void;
  isSubmitting?: boolean;
  fundingGoal?: number | null;
}

export default function EditInvestorDialog({ open, onOpenChange, investor, onSave, isSubmitting, fundingGoal }: EditInvestorDialogProps) {
  const [name, setName] = useState(investor.investor_name);
  const [email, setEmail] = useState(investor.email || "");
  const [amountInvested, setAmountInvested] = useState(String(investor.amount_invested));
  const [equity, setEquity] = useState(String(investor.equity_percentage));
  const [date, setDate] = useState(investor.investment_date);
  const [notes, setNotes] = useState(investor.notes || "");
  const [pledgeAmount, setPledgeAmount] = useState(String(investor.pledge_amount ?? ""));
  const [investmentRound, setInvestmentRound] = useState(investor.investment_round || "");

  useEffect(() => {
    setName(investor.investor_name);
    setEmail(investor.email || "");
    setAmountInvested(String(investor.amount_invested));
    setEquity(String(investor.equity_percentage));
    setDate(investor.investment_date);
    setNotes(investor.notes || "");
    setPledgeAmount(String(investor.pledge_amount ?? ""));
    setInvestmentRound(investor.investment_round || "");
  }, [investor]);

  const usesAutoCalculatedEquity = Number(fundingGoal ?? 0) > 0;

  const calculatedEquity = useMemo(() => {
    return calculateInvestorEquity({
      fundingGoal,
      pledgeAmount: pledgeAmount === "" ? null : pledgeAmount,
      amountInvested: amountInvested === "" ? 0 : amountInvested,
    });
  }, [amountInvested, fundingGoal, pledgeAmount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please fill in the investor name");
      return;
    }

    const normalizedAmountInvested = amountInvested === "" ? 0 : Number(amountInvested);
    if (!Number.isFinite(normalizedAmountInvested) || normalizedAmountInvested < 0) {
      toast.error("Please enter a valid total contributed amount");
      return;
    }

    const normalizedPledgeAmount = pledgeAmount === "" ? null : Number(pledgeAmount);
    if (normalizedPledgeAmount !== null && (!Number.isFinite(normalizedPledgeAmount) || normalizedPledgeAmount < 0)) {
      toast.error("Please enter a valid pledge amount");
      return;
    }

    const normalizedEquity = usesAutoCalculatedEquity
      ? calculatedEquity
      : equity === ""
        ? 0
        : Number(equity);

    if (!Number.isFinite(normalizedEquity) || normalizedEquity < 0 || normalizedEquity > 100) {
      toast.error("Equity must be between 0 and 100%");
      return;
    }

    onSave({
      ...investor,
      investor_name: name.trim(),
      email: email.trim() || null,
      amount_invested: normalizedAmountInvested,
      equity_percentage: normalizedEquity,
      investment_date: date,
      notes: notes.trim() || null,
      pledge_amount: normalizedPledgeAmount,
      investment_round: investmentRound || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="font-display">Edit Investor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Investor Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Total Contributed ($)</Label>
              <Input type="number" value={amountInvested} onChange={(e) => setAmountInvested(e.target.value)} min="0" step="any" />
            </div>
            <div className="space-y-2">
              <Label>Equity (%)</Label>
              <Input
                type="number"
                value={usesAutoCalculatedEquity ? calculatedEquity.toFixed(2) : equity}
                onChange={(e) => setEquity(e.target.value)}
                min="0"
                max="100"
                step="any"
                readOnly={usesAutoCalculatedEquity}
                className={usesAutoCalculatedEquity ? "bg-muted/40" : undefined}
              />
              {usesAutoCalculatedEquity && (
                <p className="text-xs text-muted-foreground">
                  Calculated from pledge amount, or total contributed if no pledge amount is set.
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Pledge Amount ($)</Label>
              <Input type="number" value={pledgeAmount} onChange={(e) => setPledgeAmount(e.target.value)} min="0" step="any" placeholder="Amount pledged" />
            </div>
            <div className="space-y-2">
              <Label>Investment Round</Label>
              <Select value={investmentRound} onValueChange={setInvestmentRound}>
                <SelectTrigger>
                  <SelectValue placeholder="Select round" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pre-seed">Pre-Seed</SelectItem>
                  <SelectItem value="seed">Seed</SelectItem>
                  <SelectItem value="series-a">Series A</SelectItem>
                  <SelectItem value="series-b">Series B</SelectItem>
                  <SelectItem value="series-c">Series C</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Investment Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} rows={2} />
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
