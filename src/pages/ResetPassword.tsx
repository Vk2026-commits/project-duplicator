import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [validResetLink, setValidResetLink] = useState(false);

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    setValidResetLink(hashParams.get("type") === "recovery" || hashParams.has("access_token"));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated successfully.");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="faithnancial-public flex min-h-screen items-center justify-center bg-background px-4 py-8 text-foreground supports-[min-height:100svh]:min-h-svh">
      <div className="w-full max-w-md rounded-2xl border border-accent/20 bg-card p-5 shadow-xl shadow-accent/10 sm:p-6">
        <Link to="/" className="font-display text-xl font-bold text-accent">Faithnancial</Link>
        <div className="mt-6 mb-5">
          <LockKeyhole className="mb-4 h-10 w-10 text-accent" />
          <h1 className="font-display text-3xl font-bold">Create a new password</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {validResetLink ? "Enter a new password for your Faithnancial account." : "This reset link is missing or expired. Request a new link from the sign-in form."}
          </p>
        </div>
        {validResetLink ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm text-muted-foreground">New Password</Label>
              <Input id="newPassword" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-background border-border" required minLength={6} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm text-muted-foreground">Confirm Password</Label>
              <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="bg-background border-border" required minLength={6} />
            </div>
            <Button className="w-full gradient-accent text-accent-foreground font-semibold" size="lg" disabled={loading}>
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        ) : (
          <Button asChild className="w-full gradient-accent text-accent-foreground font-semibold" size="lg">
            <Link to="/#signin">Back to Sign In</Link>
          </Button>
        )}
      </div>
    </main>
  );
}