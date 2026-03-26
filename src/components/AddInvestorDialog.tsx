import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";

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
}

export default function AddInvestorDialog({ onAdd, isSubmitting }: AddInvestorDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [equity, setEquity] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

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

    onAdd({
      investor_name: name.trim(),
      email: email.trim(),
      amount_invested: parsedAmount,
      equity_percentage: parsedEquity,
      investment_date: date,
      notes: notes.trim(),
    });

    toast.success(`Investor "${name.trim()}" added successfully`);
    setName("");
    setEmail("");
    setAmount("");
    setEquity("");
    setDate(new Date().toISOString().slice(0, 10));
    setNotes("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inv-amount">Amount Invested ($) *</Label>
              <Input id="inv-amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 50000" min="1" step="any" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-equity">Equity (%) *</Label>
              <Input id="inv-equity" type="number" value={equity} onChange={(e) => setEquity(e.target.value)} placeholder="e.g. 5" min="0.01" max="100" step="any" />
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
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Adding..." : "Add Investor"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
