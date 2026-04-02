import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export default function DisclaimerModal() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (loading || !user) {
      setChecking(false);
      return;
    }

    supabase
      .from("disclaimer_acceptances")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) setOpen(true);
        setChecking(false);
      });
  }, [user, loading]);

  if (checking || !user) return null;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Shield className="w-5 h-5 text-primary" />
            Investment Disclaimer Required
          </DialogTitle>
          <DialogDescription>
            Before accessing the platform, you must review and accept our Investment Disclosures & Risk Disclaimer.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted-foreground">
            All investments involve risk, including the possible loss of principal. Please review the full disclaimer to continue.
          </p>
          <Button
            className="w-full"
            onClick={() => {
              setOpen(false);
              navigate("/disclosures");
            }}
          >
            Review & Accept Disclaimer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
