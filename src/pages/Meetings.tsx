import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Calendar, MapPin, FileText, Clock, CheckCircle, Send, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";

const statusStyles: Record<string, string> = {
  scheduled: "bg-primary/20 text-primary",
  completed: "bg-accent/20 text-accent",
  cancelled: "bg-destructive/20 text-destructive",
};

export default function Meetings() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [expandedMeeting, setExpandedMeeting] = useState<string | null>(null);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    title: "", meeting_date: "", location: "", agenda: "", status: "scheduled",
  });

  // Fetch meetings
  const { data: meetings = [], isLoading } = useQuery({
    queryKey: ["meetings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meetings" as any)
        .select("*")
        .order("meeting_date", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
  });

  // Fetch all meeting notes
  const { data: allNotes = [] } = useQuery({
    queryKey: ["meeting-notes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meeting_notes" as any)
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
  });

  // Fetch profiles
  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, full_name");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const profileMap = Object.fromEntries(profiles.map((p) => [p.id, p.full_name || "Unknown"]));

  // Create meeting
  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("meetings" as any).insert({
        title: form.title,
        meeting_date: new Date(form.meeting_date).toISOString(),
        location: form.location || null,
        agenda: form.agenda || null,
        status: form.status,
        created_by: user!.id,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      setCreateOpen(false);
      setForm({ title: "", meeting_date: "", location: "", agenda: "", status: "scheduled" });
      toast.success("Meeting created!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Update meeting status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("meetings" as any).update({ status } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      toast.success("Meeting status updated.");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Add note
  const addNoteMutation = useMutation({
    mutationFn: async ({ meetingId, content }: { meetingId: string; content: string }) => {
      const { error } = await supabase.from("meeting_notes" as any).insert({
        meeting_id: meetingId,
        author_id: user!.id,
        content,
      } as any);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["meeting-notes"] });
      setNoteText((prev) => ({ ...prev, [vars.meetingId]: "" }));
      toast.success("Note added!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Delete note
  const deleteNoteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("meeting_notes" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting-notes"] });
      toast.success("Note removed.");
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Please sign in to view meetings.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold">Meetings</h2>
          <p className="text-sm text-muted-foreground mt-1">Monthly meetings, agendas, and notes</p>
        </div>
        {isAdmin && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground">
                <Plus className="w-4 h-4 mr-1" /> Schedule Meeting
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule a Meeting</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="space-y-4">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Monthly Investment Review" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date & Time *</Label>
                    <Input type="datetime-local" value={form.meeting_date} onChange={(e) => setForm({ ...form, meeting_date: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Zoom / Office" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Agenda</Label>
                  <Textarea value={form.agenda} onChange={(e) => setForm({ ...form, agenda: e.target.value })} rows={3} placeholder="Topics to discuss..." />
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Schedule Meeting"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading meetings...</p>
      ) : meetings.length === 0 ? (
        <Card className="p-12 text-center">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display text-lg font-semibold mb-2">No Meetings Scheduled</h3>
          <p className="text-sm text-muted-foreground">Schedule a meeting to get started.</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {meetings.map((meeting: any) => {
            const meetingNotes = allNotes.filter((n: any) => n.meeting_id === meeting.id);
            const isExpanded = expandedMeeting === meeting.id;
            const currentNote = noteText[meeting.id] || "";

            return (
              <Card key={meeting.id} className="overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-display text-lg font-semibold">{meeting.title}</h3>
                        <Badge className={statusStyles[meeting.status] || ""}>
                          {meeting.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {format(new Date(meeting.meeting_date), "MMM d, yyyy 'at' h:mm a")}
                        </span>
                        {meeting.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {meeting.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" />
                          {meetingNotes.length} note{meetingNotes.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isAdmin && meeting.status === "scheduled" && (
                        <Button size="sm" variant="outline" onClick={() => updateStatusMutation.mutate({ id: meeting.id, status: "completed" })}>
                          <CheckCircle className="w-4 h-4 mr-1" /> Mark Complete
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => setExpandedMeeting(isExpanded ? null : meeting.id)}>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  {meeting.agenda && (
                    <div className="mt-3 p-3 bg-secondary/50 rounded-lg">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Agenda</p>
                      <p className="text-sm whitespace-pre-wrap">{meeting.agenda}</p>
                    </div>
                  )}
                </div>

                {/* Expanded notes section */}
                {isExpanded && (
                  <div className="border-t border-border p-6 bg-secondary/20 space-y-4">
                    <h4 className="text-sm font-semibold">Meeting Notes</h4>

                    {meetingNotes.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No notes yet. Be the first to add one.</p>
                    ) : (
                      <div className="space-y-3">
                        {meetingNotes.map((note: any) => (
                          <div key={note.id} className="flex items-start gap-3 p-3 bg-card rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-medium">{profileMap[note.author_id] || "Unknown"}</p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(note.created_at), "MMM d, yyyy 'at' h:mm a")}
                                </p>
                              </div>
                              <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                            </div>
                            {(note.author_id === user.id || isAdmin) && (
                              <Button size="sm" variant="ghost" className="text-destructive shrink-0" onClick={() => setDeletingNoteId(note.id)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add note form */}
                    <div className="flex gap-2">
                      <Textarea
                        value={currentNote}
                        onChange={(e) => setNoteText((prev) => ({ ...prev, [meeting.id]: e.target.value }))}
                        placeholder="Add a note..."
                        rows={2}
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        className="self-end"
                        disabled={!currentNote.trim() || addNoteMutation.isPending}
                        onClick={() => addNoteMutation.mutate({ meetingId: meeting.id, content: currentNote.trim() })}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
      <ConfirmDeleteDialog
        open={!!deletingNoteId}
        onOpenChange={(o) => { if (!o) setDeletingNoteId(null); }}
        title="Delete Note"
        description="Are you sure you want to delete this note? This action cannot be undone."
        onConfirm={() => deletingNoteId && deleteNoteMutation.mutate(deletingNoteId)}
        isDeleting={deleteNoteMutation.isPending}
      />
    </Layout>
  );
}
