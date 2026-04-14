import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import EditStartupDialog from "@/components/EditStartupDialog";
import EditInvestorDialog from "@/components/EditInvestorDialog";
import AdminProfileEditDialog from "@/components/AdminProfileEditDialog";
import AdminPasswordDialog from "@/components/AdminPasswordDialog";
import AssignStartupsDialog from "@/components/AssignStartupsDialog";
import AssignInvestorStartupsDialog from "@/components/AssignInvestorStartupsDialog";
import InvestorLedgerDialog from "@/components/InvestorLedgerDialog";
import { Pencil, Trash2, ShieldCheck, ShieldOff, KeyRound, Link2, DollarSign, CheckCircle, XCircle, Bell, FileText, Heart, Users, Archive, ArchiveRestore, Mail } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function Admin() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/login");
  }, [loading, user, isAdmin, navigate]);

  if (loading) return <Layout><p className="text-muted-foreground p-8">Loading...</p></Layout>;
  if (!isAdmin) return null;

  return (
    <Layout>
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold">Admin Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-1">Full management of startups, investors, directory & user roles</p>
      </div>
      <Tabs defaultValue="startups" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="startups">Startups</TabsTrigger>
          <TabsTrigger value="investors">Investors</TabsTrigger>
          <TabsTrigger value="directory">Directory & Profiles</TabsTrigger>
          <TabsTrigger value="users">Users & Roles</TabsTrigger>
          <TabsTrigger value="info-requests" className="relative">
            Info Requests
            <InfoRequestsBadge />
          </TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="interests">Member Interests</TabsTrigger>
          <TabsTrigger value="email-log">Email Log</TabsTrigger>
        </TabsList>
        <TabsContent value="startups"><StartupsAdmin /></TabsContent>
        <TabsContent value="investors"><InvestorsAdmin /></TabsContent>
        <TabsContent value="directory"><DirectoryAdmin /></TabsContent>
        <TabsContent value="users"><UsersAdmin /></TabsContent>
        <TabsContent value="info-requests"><InfoRequestsAdmin /></TabsContent>
        <TabsContent value="compliance"><ComplianceAdmin /></TabsContent>
        <TabsContent value="interests"><MemberInterestsAdmin /></TabsContent>
        <TabsContent value="email-log"><EmailLogAdmin /></TabsContent>
      </Tabs>
    </Layout>
  );
}

/* ─── Startups Tab ────────────────────────────── */
function StartupsAdmin() {
  const qc = useQueryClient();
  const [editStartup, setEditStartup] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: startups = [], isLoading } = useQuery({
    queryKey: ["admin-startups"],
    queryFn: async () => {
      const { data, error } = await supabase.from("startups").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("startup_investors").delete().eq("startup_id", id);
      const { error } = await supabase.from("startups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-startups"] }); qc.invalidateQueries({ queryKey: ["startups"] }); toast.success("Startup deleted"); setDeleteId(null); },
  });

  const editMutation = useMutation({
    mutationFn: async (s: any) => {
      const { error } = await supabase.from("startups").update({
        name: s.name, sector: s.sector, stage: s.stage, invested: s.invested, current_value: s.current_value, description: s.description, progress: s.progress,
      }).eq("id", s.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-startups"] }); qc.invalidateQueries({ queryKey: ["startups"] }); },
  });

  const toggleArchiveStartup = useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      const { error } = await supabase.from("startups").update({ archived } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-startups"] }); qc.invalidateQueries({ queryKey: ["startups"] }); toast.success("Startup updated"); },
  });

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead><TableHead>Sector</TableHead><TableHead>Stage</TableHead><TableHead className="text-right">Invested</TableHead><TableHead className="text-right">Value</TableHead><TableHead>Status</TableHead><TableHead className="w-[130px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {startups.map((s: any) => (
            <TableRow key={s.id} className={s.archived ? "opacity-50" : ""}>
              <TableCell className="font-medium">{s.name}</TableCell>
              <TableCell>{s.sector}</TableCell>
              <TableCell>{s.stage}</TableCell>
              <TableCell className="text-right">${Number(s.invested).toLocaleString()}</TableCell>
              <TableCell className="text-right">${Number(s.current_value).toLocaleString()}</TableCell>
              <TableCell>{s.archived ? <span className="text-xs text-muted-foreground">Archived</span> : <span className="text-xs text-primary">Active</span>}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => setEditStartup(s)} title="Edit"><Pencil className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => toggleArchiveStartup.mutate({ id: s.id, archived: !s.archived })} title={s.archived ? "Restore" : "Archive"}>
                    {s.archived ? <ArchiveRestore className="w-4 h-4 text-primary" /> : <Archive className="w-4 h-4 text-muted-foreground" />}
                  </Button>
                  {s.archived && (
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setDeleteId(s.id)} title="Delete"><Trash2 className="w-4 h-4" /></Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {editStartup && (
        <EditStartupDialog open={!!editStartup} onOpenChange={(o) => { if (!o) setEditStartup(null); }} startup={editStartup} onSave={(d) => editMutation.mutate(d)} isSubmitting={editMutation.isPending} />
      )}
      <ConfirmDeleteDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }} title="Delete Startup" description="This will permanently delete this startup and all its investors. Make sure it is archived first." onConfirm={() => deleteId && deleteMutation.mutate(deleteId)} isDeleting={deleteMutation.isPending} />
    </>
  );
}

