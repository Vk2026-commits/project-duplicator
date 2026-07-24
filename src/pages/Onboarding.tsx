import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Users, DollarSign, AlertTriangle, ShieldCheck, Handshake,
  FileText, ChevronRight, ChevronLeft, Check
} from "lucide-react";
import { toast } from "sonner";

const TOTAL_STEPS = 6;

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { startupId } = useParams<{ startupId: string }>();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Fetch startup info if we have a startupId
  const { data: startup } = useQuery({
    queryKey: ["onboarding-startup", startupId],
    queryFn: async () => {
      if (!startupId) return null;
      const { data, error } = await supabase.from("startups").select("id, name, description, sector").eq("id", startupId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!startupId,
  });

  // Check if already completed onboarding for this startup
  const { data: existingAgreements = [] } = useQuery({
    queryKey: ["existing-onboarding", user?.id, startupId],
    queryFn: async () => {
      if (!user) return [];
      let query = supabase.from("onboarding_agreements").select("agreement_type").eq("user_id", user.id);
      if (startupId) {
        query = query.eq("startup_id", startupId);
      } else {
        query = query.is("startup_id", null);
      }
      const { data } = await query;
      return data || [];
    },
    enabled: !!user,
  });

  const alreadyCompleted = existingAgreements.length >= 2;

  useEffect(() => {
    if (alreadyCompleted) {
      toast.info("You've already completed onboarding for this group.");
      navigate("/dashboard");
    }
  }, [alreadyCompleted, navigate]);

  const groupName = startup?.name || "The Fellows Investment Group LLC";

  // Risk checkboxes
  const [riskChecks, setRiskChecks] = useState([false, false, false]);
  const [confChecks, setConfChecks] = useState([false, false, false]);
  const [capitalCheck, setCapitalCheck] = useState(false);
  const [fullName, setFullName] = useState("");
  const [signatureDate] = useState(new Date().toISOString().split("T")[0]);

  const toggleRisk = (i: number) => setRiskChecks(p => { const c = [...p]; c[i] = !c[i]; return c; });
  const toggleConf = (i: number) => setConfChecks(p => { const c = [...p]; c[i] = !c[i]; return c; });

  const canProceed = () => {
    if (step === 3) return riskChecks.every(Boolean);
    if (step === 4) return confChecks.every(Boolean);
    if (step === 5) return capitalCheck;
    if (step === 6) return fullName.trim().length > 2;
    return true;
  };

  const handleSubmit = async () => {
    if (!user || !fullName.trim()) return;
    setSubmitting(true);
    try {
      const baseRow = {
        user_id: user.id,
        full_name: fullName.trim(),
        ...(startupId ? { startup_id: startupId } : {}),
      };

      const { error: e1 } = await supabase.from("onboarding_agreements").insert({
        ...baseRow,
        agreement_type: "operating_agreement",
      });
      if (e1 && !e1.message.includes("duplicate")) throw e1;

      const { error: e2 } = await supabase.from("onboarding_agreements").insert({
        ...baseRow,
        agreement_type: "onboarding_packet",
      });
      if (e2 && !e2.message.includes("duplicate")) throw e2;

      toast.success(`Agreements signed successfully! Welcome to ${groupName}.`);
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Failed to save. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const progress = (step / TOTAL_STEPS) * 100;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Step {step} of {TOTAL_STEPS}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card className="glass-card border-border animate-fade-in">
          <CardContent className="p-8">
            {/* STEP 1: Welcome */}
            {step === 1 && (
              <div className="space-y-6 text-center">
                <div className="flex justify-center">
                  <div className="p-4 rounded-full bg-primary/10 border border-primary/20">
                    <Users className="w-10 h-10 text-primary" />
                  </div>
                </div>
                <h1 className="font-display text-3xl font-bold">Welcome to {groupName}</h1>
                <p className="text-muted-foreground leading-relaxed max-w-lg mx-auto">
                  {startup?.description || "This is a private investment group where members pool capital, evaluate opportunities, and build wealth collectively."} Before accessing the platform, please review and agree to the group's operating terms.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                  <div className="bg-secondary/50 rounded-lg p-4 text-center">
                    <DollarSign className="w-5 h-5 text-primary mx-auto mb-2" />
                    <p className="text-sm font-medium">Pool Capital</p>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-4 text-center">
                    <FileText className="w-5 h-5 text-primary mx-auto mb-2" />
                    <p className="text-sm font-medium">Evaluate Deals</p>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-4 text-center">
                    <Handshake className="w-5 h-5 text-primary mx-auto mb-2" />
                    <p className="text-sm font-medium">Build Wealth</p>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Investment Terms */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <DollarSign className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="font-display text-2xl font-bold">Investment Terms — {groupName}</h2>
                </div>
                <div className="space-y-4">
                  {[
                    { label: "Monthly Contribution", value: "$1,000 / month", desc: "Required from all members" },
                    { label: "Seed Capital", value: "$5,000 total", desc: "Paid over 5 months — permanent, non-withdrawable" },
                    { label: "Voting Structure", value: "70% majority", desc: "Required to approve any investment deal" },
                    { label: "Participation", value: "Mandatory", desc: "Monthly meetings with quarterly in-person" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-4 bg-secondary/30 rounded-lg p-4 border border-border">
                      <Check className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-semibold text-foreground">{item.label}:</span>
                          <span className="text-primary font-bold">{item.value}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    <strong>Default Policy:</strong> Missing 3 months of contributions may result in removal.
                    Ownership interest will be bought out at Fair Market Value.
                  </p>
                </div>
              </div>
            )}

            {/* STEP 3: Risk Disclosure */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-destructive/10">
                    <AlertTriangle className="w-6 h-6 text-destructive" />
                  </div>
                  <h2 className="font-display text-2xl font-bold">Investment Risk Acknowledgment</h2>
                </div>
                <p className="text-muted-foreground">All investments carry risk. Please confirm you understand the following:</p>
                <div className="space-y-3">
                  {[
                    "I understand I may lose my entire investment — all investments involve risk, including loss of 100% of capital",
                    "No returns are guaranteed — projections and forecasts are speculative and not promises of performance",
                    "My participation is voluntary — I am investing at my own discretion and have had the opportunity to seek independent advice",
                  ].map((text, i) => (
                    <label key={i} className="flex items-start gap-3 p-4 rounded-lg border border-border hover:bg-secondary/30 transition-colors cursor-pointer">
                      <Checkbox checked={riskChecks[i]} onCheckedChange={() => toggleRisk(i)} className="mt-0.5" />
                      <span className="text-sm text-foreground leading-relaxed">{text}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 4: Confidentiality & Conduct */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <ShieldCheck className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="font-display text-2xl font-bold">Confidentiality & Conduct</h2>
                </div>
                <p className="text-muted-foreground">To protect all members and the group's interests, please agree to the following:</p>
                <div className="space-y-3">
                  {[
                    "I agree to maintain confidentiality — all group information, opportunities, and discussions are private and may not be shared externally (5-year survival period)",
                    "I agree not to circumvent group deals — I will not independently pursue deals sourced through the group or use group relationships for personal gain",
                    "I agree to the non-compete terms — I will not compete using group opportunities for 2 years. Violation may result in liquidated damages of $25,000 or 3x profits and forced buyout at up to 50% discount",
                  ].map((text, i) => (
                    <label key={i} className="flex items-start gap-3 p-4 rounded-lg border border-border hover:bg-secondary/30 transition-colors cursor-pointer">
                      <Checkbox checked={confChecks[i]} onCheckedChange={() => toggleConf(i)} className="mt-0.5" />
                      <span className="text-sm text-foreground leading-relaxed">{text}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 5: Capital Commitment */}
            {step === 5 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Handshake className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="font-display text-2xl font-bold">Capital Commitment</h2>
                </div>
                <div className="space-y-4">
                  <div className="bg-secondary/30 rounded-lg p-6 border border-border space-y-3">
                    <h3 className="font-semibold">By joining {groupName}, I commit to:</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2"><Check className="w-4 h-4 text-primary mt-0.5 shrink-0" /> Contributing <strong className="text-foreground">$1,000 per month</strong></li>
                      <li className="flex items-start gap-2"><Check className="w-4 h-4 text-primary mt-0.5 shrink-0" /> Reaching <strong className="text-foreground">$5,000 seed capital</strong> (permanent, non-withdrawable)</li>
                      <li className="flex items-start gap-2"><Check className="w-4 h-4 text-primary mt-0.5 shrink-0" /> Remaining current on all contributions</li>
                      <li className="flex items-start gap-2"><Check className="w-4 h-4 text-primary mt-0.5 shrink-0" /> Understanding that exiting means a buyout at <strong className="text-foreground">Fair Market Value</strong></li>
                    </ul>
                  </div>
                  <label className="flex items-start gap-3 p-4 rounded-lg border border-primary/30 bg-primary/5 cursor-pointer">
                    <Checkbox checked={capitalCheck} onCheckedChange={() => setCapitalCheck(!capitalCheck)} className="mt-0.5" />
                    <span className="text-sm text-foreground font-medium leading-relaxed">
                      I commit to the monthly capital contributions and understand the seed capital structure, default policy, and exit/buyout terms
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* STEP 6: Digital Signature */}
            {step === 6 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="font-display text-2xl font-bold">Digital Signature</h2>
                </div>
                <p className="text-muted-foreground">
                  By signing below, you confirm that you have read and agree to the Full Operating Agreement
                  and Member Onboarding Packet of {groupName}.
                </p>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Full Legal Name</Label>
                      <Input placeholder="Type your full legal name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input type="date" value={signatureDate} disabled />
                    </div>
                  </div>
                  {fullName.trim() && (
                    <div className="bg-secondary/30 rounded-lg p-6 border border-border">
                      <p className="text-xs text-muted-foreground mb-1">Signature Preview</p>
                      <p className="font-display text-3xl italic text-primary">{fullName}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t border-border">
              {step > 1 ? (
                <Button variant="outline" onClick={() => setStep(step - 1)} className="gap-1.5">
                  <ChevronLeft className="w-4 h-4" /> Back
                </Button>
              ) : <div />}

              {step < TOTAL_STEPS ? (
                <Button onClick={() => setStep(step + 1)} disabled={!canProceed()} className="gap-1.5">
                  Continue <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={!canProceed() || submitting} className="gap-1.5">
                  {submitting ? "Submitting…" : "Agree & Join"}
                  {!submitting && <Check className="w-4 h-4" />}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
