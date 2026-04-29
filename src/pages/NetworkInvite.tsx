import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CheckCircle2, LockKeyhole } from "lucide-react";

export default function NetworkInvite() {
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";
  const [status, setStatus] = useState<"idle" | "accepting" | "success" | "error">("idle");
  const [message, setMessage] = useState("This secure invitation requires you to sign in first.");

  useEffect(() => {
    if (loading || !user || !token || status !== "idle") return;
    setStatus("accepting");
    supabase.rpc("accept_network_invite" as any, { _token: token }).then(({ data, error }) => {
      const result = Array.isArray(data) ? data[0] : data;
      if (error || !result?.success) {
        setMessage(error?.message || result?.message || "This invitation could not be accepted.");
        setStatus("error");
        return;
      }
      setMessage("Invitation accepted. Welcome to the Faithnancial Network.");
      setStatus("success");
      window.setTimeout(() => navigate("/dashboard"), 1200);
    });
  }, [loading, user, token, status, navigate]);

  return (
    <main className="min-h-screen bg-background px-4 py-16 text-foreground">
      <section className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center text-center">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10 text-accent">
          {status === "success" ? <CheckCircle2 className="h-7 w-7" /> : <LockKeyhole className="h-7 w-7" />}
        </div>
        <h1 className="font-display text-3xl font-bold">Faithnancial Network Invitation</h1>
        <p className="mt-4 leading-7 text-muted-foreground">{message}</p>
        {!user && !loading && (
          <Button asChild className="mt-8 gradient-accent text-accent-foreground">
            <Link to={`/?signin=true#signin`}>Sign in to accept</Link>
          </Button>
        )}
        {status === "error" && (
          <Button asChild variant="outline" className="mt-8">
            <Link to="/#ecosystem">Return to Faithnancial</Link>
          </Button>
        )}
      </section>
    </main>
  );
}