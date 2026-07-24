import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Shield, AlertTriangle, FileText, Lock, Scale, Clock, TrendingUp, Users, Eye, BookOpen } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const disclaimerSections = [
  {
    icon: AlertTriangle,
    title: "No Guarantee of Returns",
    content: "All investments involve risk. Faithnancial Investment Group LLC makes no guarantees, representations, or warranties regarding profitability, performance, or return on investment. There is no assurance that any investment will be successful.",
  },
  {
    icon: TrendingUp,
    title: "Risk of Loss",
    content: "You acknowledge and agree that all investments carry risk, including the potential loss of your entire investment. You may lose some or all of the capital you invest.",
  },
  {
    icon: Users,
    title: "Voluntary Participation",
    content: "Participation in this investment group is completely voluntary. Members choose to participate at their own discretion and are under no obligation to invest in any opportunity presented.",
  },
  {
    icon: Scale,
    title: "No Financial, Legal, or Tax Advice",
    content: "Faithnancial Investment Group LLC does not provide financial, legal, or tax advice. All information shared is for informational purposes only. Members are strongly encouraged to consult with their own professional advisors before making any investment decisions.",
  },
  {
    icon: BookOpen,
    title: "Independent Decision-Making",
    content: "Each member is solely responsible for conducting their own due diligence and making independent investment decisions. The Group does not assume responsibility for any individual investment decisions.",
  },
  {
    icon: Clock,
    title: "Illiquidity of Investments",
    content: "Investments made through the Group may be illiquid and may not be easily sold, transferred, or exited. Members should be prepared for long-term investment horizons.",
  },
  {
    icon: TrendingUp,
    title: "Forward-Looking Statements",
    content: "Any projections, forecasts, or forward-looking statements are speculative in nature and are not guarantees of future performance.",
  },
  {
    icon: Shield,
    title: "Limitation of Liability",
    content: "Faithnancial Investment Group LLC and its members shall not be held liable for any financial losses, damages, or outcomes resulting from investment decisions made by any participant.",
  },
  {
    icon: Lock,
    title: "Private Investment Group",
    content: "This is a private investment group and does not solicit investments from the general public.",
  },
  {
    icon: Eye,
    title: "Confidentiality",
    content: "All information, opportunities, and discussions within the Group are confidential and may not be shared outside of the Group without prior consent.",
  },
];

const acknowledgmentItems = [
  "I acknowledge that all investments involve risk and I may lose my entire investment",
  "I understand that no returns are guaranteed",
  "I am participating voluntarily and at my own discretion",
  "I understand that I am responsible for my own investment decisions",
  "I have had the opportunity to seek financial, legal, and tax advice",
  "I agree to abide by the rules and structure of Faithnancial Investment Group LLC",
];

export default function Disclosures() {
  const { user } = useAuth();
  const [checkedItems, setCheckedItems] = useState<boolean[]>(new Array(acknowledgmentItems.length).fill(false));
  const [fullName, setFullName] = useState("");
  const [signatureDate, setSignatureDate] = useState(new Date().toISOString().split("T")[0]);
  const [submitting, setSubmitting] = useState(false);
  const [alreadyAccepted, setAlreadyAccepted] = useState(false);
  const [acceptedDate, setAcceptedDate] = useState<string | null>(null);

  const allChecked = checkedItems.every(Boolean);
  const canSubmit = allChecked && fullName.trim().length > 0 && user;

  useEffect(() => {
    if (!user) return;
    supabase
      .from("disclaimer_acceptances")
      .select("accepted_at, full_name")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setAlreadyAccepted(true);
          setAcceptedDate(data.accepted_at);
          setFullName(data.full_name);
        }
      });
  }, [user]);

  const handleSubmit = async () => {
    if (!user || !canSubmit) return;
    setSubmitting(true);
    const { error } = await supabase
      .from("disclaimer_acceptances")
      .insert({ user_id: user.id, full_name: fullName.trim() });

    if (error) {
      toast.error("Failed to save acknowledgment. Please try again.");
    } else {
      toast.success("Disclaimer acknowledged successfully.");
      setAlreadyAccepted(true);
      setAcceptedDate(new Date().toISOString());
    }
    setSubmitting(false);
  };

  const toggleCheck = (index: number) => {
    setCheckedItems((prev) => {
      const copy = [...prev];
      copy[index] = !copy[index];
      return copy;
    });
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* HERO */}
        <div className="text-center space-y-4 py-8">
          <div className="flex justify-center">
            <div className="p-3 rounded-full bg-primary/10 border border-primary/20">
              <FileText className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            Investment Disclosures & Risk Disclaimer
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Please read this information carefully before participating in any investment opportunities with Faithnancial Investment Group LLC.
          </p>
        </div>

        <Separator />

        {/* DISCLAIMER SECTIONS */}
        <div className="space-y-4">
          {disclaimerSections.map((section) => (
            <Card key={section.title} className="glass-card border-border">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="p-2 rounded-lg bg-secondary">
                      <section.icon className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-foreground mb-2">{section.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{section.content}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Separator />

        {/* ACKNOWLEDGMENT */}
        {alreadyAccepted ? (
          <Card className="glass-card border-accent/30">
            <CardContent className="p-8 text-center space-y-3">
              <Shield className="w-10 h-10 text-accent mx-auto" />
              <h3 className="font-display text-lg font-semibold text-foreground">Disclaimer Acknowledged</h3>
              <p className="text-sm text-muted-foreground">
                Signed by <span className="font-semibold text-foreground">{fullName}</span> on{" "}
                {acceptedDate ? new Date(acceptedDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="glass-card border-border">
              <CardHeader>
                <CardTitle className="font-display text-xl flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Member Acknowledgment
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Please review and confirm your agreement before proceeding.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {acknowledgmentItems.map((item, i) => (
                  <label
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
                  >
                    <Checkbox
                      checked={checkedItems[i]}
                      onCheckedChange={() => toggleCheck(i)}
                      className="mt-0.5"
                    />
                    <span className="text-sm text-foreground leading-relaxed">{item}</span>
                  </label>
                ))}
              </CardContent>
            </Card>

            {/* DIGITAL SIGNATURE */}
            <Card className="glass-card border-border">
              <CardHeader>
                <CardTitle className="font-display text-xl">Digital Signature</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input
                      placeholder="Type your full legal name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" value={signatureDate} onChange={(e) => setSignatureDate(e.target.value)} />
                  </div>
                </div>
                {fullName.trim() && (
                  <div className="bg-secondary/30 rounded-lg p-4 border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Signature Preview</p>
                    <p className="font-display text-2xl italic text-primary">{fullName}</p>
                  </div>
                )}
                <Button
                  className="w-full"
                  size="lg"
                  disabled={!canSubmit || submitting}
                  onClick={handleSubmit}
                >
                  {submitting ? "Submitting…" : "Agree & Continue"}
                </Button>
                {!user && (
                  <p className="text-xs text-center text-muted-foreground">
                    You must be signed in to submit your acknowledgment.
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* FOOTER DISCLAIMER */}
        <div className="border-t border-border pt-6 pb-4">
          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            All investments involve risk, including the possible loss of principal. No guarantees are made regarding investment performance. Participation is voluntary and at your own risk.
          </p>
        </div>
      </div>
    </Layout>
  );
}
