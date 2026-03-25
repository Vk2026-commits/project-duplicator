import Layout from "@/components/Layout";
import StartupCard from "@/components/StartupCard";
import { Button } from "@/components/ui/button";
import { startups } from "@/lib/mock-data";
import { PlusCircle } from "lucide-react";

export default function Startups() {
  return (
    <Layout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold">Startup Investments</h2>
          <p className="text-sm text-muted-foreground mt-1">Track all startup investments and their progress</p>
        </div>
        <Button className="gap-2">
          <PlusCircle className="w-4 h-4" />
          New Investment
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {startups.map((s) => (
          <StartupCard key={s.id} startup={s} />
        ))}
      </div>
    </Layout>
  );
}
