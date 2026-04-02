import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, ThumbsUp, ThumbsDown, Clock, CheckCircle, XCircle, FileText, AlertTriangle, Shield } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const APPROVAL_THRESHOLD = 0.7;

const riskColors: Record<string, string> = {
  low: "bg-accent/20 text-accent",
  medium: "bg-warning/20 text-[hsl(var(--warning))]",
  high: "bg-destructive/20 text-destructive",
  very_high: "bg-destructive/30 text-destructive",
};

const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
  pending: { icon: Clock, label: "Pending Vote", color: "text-[hsl(var(--warning))]" },
  approved: { icon: CheckCircle, label: "Approved", color: "text-accent" },
  rejected: { icon: XCircle, label: "Rejected", color: "text-destructive" },
};

function formatCurrency(val: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);
}

export default function Deals() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [submitOpen, setSubmitOpen] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", investment_required: "", expected_return: "",
    risk_level: "medium", risk_factors: "", supporting_docs: "",
  });

  // Fetch deals
  const { data: deals = [], isLoading } = useQuery({
    queryKey: ["deals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deals" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
  });

  // Fetch all votes
  const { data: allVotes = [] } = useQuery({
    queryKey: ["deal-votes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deal_votes" as any)
        .select("*");
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
  });

  // Fetch all profiles for submitted_by names
  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, full_name");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Total member count for voting threshold
  const { data: memberCount = 0 } = useQuery({
    queryKey: ["member-count"],
    queryFn: async () => {
      const { count, error } = await supabase.from("profiles").select("id", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user,
  });

  const profileMap = Object.fromEntries(profiles.map((p) => [p.id, p.full_name || "Unknown"]));

  // Submit deal
  const submitMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("deals" as any).insert({
        title: form.title,
        description: form.description,
        investment_required: parseFloat(form.investment_required) || 0,
        expected_return: form.expected_return || null,
        risk_level: form.risk_level,
        risk_factors: form.risk_factors || null,
        supporting_docs: form.supporting_docs || null,
        submitted_by: user!.id,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      setSubmitOpen(false);
      setForm({ title: "", description: "", investment_required: "", expected_return: "", risk_level: "medium", risk_factors: "", supporting_docs: "" });
      toast.success("Deal submitted for review!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Cast vote
  const voteMutation = useMutation({
    mutationFn: async ({ dealId, vote }: { dealId: string; vote: string }) => {
      const { error } = await supabase.from("deal_votes" as any).upsert(
        { deal_id: dealId, user_id: user!.id, vote } as any,
        { onConflict: "deal_id,user_id" }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deal-votes"] });
      toast.success("Vote recorded!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Admin: finalize deal
  const finalizeMutation = useMutation({
    mutationFn: async ({ dealId, status }: { dealId: string; status: string }) => {
      const { error } = await supabase.from("deals" as any).update({ status } as any).eq("id", dealId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      toast.success("Deal status updated.");
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Please sign in to view deals.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold">Deal Review</h2>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Internal review only — not a public offering
          </p>
        </div>
        <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-1" /> Submit Deal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Submit an Investment Opportunity</DialogTitle>
            </DialogHeader>
            <p className="text-xs text-muted-foreground flex items-center gap-1 -mt-2 mb-2">
              <AlertTriangle className="w-3 h-3" /> Internal review only — not a public offering
            </p>
            <form onSubmit={(e) => { e.preventDefault(); submitMutation.mutate(); }} className="space-y-4">
              <div className="space-y-2">
                <Label>Deal Title *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Investment Required ($)</Label>
                  <Input type="number" min="0" step="0.01" value={form.investment_required} onChange={(e) => setForm({ ...form, investment_required: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Expected Return</Label>
                  <Input placeholder="e.g. 2x in 3 years" value={form.expected_return} onChange={(e) => setForm({ ...form, expected_return: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Risk Level</Label>
                  <Select value={form.risk_level} onValueChange={(v) => setForm({ ...form, risk_level: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="very_high">Very High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Risk Factors</Label>
                <Textarea value={form.risk_factors} onChange={(e) => setForm({ ...form, risk_factors: e.target.value })} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Supporting Documents (links)</Label>
                <Input placeholder="Paste links to docs, spreadsheets, etc." value={form.supporting_docs} onChange={(e) => setForm({ ...form, supporting_docs: e.target.value })} />
              </div>
              <Button type="submit" className="w-full" disabled={submitMutation.isPending}>
                {submitMutation.isPending ? "Submitting..." : "Submit for Group Review"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading deals...</p>
      ) : deals.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display text-lg font-semibold mb-2">No Deals Yet</h3>
          <p className="text-sm text-muted-foreground">Submit the first investment opportunity for the group to review.</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {deals.map((deal: any) => {
            const dealVotes = allVotes.filter((v: any) => v.deal_id === deal.id);
            const approvals = dealVotes.filter((v: any) => v.vote === "approve").length;
            const declines = dealVotes.filter((v: any) => v.vote === "decline").length;
            const totalVotes = dealVotes.length;
            const approvalPct = memberCount > 0 ? (approvals / memberCount) * 100 : 0;
            const myVote = dealVotes.find((v: any) => v.user_id === user.id);
            const statusCfg = statusConfig[deal.status] || statusConfig.pending;
            const StatusIcon = statusCfg.icon;

            return (
              <Card key={deal.id} className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-display text-lg font-semibold">{deal.title}</h3>
                      <Badge className={riskColors[deal.risk_level] || ""}>
                        {deal.risk_level?.replace("_", " ")} risk
                      </Badge>
                      <div className={`flex items-center gap-1 text-xs font-medium ${statusCfg.color}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {statusCfg.label}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Submitted by {profileMap[deal.submitted_by] || "Unknown"}
                    </p>
                  </div>
                  {deal.investment_required > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Investment Required</p>
                      <p className="font-display font-bold text-lg">{formatCurrency(deal.investment_required)}</p>
                    </div>
                  )}
                </div>

                <p className="text-sm text-muted-foreground">{deal.description}</p>

                {deal.expected_return && (
                  <p className="text-sm"><span className="text-muted-foreground">Expected Return:</span> {deal.expected_return}</p>
                )}
                {deal.risk_factors && (
                  <p className="text-sm"><span className="text-muted-foreground">Risk Factors:</span> {deal.risk_factors}</p>
                )}
                {deal.supporting_docs && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Docs:</span>{" "}
                    <a href={deal.supporting_docs} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      View Supporting Documents
                    </a>
                  </p>
                )}

                {/* Voting section */}
                {deal.status === "pending" && (
                  <div className="border border-border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Group Vote ({totalVotes} of {memberCount} members voted)</p>
                      <p className="text-xs text-muted-foreground">70% approval required</p>
                    </div>
                    <Progress value={approvalPct} className="h-2" />
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-accent flex items-center gap-1">
                        <ThumbsUp className="w-3.5 h-3.5" /> {approvals} Approve
                      </span>
                      <span className="text-destructive flex items-center gap-1">
                        <ThumbsDown className="w-3.5 h-3.5" /> {declines} Decline
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={myVote?.vote === "approve" ? "default" : "outline"}
                        onClick={() => voteMutation.mutate({ dealId: deal.id, vote: "approve" })}
                        disabled={voteMutation.isPending}
                      >
                        <ThumbsUp className="w-4 h-4 mr-1" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant={myVote?.vote === "decline" ? "destructive" : "outline"}
                        onClick={() => voteMutation.mutate({ dealId: deal.id, vote: "decline" })}
                        disabled={voteMutation.isPending}
                      >
                        <ThumbsDown className="w-4 h-4 mr-1" /> Decline
                      </Button>
                      {isAdmin && approvalPct >= APPROVAL_THRESHOLD * 100 && (
                        <Button size="sm" className="ml-auto" onClick={() => finalizeMutation.mutate({ dealId: deal.id, status: "approved" })}>
                          <CheckCircle className="w-4 h-4 mr-1" /> Finalize Approval
                        </Button>
                      )}
                      {isAdmin && (
                        <Button size="sm" variant="destructive" className="ml-auto" onClick={() => finalizeMutation.mutate({ dealId: deal.id, status: "rejected" })}>
                          <XCircle className="w-4 h-4 mr-1" /> Reject
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Legal notice */}
      <div className="mt-8 border border-border rounded-lg p-4 bg-secondary/30">
        <p className="text-xs text-muted-foreground text-center">
          <strong>Private Investment Club Notice:</strong> This platform is for a private investment group only.
          It is not open to the public and does not solicit investments from outside parties.
          No securities are being offered to the public. All activities are conducted privately among members.
        </p>
      </div>
    </Layout>
  );
}
