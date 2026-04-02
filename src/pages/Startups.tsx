import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import StartupCard from "@/components/StartupCard";
import NewInvestmentDialog from "@/components/NewInvestmentDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { startups as mockStartups } from "@/lib/mock-data";
import type { Startup } from "@/lib/mock-data";
import { Briefcase, Send, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function mapDbToStartup(row: any): Startup {
  return {
    id: row.id,
    name: row.name,
    sector: row.sector,
    stage: row.stage,
    invested: Number(row.invested),
    currentValue: Number(row.current_value),
    progress: row.progress,
    status: row.status,
    founded: row.founded ?? "",
    description: row.description ?? "",
    investorIds: [],
  };
}

export default function Startups() {
  const queryClient = useQueryClient();
  const { user, isAdmin } = useAuth();

  const { data: startups = mockStartups, isLoading } = useQuery({
    queryKey: ["startups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("startups")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data.map(mapDbToStartup);
    },
  });

  // Fetch user's linked startups
  const { data: myLinks = [] } = useQuery({
    queryKey: ["my-startup-links", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("profile_startup_links" as any)
        .select("startup_id")
        .eq("profile_id", user.id);
      if (error) throw error;
      return (data as unknown as { startup_id: string }[]).map((d) => d.startup_id);
    },
    enabled: !!user,
  });

  // Fetch user's info requests
  const { data: myRequests = [] } = useQuery({
    queryKey: ["my-info-requests", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("startup_info_requests" as any)
        .select("startup_id, status")
        .eq("user_id", user.id);
      if (error) throw error;
      return data as unknown as { startup_id: string; status: string }[];
    },
    enabled: !!user,
  });

  const myStartupIds = new Set(myLinks);
  const requestMap = new Map(myRequests.map((r) => [r.startup_id, r.status]));
  const approvedRequestIds = new Set(myRequests.filter((r) => r.status === "approved").map((r) => r.startup_id));

  const requestInfoMutation = useMutation({
    mutationFn: async (startupId: string) => {
      const { error } = await supabase
        .from("startup_info_requests" as any)
        .insert({ user_id: user!.id, startup_id: startupId } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-info-requests"] });
      toast.success("Information request sent to admin");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const addMutation = useMutation({
    mutationFn: async (startup: {
      name: string;
      sector: string;
      stage: string;
      invested: number;
      description: string;
    }) => {
      const { error } = await supabase.from("startups").insert({
        name: startup.name,
        sector: startup.sector,
        stage: startup.stage,
        invested: startup.invested,
        current_value: startup.invested,
        description: startup.description || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["startups"] });
    },
  });

  return (
    <Layout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold">Startup Investments</h2>
          <p className="text-sm text-muted-foreground mt-1">Track all startup investments and their progress</p>
        </div>
        {isAdmin && <NewInvestmentDialog onAdd={(s) => addMutation.mutate(s)} isSubmitting={addMutation.isPending} />}
      </div>
      {isLoading ? (
        <p className="text-muted-foreground">Loading startups...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {startups.map((s) => {
            const canSeeDetails = isAdmin || myStartupIds.has(s.id);
            if (canSeeDetails) {
              return <StartupCard key={s.id} startup={s} />;
            }
            // Non-linked users see name only + request info button
            const reqStatus = requestMap.get(s.id);
            const isApproved = reqStatus === "approved";
            return (
              <div key={s.id} className="glass-card rounded-xl p-6 animate-fade-in">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <h3 className="font-display font-semibold">{s.name}</h3>
                </div>
                {isApproved && s.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-4">{s.description}</p>
                )}
                {isApproved && (
                  <p className="text-xs text-muted-foreground mb-3">
                    <span className="font-medium text-foreground">Sector:</span> {s.sector} &bull; <span className="font-medium text-foreground">Stage:</span> {s.stage}
                    {s.founded ? <> &bull; <span className="font-medium text-foreground">Founded:</span> {s.founded}</> : null}
                  </p>
                )}
                {user && !reqStatus && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-1"
                    onClick={() => requestInfoMutation.mutate(s.id)}
                    disabled={requestInfoMutation.isPending}
                  >
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    Request for Information
                  </Button>
                )}
                {reqStatus === "pending" && (
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-warning">
                    <Clock className="w-3.5 h-3.5" />
                    Request pending admin approval
                  </div>
                )}
                {isApproved && (
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-primary">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Information access granted
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
