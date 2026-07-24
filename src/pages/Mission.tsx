import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Zap, Eye, TrendingUp, Target, Users, Heart, Star } from "lucide-react";

const coreValues = [
  { icon: Shield, title: "Accountability", description: "We hold ourselves and each other to a high standard. Everyone contributes, executes, and follows through." },
  { icon: Zap, title: "Execution Over Talk", description: "Ideas are nothing without action. We move quickly, make decisions, and get deals done." },
  { icon: Eye, title: "Transparency", description: "Open communication and honesty guide every decision, deal, and relationship within the group." },
  { icon: TrendingUp, title: "Continuous Growth", description: "We are committed to learning, improving, and sharing knowledge to elevate everyone in the group." },
  { icon: Target, title: "Discipline", description: "We stay consistent with meetings, deal flow, and financial strategy—no shortcuts, no excuses." },
  { icon: Users, title: "Collaboration", description: "We leverage each other's strengths, networks, and experiences to create better outcomes together." },
  { icon: Heart, title: "Integrity", description: "We do what's right—even when it's not easy—building trust internally and externally." },
  { icon: Star, title: "Faith & Purpose", description: "We believe our work is guided by a higher purpose, and we strive to build something meaningful that impacts our lives and others." },
];

export default function Mission() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Mission Statement */}
        <div className="text-center space-y-6">
          <h1 className="text-3xl font-display font-bold text-foreground">Mission Statement</h1>
          <Card className="border-primary/20 bg-card/80 backdrop-blur">
            <CardContent className="p-8">
              <p className="text-lg leading-relaxed text-muted-foreground">
                Our mission is to unite driven individuals to build wealth through strategic investments, shared knowledge, and disciplined execution. We are committed to creating opportunities, generating consistent returns, and growing together—financially, professionally, and personally—while operating with integrity, accountability, and faith at the center of everything we do.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Core Values */}
        <div className="space-y-6">
          <h2 className="text-2xl font-display font-bold text-foreground text-center">🔑 Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coreValues.map((value, index) => (
              <Card key={value.title} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-6 flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <value.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">
                      {index + 1}. {value.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{value.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
