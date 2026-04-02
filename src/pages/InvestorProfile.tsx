import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import AvatarUpload from "@/components/AvatarUpload";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Pencil, Save, X, User, Mail, Phone, Linkedin, Twitter, Instagram, Facebook, Shield, FileText } from "lucide-react";
import { toast } from "sonner";

export default function InvestorProfile() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});

  const isOwnProfile = user?.id === id;
  const canEdit = isOwnProfile;
  const canSeePrivate = isAdmin || isOwnProfile;

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: disclaimerAcceptance } = useQuery({
    queryKey: ["disclaimer-acceptance", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("disclaimer_acceptances")
        .select("accepted_at, full_name")
        .eq("user_id", id!)
        .maybeSingle();
      return data;
    },
    enabled: !!id && (isOwnProfile || isAdmin),
  });

  useEffect(() => {
    if (profile) setForm(profile);
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("profiles").update({
        full_name: data.full_name,
        phone: data.phone,
        bio: data.bio,
        photo_url: data.photo_url,
        linkedin: data.linkedin,
        twitter: data.twitter,
        instagram: data.instagram,
        facebook: data.facebook,
      }).eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", id] });
      setEditing(false);
      toast.success("Profile updated!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (isLoading) return <Layout><p className="text-muted-foreground">Loading...</p></Layout>;
  if (!profile) return <Layout><p className="text-muted-foreground">Profile not found.</p></Layout>;

  const initials = (profile.full_name || "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <Layout>
      <Link to="/investors" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Investors
      </Link>

      <div className="glass-card rounded-xl p-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-5">
            <div className="relative group">
              {profile.photo_url ? (
                <img src={profile.photo_url} alt={profile.full_name || ""} className="w-20 h-20 rounded-full object-cover border-2 border-primary/30" />
              ) : (
                <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center text-2xl font-bold text-primary-foreground">{initials}</div>
              )}
              {(canEdit || isAdmin) && (
                <div className="mt-2">
                  <AvatarUpload
                    userId={id!}
                    currentUrl={profile.photo_url}
                    onUploaded={(url) => {
                      queryClient.invalidateQueries({ queryKey: ["profile", id] });
                      queryClient.invalidateQueries({ queryKey: ["all-profiles"] });
                    }}
                  />
                </div>
              )}
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold">{profile.full_name || "Unnamed Investor"}</h2>
              {canSeePrivate && profile.email && <p className="text-sm text-muted-foreground flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {profile.email}</p>}
              {canSeePrivate && profile.phone && <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5"><Phone className="w-3.5 h-3.5" /> {profile.phone}</p>}
            </div>
          </div>
          {canEdit && !editing && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditing(true)}>
              <Pencil className="w-3.5 h-3.5" /> Edit Profile
            </Button>
          )}
        </div>

        {editing ? (
          <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(form); }} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={form.full_name || ""} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 (555) 123-4567" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea value={form.bio || ""} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Tell us about yourself, your investment philosophy, and experience..." rows={4} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><Linkedin className="w-3.5 h-3.5" /> LinkedIn</Label>
                <Input value={form.linkedin || ""} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} placeholder="https://linkedin.com/in/..." />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><Twitter className="w-3.5 h-3.5" /> Twitter / X</Label>
                <Input value={form.twitter || ""} onChange={(e) => setForm({ ...form, twitter: e.target.value })} placeholder="https://x.com/..." />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><Instagram className="w-3.5 h-3.5" /> Instagram</Label>
                <Input value={form.instagram || ""} onChange={(e) => setForm({ ...form, instagram: e.target.value })} placeholder="https://instagram.com/..." />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><Facebook className="w-3.5 h-3.5" /> Facebook</Label>
                <Input value={form.facebook || ""} onChange={(e) => setForm({ ...form, facebook: e.target.value })} placeholder="https://facebook.com/..." />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={updateMutation.isPending} className="gap-1.5">
                <Save className="w-3.5 h-3.5" /> Save
              </Button>
              <Button type="button" variant="outline" onClick={() => { setEditing(false); setForm(profile); }}>
                <X className="w-3.5 h-3.5 mr-1" /> Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            {/* Bio */}
            {profile.bio ? (
              <div>
                <h3 className="font-display font-semibold mb-2">About</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{profile.bio}</p>
              </div>
            ) : canEdit ? (
              <p className="text-sm text-muted-foreground italic">No bio yet. Click "Edit Profile" to add one.</p>
            ) : null}

            {/* Social Links */}
            {(profile.linkedin || profile.twitter || profile.instagram || profile.facebook) && (
              <div>
                <h3 className="font-display font-semibold mb-3">Social</h3>
                <div className="flex flex-wrap gap-3">
                  {profile.linkedin && (
                    <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors bg-secondary/50 px-3 py-2 rounded-lg">
                      <Linkedin className="w-4 h-4" /> LinkedIn
                    </a>
                  )}
                  {profile.twitter && (
                    <a href={profile.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors bg-secondary/50 px-3 py-2 rounded-lg">
                      <Twitter className="w-4 h-4" /> Twitter / X
                    </a>
                  )}
                  {profile.instagram && (
                    <a href={profile.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors bg-secondary/50 px-3 py-2 rounded-lg">
                      <Instagram className="w-4 h-4" /> Instagram
                    </a>
                  )}
                  {profile.facebook && (
                    <a href={profile.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors bg-secondary/50 px-3 py-2 rounded-lg">
                      <Facebook className="w-4 h-4" /> Facebook
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Disclaimer Acceptance Status */}
      {(isOwnProfile || isAdmin) && (
        <Card className="glass-card border-border mt-6 animate-fade-in">
          <CardContent className="p-6">
            <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Investment Disclosure & Risk Disclaimer
            </h3>
            {disclaimerAcceptance ? (
              <div className="flex items-center gap-3 bg-accent/10 border border-accent/20 rounded-lg p-4">
                <Shield className="w-6 h-6 text-accent flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Disclaimer Accepted</p>
                  <p className="text-xs text-muted-foreground">
                    Signed by <span className="font-semibold text-foreground">{disclaimerAcceptance.full_name}</span> on{" "}
                    {new Date(disclaimerAcceptance.accepted_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6 text-destructive flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Disclaimer Not Signed</p>
                    <p className="text-xs text-muted-foreground">This investor has not yet accepted the Investment Disclosure & Risk Disclaimer.</p>
                  </div>
                </div>
                {isOwnProfile && (
                  <Link to="/disclosures">
                    <Button size="sm" variant="outline">Review & Sign</Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </Layout>
  );
}
