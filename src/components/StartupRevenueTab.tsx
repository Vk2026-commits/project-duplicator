import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2, TrendingUp, DollarSign, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";

interface RevenueEntry {
  id: string;
  startup_id: string;
  entry_date: string;
  gross_sales: number;
  profit_margin: number;
  profit: number;
  notes: string | null;
}

interface StartupRevenueTabProps {
  startupId: string;
  startupName: string;
}

function AddEditRevenueDialog({
  open,
  onOpenChange,
  onSave,
  isSubmitting,
  initial,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSave: (d: { entry_date: string; gross_sales: number; profit_margin: number; notes: string }) => void;
  isSubmitting: boolean;
  initial?: RevenueEntry | null;
}) {
  const [date, setDate] = useState(initial?.entry_date || new Date().toISOString().split("T")[0]);
  const [grossSales, setGrossSales] = useState(String(initial?.gross_sales ?? ""));
  const [profitMargin, setProfitMargin] = useState(String(initial?.profit_margin ?? "33"));
  const [notes, setNotes] = useState(initial?.notes || "");

  const calculatedProfit = (Number(grossSales) || 0) * ((Number(profitMargin) || 0) / 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Revenue Entry" : "Add Revenue Entry"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label>Gross Sales ($)</Label>
            <Input type="number" min="0" step="0.01" value={grossSales} onChange={(e) => setGrossSales(e.target.value)} placeholder="0.00" />
          </div>
          <div>
            <Label>Profit Margin (%)</Label>
            <Input type="number" min="0" max="100" step="0.1" value={profitMargin} onChange={(e) => setProfitMargin(e.target.value)} placeholder="33" />
          </div>
          <div className="p-3 rounded-lg bg-secondary/30">
            <span className="text-xs text-muted-foreground">Calculated Profit</span>
            <p className="text-lg font-bold text-primary">{formatCurrency(calculatedProfit)}</p>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={isSubmitting || !date || !grossSales}
            onClick={() => onSave({ entry_date: date, gross_sales: Number(grossSales), profit_margin: Number(profitMargin), notes })}
          >
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function getQuarter(month: number) {
  return Math.floor(month / 3) + 1;
}

interface GroupedData {
  [year: string]: {
    [quarter: string]: {
      [month: string]: RevenueEntry[];
    };
  };
}

function groupRevenue(entries: RevenueEntry[]): GroupedData {
  const grouped: GroupedData = {};
  for (const entry of entries) {
    const d = new Date(entry.entry_date);
    const year = String(d.getFullYear());
    const month = d.getMonth();
    const quarter = `Q${getQuarter(month)}`;
    const monthName = MONTHS[month];
    if (!grouped[year]) grouped[year] = {};
    if (!grouped[year][quarter]) grouped[year][quarter] = {};
    if (!grouped[year][quarter][monthName]) grouped[year][quarter][monthName] = [];
    grouped[year][quarter][monthName].push(entry);
  }
  // Sort days within each month
  for (const year of Object.keys(grouped)) {
    for (const q of Object.keys(grouped[year])) {
      for (const m of Object.keys(grouped[year][q])) {
        grouped[year][q][m].sort((a, b) => a.entry_date.localeCompare(b.entry_date));
      }
    }
  }
  return grouped;
}

function sumEntries(entries: RevenueEntry[]) {
  return entries.reduce(
    (acc, e) => ({ grossSales: acc.grossSales + Number(e.gross_sales), profit: acc.profit + Number(e.profit) }),
    { grossSales: 0, profit: 0 }
  );
}

function flattenGroup(group: { [month: string]: RevenueEntry[] }): RevenueEntry[] {
  return Object.values(group).flat();
}

function flattenYear(yearGroup: { [quarter: string]: { [month: string]: RevenueEntry[] } }): RevenueEntry[] {
  return Object.values(yearGroup).flatMap((q) => Object.values(q).flat());
}

export default function StartupRevenueTab({ startupId, startupName }: StartupRevenueTabProps) {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<RevenueEntry | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());
  const [expandedQuarters, setExpandedQuarters] = useState<Set<string>>(new Set());
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  const toggle = (set: Set<string>, key: string, setter: (s: Set<string>) => void) => {
    const next = new Set(set);
    next.has(key) ? next.delete(key) : next.add(key);
    setter(next);
  };

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["startup-revenue", startupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("startup_revenue")
        .select("*")
        .eq("startup_id", startupId)
        .order("entry_date", { ascending: false });
      if (error) throw error;
      return data as RevenueEntry[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (d: { entry_date: string; gross_sales: number; profit_margin: number; notes: string }) => {
      const profit = d.gross_sales * (d.profit_margin / 100);
      const { error } = await supabase.from("startup_revenue").insert({
        startup_id: startupId,
        entry_date: d.entry_date,
        gross_sales: d.gross_sales,
        profit_margin: d.profit_margin,
        profit,
        notes: d.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["startup-revenue", startupId] });
      toast.success("Revenue entry added");
      setAddOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (d: { id: string; entry_date: string; gross_sales: number; profit_margin: number; notes: string }) => {
      const profit = d.gross_sales * (d.profit_margin / 100);
      const { error } = await supabase.from("startup_revenue").update({
        entry_date: d.entry_date,
        gross_sales: d.gross_sales,
        profit_margin: d.profit_margin,
        profit,
        notes: d.notes || null,
      }).eq("id", d.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["startup-revenue", startupId] });
      toast.success("Revenue entry updated");
      setEditingEntry(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("startup_revenue").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["startup-revenue", startupId] });
      toast.success("Revenue entry deleted");
      setDeletingId(null);
    },
  });

  const totals = sumEntries(entries);
  const grouped = groupRevenue(entries);
  const years = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  if (isLoading) return <p className="text-muted-foreground text-sm p-4">Loading revenue data...</p>;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-5 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-primary/10"><DollarSign className="w-5 h-5 text-primary" /></div>
          <div>
            <p className="text-xs text-muted-foreground">Total Gross Sales</p>
            <p className="text-lg font-bold">{formatCurrency(totals.grossSales)}</p>
          </div>
        </div>
        <div className="glass-card rounded-xl p-5 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-accent/10"><TrendingUp className="w-5 h-5 text-accent" /></div>
          <div>
            <p className="text-xs text-muted-foreground">Total Profit</p>
            <p className="text-lg font-bold">{formatCurrency(totals.profit)}</p>
          </div>
        </div>
        <div className="glass-card rounded-xl p-5 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-secondary"><BarChart3 className="w-5 h-5 text-muted-foreground" /></div>
          <div>
            <p className="text-xs text-muted-foreground">Entries</p>
            <p className="text-lg font-bold">{entries.length}</p>
          </div>
        </div>
      </div>

      {/* Add button */}
      {isAdmin && (
        <div className="flex justify-end">
          <Button onClick={() => setAddOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Add Revenue Entry
          </Button>
        </div>
      )}

      {/* Grouped display */}
      {entries.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center">
          <BarChart3 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No revenue entries yet.</p>
          {isAdmin && <p className="text-muted-foreground text-xs mt-1">Click "Add Revenue Entry" to start tracking sales.</p>}
        </div>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden">
          {years.map((year) => {
            const yearKey = year;
            const yearEntries = flattenYear(grouped[year]);
            const yearTotals = sumEntries(yearEntries);
            const isYearOpen = expandedYears.has(yearKey);
            const quarters = Object.keys(grouped[year]).sort();

            return (
              <div key={year} className="border-b border-border last:border-0">
                <button
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-secondary/30 transition-colors"
                  onClick={() => toggle(expandedYears, yearKey, setExpandedYears)}
                >
                  <div className="flex items-center gap-2">
                    {isYearOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    <span className="font-display font-semibold text-lg">{year}</span>
                    <span className="text-xs text-muted-foreground ml-2">({yearEntries.length} entries)</span>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <span>Sales: <strong>{formatCurrency(yearTotals.grossSales)}</strong></span>
                    <span>Profit: <strong className="text-primary">{formatCurrency(yearTotals.profit)}</strong></span>
                  </div>
                </button>

                {isYearOpen && quarters.map((quarter) => {
                  const qKey = `${year}-${quarter}`;
                  const qEntries = flattenGroup(grouped[year][quarter]);
                  const qTotals = sumEntries(qEntries);
                  const isQOpen = expandedQuarters.has(qKey);
                  const months = Object.keys(grouped[year][quarter]).sort((a, b) => MONTHS.indexOf(a) - MONTHS.indexOf(b));

                  return (
                    <div key={qKey} className="border-t border-border/50">
                      <button
                        className="w-full flex items-center justify-between px-8 py-3 hover:bg-secondary/20 transition-colors"
                        onClick={() => toggle(expandedQuarters, qKey, setExpandedQuarters)}
                      >
                        <div className="flex items-center gap-2">
                          {isQOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          <span className="font-medium">{quarter}</span>
                          <span className="text-xs text-muted-foreground">({qEntries.length} entries)</span>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <span>Sales: {formatCurrency(qTotals.grossSales)}</span>
                          <span>Profit: <span className="text-primary">{formatCurrency(qTotals.profit)}</span></span>
                        </div>
                      </button>

                      {isQOpen && months.map((month) => {
                        const mKey = `${qKey}-${month}`;
                        const mEntries = grouped[year][quarter][month];
                        const mTotals = sumEntries(mEntries);
                        const isMOpen = expandedMonths.has(mKey);

                        return (
                          <div key={mKey} className="border-t border-border/30">
                            <button
                              className="w-full flex items-center justify-between px-10 py-2.5 hover:bg-secondary/10 transition-colors"
                              onClick={() => toggle(expandedMonths, mKey, setExpandedMonths)}
                            >
                              <div className="flex items-center gap-2">
                                {isMOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                <span className="text-sm font-medium">{month}</span>
                                <span className="text-xs text-muted-foreground">({mEntries.length})</span>
                              </div>
                              <div className="flex items-center gap-6 text-xs">
                                <span>Sales: {formatCurrency(mTotals.grossSales)}</span>
                                <span>Profit: <span className="text-primary">{formatCurrency(mTotals.profit)}</span></span>
                              </div>
                            </button>

                            {isMOpen && (
                              <div className="px-12 pb-3">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b border-border/30">
                                      <th className="text-left text-xs font-medium text-muted-foreground py-2">Date</th>
                                      <th className="text-right text-xs font-medium text-muted-foreground py-2">Gross Sales</th>
                                      <th className="text-right text-xs font-medium text-muted-foreground py-2">Margin</th>
                                      <th className="text-right text-xs font-medium text-muted-foreground py-2">Profit</th>
                                      <th className="text-right text-xs font-medium text-muted-foreground py-2">Notes</th>
                                      {isAdmin && <th className="text-right text-xs font-medium text-muted-foreground py-2">Actions</th>}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {mEntries.map((entry) => (
                                      <tr key={entry.id} className="border-b border-border/20 hover:bg-secondary/10">
                                        <td className="py-2">
                                          {new Date(entry.entry_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                        </td>
                                        <td className="py-2 text-right font-medium">{formatCurrency(Number(entry.gross_sales))}</td>
                                        <td className="py-2 text-right">{Number(entry.profit_margin)}%</td>
                                        <td className="py-2 text-right text-primary font-medium">{formatCurrency(Number(entry.profit))}</td>
                                        <td className="py-2 text-right text-muted-foreground max-w-[150px] truncate">{entry.notes || "—"}</td>
                                        {isAdmin && (
                                          <td className="py-2 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingEntry(entry)}>
                                                <Pencil className="w-3 h-3" />
                                              </Button>
                                              <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => setDeletingId(entry.id)}>
                                                <Trash2 className="w-3 h-3" />
                                              </Button>
                                            </div>
                                          </td>
                                        )}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* Dialogs */}
      <AddEditRevenueDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSave={(d) => addMutation.mutate(d)}
        isSubmitting={addMutation.isPending}
      />

      {editingEntry && (
        <AddEditRevenueDialog
          open={!!editingEntry}
          onOpenChange={(o) => { if (!o) setEditingEntry(null); }}
          onSave={(d) => updateMutation.mutate({ id: editingEntry.id, ...d })}
          isSubmitting={updateMutation.isPending}
          initial={editingEntry}
        />
      )}

      <ConfirmDeleteDialog
        open={!!deletingId}
        onOpenChange={(o) => { if (!o) setDeletingId(null); }}
        title="Delete Revenue Entry"
        description="Are you sure you want to delete this revenue entry? This action cannot be undone."
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}