/* ─── Investors Tab ───────────────────────────── */
function InvestorsAdmin() {
  const qc = useQueryClient();
  const [editInvestor, setEditInvestor] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [assignInvestor, setAssignInvestor] = useState<any | null>(null);
  const [ledgerInvestor, setLedgerInvestor] = useState<any | null>(null);

  const { data: investors = [], isLoading } = useQuery({
    queryKey: ["admin-investors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("startup_investors").select("*, startups(name)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("startup_investors").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-investors"] }); toast.success("Investor deleted"); setDeleteId(null); },
  });

  const editMutation = useMutation({
    mutationFn: async (inv: any) => {
      const { error } = await supabase.from("startup_investors").update({
        investor_name: inv.investor_name,
        amount_invested: inv.amount_invested,
        equity_percentage: inv.equity_percentage,
        investment_date: inv.investment_date,
        email: inv.email,
        notes: inv.notes,
        archived: inv.archived,
        pledge_amount: inv.pledge_amount,
        investment_round: inv.investment_round,
      }).eq("id", inv.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-investors"] });
      qc.invalidateQueries({ queryKey: ["startup-investors"] });
      qc.invalidateQueries({ queryKey: ["startup"] });
      qc.invalidateQueries({ queryKey: ["startups"] });
      qc.invalidateQueries({ queryKey: ["admin-startups"] });
      toast.success("Investor updated");
      setEditInvestor(null);
    },
  });

  const toggleArchive = useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      const { error } = await supabase.from("startup_investors").update({ archived }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-investors"] }); },
  });

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Investor</TableHead><TableHead>Startup</TableHead><TableHead className="text-right">Invested</TableHead><TableHead className="text-right">Equity %</TableHead><TableHead>Status</TableHead><TableHead className="w-[160px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {investors.map((inv: any) => (
            <TableRow key={inv.id} className={`${inv.archived ? "opacity-50" : ""} cursor-pointer hover:bg-muted/50`} onClick={() => setLedgerInvestor(inv)}>
              <TableCell className="font-medium">{inv.investor_name}</TableCell>
              <TableCell>{inv.startups?.name || "—"}</TableCell>
              <TableCell className="text-right">${Number(inv.amount_invested).toLocaleString()}</TableCell>
              <TableCell className="text-right">{inv.equity_percentage}%</TableCell>
              <TableCell>{inv.archived ? <span className="text-muted-foreground text-xs">Archived</span> : <span className="text-xs text-primary">Active</span>}</TableCell>
              <TableCell>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button size="icon" variant="ghost" onClick={() => setEditInvestor(inv)}><Pencil className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setAssignInvestor(inv); }} title="Assign startups"><Link2 className="w-4 h-4 text-primary" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => toggleArchive.mutate({ id: inv.id, archived: !inv.archived })} title={inv.archived ? "Restore" : "Archive"}>
                    {inv.archived ? <ArchiveRestore className="w-4 h-4 text-primary" /> : <Archive className="w-4 h-4 text-muted-foreground" />}
                  </Button>
                  {inv.archived && (
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setDeleteId(inv.id)} title="Delete"><Trash2 className="w-4 h-4" /></Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {editInvestor && (
        <EditInvestorDialog open={!!editInvestor} onOpenChange={(o) => { if (!o) setEditInvestor(null); }} investor={editInvestor} onSave={(d) => editMutation.mutate(d)} isSubmitting={editMutation.isPending} />
      )}
      <ConfirmDeleteDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }} title="Delete Investor" description="This will permanently delete this investor record." onConfirm={() => deleteId && deleteMutation.mutate(deleteId)} isDeleting={deleteMutation.isPending} />
      {assignInvestor && (
        <AssignInvestorStartupsDialog
          open={!!assignInvestor}
          onOpenChange={(o) => { if (!o) setAssignInvestor(null); }}
          investorName={assignInvestor.investor_name}
          investorEmail={assignInvestor.email}
          onSaved={() => qc.invalidateQueries({ queryKey: ["admin-investors"] })}
        />
      )}
      {ledgerInvestor && (
        <InvestorLedgerDialog
          open={!!ledgerInvestor}
          onOpenChange={(o) => { if (!o) setLedgerInvestor(null); }}
          investorName={ledgerInvestor.investor_name}
          investorEmail={ledgerInvestor.email}
          onSaved={() => qc.invalidateQueries({ queryKey: ["admin-investors"] })}
        />
      )}
    </>
  );
}

