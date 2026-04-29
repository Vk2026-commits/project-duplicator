import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileLock2,
  Handshake,
  HeartHandshake,
  Landmark,
  Lock,
  LockKeyhole,
  Mail,
  Map,
  Network,
  PiggyBank,
  Repeat2,
  ShieldCheck,
  Sparkles,
  Target,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";

const budgetAppUrl = "https://budget.faithnancial.com";
const estateAppUrl = "https://www.heirloom.faithnancial.com";

const principles = [
  { letter: "F", word: "Faith", description: "Daily scripture & devotional", icon: BookOpen },
  { letter: "A", word: "Accountability", description: "Small group check-ins", icon: Users },
  { letter: "I", word: "Intentionality", description: "Goal-based budgeting", icon: Target },
  { letter: "T", word: "Tithing", description: "Giving tracker & tithe goals", icon: HeartHandshake },
  { letter: "H", word: "Humility", description: "Net worth reflection", icon: Landmark },
  { letter: "N", word: "Network", description: "Connect with members", icon: Network },
  { letter: "A", word: "Assets", description: "Track what you own", icon: Wallet },
  { letter: "N", word: "Navigation", description: "Personal financial roadmap", icon: Map },
  { letter: "C", word: "Consistency", description: "Habits & streaks", icon: Repeat2 },
  { letter: "I", word: "Investing", description: "Group investing portal", icon: PiggyBank },
  { letter: "A", word: "Abundance", description: "Mindset lessons & reflection", icon: Sparkles },
  { letter: "L", word: "Legacy", description: "Estate planning & family readiness", icon: FileLock2 },
];

const ecosystem = [
  {
    title: "Manage Your Finances",
    description: "Track your budget, monitor your net worth, and organize your financial life in one place.",
    cta: "Start Free Trial",
    href: "/?signup=true#signin",
    icon: Wallet,
  },
  {
    title: "Build Your Legacy",
    description: "Store important documents, track insurance, and organize your estate so your family is always prepared.",
    cta: "Set Up Your Legacy",
    href: estateAppUrl,
    icon: FileLock2,
  },
  {
    title: "Grow Together",
    description: "Join a trusted network to learn, invest, and build wealth through shared opportunities.",
    cta: "Explore Network",
    href: "#signin",
    icon: Handshake,
  },
];

const trustBullets = [
  "Bank-level encryption",
  "Your data is private",
  "No selling of your information",
  "Secure document storage",
];

