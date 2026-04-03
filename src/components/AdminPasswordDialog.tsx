import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ShieldCheck } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirmed: () => void;
  isPending?: boolean;
}

export default function AdminPasswordDialog({ open, onOpenChange, title, description, onConfirmed, isPending }: Props) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);

  const handleVerify = async () => {
    if (!password.trim()) {
      setError("Please enter your password");
      return;
    }
    setError("");
    setVerifying(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      setError("Could not determine your email");
      setVerifying(false);
      return;
    }

    // Verify password via direct GoTrue API call to avoid triggering
    // onAuthStateChange which causes page-level re-renders and redirects
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": anonKey,
        },
        body: JSON.stringify({ email: user.email, password }),
      });

      setVerifying(false);

      if (!res.ok) {
        setError("Incorrect password. Please try again.");
        return;
      }

      setPassword("");
      onConfirmed();
    } catch {
      setVerifying(false);
      setError("Verification failed. Please try again.");
    }
  };

  const handleClose = (v: boolean) => {
    if (!v) {
      setPassword("");
      setError("");
    }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            {title}
          </DialogTitle>
          <p className="text-sm text-muted-foreground pt-1">{description}</p>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label className="text-sm">Admin Password</Label>
          <Input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleVerify()}
            className="h-10"
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
          <Button onClick={handleVerify} disabled={verifying || isPending}>
            {(verifying || isPending) ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
