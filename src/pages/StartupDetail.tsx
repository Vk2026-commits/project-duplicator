import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import StatCard from "@/components/StatCard";
import AddInvestorDialog from "@/components/AddInvestorDialog";
import EditStartupDialog from "@/components/EditStartupDialog";
import EditInvestorDialog from "@/components/EditInvestorDialog";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import StartupAboutTab from "@/components/StartupAboutTab";
import StartupRevenueTab from "@/components/StartupRevenueTab";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/lib/mock-data";
import { DollarSign, TrendingUp, Users, ArrowLeft, Percent, Pencil, Trash2, Check, X } from "lucide-react";
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
  const [editingEquityId, setEditingEquityId] = useState<string | null>(null);
  const [editingEquityValue, setEditingEquityValue] = useState("");

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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["startup-investors", id] }); queryClient.invalidateQueries({ queryKey: ["startup", id] }); },
  });

  const updateStartupMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; sector: string; stage: string; invested: number; current_value: number; description: string; progress: number; funding_goal: number }) => {
      const { error } = await supabase.from("startups").update({ name: data.name, sector: data.sector, stage: data.stage, invested: data.invested, current_value: data.current_value, description: data.description || null, progress: data.progress, funding_goal: data.funding_goal }).eq("id", data.id);
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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["startup-investors", id] }); queryClient.invalidateQueries({ queryKey: ["startup", id] }); setEditingInvestor(null); },
  });

  const updateEquityMutation = useMutation({
    mutationFn: async ({ investorId, equity }: { investorId: string; equity: number }) => {
      const { error } = await supabase.from("startup_investors").update({ equity_percentage: equity }).eq("id", investorId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["startup-investors", id] });
      setEditingEquityId(null);
      toast.success("Equity updated");
    },
  });

  const deleteInvestorMutation = useMutation({
    mutationFn: async (investorId: string) => {
      const { error } = await supabase.from("startup_investors").delete().eq("id", investorId);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["startup-investors", id] }); toast.success("Investor deleted"); setDeletingInvestorId(null); },
  });

  const handleEquitySave = (investorId: string) => {
    const val = parseFloat(editingEquityValue);
    if (isNaN(val) || val < 0 || val > 100) {
      toast.error("Equity must be between 0 and 100%");
      return;
    }
    const otherEquity = investors.filter(i => i.id !== investorId).reduce((s, i) => s + Number(i.equity_percentage), 0);
    if (otherEquity + val > 100) {
      toast.error(`Only ${(100 - otherEquity).toFixed(2)}% equity remaining`);
      return;
    }
    updateEquityMutation.mutate({ investorId, equity: val });
  };

  if (loadingStartup) return <Layout><p className="text-muted-foreground">Loading...</p></Layout>;
  if (!startup) return <Layout><p className="text-muted-foreground">Startup not found.</p></Layout>;

  const roi = ((Number(startup.current_value) - Number(startup.invested)) / Number(startup.invested)) * 100;
  const totalFromInvestors = investors.reduce((sum, inv) => sum + Number(inv.amount_invested), 0);
  const totalEquity = investors.reduce((sum, inv) => sum + Number(inv.equity_percentage), 0);
  const fundingGoal = Number(startup.funding_goal);

  return (
    <Layout>
      <Link to="/startups" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Startups
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="font-display text-2xl font-bold">{startup.name}</h2>
          <p className="text-sm text-muted-foreground">{startup.sector} · {startup.stage}</p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditStartupOpen(true)}>
              <Pencil className="w-3.5 h-3.5" /> Edit
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={() => setDeleteStartupOpen(true)}>
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </Button>
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={DollarSign} title="Total Invested" value={formatCurrency(Number(startup.invested))} />
        <StatCard icon={TrendingUp} title="Current Value" value={formatCurrency(Number(startup.current_value))} change={`ROI: ${roi >= 0 ? "+" : ""}${roi.toFixed(1)}%`} changeType={roi >= 0 ? "positive" : "negative"} />
        <StatCard icon={Users} title="Investors" value={String(investors.length)} />
        <StatCard icon={Percent} title="Equity Allocated" value={`${totalEquity.toFixed(1)}% / 100%`} change={`${(100 - totalEquity).toFixed(1)}% available`} changeType={totalEquity > 100 ? "negative" : "neutral"} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="about" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="investors">Investors</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>

        <TabsContent value="about">
          <StartupAboutTab startup={startup} />
        </TabsContent>

        <TabsContent value="investors">
          <div className="space-y-4 animate-fade-in">
            {isAdmin && (
              <div className="flex justify-end gap-2">
                {fundingGoal > 0 && investors.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={async () => {
                      const updates = investors.map(inv => ({
                        id: inv.id,
                        equity: Math.round(((Number(inv.amount_invested) / fundingGoal) * 100) * 100) / 100,
                      }));
                      const totalCalc = updates.reduce((s, u) => s + u.equity, 0);
                      if (totalCalc > 100) {
                        toast.error("Recalculated equity exceeds 100%. Adjust funding goal or investments.");
                        return;
                      }
                      for (const u of updates) {
                        const { error } = await supabase.from("startup_investors").update({ equity_percentage: u.equity }).eq("id", u.id);
                        if (error) { toast.error("Failed to update equity"); return; }
                      }
                      queryClient.invalidateQueries({ queryKey: ["startup-investors", id] });
                      toast.success("All equity recalculated from investments vs funding goal");
                    }}
                  >
                    <Percent className="w-3.5 h-3.5" /> Recalculate Equity
                  </Button>
                )}
                <AddInvestorDialog
                  onAdd={(data) => addInvestorMutation.mutate(data)}
                  isSubmitting={addInvestorMutation.isPending}
                  fundingGoal={fundingGoal}
                  totalEquityAllocated={totalEquity}
                />
              </div>
            )}
            <div className="glass-card rounded-xl overflow-hidden">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h3 className="font-display font-semibold">Investor Breakdown</h3>
                <div className="flex items-center gap-4">
                  {totalFromInvestors > 0 && <span className="text-sm text-muted-foreground">Total: {formatCurrency(totalFromInvestors)}</span>}
                  <span className="text-sm font-medium text-primary">{(100 - totalEquity).toFixed(1)}% equity available</span>
                </div>
              </div>
              {loadingInvestors ? (
                <p className="p-6 text-muted-foreground text-sm">Loading investors...</p>
              ) : investors.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">No investors added yet.</p>
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
                              {inv.investor_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span className="text-sm font-medium">{inv.investor_name}</span>
                              {inv.email && <p className="text-xs text-muted-foreground">{inv.email}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium">{formatCurrency(Number(inv.amount_invested))}</td>
                        <td className="px-6 py-4 text-right text-sm">
                          {editingEquityId === inv.id ? (
                            <div className="flex items-center justify-end gap-1">
                              <Input
                                type="number"
                                value={editingEquityValue}
                                onChange={(e) => setEditingEquityValue(e.target.value)}
                                className="w-20 h-7 text-right text-sm"
                                min="0"
                                max="100"
                                step="any"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleEquitySave(inv.id);
                                  if (e.key === "Escape") setEditingEquityId(null);
                                }}
                              />
                              <span className="text-xs">%</span>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-green-600" onClick={() => handleEquitySave(inv.id)}>
                                <Check className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingEquityId(null)}>
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1">
                              <span>{Number(inv.equity_percentage)}%</span>
                              {isAdmin && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => {
                                    setEditingEquityId(inv.id);
                                    setEditingEquityValue(String(inv.equity_percentage));
                                  }}
                                >
                                  <Pencil className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          )}
                        </td>
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
          </div>
        </TabsContent>

        <TabsContent value="revenue">
          <StartupRevenueTab startupId={id!} startupName={startup.name} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <EditStartupDialog
        open={editStartupOpen}
        onOpenChange={setEditStartupOpen}
        startup={{ id: startup.id, name: startup.name, sector: startup.sector, stage: startup.stage, invested: Number(startup.invested), current_value: Number(startup.current_value), description: startup.description, progress: startup.progress, funding_goal: Number(startup.funding_goal) }}
        onSave={(data) => updateStartupMutation.mutate(data)}
        isSubmitting={updateStartupMutation.isPending}
        investorTotal={investors.reduce((sum, inv) => sum + Number(inv.amount_invested), 0)}
      />
      <ConfirmDeleteDialog
        open={deleteStartupOpen}
        onOpenChange={setDeleteStartupOpen}
        title="Delete Startup"
        description={`Are you sure you want to delete "${startup.name}"? This will also remove all associated investors. This action cannot be undone.`}
        onConfirm={() => deleteStartupMutation.mutate()}
        isDeleting={deleteStartupMutation.isPending}
      />
      {editingInvestor && (
        <EditInvestorDialog
          open={!!editingInvestor}
          onOpenChange={(open) => { if (!open) setEditingInvestor(null); }}
          investor={editingInvestor}
          onSave={(data) => updateInvestorMutation.mutate(data)}
          isSubmitting={updateInvestorMutation.isPending}
        />
      )}
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
