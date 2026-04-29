import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, DollarSign, Wallet, PiggyBank, TrendingUp, Users, AlertTriangle, Trash2 } from "lucide-react";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";

function formatCurrency(val: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);
}

export default function Contributions() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ user_id: "", amount: "", contribution_date: "", notes: "" });
  const [deletingContribId, setDeletingContribId] = useState<string | null>(null);

  if (!isAdmin) {
    return (
      <Layout>
        <div className="text-center py-16">
          <AlertTriangle className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">You don't have permission to view this page.</p>
        </div>
      </Layout>
    );
  }

  // Fetch contributions
  const { data: contributions = [], isLoading } = useQuery({
    queryKey: ["contributions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("member_contributions" as any)
        .select("*")
        .order("contribution_date", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
  });

  // Fetch profiles
  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, full_name");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch total allocated (invested in startups)
  const { data: totalAllocated = 0 } = useQuery({
    queryKey: ["total-allocated"],
    queryFn: async () => {
      const { data, error } = await supabase.from("startups").select("invested");
      if (error) throw error;
      return (data || []).reduce((sum, s) => sum + Number(s.invested), 0);
    },
    enabled: !!user,
  });

  const profileMap = Object.fromEntries(profiles.map((p) => [p.id, p.full_name || "Unknown"]));

  // Calculate stats
  const totalCapital = contributions.reduce((sum: number, c: any) => sum + Number(c.amount), 0);
  const availableFunds = totalCapital - totalAllocated;

  // Per-member breakdown
  const memberTotals = contributions.reduce((acc: Record<string, number>, c: any) => {
    acc[c.user_id] = (acc[c.user_id] || 0) + Number(c.amount);
    return acc;
  }, {});

  // Add contribution mutation
  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("member_contributions" as any).insert({
        user_id: form.user_id,
        amount: parseFloat(form.amount),
        contribution_date: form.contribution_date || new Date().toISOString().split("T")[0],
        notes: form.notes || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contributions"] });
      setAddOpen(false);
      setForm({ user_id: "", amount: "", contribution_date: "", notes: "" });
      toast.success("Contribution recorded!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Delete
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("member_contributions" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contributions"] });
      toast.success("Contribution removed.");
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Please sign in to view contributions.</p>
        </div>
      </Layout>
    );
  }

  const allocationPct = totalCapital > 0 ? (totalAllocated / totalCapital) * 100 : 0;

  return (
    <Layout>
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-display text-2xl sm:text-3xl font-bold">Capital & Contributions</h2>
          <p className="text-sm text-muted-foreground mt-1">Track member contributions and group capital pool</p>
        </div>
        {isAdmin && (
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground">
                <Plus className="w-4 h-4 mr-1" /> Record Contribution
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Member Contribution</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); addMutation.mutate(); }} className="space-y-4">
                <div className="space-y-2">
                  <Label>Member *</Label>
                  <Select value={form.user_id} onValueChange={(v) => setForm({ ...form, user_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                    <SelectContent>
                      {profiles.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.full_name || p.id}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Amount ($) *</Label>
                    <Input type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" value={form.contribution_date} onChange={(e) => setForm({ ...form, contribution_date: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="e.g. Monthly dues, seed capital" />
                </div>
                <Button type="submit" className="w-full" disabled={addMutation.isPending || !form.user_id || !form.amount}>
                  {addMutation.isPending ? "Saving..." : "Record Contribution"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Capital Pool Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6 sm:mb-8">
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <PiggyBank className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Total Group Capital</p>
          </div>
          <p className="font-display text-2xl font-bold">{formatCurrency(totalCapital)}</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-accent" />
            </div>
            <p className="text-sm text-muted-foreground">Allocated Funds</p>
          </div>
          <p className="font-display text-2xl font-bold">{formatCurrency(totalAllocated)}</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-[hsl(var(--warning))]/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-[hsl(var(--warning))]" />
            </div>
            <p className="text-sm text-muted-foreground">Available Funds</p>
          </div>
          <p className="font-display text-2xl font-bold">{formatCurrency(Math.max(0, availableFunds))}</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Contributing Members</p>
          </div>
          <p className="font-display text-2xl font-bold">{Object.keys(memberTotals).length}</p>
        </Card>
      </div>

      {/* Allocation bar */}
      <Card className="p-5 mb-8">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium">Capital Allocation</p>
          <p className="text-xs text-muted-foreground">{allocationPct.toFixed(1)}% allocated</p>
        </div>
        <Progress value={allocationPct} className="h-3" />
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>Allocated: {formatCurrency(totalAllocated)}</span>
          <span>Available: {formatCurrency(Math.max(0, availableFunds))}</span>
        </div>
      </Card>

      {/* Member Breakdown */}
      <h3 className="font-display text-lg font-semibold mb-4">Member Breakdown</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {Object.entries(memberTotals)
          .sort(([, a], [, b]) => (b as number) - (a as number))
          .map(([uid, total]) => {
            const pct = totalCapital > 0 ? ((total as number) / totalCapital) * 100 : 0;
            return (
              <Card key={uid} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-sm">{profileMap[uid] || "Unknown"}</p>
                  <Badge variant="secondary">{pct.toFixed(1)}% ownership</Badge>
                </div>
                <p className="font-display font-bold text-lg">{formatCurrency(total as number)}</p>
                <Progress value={pct} className="h-1.5 mt-2" />
              </Card>
            );
          })}
      </div>

      {/* Contribution History */}
      <h3 className="font-display text-lg font-semibold mb-4">Contribution History</h3>
      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : contributions.length === 0 ? (
        <Card className="p-8 text-center">
          <DollarSign className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No contributions recorded yet.</p>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Notes</TableHead>
                {isAdmin && <TableHead className="w-20">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {contributions.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{profileMap[c.user_id] || "Unknown"}</TableCell>
                  <TableCell>{formatCurrency(Number(c.amount))}</TableCell>
                  <TableCell>{format(new Date(c.contribution_date), "MMM d, yyyy")}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{c.notes || "—"}</TableCell>
                  {isAdmin && (
                    <TableCell>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeletingContribId(c.id)}>
                        Remove
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Legal notice */}
      <div className="mt-8 border border-border rounded-lg p-4 bg-secondary/30">
        <p className="text-xs text-muted-foreground text-center">
          <strong>No Fees Clause:</strong> The Group does not charge fees, commissions, or carry for managing investments.
          All members actively participate in investment decisions and are not passive investors.
        </p>
      </div>
      <ConfirmDeleteDialog
        open={!!deletingContribId}
        onOpenChange={(o) => { if (!o) setDeletingContribId(null); }}
        title="Delete Contribution"
        description="Are you sure you want to delete this contribution? This action cannot be undone."
        onConfirm={() => deletingContribId && deleteMutation.mutate(deletingContribId)}
        isDeleting={deleteMutation.isPending}
      />
    </Layout>
  );
}
