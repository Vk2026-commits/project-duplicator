import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import StartupCard from "@/components/StartupCard";
import NewInvestmentDialog from "@/components/NewInvestmentDialog";
import { supabase } from "@/integrations/supabase/client";
import { startups as mockStartups } from "@/lib/mock-data";
import type { Startup } from "@/lib/mock-data";

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
        <NewInvestmentDialog onAdd={(s) => addMutation.mutate(s)} isSubmitting={addMutation.isPending} />
      </div>
      {isLoading ? (
        <p className="text-muted-foreground">Loading startups...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {startups.map((s) => (
            <StartupCard key={s.id} startup={s} />
          ))}
        </div>
      )}
    </Layout>
  );
}
