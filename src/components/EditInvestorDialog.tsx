import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Investor {
  id: string;
  investor_name: string;
  email: string | null;
  amount_invested: number;
  equity_percentage: number;
  investment_date: string;
  notes: string | null;
}

interface EditInvestorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investor: Investor;
  onSave: (data: Investor) => void;
  isSubmitting?: boolean;
}

export default function EditInvestorDialog({ open, onOpenChange, investor, onSave, isSubmitting }: EditInvestorDialogProps) {
  const [name, setName] = useState(investor.investor_name);
  const [email, setEmail] = useState(investor.email || "");
  const [amount, setAmount] = useState(String(investor.amount_invested));
  const [equity, setEquity] = useState(String(investor.equity_percentage));
  const [date, setDate] = useState(investor.investment_date);
  const [notes, setNotes] = useState(investor.notes || "");

  useEffect(() => {
    setName(investor.investor_name);
    setEmail(investor.email || "");
    setAmount(String(investor.amount_invested));
    setEquity(String(investor.equity_percentage));
    setDate(investor.investment_date);
    setNotes(investor.notes || "");
  }, [investor]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !amount || !equity) {
      toast.error("Please fill in name, amount, and equity");
      return;
    }
    onSave({
      ...investor,
      investor_name: name.trim(),
      email: email.trim() || null,
      amount_invested: parseFloat(amount),
      equity_percentage: parseFloat(equity),
      investment_date: date,
      notes: notes.trim() || null,
    });
    toast.success("Investor updated");
    onOpenChange(false);
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
              <Label>Amount ($) *</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min="1" step="any" />
            </div>
            <div className="space-y-2">
              <Label>Equity (%) *</Label>
              <Input type="number" value={equity} onChange={(e) => setEquity(e.target.value)} min="0.01" max="100" step="any" />
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
