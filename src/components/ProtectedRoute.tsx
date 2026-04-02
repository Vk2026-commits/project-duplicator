import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile-completion-check", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("profile_completed")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!user,
    staleTime: 30000,
  });

  if (loading || (user && profileLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to profile page if profile is incomplete (but don't redirect if already on profile page)
  if (profile && !profile.profile_completed) {
    const currentPath = window.location.pathname;
    const profilePath = `/profile/${user.id}`;
    // Allow profile page, disclosures, and onboarding
    if (!currentPath.startsWith("/profile/") && !currentPath.startsWith("/disclosures") && !currentPath.startsWith("/onboarding")) {
      return <Navigate to={profilePath} replace />;
    }
  }

  return <>{children}</>;
}
