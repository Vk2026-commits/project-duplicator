import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, DollarSign } from "lucide-react";
import { format } from "date-fns";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investorName: string;
  investorEmail: string | null;
  onSaved: () => void;
}

export default function InvestorLedgerDialog({ open, onOpenChange, investorName, investorEmail, onSaved }: Props) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [startupId, setStartupId] = useState("");
  const [amount, setAmount] = useState("");
  const [equity, setEquity] = useState("");
  const [investmentDate, setInvestmentDate] = useState(new Date().toISOString().split("T")[0]);

  // Fetch all investments for this investor
  const { data: investments = [], isLoading } = useQuery({
    queryKey: ["investor-ledger", investorName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("startup_investors")
        .select("*, startups(name)")
        .eq("investor_name", investorName)
        .order("investment_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Fetch all startups for the dropdown
  const { data: startups = [] } = useQuery({
    queryKey: ["all-startups-for-ledger"],
    queryFn: async () => {
      const { data, error } = await supabase.from("startups").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Group investments by startup for summary
  const byStartup = investments.reduce((acc: Record<string, { name: string; total: number; entries: number }>, inv: any) => {
    const sid = inv.startup_id;
    if (!acc[sid]) acc[sid] = { name: inv.startups?.name || "Unknown", total: 0, entries: 0 };
    acc[sid].total += Number(inv.amount_invested);
    acc[sid].entries += 1;
    return acc;
  }, {});

  const addMutation = useMutation({
    mutationFn: async () => {
      const parsedAmount = parseFloat(amount);
      const parsedEquity = parseFloat(equity);
      if (!startupId) throw new Error("Select a startup");
      if (isNaN(parsedAmount) || parsedAmount <= 0) throw new Error("Enter a valid amount");
      if (isNaN(parsedEquity) || parsedEquity <= 0 || parsedEquity > 100) throw new Error("Enter valid equity (0-100%)");

      const { error } = await supabase.from("startup_investors").insert({
        investor_name: investorName,
        email: investorEmail || null,
        startup_id: startupId,
        amount_invested: parsedAmount,
        equity_percentage: parsedEquity,
        investment_date: investmentDate,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Investment entry added");
      setAmount("");
      setEquity("");
      setStartupId("");
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ["investor-ledger", investorName] });
      onSaved();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const totalInvested = investments.reduce((sum: number, inv: any) => sum + Number(inv.amount_invested), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Investment Ledger — {investorName}
          </DialogTitle>
        </DialogHeader>

        {/* Summary */}
        <div className="flex items-center gap-4 text-sm">
          <div className="bg-secondary/50 rounded-lg px-3 py-2">
            <span className="text-muted-foreground">Total Invested: </span>
            <span className="font-semibold">${totalInvested.toLocaleString()}</span>
          </div>
          <div className="bg-secondary/50 rounded-lg px-3 py-2">
            <span className="text-muted-foreground">Entries: </span>
            <span className="font-semibold">{investments.length}</span>
          </div>
          <div className="bg-secondary/50 rounded-lg px-3 py-2">
            <span className="text-muted-foreground">Startups: </span>
            <span className="font-semibold">{Object.keys(byStartup).length}</span>
          </div>
        </div>

        {/* Per-startup summary */}
        {Object.keys(byStartup).length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">By Startup</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(byStartup).map(([sid, info]) => (
                <div key={sid} className="bg-primary/10 text-primary rounded-md px-2.5 py-1 text-xs font-medium">
                  {info.name}: ${info.total.toLocaleString()} ({info.entries} entry{info.entries !== 1 ? "ies" : ""})
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Investment history table */}
        <div className="overflow-y-auto flex-1 border rounded-lg">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : investments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No investments recorded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Startup</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Equity %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {investments.map((inv: any) => (
                  <TableRow key={inv.id} className={inv.archived ? "opacity-50" : ""}>
                    <TableCell className="text-sm">{format(new Date(inv.investment_date), "MMM d, yyyy")}</TableCell>
                    <TableCell className="font-medium text-sm">{inv.startups?.name || "—"}</TableCell>
                    <TableCell className="text-right text-sm">${Number(inv.amount_invested).toLocaleString()}</TableCell>
                    <TableCell className="text-right text-sm">{inv.equity_percentage}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Add new investment form */}
        {showForm ? (
          <div className="border border-primary/20 rounded-lg p-4 space-y-3 bg-secondary/20">
            <p className="text-sm font-medium">New Investment Entry</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Startup</Label>
                <Select value={startupId} onValueChange={setStartupId}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Select startup" /></SelectTrigger>
                  <SelectContent>
                    {startups.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Amount ($)</Label>
                <Input type="number" placeholder="e.g. 50000" value={amount} onChange={(e) => setAmount(e.target.value)} min="1" step="any" className="h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Equity (%)</Label>
                <Input type="number" placeholder="e.g. 5" value={equity} onChange={(e) => setEquity(e.target.value)} min="0.01" max="100" step="any" className="h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Date</Label>
                <Input type="date" value={investmentDate} onChange={(e) => setInvestmentDate(e.target.value)} className="h-9 text-sm" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button size="sm" onClick={() => addMutation.mutate()} disabled={addMutation.isPending} className="gap-1.5">
                {addMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Add Entry
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-end pt-1">
            <Button onClick={() => setShowForm(true)} className="gap-1.5">
              <Plus className="w-4 h-4" />
              Add New Investment
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
