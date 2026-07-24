import { useState } from "react";
import Layout from "@/components/Layout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calculator, BookOpen, FileText, TrendingUp, DollarSign, Percent, BarChart3, ArrowRight, Info } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Investment Rounds Education                                       */
/* ------------------------------------------------------------------ */
function InvestmentRoundsTab() {
  const rounds = [
    {
      name: "Seed Round",
      color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      purpose: "Prove the idea works, build product, get early traction.",
      investors: "Founders, friends & family, small investor groups.",
      raise: "$50K – $2M",
      valuation: "$500K – $5M",
      example: {
        valuation: "$1,000,000",
        investment: "$100,000",
        ownership: "10%",
      },
    },
    {
      name: "Series A",
      color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      purpose: "Scale the business, hire team, expand market.",
      investors: "Venture capital firms, angel investors.",
      raise: "$2M – $15M",
      valuation: "$5M – $30M+",
      example: {
        valuation: "$10,000,000",
        investment: "$5,000,000 raised",
        ownership: "Seed 10% → ~6–7% (diluted)",
        valueNote: "10% of $1M = $100K → 6% of $10M = $600K",
      },
    },
    {
      name: "Series B",
      color: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      purpose: "Expand nationally/internationally, build infrastructure.",
      investors: "Growth-stage VCs, private equity.",
      raise: "$10M – $50M+",
      valuation: "$30M – $150M+",
      example: {
        valuation: "$50,000,000",
        investment: "Continued growth",
        ownership: "~4%",
        valueNote: "4% of $50M = $2,000,000",
      },
    },
    {
      name: "Series C",
      color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      purpose: "Dominate market, prepare for sale or IPO.",
      investors: "Late-stage VCs, hedge funds, banks.",
      raise: "$50M+",
      valuation: "$100M – $1B+",
      example: {
        valuation: "$200,000,000",
        investment: "Major expansion capital",
        ownership: "~2–3%",
        valueNote: "2.5% of $200M = $5,000,000",
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Key Formulas */}
      <Card className="glass-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="w-5 h-5 text-primary" /> Key Formulas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-secondary/50 rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">Ownership %</p>
              <p className="font-mono text-sm text-foreground">Ownership = (Your Investment ÷ Company Valuation) × 100</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">Dilution (Simplified)</p>
              <p className="font-mono text-sm text-foreground">New % = Old % × (Old Valuation ÷ New Valuation)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rounds */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rounds.map((r) => (
          <Card key={r.name} className="glass-card border-border">
            <CardHeader className="pb-3">
              <Badge variant="outline" className={`w-fit ${r.color}`}>{r.name}</Badge>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Purpose</p>
                <p>{r.purpose}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Who Invests</p>
                <p>{r.investors}</p>
              </div>
              <div className="flex gap-4">
                <div>
                  <p className="text-muted-foreground text-xs">Typical Raise</p>
                  <p className="font-semibold">{r.raise}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Valuation</p>
                  <p className="font-semibold">{r.valuation}</p>
                </div>
              </div>
              <Separator />
              <div className="bg-secondary/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Example</p>
                <p className="text-xs">Valuation: <span className="font-semibold">{r.example.valuation}</span></p>
                <p className="text-xs">Investment: <span className="font-semibold">{r.example.investment}</span></p>
                <p className="text-xs">Ownership: <span className="font-semibold text-primary">{r.example.ownership}</span></p>
                {r.example.valueNote && (
                  <p className="text-xs mt-1 text-muted-foreground italic">{r.example.valueNote}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick takeaway */}
      <Card className="glass-card border-primary/20">
        <CardContent className="pt-6">
          <p className="text-sm italic text-muted-foreground">
            "We want to get in early when ownership is cheap. As the company grows, our percentage may go down,
            but the value of that percentage goes way up. That's how small investments turn into big returns."
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Strategy & MOU                                                    */
/* ------------------------------------------------------------------ */
function StrategyTab() {
  return (
    <div className="space-y-6">
      {/* Investment Structures */}
      <Card className="glass-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Investment Structures</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            {
              title: "Option 1: Direct Equity Investment",
              desc: "You invest capital and own a percentage of the company directly.",
              example: "Invest $50K → own 5%.",
            },
            {
              title: "Option 2: Convertible Note",
              desc: "You invest money now that converts to equity later at a discount, giving you more ownership than the next round's investors.",
              example: "Invest $50K. Next round valuation = $5M. You convert at $4M discount → more ownership.",
            },
            {
              title: "Option 3: SAFE Agreement",
              desc: "Simple Agreement for Future Equity. No valuation set now — converts to equity during the next priced round.",
              example: "Common in early-stage startups. Simpler than convertible notes.",
            },
          ].map((opt) => (
            <div key={opt.title} className="bg-secondary/30 rounded-lg p-4">
              <p className="font-semibold text-sm mb-1">{opt.title}</p>
              <p className="text-sm text-muted-foreground">{opt.desc}</p>
              <p className="text-xs text-primary mt-2">{opt.example}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* How Returns Work */}
      <Card className="glass-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">How Returns Work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-0.5">1</Badge>
            <div>
              <p className="font-semibold">Exit (Company Sold)</p>
              <p className="text-muted-foreground">Company sells for $100M, you own 3% → you receive $3M.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-0.5">2</Badge>
            <div>
              <p className="font-semibold">Dividends</p>
              <p className="text-muted-foreground">Rare in early-stage, but some companies distribute profits.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-0.5">3</Badge>
            <div>
              <p className="font-semibold">Buyout</p>
              <p className="text-muted-foreground">Bigger investors buy your shares at a premium.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Strategy */}
      <Card className="glass-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Portfolio Strategy</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-3">
          <p className="text-muted-foreground">Instead of one deal, diversify across multiple early-stage opportunities:</p>
          <div className="bg-secondary/30 rounded-lg p-4">
            <p className="font-mono text-xs mb-2">5 investments × $20K each = $100K portfolio</p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>• 2 may fail</p>
              <p>• 2 break even</p>
              <p>• 1 becomes a big winner → pays for everything</p>
            </div>
          </div>
          <Separator />
          <div>
            <p className="font-semibold mb-2">Recommended Phases</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <Badge>Phase 1</Badge> <span>Build capital, learn investing discipline</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Badge>Phase 2</Badge> <span>Start small seed deals ($10K–$50K per deal)</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Badge>Phase 3</Badge> <span>Double down on winners</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MOU Language */}
      <Card className="glass-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Suggested MOU Language</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="bg-secondary/30 rounded-lg p-4 border-l-2 border-primary">
            <p className="italic text-muted-foreground">
              "The Group will prioritize early-stage (seed) investments where possible to maximize equity ownership and long-term return potential."
            </p>
          </div>
          <div className="bg-secondary/30 rounded-lg p-4 border-l-2 border-primary">
            <p className="italic text-muted-foreground">
              "The Group may participate in subsequent funding rounds (Series A, B, C) at its discretion to maintain or increase ownership percentage."
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Investment Calculator                                             */
/* ------------------------------------------------------------------ */
function InvestmentCalculator() {
  const [companyValuation, setCompanyValuation] = useState<string>("");
  const [investmentAmount, setInvestmentAmount] = useState<string>("");
  const [fundingRound, setFundingRound] = useState<string>("");
  const [exitValuation, setExitValuation] = useState<string>("");
  const [nextRoundValuation, setNextRoundValuation] = useState<string>("");

  const valuation = parseFloat(companyValuation) || 0;
  const investment = parseFloat(investmentAmount) || 0;
  const exit = parseFloat(exitValuation) || 0;
  const nextRound = parseFloat(nextRoundValuation) || 0;

  const ownershipPct = valuation > 0 ? (investment / valuation) * 100 : 0;
  const exitValue = exit > 0 ? (ownershipPct / 100) * exit : 0;
  const roi = investment > 0 && exitValue > 0 ? ((exitValue - investment) / investment) * 100 : 0;
  const roiMultiple = investment > 0 && exitValue > 0 ? exitValue / investment : 0;

  // Dilution
  const dilutedPct = nextRound > 0 && valuation > 0 ? ownershipPct * (valuation / nextRound) : 0;
  const dilutedValue = nextRound > 0 ? (dilutedPct / 100) * nextRound : 0;

  const fmt = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div className="space-y-6">
      {/* Inputs */}
      <Card className="glass-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calculator className="w-5 h-5 text-primary" /> Investment Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" /> Company Valuation
              </Label>
              <Input
                type="number"
                placeholder="e.g. 1000000"
                value={companyValuation}
                onChange={(e) => setCompanyValuation(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" /> Your Investment Amount
              </Label>
              <Input
                type="number"
                placeholder="e.g. 100000"
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" /> Projected Exit Valuation
              </Label>
              <Input
                type="number"
                placeholder="e.g. 50000000"
                value={exitValuation}
                onChange={(e) => setExitValuation(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">What you think the company could be worth at exit</p>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" /> Next Round Valuation (Optional)
              </Label>
              <Input
                type="number"
                placeholder="e.g. 10000000"
                value={nextRoundValuation}
                onChange={(e) => setNextRoundValuation(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">To calculate dilution at the next funding round</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {valuation > 0 && investment > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass-card border-primary/20">
            <CardContent className="pt-6 text-center">
              <Percent className="w-8 h-8 mx-auto text-primary mb-2" />
              <p className="text-xs text-muted-foreground">Your Ownership</p>
              <p className="text-3xl font-bold text-primary">{ownershipPct.toFixed(2)}%</p>
              <p className="text-xs text-muted-foreground mt-1">of {fmt(valuation)} valuation</p>
            </CardContent>
          </Card>

          {exit > 0 && (
            <Card className="glass-card border-emerald-500/20">
              <CardContent className="pt-6 text-center">
                <DollarSign className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
                <p className="text-xs text-muted-foreground">Exit Value</p>
                <p className="text-3xl font-bold text-emerald-400">{fmt(exitValue)}</p>
                <p className="text-xs text-muted-foreground mt-1">{roiMultiple.toFixed(1)}x return</p>
              </CardContent>
            </Card>
          )}

          {exit > 0 && (
            <Card className="glass-card border-amber-500/20">
              <CardContent className="pt-6 text-center">
                <TrendingUp className="w-8 h-8 mx-auto text-amber-400 mb-2" />
                <p className="text-xs text-muted-foreground">ROI</p>
                <p className="text-3xl font-bold text-amber-400">{roi.toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground mt-1">return on investment</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Dilution Results */}
      {nextRound > 0 && ownershipPct > 0 && (
        <Card className="glass-card border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ArrowRight className="w-5 h-5 text-muted-foreground" /> Dilution Projection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-secondary/30 rounded-lg p-4 text-center">
                <p className="text-xs text-muted-foreground">Current Ownership</p>
                <p className="text-xl font-bold">{ownershipPct.toFixed(2)}%</p>
              </div>
              <div className="bg-secondary/30 rounded-lg p-4 text-center">
                <p className="text-xs text-muted-foreground">After Next Round</p>
                <p className="text-xl font-bold text-amber-400">{dilutedPct.toFixed(2)}%</p>
              </div>
              <div className="bg-secondary/30 rounded-lg p-4 text-center">
                <p className="text-xs text-muted-foreground">Value After Dilution</p>
                <p className="text-xl font-bold text-emerald-400">{fmt(dilutedValue)}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3 italic">
              Even though your percentage decreases, your value increases if the company valuation grows.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Quick scenarios */}
      <Card className="glass-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Full Example Walkthrough</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-muted-foreground font-medium">Round</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">Valuation</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">Your %</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">Your Value</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { round: "Seed", val: 1_000_000, pct: 10 },
                  { round: "Series A", val: 10_000_000, pct: 6 },
                  { round: "Series B", val: 50_000_000, pct: 4 },
                  { round: "Series C", val: 200_000_000, pct: 2.5 },
                ].map((r) => (
                  <tr key={r.round} className="border-b border-border/50">
                    <td className="py-2 font-medium">{r.round}</td>
                    <td className="py-2 text-right">{fmt(r.val)}</td>
                    <td className="py-2 text-right text-primary">{r.pct}%</td>
                    <td className="py-2 text-right text-emerald-400">{fmt(r.val * r.pct / 100)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-3">Based on a $100K seed investment at $1M valuation.</p>
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                         */
/* ------------------------------------------------------------------ */
export default function Information() {
  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="font-display text-3xl font-bold">
            <Info className="w-7 h-7 inline-block mr-2 text-primary" />
            Investment Information
          </h1>
          <p className="text-muted-foreground mt-1">Learn about funding rounds, strategies, and calculate your potential returns.</p>
        </div>

        <Tabs defaultValue="rounds" className="w-full">
          <TabsList className="w-full md:w-auto">
            <TabsTrigger value="rounds" className="gap-1.5">
              <BookOpen className="w-3.5 h-3.5" /> Investment Rounds
            </TabsTrigger>
            <TabsTrigger value="strategy" className="gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Strategy & MOU
            </TabsTrigger>
            <TabsTrigger value="calculator" className="gap-1.5">
              <Calculator className="w-3.5 h-3.5" /> Calculator
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rounds">
            <InvestmentRoundsTab />
          </TabsContent>
          <TabsContent value="strategy">
            <StrategyTab />
          </TabsContent>
          <TabsContent value="calculator">
            <InvestmentCalculator />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
