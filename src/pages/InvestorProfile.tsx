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
import { Checkbox } from "@/components/ui/checkbox";
import AvatarUpload from "@/components/AvatarUpload";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pencil, Save, X, User, Mail, Phone, Linkedin, Twitter, Instagram, Facebook, Shield, FileText, AlertCircle, CheckCircle2, Briefcase, MapPin, Target, Heart, UserCheck, HeartHandshake } from "lucide-react";
import { toast } from "sonner";

const INTEREST_OPTIONS = [
  "Golf", "Swimming", "Tennis", "Running", "Cycling", "Hiking",
  "Basketball", "Football Games", "Baseball Games", "Soccer",
  "Fishing", "Yoga", "Gym & Fitness",
  "Family Activities", "Travel", "Wine & Dining",
  "Reading", "Podcasts", "Cooking",
  "Philanthropy", "Mentoring", "Networking Events",
  "Real Estate", "Technology", "Art & Culture",
  "Music", "Photography", "Boating",
];

export default function InvestorProfile() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
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

  // Fetch startups linked to this profile
  const { data: linkedStartups = [] } = useQuery({
    queryKey: ["profile-startup-links", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profile_startup_links")
        .select("startup_id, startups(id, name)")
        .eq("profile_id", id!);
      if (error) throw error;
      return data;
    },
    enabled: !!id && (isOwnProfile || isAdmin),
  });

  // Fetch all documents for linked startups
  const startupIds = linkedStartups.map((l: any) => l.startup_id);
  const { data: allDocs = [] } = useQuery({
    queryKey: ["profile-startup-documents", startupIds],
    queryFn: async () => {
      if (startupIds.length === 0) return [];
      const { data, error } = await supabase
        .from("startup_documents")
        .select("*")
        .in("startup_id", startupIds);
      if (error) throw error;
      return data;
    },
    enabled: startupIds.length > 0 && (isOwnProfile || isAdmin),
  });

  // Fetch acknowledgments for this user
  const { data: userAcks = [] } = useQuery({
    queryKey: ["profile-doc-acknowledgments", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_acknowledgments")
        .select("document_id")
        .eq("user_id", id!);
      if (error) throw error;
      return data;
    },
    enabled: !!id && (isOwnProfile || isAdmin),
  });

  const ackedDocIds = new Set(userAcks.map((a: any) => a.document_id));
  const pendingDocs = allDocs.filter((d: any) => !ackedDocIds.has(d.id));
  const signedDocs = allDocs.filter((d: any) => ackedDocIds.has(d.id));
  const startupNameMap = Object.fromEntries(linkedStartups.map((l: any) => [l.startup_id, (l as any).startups?.name || "Unknown"]));

  useEffect(() => {
    if (profile) setForm({ ...profile, interests: (profile as any).interests || [] });
  }, [profile]);

  const toggleInterest = (interest: string) => {
    const current: string[] = form.interests || [];
    if (current.includes(interest)) {
      setForm({ ...form, interests: current.filter((i: string) => i !== interest) });
    } else {
      setForm({ ...form, interests: [...current, interest] });
    }
  };

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
        occupation: data.occupation,
        company: data.company,
        location: data.location,
        investment_focus: data.investment_focus,
        interests: data.interests || [],
        emergency_contact_name: data.emergency_contact_name || null,
        emergency_contact_phone: data.emergency_contact_phone || null,
        emergency_contact_relationship: data.emergency_contact_relationship || null,
        beneficiary_name: data.beneficiary_name || null,
        beneficiary_relationship: data.beneficiary_relationship || null,
        beneficiary_contact: data.beneficiary_contact || null,
        profile_completed: true,
      } as any).eq("id", id!);
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

  const profileData = profile as any;
  const initials = (profile.full_name || "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  const isIncomplete = !(profileData.profile_completed);
  const showCompletePrompt = isOwnProfile && isIncomplete && !editing;

  return (
    <Layout>
      <Link to="/investors" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Investors
      </Link>

      {/* Complete Profile Prompt */}
      {showCompletePrompt && (
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-primary/10 border border-primary/20 rounded-xl p-4 sm:p-5 animate-fade-in">
          <User className="w-8 h-8 text-primary flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-display font-semibold text-foreground">Complete Your Profile</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Welcome! Please fill out your profile information so other members can get to know you.
            </p>
          </div>
          <Button onClick={() => setEditing(true)} className="gap-1.5 shrink-0 w-full sm:w-auto">
            <Pencil className="w-3.5 h-3.5" /> Complete Profile
          </Button>
        </div>
      )}

      <div className="glass-card rounded-xl p-4 sm:p-6 md:p-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
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
              {profileData.occupation && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <Briefcase className="w-3.5 h-3.5" /> {profileData.occupation}{profileData.company ? ` at ${profileData.company}` : ""}
                </p>
              )}
              {profileData.location && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5" /> {profileData.location}
                </p>
              )}
              {canSeePrivate && profile.email && <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5"><Mail className="w-3.5 h-3.5" /> {profile.email}</p>}
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
          <form onSubmit={(e) => {
            e.preventDefault();
            if (!disclaimerAcceptance) {
              toast.error("You must sign the Investment Disclosure & Risk Disclaimer before saving your profile.");
              navigate("/disclosures");
              return;
            }
            if (!form.full_name?.trim()) {
              toast.error("Full name is required");
              return;
            }
            if (!form.phone?.trim()) {
              toast.error("Phone number is required");
              return;
            }
            updateMutation.mutate(form);
          }} className="space-y-6">
            {!disclaimerAcceptance && (
              <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <Shield className="w-5 h-5 text-destructive flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Disclaimer Required</p>
                  <p className="text-xs text-muted-foreground">You must sign the Investment Disclosure & Risk Disclaimer before saving your profile.</p>
                </div>
                <Link to="/disclosures">
                  <Button size="sm" variant="outline" type="button">Sign Now</Button>
                </Link>
              </div>
            )}

            {/* Basic Info */}
            <div>
              <h3 className="font-display font-semibold mb-3 flex items-center gap-2"><User className="w-4 h-4 text-primary" /> Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name <span className="text-destructive">*</span></Label>
                  <Input value={form.full_name || ""} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Phone <span className="text-destructive">*</span></Label>
                  <Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 (555) 123-4567" required />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <h3 className="font-display font-semibold mb-2 flex items-center gap-2"><UserCheck className="w-4 h-4 text-primary" /> Emergency Contact</h3>
              <p className="text-xs text-muted-foreground mb-3">Someone we can reach if there's an emergency.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Contact Name</Label>
                  <Input value={form.emergency_contact_name || ""} onChange={(e) => setForm({ ...form, emergency_contact_name: e.target.value })} placeholder="e.g. Jane Smith" />
                </div>
                <div className="space-y-2">
                  <Label>Contact Phone</Label>
                  <Input value={form.emergency_contact_phone || ""} onChange={(e) => setForm({ ...form, emergency_contact_phone: e.target.value })} placeholder="+1 (555) 123-4567" />
                </div>
                <div className="space-y-2">
                  <Label>Relationship</Label>
                  <Input value={form.emergency_contact_relationship || ""} onChange={(e) => setForm({ ...form, emergency_contact_relationship: e.target.value })} placeholder="e.g. Spouse, Parent, Sibling" />
                </div>
              </div>
            </div>

            {/* Beneficiary */}
            <div>
              <h3 className="font-display font-semibold mb-2 flex items-center gap-2"><HeartHandshake className="w-4 h-4 text-primary" /> Beneficiary Information</h3>
              <p className="text-xs text-muted-foreground mb-3">Designate who should receive your portfolio in the event something happens to you.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Beneficiary Name</Label>
                  <Input value={form.beneficiary_name || ""} onChange={(e) => setForm({ ...form, beneficiary_name: e.target.value })} placeholder="e.g. Jane Smith" />
                </div>
                <div className="space-y-2">
                  <Label>Relationship</Label>
                  <Input value={form.beneficiary_relationship || ""} onChange={(e) => setForm({ ...form, beneficiary_relationship: e.target.value })} placeholder="e.g. Spouse, Child, Trust" />
                </div>
                <div className="space-y-2">
                  <Label>Contact (Phone or Email)</Label>
                  <Input value={form.beneficiary_contact || ""} onChange={(e) => setForm({ ...form, beneficiary_contact: e.target.value })} placeholder="Phone or email" />
                </div>
              </div>
            </div>

            {/* Professional Info */}
            <div>
              <h3 className="font-display font-semibold mb-3 flex items-center gap-2"><Briefcase className="w-4 h-4 text-primary" /> Professional Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Occupation / Title</Label>
                  <Input value={form.occupation || ""} onChange={(e) => setForm({ ...form, occupation: e.target.value })} placeholder="e.g. Software Engineer, Attorney, Entrepreneur" />
                </div>
                <div className="space-y-2">
                  <Label>Company / Business</Label>
                  <Input value={form.company || ""} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="e.g. Acme Corp, Self-Employed" />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input value={form.location || ""} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Dallas, TX" />
                </div>
                <div className="space-y-2">
                  <Label>Investment Focus</Label>
                  <Input value={form.investment_focus || ""} onChange={(e) => setForm({ ...form, investment_focus: e.target.value })} placeholder="e.g. Real Estate, AI, Healthcare" />
                </div>
              </div>
            </div>

            {/* Bio */}
            <div>
              <h3 className="font-display font-semibold mb-3">About Me</h3>
              <Textarea value={form.bio || ""} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Tell us about yourself, your investment philosophy, and experience..." rows={4} />
            </div>

            {/* Interests */}
            <div>
              <h3 className="font-display font-semibold mb-2 flex items-center gap-2"><Heart className="w-4 h-4 text-primary" /> Interests & Hobbies</h3>
              <p className="text-xs text-muted-foreground mb-3">Select activities you enjoy — we'll connect you with members who share similar interests!</p>
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map((interest) => {
                  const selected = (form.interests || []).includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                        selected
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-secondary/50 text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Social */}
            <div>
              <h3 className="font-display font-semibold mb-3">Social Links</h3>
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
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={updateMutation.isPending} className="gap-1.5">
                <Save className="w-3.5 h-3.5" /> Save Profile
              </Button>
              <Button type="button" variant="outline" onClick={() => { setEditing(false); setForm({ ...profile, interests: (profile as any).interests || [] }); }}>
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

            {/* Professional Info (view mode) */}
            {(profileData.investment_focus) && (
              <div>
                <h3 className="font-display font-semibold mb-2 flex items-center gap-2"><Target className="w-4 h-4 text-primary" /> Investment Focus</h3>
                <p className="text-sm text-muted-foreground">{profileData.investment_focus}</p>
              </div>
            )}

            {/* Interests (view mode) */}
            {(profileData.interests as string[] | undefined)?.length > 0 && (
              <div>
                <h3 className="font-display font-semibold mb-3 flex items-center gap-2"><Heart className="w-4 h-4 text-primary" /> Interests & Hobbies</h3>
                <div className="flex flex-wrap gap-2">
                  {(profileData.interests as string[]).map((interest: string) => (
                    <Badge key={interest} variant="secondary" className="text-sm px-3 py-1">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Emergency Contact & Beneficiary (view mode - private) */}
            {canSeePrivate && (profileData.emergency_contact_name || profileData.beneficiary_name) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {profileData.emergency_contact_name && (
                  <div>
                    <h3 className="font-display font-semibold mb-2 flex items-center gap-2"><UserCheck className="w-4 h-4 text-primary" /> Emergency Contact</h3>
                    <div className="bg-secondary/30 rounded-lg p-4 space-y-1">
                      <p className="text-sm font-medium">{profileData.emergency_contact_name}</p>
                      {profileData.emergency_contact_relationship && <p className="text-xs text-muted-foreground">{profileData.emergency_contact_relationship}</p>}
                      {profileData.emergency_contact_phone && <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> {profileData.emergency_contact_phone}</p>}
                    </div>
                  </div>
                )}
                {profileData.beneficiary_name && (
                  <div>
                    <h3 className="font-display font-semibold mb-2 flex items-center gap-2"><HeartHandshake className="w-4 h-4 text-primary" /> Beneficiary</h3>
                    <div className="bg-secondary/30 rounded-lg p-4 space-y-1">
                      <p className="text-sm font-medium">{profileData.beneficiary_name}</p>
                      {profileData.beneficiary_relationship && <p className="text-xs text-muted-foreground">{profileData.beneficiary_relationship}</p>}
                      {profileData.beneficiary_contact && <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> {profileData.beneficiary_contact}</p>}
                    </div>
                  </div>
                )}
              </div>
            )}

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

      {/* Pending & Signed Documents */}
      {(isOwnProfile || isAdmin) && allDocs.length > 0 && (
        <Card className="glass-card border-border mt-6 animate-fade-in">
          <CardContent className="p-6">
            <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Startup Documents
            </h3>

            {pendingDocs.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                    {pendingDocs.length} document{pendingDocs.length !== 1 ? "s" : ""} pending acknowledgment
                  </span>
                </div>
                <div className="space-y-2">
                  {pendingDocs.map((doc: any) => (
                    <div key={doc.id} className="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="w-4 h-4 text-amber-600 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{doc.title}</p>
                          <p className="text-xs text-muted-foreground">{startupNameMap[doc.startup_id]} • {doc.document_type?.toUpperCase()}</p>
                        </div>
                      </div>
                      <Link to={`/startups/${doc.startup_id}`}>
                        <Button size="sm" variant="outline" className="shrink-0">Review & Sign</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {signedDocs.length > 0 && (
              <div>
                {pendingDocs.length > 0 && <div className="border-t border-border my-4" />}
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    {signedDocs.length} document{signedDocs.length !== 1 ? "s" : ""} acknowledged
                  </span>
                </div>
                <div className="space-y-2">
                  {signedDocs.map((doc: any) => (
                    <div key={doc.id} className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{doc.title}</p>
                        <p className="text-xs text-muted-foreground">{startupNameMap[doc.startup_id]} • {doc.document_type?.toUpperCase()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pendingDocs.length === 0 && signedDocs.length === 0 && (
              <p className="text-sm text-muted-foreground">No documents to display.</p>
            )}
          </CardContent>
        </Card>
      )}
    </Layout>
  );
}
