import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
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
  Phone,
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
  const [showNetworkInvite, setShowNetworkInvite] = useState(false);
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const [waitlistStatusMessage, setWaitlistStatusMessage] = useState("We saved your request and sent a confirmation email.");
  const [waitlistForm, setWaitlistForm] = useState({ firstName: "", lastName: "", email: "", phone: "", occupation: "", interestType: "learn" });

  useEffect(() => {
    if (searchParams.get("signup") === "true") {
      setIsSignUp(true);
      setForgotPassword(false);
    }
  }, [searchParams]);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const revealItems = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));

    if (reduceMotion || revealItems.length === 0) {
      revealItems.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    revealItems.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, []);

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
        window.location.href = budgetAppUrl;
        return;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        applySessionPreference();
        toast.success("Signed in successfully!");
      }
      const pendingInvite = sessionStorage.getItem("faithnancial-pending-network-invite");
      if (pendingInvite) {
        sessionStorage.removeItem("faithnancial-pending-network-invite");
        navigate(pendingInvite);
        return;
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

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWaitlistLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("network-waitlist", {
        body: { action: "join", ...waitlistForm },
      });
      if (error) throw error;
      const message = data?.alreadyOnList ? "You’re already on the Faithnancial Network waitlist." : "You're on the Faithnancial Network waitlist. Check your email for confirmation.";
      toast.success(message);
      setWaitlistStatusMessage(data?.alreadyOnList ? "You’re already on the list, so we did not create a duplicate entry." : "We saved your request and sent a confirmation email.");
      setWaitlistSubmitted(true);
      setWaitlistForm({ firstName: "", lastName: "", email: "", phone: "", occupation: "", interestType: "learn" });
    } catch (err: any) {
      toast.error(err.message || "Unable to join the waitlist right now.");
    } finally {
      setWaitlistLoading(false);
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

      <section className="home-hero-motion relative overflow-hidden border-b border-border">
        <div className="mx-auto grid min-h-[calc(100svh-4.5rem)] max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.08fr_0.92fr] lg:px-8">
          <div className="max-w-3xl">
            <p className="hero-kicker mb-4 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-card px-3 py-1 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-accent" /> Faith-led financial organization
            </p>
            <h1 className="hero-headline font-display text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Faith. Finances. Freedom. Build Wealth Together.
            </h1>
            <p className="hero-subheadline mt-5 max-w-2xl font-display text-2xl font-semibold leading-8 text-accent sm:text-3xl">
              Your financial life and estate plan — all in one place.
            </p>
            <p className="hero-copy mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
              Faithnancial is an ecosystem designed to help individuals and families organize their finances, build legacy, and grow wealth through community.
            </p>
            <div className="hero-actions mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="motion-button gradient-accent text-accent-foreground font-semibold" onClick={showCreateAccount}>
                Start Managing My Finances <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="motion-button" asChild>
                <a href="#ecosystem">Explore the Ecosystem</a>
              </Button>
            </div>
          </div>

          <div id="signin" className="hero-signin scroll-mt-24 rounded-2xl border border-accent/20 bg-card p-5 shadow-xl shadow-accent/10 sm:p-6">
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
        <div className="mx-auto max-w-4xl text-center reveal-up" data-reveal>
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
          <div className="mx-auto mb-10 max-w-3xl text-center reveal-up" data-reveal>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">The Faithnancial Framework</h2>
            <p className="mt-3 text-muted-foreground">12 principles guiding financial growth, discipline, and legacy</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {principles.map((principle, index) => (
              <Card key={`${principle.letter}-${principle.word}`} className="motion-card reveal-up bg-background/70" data-reveal style={{ transitionDelay: `${index * 45}ms` }}>
                <CardContent className="flex min-h-32 gap-4 p-5">
                  <div className="principle-icon-motion flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
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
          <h2 className="reveal-up text-center font-display text-3xl font-bold sm:text-4xl" data-reveal>One Ecosystem. Three Core Systems.</h2>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {ecosystem.map((item, index) => (
              <Card key={item.title} className="motion-card reveal-up bg-card" data-reveal style={{ transitionDelay: `${index * 90}ms` }}>
                <CardContent className="flex h-full flex-col p-6">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-display text-2xl font-semibold">{item.title}</h3>
                  <p className="mt-3 flex-1 leading-7 text-muted-foreground">{item.description}</p>
                  {item.title === "Manage Your Finances" ? (
                    <Button variant="default" className="motion-button mt-6 w-full" onClick={showCreateAccount}>
                      {item.cta}
                    </Button>
                  ) : item.title === "Grow Together" ? (
                    <>
                      <Button variant="outline" className="motion-button mt-6 w-full" onClick={() => setShowNetworkInvite(true)}>
                        {item.cta}
                      </Button>
                      {showNetworkInvite && (
                        <div className="mt-4 rounded-lg border border-accent/20 bg-accent/10 p-4">
                          <h4 className="font-display text-xl font-bold text-foreground">Join the Faithnancial Network Waitlist</h4>
                          <div className="mt-3 space-y-3 text-sm leading-6 text-muted-foreground">
                            <p>Our investment network is currently at capacity with active members and ongoing opportunities.</p>
                            <p>This is a curated community designed for collaboration, trust, and long-term wealth building — which means we grow intentionally, not quickly.</p>
                            <p>Add your name to the waitlist, and you’ll be first to know when new openings become available.</p>
                            <p>In the meantime, continue strengthening your foundation:</p>
                            <ul className="space-y-2 pl-1">
                              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-accent" /> Manage your finances</li>
                              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-accent" /> Build your legacy</li>
                              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-accent" /> Prepare for opportunities ahead</li>
                            </ul>
                            <p>When a spot opens, you’ll be ready to step in and grow with us.</p>
                          </div>
                          <form onSubmit={handleWaitlistSubmit} className="mt-5 space-y-3">
                            <div className="grid gap-3 sm:grid-cols-2">
                              <Input placeholder="First name" value={waitlistForm.firstName} onChange={(e) => setWaitlistForm({ ...waitlistForm, firstName: e.target.value })} required />
                              <Input placeholder="Last name" value={waitlistForm.lastName} onChange={(e) => setWaitlistForm({ ...waitlistForm, lastName: e.target.value })} required />
                            </div>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                              <Input type="email" placeholder="Email" className="pl-10" value={waitlistForm.email} onChange={(e) => setWaitlistForm({ ...waitlistForm, email: e.target.value })} required />
                            </div>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                              <Input placeholder="Phone (optional)" className="pl-10" value={waitlistForm.phone} onChange={(e) => setWaitlistForm({ ...waitlistForm, phone: e.target.value })} />
                            </div>
                            <div className="relative">
                              <BriefcaseBusiness className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                              <Input placeholder="Occupation" className="pl-10" value={waitlistForm.occupation} onChange={(e) => setWaitlistForm({ ...waitlistForm, occupation: e.target.value })} required />
                            </div>
                            <Select value={waitlistForm.interestType} onValueChange={(value) => setWaitlistForm({ ...waitlistForm, interestType: value })}>
                              <SelectTrigger><SelectValue placeholder="Interest type" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="learn">Learn</SelectItem>
                                <SelectItem value="invest">Invest</SelectItem>
                                <SelectItem value="build_wealth">Build Wealth</SelectItem>
                                <SelectItem value="partnership">Partnership</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button type="submit" className="motion-button w-full gradient-accent text-accent-foreground" disabled={waitlistLoading}>
                              {waitlistLoading ? "Joining..." : "👉 Join the Waitlist"}
                            </Button>
                            {waitlistSubmitted && (
                              <div className="rounded-lg border border-accent/25 bg-card p-4 text-sm leading-6 text-foreground">
                                <p className="flex items-center gap-2 font-semibold text-accent">
                                  <CheckCircle2 className="h-4 w-4" /> You’re on the Faithnancial Network waitlist.
                                </p>
                                <p className="mt-1 text-muted-foreground">{waitlistStatusMessage}</p>
                              </div>
                            )}
                          </form>
                        </div>
                      )}
                    </>
                  ) : (
                    <Button asChild variant="outline" className="motion-button mt-6 w-full">
                      {item.href.startsWith("/") ? <Link to={item.href}>{item.cta}</Link> : <a href={item.href}>{item.cta}</a>}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-secondary/40 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-5xl reveal-up" data-reveal>
          <h2 className="text-center font-display text-3xl font-bold sm:text-4xl">How Faithnancial Works</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {["Start with your finances", "Organize your documents and legacy", "Connect and grow with others"].map((step, index) => (
              <div key={step} className="motion-card rounded-xl border border-border bg-card p-6" style={{ transitionDelay: `${index * 80}ms` }}>
                <p className="text-sm font-semibold text-accent">Step {index + 1}</p>
                <p className="mt-3 font-display text-xl font-semibold">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-8 reveal-up lg:grid-cols-[0.9fr_1.1fr] lg:items-center" data-reveal>
          <div>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Built on Security and Trust</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {trustBullets.map((bullet) => (
              <div key={bullet} className="motion-card flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-accent" />
                <span className="font-medium">{bullet}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-card/40 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-4xl text-center reveal-up" data-reveal>
          <LockKeyhole className="mx-auto mb-5 h-10 w-10 text-accent" />
          <h2 className="font-display text-3xl font-bold sm:text-4xl">If something happened tomorrow, would everything be in place?</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
            Your finances, documents, and plans should not be scattered.
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-lg leading-8 text-muted-foreground">
            Faithnancial brings everything together so you, your family, and your future are protected.
          </p>
          <Button size="lg" className="motion-button mt-8 gradient-accent text-accent-foreground font-semibold" onClick={showCreateAccount}>
            Start Your 30-Day Free Trial <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>
    </main>
  );
}