/* ─── Directory & Profiles Tab ────────────────── */
function DirectoryAdmin() {
  const qc = useQueryClient();
  const [editProfile, setEditProfile] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [assignProfile, setAssignProfile] = useState<any | null>(null);

  // Password-gated action state
  const [pendingAction, setPendingAction] = useState<{ type: "edit" | "assign" | "reset" | "delete" | "archive"; profile: any } | null>(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["admin-profiles-dir"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const editMutation = useMutation({
    mutationFn: async (p: any) => {
      const { error } = await supabase.from("profiles").update({
        full_name: p.full_name, email: p.email, phone: p.phone, bio: p.bio, photo_url: p.photo_url,
        linkedin: p.linkedin, twitter: p.twitter, instagram: p.instagram, facebook: p.facebook,
      }).eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-profiles-dir"] }); qc.invalidateQueries({ queryKey: ["admin-profiles"] }); toast.success("Profile updated"); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("user_roles").delete().eq("user_id", id);
      const { error } = await supabase.from("profiles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-profiles-dir"] }); toast.success("Profile deleted"); setDeleteId(null); },
  });

  const sendPasswordReset = async (email: string | null) => {
    if (!email) { toast.error("No email on this profile"); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) toast.error(error.message);
    else toast.success(`Password reset email sent to ${email}`);
  };

  const toggleArchiveProfile = useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      const { error } = await supabase.from("profiles").update({ archived } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-profiles-dir"] }); toast.success("Profile updated"); },
  });

  const requestAction = (type: "edit" | "assign" | "reset" | "delete" | "archive", profile: any) => {
    setPendingAction({ type, profile });
    setShowPasswordDialog(true);
  };

  const handlePasswordConfirmed = () => {
    setShowPasswordDialog(false);
    if (!pendingAction) return;
    const { type, profile } = pendingAction;
    setPendingAction(null);

    switch (type) {
      case "edit":
        setEditProfile(profile);
        break;
      case "assign":
        setAssignProfile(profile);
        break;
      case "reset":
        sendPasswordReset(profile.email);
        break;
      case "delete":
        setDeleteId(profile.id);
        break;
      case "archive":
        toggleArchiveProfile.mutate({ id: profile.id, archived: !(profile as any).archived });
        break;
    }
  };

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <>
      <p className="text-sm text-muted-foreground mb-4">Full profile management — edit all fields, send password resets, or remove profiles.</p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Bio</TableHead><TableHead>Status</TableHead><TableHead className="w-[200px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {profiles.map((p: any) => {
            return (
              <TableRow key={p.id} className={p.archived ? "opacity-50" : ""}>
                <TableCell className="font-medium">{p.full_name || "—"}</TableCell>
                <TableCell className="text-sm">{p.email || "—"}</TableCell>
                <TableCell className="text-sm">{p.phone || "—"}</TableCell>
                <TableCell className="text-sm max-w-[200px] truncate">{p.bio || "—"}</TableCell>
                <TableCell>{p.archived ? <span className="text-xs text-muted-foreground">Archived</span> : <span className="text-xs text-primary">Active</span>}</TableCell>
                <TableCell>
                   <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => requestAction("edit", p)} title="Edit profile"><Pencil className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => requestAction("assign", p)} title="Assign startups"><Link2 className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => requestAction("reset", p)} title="Send password reset"><KeyRound className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => requestAction("archive", p)} title={p.archived ? "Restore" : "Archive"}>
                      {p.archived ? <ArchiveRestore className="w-4 h-4 text-primary" /> : <Archive className="w-4 h-4 text-muted-foreground" />}
                    </Button>
                    {p.archived && (
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => requestAction("delete", p)} title="Delete profile"><Trash2 className="w-4 h-4" /></Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <AdminPasswordDialog
        open={showPasswordDialog}
        onOpenChange={setShowPasswordDialog}
        title="Admin Verification"
        description="Enter your admin password to perform this action."
        onConfirmed={handlePasswordConfirmed}
      />

      {editProfile && (
        <AdminProfileEditDialog open={!!editProfile} onOpenChange={(o) => { if (!o) setEditProfile(null); }} profile={editProfile} onSave={(d) => editMutation.mutate(d)} isSubmitting={editMutation.isPending} />
      )}
      <ConfirmDeleteDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }} title="Delete Profile" description="This will delete this user's profile and roles. The auth account will remain." onConfirm={() => deleteId && deleteMutation.mutate(deleteId)} isDeleting={deleteMutation.isPending} />
      {assignProfile && (
        <AssignStartupsDialog open={!!assignProfile} onOpenChange={(o) => { if (!o) setAssignProfile(null); }} profileId={assignProfile.id} profileName={assignProfile.full_name || "Unnamed"} profileEmail={assignProfile.email} />
      )}
    </>
  );
}

