import { useState } from "react";
import Layout from "@/components/Layout";
import StartupCard from "@/components/StartupCard";
import NewInvestmentDialog from "@/components/NewInvestmentDialog";
import { startups as initialStartups, type Startup } from "@/lib/mock-data";

export default function Startups() {
  const [allStartups, setAllStartups] = useState<Startup[]>(initialStartups);

  const handleAdd = (newStartup: Startup) => {
    setAllStartups((prev) => [...prev, newStartup]);
  };

  return (
    <Layout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold">Startup Investments</h2>
          <p className="text-sm text-muted-foreground mt-1">Track all startup investments and their progress</p>
        </div>
        <NewInvestmentDialog onAdd={handleAdd} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allStartups.map((s) => (
          <StartupCard key={s.id} startup={s} />
        ))}
      </div>
    </Layout>
  );
}
