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
import AssignStartupsDialog from "@/components/AssignStartupsDialog";
import AssignInvestorStartupsDialog from "@/components/AssignInvestorStartupsDialog";
import { Pencil, Trash2, ShieldCheck, ShieldOff, KeyRound, Link2 } from "lucide-react";
import { toast } from "sonner";

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
        </TabsList>
        <TabsContent value="startups"><StartupsAdmin /></TabsContent>
        <TabsContent value="investors"><InvestorsAdmin /></TabsContent>
        <TabsContent value="directory"><DirectoryAdmin /></TabsContent>
        <TabsContent value="users"><UsersAdmin /></TabsContent>
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

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead><TableHead>Sector</TableHead><TableHead>Stage</TableHead><TableHead className="text-right">Invested</TableHead><TableHead className="text-right">Value</TableHead><TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {startups.map((s) => (
            <TableRow key={s.id}>
              <TableCell className="font-medium">{s.name}</TableCell>
              <TableCell>{s.sector}</TableCell>
              <TableCell>{s.stage}</TableCell>
              <TableCell className="text-right">${Number(s.invested).toLocaleString()}</TableCell>
              <TableCell className="text-right">${Number(s.current_value).toLocaleString()}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => setEditStartup(s)}><Pencil className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setDeleteId(s.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {editStartup && (
        <EditStartupDialog open={!!editStartup} onOpenChange={(o) => { if (!o) setEditStartup(null); }} startup={editStartup} onSave={(d) => editMutation.mutate(d)} isSubmitting={editMutation.isPending} />
      )}
      <ConfirmDeleteDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }} title="Delete Startup" description="This will permanently delete this startup and all its investors." onConfirm={() => deleteId && deleteMutation.mutate(deleteId)} isDeleting={deleteMutation.isPending} />
    </>
  );
}

/* ─── Investors Tab ───────────────────────────── */
function InvestorsAdmin() {
  const qc = useQueryClient();
  const [editInvestor, setEditInvestor] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [assignInvestor, setAssignInvestor] = useState<any | null>(null);

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
        investor_name: inv.investor_name, amount_invested: inv.amount_invested, equity_percentage: inv.equity_percentage, email: inv.email, notes: inv.notes, archived: inv.archived,
      }).eq("id", inv.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-investors"] }); toast.success("Investor updated"); },
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
            <TableHead>Investor</TableHead><TableHead>Startup</TableHead><TableHead className="text-right">Invested</TableHead><TableHead className="text-right">Equity %</TableHead><TableHead>Status</TableHead><TableHead className="w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {investors.map((inv: any) => (
            <TableRow key={inv.id} className={inv.archived ? "opacity-50" : ""}>
              <TableCell className="font-medium">{inv.investor_name}</TableCell>
              <TableCell>{inv.startups?.name || "—"}</TableCell>
              <TableCell className="text-right">${Number(inv.amount_invested).toLocaleString()}</TableCell>
              <TableCell className="text-right">{inv.equity_percentage}%</TableCell>
              <TableCell>{inv.archived ? <span className="text-muted-foreground text-xs">Archived</span> : <span className="text-xs text-primary">Active</span>}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => setEditInvestor(inv)}><Pencil className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setAssignInvestor(inv); }} title="Assign startups"><Link2 className="w-4 h-4 text-primary" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => toggleArchive.mutate({ id: inv.id, archived: !inv.archived })}>
                    {inv.archived ? <ShieldCheck className="w-4 h-4 text-primary" /> : <ShieldOff className="w-4 h-4 text-muted-foreground" />}
                  </Button>
                  <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setDeleteId(inv.id)}><Trash2 className="w-4 h-4" /></Button>
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
    </>
  );
}

/* ─── Directory & Profiles Tab ────────────────── */
function DirectoryAdmin() {
  const qc = useQueryClient();
  const [editProfile, setEditProfile] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [assignProfile, setAssignProfile] = useState<any | null>(null);

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

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <>
      <p className="text-sm text-muted-foreground mb-4">Full profile management — edit all fields, send password resets, or remove profiles.</p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Bio</TableHead><TableHead>Socials</TableHead><TableHead className="w-[170px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {profiles.map((p) => {
            const socials = [p.linkedin && "LI", p.twitter && "X", p.instagram && "IG", p.facebook && "FB"].filter(Boolean).join(", ");
            return (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.full_name || "—"}</TableCell>
                <TableCell className="text-sm">{p.email || "—"}</TableCell>
                <TableCell className="text-sm">{p.phone || "—"}</TableCell>
                <TableCell className="text-sm max-w-[200px] truncate">{p.bio || "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{socials || "—"}</TableCell>
                <TableCell>
                   <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setEditProfile(p)} title="Edit profile"><Pencil className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setAssignProfile(p)} title="Assign startups"><Link2 className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => sendPasswordReset(p.email)} title="Send password reset"><KeyRound className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setDeleteId(p.id)} title="Delete profile"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {editProfile && (
        <AdminProfileEditDialog open={!!editProfile} onOpenChange={(o) => { if (!o) setEditProfile(null); }} profile={editProfile} onSave={(d) => editMutation.mutate(d)} isSubmitting={editMutation.isPending} />
      )}
      <ConfirmDeleteDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }} title="Delete Profile" description="This will delete this user's profile and roles. The auth account will remain." onConfirm={() => deleteId && deleteMutation.mutate(deleteId)} isDeleting={deleteMutation.isPending} />
      {assignProfile && (
        <AssignStartupsDialog open={!!assignProfile} onOpenChange={(o) => { if (!o) setAssignProfile(null); }} profileId={assignProfile.id} profileName={assignProfile.full_name || "Unnamed"} />
      )}
    </>
  );
}

/* ─── Users & Roles Tab ───────────────────────── */
function UsersAdmin() {
  const qc = useQueryClient();

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

  const [deleteId, setDeleteId] = useState<string | null>(null);

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
            <TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Roles</TableHead><TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {profiles.map((p) => {
            const userRoles = getRoles(p.id);
            return (
              <TableRow key={p.id}>
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
                <TableCell>
                  <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setDeleteId(p.id)}><Trash2 className="w-4 h-4" /></Button>
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
