import Layout from "@/components/Layout";
import InvestorTable from "@/components/InvestorTable";

export default function Investors() {
  return (
    <Layout>
      <div className="mb-8">
        <h2 className="font-display text-2xl font-bold">Investors</h2>
        <p className="text-sm text-muted-foreground mt-1">All investors across your startup portfolio</p>
      </div>
      <InvestorTable />
    </Layout>
  );
}
