import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { FileText, Plus, Trash2, Download, CheckCircle2, AlertCircle, Eye } from "lucide-react";
import { toast } from "sonner";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";

const DOC_TYPES = [
  { value: "mou", label: "MOU" },
  { value: "nda", label: "NDA" },
  { value: "non-compete", label: "Non-Compete" },
  { value: "subscription", label: "Subscription Agreement" },
  { value: "operating", label: "Operating Agreement" },
  { value: "other", label: "Other" },
];

interface Props {
  startupId: string;
  startupName: string;
}

export default function StartupDocumentsTab({ startupId, startupName }: Props) {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [docType, setDocType] = useState("other");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["startup-documents", startupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("startup_documents")
        .select("*")
        .eq("startup_id", startupId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: acknowledgments = [] } = useQuery({
    queryKey: ["document-acknowledgments", startupId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_acknowledgments")
        .select("*")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // For admins: get all acknowledgments to show who has acknowledged
  const { data: allAcknowledgments = [] } = useQuery({
    queryKey: ["all-document-acknowledgments", startupId],
    queryFn: async () => {
      const docIds = documents.map((d) => d.id);
      if (docIds.length === 0) return [];
      const { data, error } = await supabase
        .from("document_acknowledgments")
        .select("*")
        .in("document_id", docIds);
      if (error) throw error;
      return data;
    },
    enabled: isAdmin && documents.length > 0,
  });

  const addDocMutation = useMutation({
    mutationFn: async () => {
      setUploading(true);
      let fileUrl: string | null = null;

      if (file) {
        const ext = file.name.split(".").pop();
        const path = `${startupId}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("startup-documents")
          .upload(path, file);
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage
          .from("startup-documents")
          .getPublicUrl(path);
        fileUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from("startup_documents").insert({
        startup_id: startupId,
        title,
        description: description || null,
        document_type: docType,
        file_url: fileUrl,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["startup-documents", startupId] });
      toast.success("Document added");
      setAddOpen(false);
      setTitle("");
      setDescription("");
      setDocType("other");
      setFile(null);
      setUploading(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to add document");
      setUploading(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (docId: string) => {
      const { error } = await supabase.from("startup_documents").delete().eq("id", docId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["startup-documents", startupId] });
      toast.success("Document removed");
    },
  });

  const acknowledgeMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const { error } = await supabase.from("document_acknowledgments").insert({
        document_id: documentId,
        user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-acknowledgments", startupId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ["all-document-acknowledgments", startupId] });
      toast.success("Document acknowledged");
    },
  });

  const isAcknowledged = (docId: string) =>
    acknowledgments.some((a) => a.document_id === docId);

  const getAckCount = (docId: string) =>
    allAcknowledgments.filter((a) => a.document_id === docId).length;

  const getDocTypeLabel = (type: string) =>
    DOC_TYPES.find((d) => d.value === type)?.label || type;

  const getDocTypeBadgeVariant = (type: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
      case "nda": return "destructive";
      case "non-compete": return "destructive";
      case "mou": return "default";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {isAdmin && (
        <div className="flex justify-end">
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Add Document
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Document to {startupName}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <Label>Title *</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Non-Disclosure Agreement" />
                </div>
                <div>
                  <Label>Document Type</Label>
                  <Select value={docType} onValueChange={setDocType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DOC_TYPES.map((dt) => (
                        <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of the document and its purpose..." rows={3} />
                </div>
                <div>
                  <Label>Upload File (PDF, DOCX, etc.)</Label>
                  <Input type="file" accept=".pdf,.doc,.docx,.txt,.png,.jpg" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                </div>
                <Button
                  className="w-full"
                  disabled={!title.trim() || uploading}
                  onClick={() => addDocMutation.mutate()}
                >
                  {uploading ? "Uploading..." : "Add Document"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="font-display font-semibold">Disclosures & Documents</h3>
          <p className="text-sm text-muted-foreground mt-1">
            MOUs, NDAs, non-compete agreements, and other legal documents for this investment.
          </p>
        </div>

        {isLoading ? (
          <p className="p-6 text-muted-foreground text-sm">Loading documents...</p>
        ) : documents.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No documents added yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {documents.map((doc) => {
              const acked = isAcknowledged(doc.id);
              return (
                <div key={doc.id} className="p-5 hover:bg-secondary/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="font-medium text-sm">{doc.title}</span>
                        <Badge variant={getDocTypeBadgeVariant(doc.document_type)}>
                          {getDocTypeLabel(doc.document_type)}
                        </Badge>
                        {acked && (
                          <Badge variant="outline" className="text-green-600 border-green-600 gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Acknowledged
                          </Badge>
                        )}
                      </div>
                      {doc.description && (
                        <p className="text-sm text-muted-foreground mt-1.5 ml-6">{doc.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 ml-6">
                        <span className="text-xs text-muted-foreground">
                          Added {new Date(doc.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                        {isAdmin && (
                          <span className="text-xs text-muted-foreground">
                            • {getAckCount(doc.id)} acknowledgment(s)
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {doc.file_url && (
                        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setViewUrl(doc.file_url)}>
                          <Eye className="w-3.5 h-3.5" /> View
                        </Button>
                      )}
                      {!acked && user && (
                        <Button
                          variant="default"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => acknowledgeMutation.mutate(doc.id)}
                          disabled={acknowledgeMutation.isPending}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Acknowledge
                        </Button>
                      )}
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => deleteMutation.mutate(doc.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {!isAdmin && documents.length > 0 && (
        <div className="flex items-start gap-2 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-400">
            Please review and acknowledge all documents above. Acknowledgment is required to confirm you have read and understood the terms.
          </p>
        </div>
      )}

      {/* PDF Viewer Dialog */}
      <Dialog open={!!viewUrl} onOpenChange={(open) => !open && setViewUrl(null)}>
        <DialogContent className="max-w-4xl w-[95vw] h-[85vh] flex flex-col p-0">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle>Document Viewer</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 px-4 pb-4">
            {viewUrl && (
              <object
                data={viewUrl}
                type="application/pdf"
                className="w-full h-full rounded-lg border border-border"
              >
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
                  <FileText className="w-12 h-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    PDF preview is not available in this browser.
                  </p>
                  <Button variant="default" size="sm" className="gap-1.5" asChild>
                    <a href={viewUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="w-3.5 h-3.5" /> Open PDF
                    </a>
                  </Button>
                </div>
              </object>
            )}
          </div>
          <div className="px-4 pb-4 flex justify-end">
            <Button variant="outline" size="sm" className="gap-1.5" asChild>
              <a href={viewUrl || "#"} target="_blank" rel="noopener noreferrer">
                <Download className="w-3.5 h-3.5" /> Download
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
