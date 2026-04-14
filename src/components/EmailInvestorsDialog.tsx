import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Send, Loader2 } from "lucide-react";

interface Investor {
  id: string;
  investor_name: string;
  email: string | null;
}

interface EmailInvestorsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investors: Investor[];
  startupName: string;
}

export default function EmailInvestorsDialog({ open, onOpenChange, investors, startupName }: EmailInvestorsDialogProps) {
  const emailableInvestors = investors.filter((inv) => inv.email);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open) {
      setSelected(new Set(emailableInvestors.map((inv) => inv.id)));
      setSubject("");
      setMessage("");
    }
  }, [open]);

  const toggleAll = () => {
    if (selected.size === emailableInvestors.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(emailableInvestors.map((inv) => inv.id)));
    }
  };

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const handleSend = async () => {
    if (!subject.trim()) { toast.error("Please enter a subject"); return; }
    if (!message.trim()) { toast.error("Please enter a message"); return; }
    if (selected.size === 0) { toast.error("Please select at least one investor"); return; }

    setSending(true);
    let successCount = 0;
    let failCount = 0;

    const { data: { user } } = await supabase.auth.getUser();
    const senderName = user?.user_metadata?.full_name || "Admin";

    for (const inv of emailableInvestors.filter((i) => selected.has(i.id))) {
      try {
        const { error } = await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "investor-communication",
            recipientEmail: inv.email,
            idempotencyKey: `investor-comm-${inv.id}-${Date.now()}`,
            templateData: {
              startupName,
              subject: subject.trim(),
              message: message.trim(),
              senderName,
            },
          },
        });
        if (error) throw error;
        successCount++;
      } catch {
        failCount++;
      }
    }

    setSending(false);
    if (failCount === 0) {
      toast.success(`Email queued for ${successCount} investor${successCount > 1 ? "s" : ""}`);
      onOpenChange(false);
    } else {
      toast.error(`${failCount} email(s) failed, ${successCount} succeeded`);
    }
  };

  const noEmails = emailableInvestors.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" /> Email Investors — {startupName}
          </DialogTitle>
        </DialogHeader>

        {noEmails ? (
          <p className="text-sm text-muted-foreground py-4">
            No investors have email addresses on file. Add email addresses to investors first.
          </p>
        ) : (
          <div className="space-y-4">
            {/* Select investors */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">Recipients</Label>
                <Button variant="ghost" size="sm" onClick={toggleAll} className="text-xs h-7">
                  {selected.size === emailableInvestors.length ? "Deselect All" : "Select All"}
                </Button>
              </div>
              <div className="border border-border rounded-lg max-h-48 overflow-y-auto divide-y divide-border/50">
                {emailableInvestors.map((inv) => (
                  <label
                    key={inv.id}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-secondary/40 cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={selected.has(inv.id)}
                      onCheckedChange={() => toggle(inv.id)}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{inv.investor_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{inv.email}</p>
                    </div>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {selected.size} of {emailableInvestors.length} selected
                {investors.length > emailableInvestors.length &&
                  ` · ${investors.length - emailableInvestors.length} investor(s) without email excluded`}
              </p>
            </div>

            {/* Subject */}
            <div>
              <Label htmlFor="email-subject" className="text-sm font-medium">Subject</Label>
              <Input
                id="email-subject"
                placeholder={`Update from ${startupName}`}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Message */}
            <div>
              <Label htmlFor="email-message" className="text-sm font-medium">Message</Label>
              <Textarea
                id="email-message"
                placeholder="Write your message to the investors..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="mt-1"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          {!noEmails && (
            <Button onClick={handleSend} disabled={sending || selected.size === 0}>
              {sending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
              ) : (
                <><Send className="w-4 h-4" /> Send to {selected.size} Investor{selected.size !== 1 ? "s" : ""}</>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
