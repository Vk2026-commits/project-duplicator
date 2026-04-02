import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Phone, User } from "lucide-react";

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
            const canSeePrivate = isAdmin || isOwn;
            const initials = (p.full_name || "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

            return (
              <Link key={p.id} to={`/profile/${p.id}`} className="glass-card rounded-xl p-6 hover:border-primary/30 transition-all group animate-fade-in">
                <div className="flex items-center gap-4 mb-3">
                  {p.photo_url ? (
                    <img src={p.photo_url} alt={p.full_name || ""} className="w-14 h-14 rounded-full object-cover border-2 border-primary/20" />
                  ) : (
                    <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center text-lg font-bold text-primary-foreground">{initials}</div>
                  )}
                  <div>
                    <h3 className="font-display font-semibold group-hover:text-primary transition-colors">{p.full_name || "Unnamed"}</h3>
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
            );
          })}
        </div>
      )}
    </Layout>
  );
}
