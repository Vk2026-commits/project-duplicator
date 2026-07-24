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
import { Loader2, Plus, DollarSign, Calendar, Pencil, Trash2, Check, X } from "lucide-react";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/mock-data";
import AdminPasswordDialog from "./AdminPasswordDialog";

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

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editNotes, setEditNotes] = useState("");

  // Admin password confirmation state
  const [passwordAction, setPasswordAction] = useState<{ type: "edit" | "delete"; id: string } | null>(null);
  const [pendingEdit, setPendingEdit] = useState<{ id: string; amount: string; date: string; notes: string } | null>(null);

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

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["investor-contributions", investorRecord.id] });
    qc.invalidateQueries({ queryKey: ["startup-investors"] });
    qc.invalidateQueries({ queryKey: ["startup"] });
    onSaved();
  };

  const recalcTotal = async () => {
    const { data: allContribs } = await supabase
      .from("investor_contributions")
      .select("amount")
      .eq("startup_investor_id", investorRecord.id);
    const newTotal = (allContribs || []).reduce((sum: number, c: any) => sum + Number(c.amount), 0);
    await supabase
      .from("startup_investors")
      .update({ amount_invested: newTotal })
      .eq("id", investorRecord.id);
  };

  // Add contribution
  const addMutation = useMutation({
    mutationFn: async () => {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) throw new Error("Enter a valid amount");
      const { error } = await supabase.from("investor_contributions").insert({
        startup_investor_id: investorRecord.id,
        startup_id: investorRecord.startup_id,
        investor_name: investorRecord.investor_name,
        amount: parsedAmount,
        contribution_date: date,
        notes: notes || null,
      } as any);
      if (error) throw error;
      await recalcTotal();
    },
    onSuccess: () => {
      toast.success("Contribution recorded");
      setAmount("");
      setNotes("");
      setShowForm(false);
      invalidateAll();
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Edit contribution
  const editMutation = useMutation({
    mutationFn: async ({ id, amount, date, notes }: { id: string; amount: string; date: string; notes: string }) => {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) throw new Error("Enter a valid amount");
      const { error } = await supabase
        .from("investor_contributions")
        .update({ amount: parsedAmount, contribution_date: date, notes: notes || null })
        .eq("id", id);
      if (error) throw error;
      await recalcTotal();
    },
    onSuccess: () => {
      toast.success("Contribution updated");
      setEditingId(null);
      setPendingEdit(null);
      invalidateAll();
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Delete contribution
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("investor_contributions").delete().eq("id", id);
      if (error) throw error;
      await recalcTotal();
    },
    onSuccess: () => {
      toast.success("Contribution deleted");
      invalidateAll();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const startEdit = (c: any) => {
    setEditingId(c.id);
    setEditAmount(String(c.amount));
    setEditDate(c.contribution_date);
    setEditNotes(c.notes || "");
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    setPendingEdit({ id: editingId, amount: editAmount, date: editDate, notes: editNotes });
    setPasswordAction({ type: "edit", id: editingId });
  };

  const handleDeleteClick = (id: string) => {
    setPasswordAction({ type: "delete", id });
  };

  const handlePasswordConfirmed = () => {
    if (!passwordAction) return;
    if (passwordAction.type === "edit" && pendingEdit) {
      editMutation.mutate(pendingEdit);
    } else if (passwordAction.type === "delete") {
      deleteMutation.mutate(passwordAction.id);
    }
    setPasswordAction(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-hidden flex flex-col">
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
                    <TableHead className="text-right w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contributions.map((c: any) => (
                    <TableRow key={c.id}>
                      {editingId === c.id ? (
                        <>
                          <TableCell>
                            <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="h-8 text-sm w-[140px]" />
                          </TableCell>
                          <TableCell className="text-right">
                            <Input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} className="h-8 text-sm w-[100px] ml-auto text-right" min="0.01" step="any" />
                          </TableCell>
                          <TableCell>
                            <Input value={editNotes} onChange={(e) => setEditNotes(e.target.value)} className="h-8 text-sm" placeholder="Notes" />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={handleSaveEdit}>
                                <Check className="w-3.5 h-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(null)}>
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className="text-sm">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                              {format(new Date(c.contribution_date), "MMM d, yyyy")}
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-sm font-medium">{formatCurrency(Number(c.amount))}</TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">{c.notes || "—"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(c)}>
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeleteClick(c.id)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </>
                      )}
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

      {/* Admin password confirmation dialog */}
      <AdminPasswordDialog
        open={!!passwordAction}
        onOpenChange={(v) => { if (!v) { setPasswordAction(null); setPendingEdit(null); } }}
        title={passwordAction?.type === "delete" ? "Confirm Deletion" : "Confirm Changes"}
        description={
          passwordAction?.type === "delete"
            ? "Are you sure you want to delete this contribution? Enter your admin password to confirm."
            : "Are you sure you want to make these changes? Enter your admin password to confirm."
        }
        onConfirmed={handlePasswordConfirmed}
        isPending={editMutation.isPending || deleteMutation.isPending}
      />
    </>
  );
}
