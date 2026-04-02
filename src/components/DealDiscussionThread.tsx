import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MessageSquare, Send, Trash2 } from "lucide-react";
import { format } from "date-fns";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";

interface Props {
  dealId: string;
  profileMap: Record<string, string>;
}

export default function DealDiscussionThread({ dealId, profileMap }: Props) {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState("");
  const [expanded, setExpanded] = useState(false);

  const { data: comments = [] } = useQuery({
    queryKey: ["deal-comments", dealId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deal_comments" as any)
        .select("*")
        .eq("deal_id", dealId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("deal_comments" as any).insert({
        deal_id: dealId,
        author_id: user!.id,
        content: commentText.trim(),
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deal-comments", dealId] });
      setCommentText("");
      toast.success("Comment posted!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("deal_comments" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deal-comments", dealId] });
      toast.success("Comment removed.");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-3 text-sm font-medium hover:bg-secondary/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-muted-foreground" />
          Discussion ({comments.length})
        </span>
        <span className="text-xs text-muted-foreground">{expanded ? "Hide" : "Show"}</span>
      </button>

      {expanded && (
        <div className="border-t border-border p-4 space-y-3 bg-secondary/10">
          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">No comments yet. Start the discussion.</p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {comments.map((c: any) => (
                <div key={c.id} className="flex items-start gap-3">
                  <div className="flex-1 p-3 bg-card rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium">{profileMap[c.author_id] || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(c.created_at), "MMM d 'at' h:mm a")}
                      </p>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{c.content}</p>
                  </div>
                  {(c.author_id === user?.id || isAdmin) && (
                    <Button size="sm" variant="ghost" className="text-destructive shrink-0 mt-1" onClick={() => deleteMutation.mutate(c.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add comment */}
          <div className="flex gap-2 pt-1">
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              rows={2}
              className="flex-1"
            />
            <Button
              size="sm"
              className="self-end"
              disabled={!commentText.trim() || addMutation.isPending}
              onClick={() => addMutation.mutate()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