/* ─── Users & Roles Tab ───────────────────────── */
function UsersAdmin() {
  const qc = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: roles = [] } = useQuery({
    queryKey: ["admin-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("*");
      if (error) throw error;
      return data;
    },
  });

  const getRoles = (userId: string) => roles.filter((r: any) => r.user_id === userId).map((r: any) => r.role);

  const toggleRole = useMutation({
    mutationFn: async ({ userId, role, hasRole }: { userId: string; role: string; hasRole: boolean }) => {
      if (hasRole) {
        const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role as any);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: role as any });
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-roles"] }); toast.success("Role updated"); },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleArchiveUser = useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      const { error } = await supabase.from("profiles").update({ archived } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-profiles"] }); toast.success("Profile updated"); },
  });

  const deleteProfile = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("user_roles").delete().eq("user_id", id);
      const { error } = await supabase.from("profiles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-profiles"] }); toast.success("Profile deleted"); setDeleteId(null); },
  });

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Roles</TableHead><TableHead>Status</TableHead><TableHead className="w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {profiles.map((p: any) => {
            const userRoles = getRoles(p.id);
            return (
              <TableRow key={p.id} className={p.archived ? "opacity-50" : ""}>
                <TableCell className="font-medium">{p.full_name || "—"}</TableCell>
                <TableCell>{p.email || "—"}</TableCell>
                <TableCell>{p.phone || "—"}</TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {(["admin", "moderator", "user"] as const).map((role) => {
                      const has = userRoles.includes(role);
                      return (
                        <Button key={role} size="sm" variant={has ? "default" : "outline"} className="h-6 text-xs px-2" onClick={() => toggleRole.mutate({ userId: p.id, role, hasRole: has })} disabled={toggleRole.isPending}>
                          {role}
                        </Button>
                      );
                    })}
                  </div>
                </TableCell>
                <TableCell>{p.archived ? <span className="text-xs text-muted-foreground">Archived</span> : <span className="text-xs text-primary">Active</span>}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => toggleArchiveUser.mutate({ id: p.id, archived: !p.archived })} title={p.archived ? "Restore" : "Archive"}>
                      {p.archived ? <ArchiveRestore className="w-4 h-4 text-primary" /> : <Archive className="w-4 h-4 text-muted-foreground" />}
                    </Button>
                    {p.archived && (
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setDeleteId(p.id)} title="Delete"><Trash2 className="w-4 h-4" /></Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <ConfirmDeleteDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }} title="Delete Profile" description="This will delete this user's profile and roles." onConfirm={() => deleteId && deleteProfile.mutate(deleteId)} isDeleting={deleteProfile.isPending} />
    </>
  );
}