export default function Home() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(searchParams.get("signup") === "true");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
    if (searchParams.get("signup") === "true") {
      setIsSignUp(true);
      setForgotPassword(false);
    }
  }, [searchParams]);

  const showCreateAccount = () => {
    setIsSignUp(true);
    setForgotPassword(false);
    window.requestAnimationFrame(() => document.getElementById("signin")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const applySessionPreference = () => {
    localStorage.setItem("faithnancial-remember-session", rememberMe ? "true" : "false");
    sessionStorage.setItem("faithnancial-active-session", "true");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) throw error;
        toast.success("Account created! You're now signed in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        applySessionPreference();
        toast.success("Signed in successfully!");
      }
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: "google" | "apple") => {
    setLoading(true);
    applySessionPreference();
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: `${window.location.origin}/dashboard`,
      });

      if (result.error) throw result.error;
      if (result.redirected) return;
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message ?? `Unable to sign in with ${provider}.`);
      setLoading(false);
    }
  };

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Password reset email sent. Check your inbox.");
      setForgotPassword(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="faithnancial-public min-h-screen bg-background text-foreground overflow-x-hidden">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="font-display text-xl font-bold text-accent">
            Faithnancial
          </Link>
          <div className="flex items-center gap-2">
            <Button className="gradient-accent text-accent-foreground font-semibold" onClick={showCreateAccount}>
              Start Free Trial
            </Button>
          </div>
        </div>
      </header>

      <section className="relative border-b border-border">
        <div className="mx-auto grid min-h-[calc(100svh-4.5rem)] max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.08fr_0.92fr] lg:px-8">
          <div className="max-w-3xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-card px-3 py-1 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-accent" /> Faith-led financial organization
            </p>
            <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Faith. Finances. Freedom. Build Wealth Together.
            </h1>
            <p className="mt-5 max-w-2xl font-display text-2xl font-semibold leading-8 text-accent sm:text-3xl">
              Your financial life and estate plan — all in one place.
            </p>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
              Faithnancial is an ecosystem designed to help individuals and families organize their finances, build legacy, and grow wealth through community.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="gradient-accent text-accent-foreground font-semibold" onClick={showCreateAccount}>
                Start Managing My Finances <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#ecosystem">Explore the Ecosystem</a>
              </Button>
            </div>
          </div>

          <div id="signin" className="scroll-mt-24 rounded-2xl border border-accent/20 bg-card p-5 shadow-xl shadow-accent/10 sm:p-6">
            <div className="mb-5">
              <p className="text-sm font-semibold text-accent">Member access</p>
              <h2 className="mt-1 font-display text-2xl font-bold">{forgotPassword ? "Reset your password" : isSignUp ? "Create your account" : "Sign in to Faithnancial"}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{forgotPassword ? "Enter your email and we’ll send a secure reset link." : "Private access for Faithnancial members and invited users."}</p>
            </div>
            <form onSubmit={forgotPassword ? handleResetRequest : handleSubmit} className="space-y-4">
              {isSignUp && !forgotPassword && (
                <div className="space-y-2">
                  <Label htmlFor="homeFullName" className="text-sm text-muted-foreground">Full Name</Label>
                  <Input
                    id="homeFullName"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="bg-background border-border"
                    required
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="homeEmail" className="text-sm text-muted-foreground">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="homeEmail"
                    type="email"
                    placeholder="investor@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-background border-border pl-10"
                    required
                  />
                </div>
              </div>
              {!forgotPassword && <div className="space-y-2">
                <Label htmlFor="homePassword" className="text-sm text-muted-foreground">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="homePassword"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-background border-border pl-10"
                    required
                    minLength={6}
                  />
                </div>
              </div>}
              {!isSignUp && !forgotPassword && (
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="rememberMe" className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
                    <Checkbox id="rememberMe" checked={rememberMe} onCheckedChange={(checked) => setRememberMe(checked === true)} className="border-accent data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground" />
                    Remember me
                  </label>
                  <button type="button" className="text-sm font-semibold text-accent hover:underline" onClick={() => setForgotPassword(true)}>
                    Forgot password?
                  </button>
                </div>
              )}
              <Button className="w-full gradient-accent text-accent-foreground font-semibold" size="lg" disabled={loading}>
                {loading ? "Please wait..." : forgotPassword ? (
                  <>Send Reset Email <Mail className="h-4 w-4" /></>
                ) : isSignUp ? (
                  <>Sign Up <UserPlus className="h-4 w-4" /></>
                ) : (
                  <>Sign In <ArrowRight className="h-4 w-4" /></>
                )}
              </Button>
            </form>
            {!forgotPassword && (
              <div className="mt-5 space-y-3">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="h-px flex-1 bg-border" />
                  Or continue with
                  <span className="h-px flex-1 bg-border" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button type="button" variant="outline" className="w-full" disabled={loading} onClick={() => handleSocialSignIn("google")}>
                    Google
                  </Button>
                  <Button type="button" variant="outline" className="w-full" disabled={loading} onClick={() => handleSocialSignIn("apple")}>
                    Apple
                  </Button>
                </div>
              </div>
            )}
            <p className="mt-5 text-center text-sm text-muted-foreground">
              {forgotPassword ? "Remember your password?" : isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button className="font-semibold text-accent hover:underline" onClick={() => forgotPassword ? setForgotPassword(false) : setIsSignUp(!isSignUp)}>
                {forgotPassword ? "Sign In" : isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </p>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Why Faithnancial Was Created</h2>
          <div className="mt-6 space-y-4 text-lg leading-8 text-muted-foreground">
            <p>Too many people are trying to build their financial lives alone.</p>
            <p>Accounts are scattered. Documents are unorganized. Families are unprepared.</p>
            <p>Faithnancial was created to bring people together through faith and financial discipline — to organize, learn, and build wealth as a community.</p>
            <p className="text-foreground">Not just for today, but for generations.</p>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card/30 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">The Faithnancial Framework</h2>
            <p className="mt-3 text-muted-foreground">12 principles guiding financial growth, discipline, and legacy</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {principles.map((principle) => (
              <Card key={`${principle.letter}-${principle.word}`} className="bg-background/70">
                <CardContent className="flex min-h-32 gap-4 p-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <principle.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-display text-xl font-bold"><span className="text-accent">{principle.letter}</span> — {principle.word}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{principle.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="ecosystem" className="scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center font-display text-3xl font-bold sm:text-4xl">One Ecosystem. Three Core Systems.</h2>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {ecosystem.map((item) => (
              <Card key={item.title} className="bg-card">
                <CardContent className="flex h-full flex-col p-6">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-display text-2xl font-semibold">{item.title}</h3>
                  <p className="mt-3 flex-1 leading-7 text-muted-foreground">{item.description}</p>
                  <Button asChild variant={item.title === "Manage Your Finances" ? "default" : "outline"} className="mt-6 w-full">
                    {item.href.startsWith("/") ? <Link to={item.href}>{item.cta}</Link> : <a href={item.href}>{item.cta}</a>}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-secondary/40 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center font-display text-3xl font-bold sm:text-4xl">How Faithnancial Works</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {["Start with your finances", "Organize your documents and legacy", "Connect and grow with others"].map((step, index) => (
              <div key={step} className="rounded-xl border border-border bg-card p-6">
                <p className="text-sm font-semibold text-accent">Step {index + 1}</p>
                <p className="mt-3 font-display text-xl font-semibold">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Built on Security and Trust</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {trustBullets.map((bullet) => (
              <div key={bullet} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-accent" />
                <span className="font-medium">{bullet}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-card/40 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <LockKeyhole className="mx-auto mb-5 h-10 w-10 text-accent" />
          <h2 className="font-display text-3xl font-bold sm:text-4xl">If something happened tomorrow, would everything be in place?</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
            Your finances, documents, and plans should not be scattered.
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-lg leading-8 text-muted-foreground">
            Faithnancial brings everything together so you, your family, and your future are protected.
          </p>
          <Button size="lg" className="mt-8 gradient-accent text-accent-foreground font-semibold" onClick={showCreateAccount}>
            Start Your 30-Day Free Trial <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>
    </main>
  );
}