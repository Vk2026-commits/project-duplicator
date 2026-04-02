import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "valid" | "already" | "invalid" | "success" | "error">("loading");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    fetch(`${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${token}`, {
      headers: { apikey: anonKey },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.valid === true) setStatus("valid");
        else if (data.reason === "already_unsubscribed") setStatus("already");
        else setStatus("invalid");
      })
      .catch(() => setStatus("invalid"));
  }, [token]);

  const handleUnsubscribe = async () => {
    if (!token) return;
    setProcessing(true);
    try {
      const { data } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (data?.success) setStatus("success");
      else if (data?.reason === "already_unsubscribed") setStatus("already");
      else setStatus("error");
    } catch {
      setStatus("error");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="glass-card rounded-xl p-8 max-w-md w-full text-center space-y-4">
        <h1 className="font-display text-2xl font-bold text-foreground">Email Preferences</h1>

        {status === "loading" && <p className="text-muted-foreground">Verifying...</p>}

        {status === "valid" && (
          <>
            <p className="text-muted-foreground">
              Click the button below to unsubscribe from email notifications.
            </p>
            <button
              onClick={handleUnsubscribe}
              disabled={processing}
              className="px-6 py-3 rounded-lg bg-destructive text-destructive-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {processing ? "Processing..." : "Confirm Unsubscribe"}
            </button>
          </>
        )}

        {status === "success" && (
          <p className="text-accent font-medium">You have been successfully unsubscribed.</p>
        )}

        {status === "already" && (
          <p className="text-muted-foreground">You are already unsubscribed.</p>
        )}

        {status === "invalid" && (
          <p className="text-destructive">Invalid or expired unsubscribe link.</p>
        )}

        {status === "error" && (
          <p className="text-destructive">Something went wrong. Please try again later.</p>
        )}
      </div>
    </div>
  );
}
