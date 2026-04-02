import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import StatCard from "@/components/StatCard";
import AddInvestorDialog from "@/components/AddInvestorDialog";
import EditStartupDialog from "@/components/EditStartupDialog";
import EditInvestorDialog from "@/components/EditInvestorDialog";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/lib/mock-data";
import { DollarSign, TrendingUp, Users, ArrowLeft, Percent, Pencil, Trash2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

export default function StartupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();

  const [editStartupOpen, setEditStartupOpen] = useState(false);
  const [deleteStartupOpen, setDeleteStartupOpen] = useState(false);
  const [editingInvestor, setEditingInvestor] = useState<any | null>(null);
  const [deletingInvestorId, setDeletingInvestorId] = useState<string | null>(null);

  const { data: startup, isLoading: loadingStartup } = useQuery({
    queryKey: ["startup", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("startups").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: investors = [], isLoading: loadingInvestors } = useQuery({
    queryKey: ["startup-investors", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("startup_investors").select("*").eq("startup_id", id!).eq("archived", false).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const addInvestorMutation = useMutation({
    mutationFn: async (investor: { investor_name: string; email: string; amount_invested: number; equity_percentage: number; investment_date: string; notes: string }) => {
      const { error } = await supabase.from("startup_investors").insert({ startup_id: id!, ...investor, email: investor.email || null, notes: investor.notes || null });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["startup-investors", id] }),
  });

  const updateStartupMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; sector: string; stage: string; invested: number; current_value: number; description: string; progress: number }) => {
      const { error } = await supabase.from("startups").update({ name: data.name, sector: data.sector, stage: data.stage, invested: data.invested, current_value: data.current_value, description: data.description || null, progress: data.progress }).eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["startup", id] }),
  });

  const deleteStartupMutation = useMutation({
    mutationFn: async () => {
      const { error: invErr } = await supabase.from("startup_investors").delete().eq("startup_id", id!);
      if (invErr) throw invErr;
      const { error } = await supabase.from("startups").delete().eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Startup deleted");
      queryClient.invalidateQueries({ queryKey: ["startups"] });
      navigate("/startups");
    },
  });

  const updateInvestorMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("startup_investors").update({ investor_name: data.investor_name, email: data.email, amount_invested: data.amount_invested, equity_percentage: data.equity_percentage, investment_date: data.investment_date, notes: data.notes }).eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["startup-investors", id] }); setEditingInvestor(null); },
  });

  const deleteInvestorMutation = useMutation({
    mutationFn: async (investorId: string) => {
      const { error } = await supabase.from("startup_investors").delete().eq("id", investorId);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["startup-investors", id] }); toast.success("Investor deleted"); setDeletingInvestorId(null); },
  });

  if (loadingStartup) return <Layout><p className="text-muted-foreground">Loading...</p></Layout>;
  if (!startup) return <Layout><p className="text-muted-foreground">Startup not found.</p></Layout>;

  const roi = ((Number(startup.current_value) - Number(startup.invested)) / Number(startup.invested)) * 100;
  const totalFromInvestors = investors.reduce((sum, inv) => sum + Number(inv.amount_invested), 0);
  const totalEquity = investors.reduce((sum, inv) => sum + Number(inv.equity_percentage), 0);

  const statusStyles: Record<string, string> = {
    "on-track": "bg-primary/10 text-primary",
    "at-risk": "bg-warning/10 text-warning",
    outperforming: "bg-accent/10 text-accent",
  };

  return (
    <Layout>
      <Link to="/startups" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Startups
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="font-display text-2xl font-bold">{startup.name}</h2>
            <span className={`text-xs px-2.5 py-1 rounded-full ${statusStyles[startup.status] || ""}`}>
              {startup.status.replace("-", " ")}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{startup.sector} · {startup.stage}</p>
          {startup.description && <p className="text-sm text-muted-foreground mt-2">{startup.description}</p>}
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditStartupOpen(true)}>
              <Pencil className="w-3.5 h-3.5" /> Edit
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={() => setDeleteStartupOpen(true)}>
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </Button>
            <AddInvestorDialog onAdd={(data) => addInvestorMutation.mutate(data)} isSubmitting={addInvestorMutation.isPending} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={DollarSign} title="Total Invested" value={formatCurrency(Number(startup.invested))} />
        <StatCard icon={TrendingUp} title="Current Value" value={formatCurrency(Number(startup.current_value))} change={`ROI: ${roi >= 0 ? "+" : ""}${roi.toFixed(1)}%`} changeType={roi >= 0 ? "positive" : "negative"} />
        <StatCard icon={Users} title="Investors" value={String(investors.length)} />
        <StatCard icon={Percent} title="Total Equity Allocated" value={`${totalEquity.toFixed(1)}%`} change={totalEquity > 0 ? `${(100 - totalEquity).toFixed(1)}% remaining` : "No equity allocated"} changeType="neutral" />
      </div>

      <div className="glass-card rounded-xl p-6 mb-8 animate-fade-in">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-semibold">Milestone Progress</h3>
          <span className="text-sm font-medium">{startup.progress}%</span>
        </div>
        <Progress value={startup.progress} className="h-2" />
      </div>

      <div className="glass-card rounded-xl overflow-hidden animate-fade-in">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="font-display font-semibold">Investor Breakdown</h3>
          {totalFromInvestors > 0 && <span className="text-sm text-muted-foreground">Total: {formatCurrency(totalFromInvestors)}</span>}
        </div>
        {loadingInvestors ? (
          <p className="p-6 text-muted-foreground text-sm">Loading investors...</p>
        ) : investors.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No investors added yet.</p>
            <p className="text-muted-foreground text-xs mt-1">Click "Add Investor" to track who has invested.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Investor</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">Amount</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">Equity</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">Date</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">Notes</th>
                {isAdmin && <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {investors.map((inv) => (
                <tr key={inv.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                        {inv.investor_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="text-sm font-medium">{inv.investor_name}</span>
                        {inv.email && <p className="text-xs text-muted-foreground">{inv.email}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">{formatCurrency(Number(inv.amount_invested))}</td>
                  <td className="px-6 py-4 text-right text-sm">{Number(inv.equity_percentage)}%</td>
                  <td className="px-6 py-4 text-right text-sm text-muted-foreground">
                    {new Date(inv.investment_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-muted-foreground max-w-[200px] truncate">{inv.notes || "—"}</td>
                  {isAdmin && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingInvestor(inv)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeletingInvestorId(inv.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Startup Dialog */}
      <EditStartupDialog
        open={editStartupOpen}
        onOpenChange={setEditStartupOpen}
        startup={{ id: startup.id, name: startup.name, sector: startup.sector, stage: startup.stage, invested: Number(startup.invested), current_value: Number(startup.current_value), description: startup.description, progress: startup.progress }}
        onSave={(data) => updateStartupMutation.mutate(data)}
        isSubmitting={updateStartupMutation.isPending}
      />

      {/* Delete Startup Dialog */}
      <ConfirmDeleteDialog
        open={deleteStartupOpen}
        onOpenChange={setDeleteStartupOpen}
        title="Delete Startup"
        description={`Are you sure you want to delete "${startup.name}"? This will also remove all associated investors. This action cannot be undone.`}
        onConfirm={() => deleteStartupMutation.mutate()}
        isDeleting={deleteStartupMutation.isPending}
      />

      {/* Edit Investor Dialog */}
      {editingInvestor && (
        <EditInvestorDialog
          open={!!editingInvestor}
          onOpenChange={(open) => { if (!open) setEditingInvestor(null); }}
          investor={editingInvestor}
          onSave={(data) => updateInvestorMutation.mutate(data)}
          isSubmitting={updateInvestorMutation.isPending}
        />
      )}

      {/* Delete Investor Dialog */}
      <ConfirmDeleteDialog
        open={!!deletingInvestorId}
        onOpenChange={(open) => { if (!open) setDeletingInvestorId(null); }}
        title="Delete Investor"
        description="Are you sure you want to remove this investor? This action cannot be undone."
        onConfirm={() => deletingInvestorId && deleteInvestorMutation.mutate(deletingInvestorId)}
        isDeleting={deleteInvestorMutation.isPending}
      />
    </Layout>
  );
}
