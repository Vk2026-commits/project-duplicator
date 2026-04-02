import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Phone, User } from "lucide-react";

function getDisplayName(fullName: string | null, canSeeFull: boolean): string {
  if (!fullName) return canSeeFull ? "Unnamed" : "?";
  if (canSeeFull) return fullName;
  const parts = fullName.trim().split(" ");
  if (parts.length === 1) return parts[0][0] + ".";
  return parts[0][0] + ". " + parts[parts.length - 1];
}

export default function InvestorDirectory() {
  const { isAdmin, user } = useAuth();

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["all-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Fetch all profile-startup links to determine co-investors
  const { data: allLinks = [] } = useQuery({
    queryKey: ["all-profile-startup-links"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profile_startup_links" as any).select("profile_id, startup_id");
      if (error) throw error;
      return data as { profile_id: string; startup_id: string }[];
    },
  });

  // Determine which profiles share a startup with the current user
  const myStartupIds = new Set(
    allLinks.filter((l) => l.profile_id === user?.id).map((l) => l.startup_id)
  );
  const coInvestorIds = new Set(
    allLinks.filter((l) => l.profile_id !== user?.id && myStartupIds.has(l.startup_id)).map((l) => l.profile_id)
  );

  return (
    <Layout>
      <div className="mb-8">
        <h2 className="font-display text-2xl font-bold">Investor Directory</h2>
        <p className="text-sm text-muted-foreground mt-1">Browse investor profiles</p>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : profiles.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center">
          <User className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No investor profiles yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map((p) => {
            const isOwn = user?.id === p.id;
            const isCoInvestor = coInvestorIds.has(p.id);
            const canSeeFull = isAdmin || isOwn || isCoInvestor;
            const canSeePrivate = isAdmin || isOwn;
            const displayName = getDisplayName(p.full_name, canSeeFull);
            const initials = (displayName || "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

            return (
              <div key={p.id} className="glass-card rounded-xl p-6 animate-fade-in">
                {canSeeFull ? (
                  <Link to={`/profile/${p.id}`} className="block hover:border-primary/30 transition-all group">
                    <div className="flex items-center gap-4 mb-3">
                      {p.photo_url ? (
                        <img src={p.photo_url} alt={p.full_name || ""} className="w-14 h-14 rounded-full object-cover border-2 border-primary/20" />
                      ) : (
                        <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center text-lg font-bold text-primary-foreground">{initials}</div>
                      )}
                      <div>
                        <h3 className="font-display font-semibold group-hover:text-primary transition-colors">{displayName}</h3>
                        {canSeePrivate && p.email && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" /> {p.email}</p>
                        )}
                        {canSeePrivate && p.phone && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> {p.phone}</p>
                        )}
                      </div>
                    </div>
                    {p.bio && <p className="text-sm text-muted-foreground line-clamp-2">{p.bio}</p>}
                  </Link>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-lg font-bold text-muted-foreground">{initials}</div>
                    <div>
                      <h3 className="font-display font-semibold text-muted-foreground">{displayName}</h3>
                      <p className="text-xs text-muted-foreground">Investor</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