/* ─── Info Requests Badge ─────────────────────── */
function InfoRequestsBadge() {
  const { data: count = 0 } = useQuery({
    queryKey: ["info-requests-pending-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("startup_info_requests" as any)
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
      if (error) throw error;
      return count || 0;
    },
  });

  if (!count) return null;

  return (
    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold">
      {count}
    </span>
  );
}

/* ─── Info Requests Admin Tab ─────────────────── */
function InfoRequestsAdmin() {
  const qc = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["admin-info-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("startup_info_requests" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as { id: string; user_id: string; startup_id: string; status: string; created_at: string }[];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-profiles-for-requests"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, full_name, email");
      if (error) throw error;
      return data;
    },
  });

  const { data: startups = [] } = useQuery({
    queryKey: ["admin-startups-for-requests"],
    queryFn: async () => {
      const { data, error } = await supabase.from("startups").select("id, name");
      if (error) throw error;
      return data;
    },
  });

  const profileMap = new Map(profiles.map((p) => [p.id, p]));
  const startupMap = new Map(startups.map((s) => [s.id, s]));

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("startup_info_requests" as any)
        .update({ status } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-info-requests"] });
      qc.invalidateQueries({ queryKey: ["info-requests-pending-count"] });
      toast.success("Request updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;

  if (!requests.length) return <p className="text-muted-foreground">No information requests yet.</p>;

  return (
    <>
      <p className="text-sm text-muted-foreground mb-4">
        Members can request information about startups they aren't linked to. Approving grants access to the startup's bio and basic details (no financial data).
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Startup</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Requested</TableHead>
            <TableHead className="w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((req) => {
            const profile = profileMap.get(req.user_id);
            const startup = startupMap.get(req.startup_id);
            return (
              <TableRow key={req.id}>
                <TableCell className="font-medium">{profile?.full_name || profile?.email || req.user_id.slice(0, 8)}</TableCell>
                <TableCell>{startup?.name || req.startup_id.slice(0, 8)}</TableCell>
                <TableCell>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    req.status === "pending" ? "bg-warning/10 text-warning" :
                    req.status === "approved" ? "bg-primary/10 text-primary" :
                    "bg-destructive/10 text-destructive"
                  }`}>
                    {req.status}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(req.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {req.status === "pending" && (
                      <>
                        <Button size="icon" variant="ghost" className="text-primary" onClick={() => updateStatus.mutate({ id: req.id, status: "approved" })} title="Approve" disabled={updateStatus.isPending}>
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => updateStatus.mutate({ id: req.id, status: "rejected" })} title="Reject" disabled={updateStatus.isPending}>
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    {req.status !== "pending" && (
                      <span className="text-xs text-muted-foreground px-2">—</span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </>
  );
}

/* ─── Compliance Tab ──────────────────────────── */
function ComplianceAdmin() {
  const { data: profiles = [] } = useQuery({
    queryKey: ["all-profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name, email");
      return data || [];
    },
  });

  const { data: disclaimers = [] } = useQuery({
    queryKey: ["all-disclaimer-acceptances"],
    queryFn: async () => {
      const { data } = await supabase.from("disclaimer_acceptances").select("user_id, accepted_at, full_name");
      return data || [];
    },
  });

  const { data: onboardingAgreements = [] } = useQuery({
    queryKey: ["all-onboarding-agreements"],
    queryFn: async () => {
      const { data } = await supabase.from("onboarding_agreements").select("user_id, agreement_type, signed_at, full_name, startup_id");
      return data || [];
    },
  });

  const { data: startups = [] } = useQuery({
    queryKey: ["all-startups-compliance"],
    queryFn: async () => {
      const { data } = await supabase.from("startups").select("id, name");
      return data || [];
    },
  });

  const { data: profileLinks = [] } = useQuery({
    queryKey: ["all-profile-startup-links"],
    queryFn: async () => {
      const { data } = await supabase.from("profile_startup_links").select("profile_id, startup_id");
      return data || [];
    },
  });

  const disclaimerMap = new Map(disclaimers.map((d: any) => [d.user_id, d]));
  const startupMap = new Map(startups.map((s: any) => [s.id, s.name]));

  // Group onboarding agreements by user_id + startup_id
  const getAgreements = (userId: string, startupId: string | null) => {
    return onboardingAgreements.filter((a: any) =>
      a.user_id === userId && (startupId ? a.startup_id === startupId : !a.startup_id)
    );
  };

  // Get startups assigned to each profile
  const getAssignedStartups = (profileId: string) => {
    return profileLinks.filter((l: any) => l.profile_id === profileId).map((l: any) => l.startup_id);
  };

  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-primary" />
        <h3 className="font-display font-semibold text-lg">Member Compliance Tracker</h3>
      </div>

      {/* Global Agreements */}
      <h4 className="text-sm font-semibold text-muted-foreground mb-2 mt-4">Global Agreements</h4>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Risk Disclaimer</TableHead>
            <TableHead>Operating Agreement</TableHead>
            <TableHead>Onboarding Packet</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {profiles.map((p: any) => {
            const disc = disclaimerMap.get(p.id);
            const agreements = getAgreements(p.id, null);
            const opAgreement = agreements.find((a: any) => a.agreement_type === "operating_agreement");
            const onbPacket = agreements.find((a: any) => a.agreement_type === "onboarding_packet");
            return (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.full_name || p.email || "—"}</TableCell>
                <TableCell>
                  {disc ? (
                    <Badge variant="default" className="bg-green-600/20 text-green-700 dark:text-green-400 border-green-600/30">
                      <CheckCircle className="w-3 h-3 mr-1" /> Signed {new Date(disc.accepted_at).toLocaleDateString()}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-amber-600 border-amber-500/30">Pending</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {opAgreement ? (
                    <Badge variant="default" className="bg-green-600/20 text-green-700 dark:text-green-400 border-green-600/30">
                      <CheckCircle className="w-3 h-3 mr-1" /> Signed {new Date(opAgreement.signed_at).toLocaleDateString()}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-amber-600 border-amber-500/30">Pending</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {onbPacket ? (
                    <Badge variant="default" className="bg-green-600/20 text-green-700 dark:text-green-400 border-green-600/30">
                      <CheckCircle className="w-3 h-3 mr-1" /> Signed {new Date(onbPacket.signed_at).toLocaleDateString()}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-amber-600 border-amber-500/30">Pending</Badge>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Per-Startup Agreements */}
      <h4 className="text-sm font-semibold text-muted-foreground mb-2 mt-8">Per-Startup Onboarding</h4>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Startup</TableHead>
            <TableHead>Operating Agreement</TableHead>
            <TableHead>Onboarding Packet</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {profiles.flatMap((p: any) => {
            const assignedStartups = getAssignedStartups(p.id);
            if (assignedStartups.length === 0) return [];
            return assignedStartups.map((sId: string) => {
              const agreements = getAgreements(p.id, sId);
              const opAgreement = agreements.find((a: any) => a.agreement_type === "operating_agreement");
              const onbPacket = agreements.find((a: any) => a.agreement_type === "onboarding_packet");
              return (
                <TableRow key={`${p.id}-${sId}`}>
                  <TableCell className="font-medium">{p.full_name || p.email || "—"}</TableCell>
                  <TableCell className="text-sm">{startupMap.get(sId) || sId.slice(0, 8)}</TableCell>
                  <TableCell>
                    {opAgreement ? (
                      <Badge variant="default" className="bg-green-600/20 text-green-700 dark:text-green-400 border-green-600/30">
                        <CheckCircle className="w-3 h-3 mr-1" /> Signed {new Date(opAgreement.signed_at).toLocaleDateString()}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-600 border-amber-500/30">Pending</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {onbPacket ? (
                      <Badge variant="default" className="bg-green-600/20 text-green-700 dark:text-green-400 border-green-600/30">
                        <CheckCircle className="w-3 h-3 mr-1" /> Signed {new Date(onbPacket.signed_at).toLocaleDateString()}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-600 border-amber-500/30">Pending</Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            });
          })}
          {profiles.every((p: any) => getAssignedStartups(p.id).length === 0) && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground text-sm py-6">
                No startup assignments yet. Assign members to startups from the Directory tab.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </>
  );
}

function MemberInterestsAdmin() {
  const [selectedInterest, setSelectedInterest] = useState<string>("");

  const { data: profiles = [] } = useQuery({
    queryKey: ["all-profiles-interests"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, full_name, email, occupation, company, interests, photo_url");
      if (error) throw error;
      return data as any[];
    },
  });

  // Collect all unique interests
  const allInterests = Array.from(
    new Set(profiles.flatMap((p: any) => (p.interests as string[]) || []))
  ).sort();

  const filteredProfiles = selectedInterest
    ? profiles.filter((p: any) => ((p.interests as string[]) || []).includes(selectedInterest))
    : profiles.filter((p: any) => ((p.interests as string[]) || []).length > 0);

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display font-semibold text-lg flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" /> Member Interests
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Filter members by shared interests to plan group activities
          </p>
        </div>
      </div>

      {/* Interest filter chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setSelectedInterest("")}
          className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
            !selectedInterest
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-secondary/50 text-muted-foreground border-border hover:border-primary/40"
          }`}
        >
          All ({profiles.filter((p: any) => ((p.interests as string[]) || []).length > 0).length})
        </button>
        {allInterests.map((interest) => {
          const count = profiles.filter((p: any) => ((p.interests as string[]) || []).includes(interest)).length;
          return (
            <button
              key={interest}
              onClick={() => setSelectedInterest(interest === selectedInterest ? "" : interest)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                selectedInterest === interest
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary/50 text-muted-foreground border-border hover:border-primary/40"
              }`}
            >
              {interest} ({count})
            </button>
          );
        })}
      </div>

      {filteredProfiles.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          {allInterests.length === 0
            ? "No members have added interests yet."
            : "No members match this filter."}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Occupation</TableHead>
              <TableHead>Interests</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProfiles.map((p: any) => (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {p.photo_url ? (
                      <img src={p.photo_url} className="w-8 h-8 rounded-full object-cover" alt="" />
                    ) : (
                      <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                        {(p.full_name || "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium">{p.full_name || "Unnamed"}</p>
                      <p className="text-xs text-muted-foreground">{p.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {p.occupation ? `${p.occupation}${p.company ? ` at ${p.company}` : ""}` : "—"}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {((p.interests as string[]) || []).map((interest: string) => (
                      <Badge
                        key={interest}
                        variant={interest === selectedInterest ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {selectedInterest && filteredProfiles.length > 1 && (
        <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <p className="text-sm font-medium flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            {filteredProfiles.length} members share an interest in "{selectedInterest}"
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Consider planning a group {selectedInterest.toLowerCase()} activity!
          </p>
        </div>
      )}
    </>
  );
}

/* ─── Email Log Tab ────────────────────────────── */
function EmailLogAdmin() {
  const [timeRange, setTimeRange] = useState<string>("7d");

  const rangeStart = (() => {
    const now = new Date();
    if (timeRange === "24h") return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    if (timeRange === "7d") return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  })();

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["email-log", timeRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_send_log")
        .select("*")
        .gte("created_at", rangeStart)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      // Deduplicate by message_id, keeping latest
      const seen = new Map<string, typeof data[0]>();
      for (const row of data) {
        const key = row.message_id || row.id;
        if (!seen.has(key)) seen.set(key, row);
      }
      return Array.from(seen.values());
    },
  });

  const stats = {
    total: logs.length,
    sent: logs.filter(l => l.status === "sent").length,
    pending: logs.filter(l => l.status === "pending").length,
    failed: logs.filter(l => l.status === "dlq" || l.status === "failed").length,
    suppressed: logs.filter(l => l.status === "suppressed").length,
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      sent: "bg-green-500/20 text-green-400",
      pending: "bg-yellow-500/20 text-yellow-400",
      dlq: "bg-red-500/20 text-red-400",
      failed: "bg-red-500/20 text-red-400",
      suppressed: "bg-orange-500/20 text-orange-400",
      bounced: "bg-red-500/20 text-red-400",
      complained: "bg-red-500/20 text-red-400",
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status] || "bg-muted text-muted-foreground"}`}>
        {status}
      </span>
    );
  };

  return (
    <>
      {/* Time range buttons */}
      <div className="flex items-center gap-2 mb-4">
        <Mail className="w-5 h-5 text-primary" />
        <span className="text-sm font-medium mr-2">Time Range:</span>
        {[
          { value: "24h", label: "Last 24h" },
          { value: "7d", label: "Last 7 days" },
          { value: "30d", label: "Last 30 days" },
        ].map(r => (
          <Button
            key={r.value}
            variant={timeRange === r.value ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange(r.value)}
          >
            {r.label}
          </Button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        {[
          { label: "Total", value: stats.total },
          { label: "Sent", value: stats.sent },
          { label: "Pending", value: stats.pending },
          { label: "Failed", value: stats.failed },
          { label: "Suppressed", value: stats.suppressed },
        ].map(s => (
          <div key={s.label} className="rounded-lg border border-border bg-card p-3 text-center">
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading email log...</p>
      ) : logs.length === 0 ? (
        <p className="text-sm text-muted-foreground">No emails sent in this time range.</p>
      ) : (
        <div className="rounded-lg border border-border overflow-auto max-h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent At</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map(log => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm font-medium">{log.template_name}</TableCell>
                  <TableCell className="text-sm">{log.recipient_email}</TableCell>
                  <TableCell>{statusBadge(log.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(log.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-xs text-red-400 max-w-[200px] truncate">
                    {log.error_message || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
