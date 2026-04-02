import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, DollarSign, Calendar, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/mock-data";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investorRecord: {
    id: string;
    investor_name: string;
    startup_id: string;
    pledge_amount: number | null;
    amount_invested: number;
  };
  startupName: string;
  onSaved: () => void;
}

export default function InvestorContributionsDialog({ open, onOpenChange, investorRecord, startupName, onSaved }: Props) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  const { data: contributions = [], isLoading } = useQuery({
    queryKey: ["investor-contributions", investorRecord.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("investor_contributions")
        .select("*")
        .eq("startup_investor_id", investorRecord.id)
        .order("contribution_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const totalContributed = contributions.reduce((sum: number, c: any) => sum + Number(c.amount), 0);
  const pledgeAmount = Number(investorRecord.pledge_amount) || 0;
  const progressPct = pledgeAmount > 0 ? Math.min((totalContributed / pledgeAmount) * 100, 100) : 0;
  const remaining = pledgeAmount > 0 ? Math.max(pledgeAmount - totalContributed, 0) : 0;

  const addMutation = useMutation({
    mutationFn: async () => {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) throw new Error("Enter a valid amount");

      // Insert contribution
      const { error } = await supabase.from("investor_contributions").insert({
        startup_investor_id: investorRecord.id,
        startup_id: investorRecord.startup_id,
        investor_name: investorRecord.investor_name,
        amount: parsedAmount,
        contribution_date: date,
        notes: notes || null,
      } as any);
      if (error) throw error;

      // Recalculate total from all contributions for this investor-startup record
      const { data: allContribs, error: fetchErr } = await supabase
        .from("investor_contributions")
        .select("amount")
        .eq("startup_investor_id", investorRecord.id);
      if (fetchErr) throw fetchErr;

      const newTotal = (allContribs || []).reduce((sum: number, c: any) => sum + Number(c.amount), 0) + parsedAmount;
      const { error: updateErr } = await supabase
        .from("startup_investors")
        .update({ amount_invested: newTotal })
        .eq("id", investorRecord.id);
      if (updateErr) throw updateErr;
    },
    onSuccess: () => {
      toast.success("Contribution recorded");
      setAmount("");
      setNotes("");
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ["investor-contributions", investorRecord.id] });
      qc.invalidateQueries({ queryKey: ["startup-investors"] });
      qc.invalidateQueries({ queryKey: ["startup"] });
      onSaved();
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Contributions — {investorRecord.investor_name}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{startupName}</p>
        </DialogHeader>

        {/* Pledge Progress */}
        {pledgeAmount > 0 && (
          <div className="space-y-2 bg-secondary/30 rounded-lg p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Pledge Progress</span>
              <span className="font-semibold">{formatCurrency(totalContributed)} / {formatCurrency(pledgeAmount)}</span>
            </div>
            <Progress value={progressPct} className="h-2.5" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{progressPct.toFixed(0)}% complete</span>
              {remaining > 0 && <span>{formatCurrency(remaining)} remaining</span>}
              {remaining === 0 && <span className="text-green-600 font-medium">✓ Pledge fulfilled!</span>}
            </div>
          </div>
        )}

        {/* Summary stats */}
        <div className="flex items-center gap-3 text-sm">
          <div className="bg-secondary/50 rounded-lg px-3 py-2">
            <span className="text-muted-foreground">Total Contributed: </span>
            <span className="font-semibold">{formatCurrency(totalContributed)}</span>
          </div>
          <div className="bg-secondary/50 rounded-lg px-3 py-2">
            <span className="text-muted-foreground">Payments: </span>
            <span className="font-semibold">{contributions.length}</span>
          </div>
        </div>

        {/* Contributions table */}
        <div className="overflow-y-auto flex-1 border rounded-lg">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : contributions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No contributions recorded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contributions.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        {format(new Date(c.contribution_date), "MMM d, yyyy")}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">{formatCurrency(Number(c.amount))}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">{c.notes || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Add contribution form */}
        {showForm ? (
          <div className="border border-primary/20 rounded-lg p-4 space-y-3 bg-secondary/20">
            <p className="text-sm font-medium">Record New Contribution</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Amount ($)</Label>
                <Input type="number" placeholder="e.g. 1000" value={amount} onChange={(e) => setAmount(e.target.value)} min="1" step="any" className="h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Date</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Notes (optional)</Label>
                <Input placeholder="e.g. Monthly contribution" value={notes} onChange={(e) => setNotes(e.target.value)} className="h-9 text-sm" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button size="sm" onClick={() => addMutation.mutate()} disabled={addMutation.isPending} className="gap-1.5">
                {addMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Add Contribution
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-end pt-1">
            <Button onClick={() => setShowForm(true)} className="gap-1.5">
              <Plus className="w-4 h-4" />
              Add Contribution
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
