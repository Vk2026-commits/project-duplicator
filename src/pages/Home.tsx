import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileLock2,
  Handshake,
  HeartHandshake,
  Landmark,
  Layers3,
  LockKeyhole,
  Map,
  Network,
  PiggyBank,
  Repeat2,
  ShieldCheck,
  Sparkles,
  Target,
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
    href: budgetAppUrl,
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
    href: "/login",
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
  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="font-display text-xl font-bold text-accent">
            Faithnancial
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link to="/login">Sign In</Link>
            </Button>
            <Button asChild className="gradient-accent text-accent-foreground font-semibold">
              <a href={budgetAppUrl}>Start Free Trial</a>
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
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
              Faithnancial is an ecosystem designed to help individuals and families organize their finances, build legacy, and grow wealth through community.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild className="gradient-accent text-accent-foreground font-semibold">
                <a href={budgetAppUrl}>
                  Start Managing My Finances <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#ecosystem">Explore the Ecosystem</a>
              </Button>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 glow-accent sm:p-6">
            <div className="grid gap-4">
              {[
                { label: "Budget", value: "Organized", icon: Wallet },
                { label: "Documents", value: "Protected", icon: FileLock2 },
                { label: "Legacy", value: "Prepared", icon: Layers3 },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-4 rounded-xl border border-border bg-secondary/60 p-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                    <p className="font-display text-2xl font-semibold">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
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
          <Button size="lg" asChild className="mt-8 gradient-accent text-accent-foreground font-semibold">
            <a href={budgetAppUrl}>
              Start Your 30-Day Free Trial <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </section>
    </main>
  );
}