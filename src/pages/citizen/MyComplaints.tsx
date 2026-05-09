import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, FileText, Loader2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import CitizenLayout from "@/components/CitizenLayout";

type Status = "Pending" | "In Progress" | "Resolved";
interface Complaint {
  complaint_id: string;
  tracking_id: string | null;
  title: string;
  description: string;
  image_url: string | null;
  address: string | null;
  location_text: string | null;
  pincode: string | null;
  priority: string | null;
  status: Status;
  created_at: string;
}

const STATUS_STYLES: Record<Status, string> = {
  "Pending": "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30",
  "In Progress": "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
  "Resolved": "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",
};

const formatDate = (s: string) =>
  new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const extractStoragePath = (publicUrl: string | null): string | null => {
  if (!publicUrl) return null;
  const marker = "/complaint-images/";
  const i = publicUrl.indexOf(marker);
  return i >= 0 ? publicUrl.substring(i + marker.length) : null;
};

const MyComplaints = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"All" | Status>("All");
  const [deleteTarget, setDeleteTarget] = useState<Complaint | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("complaints")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setComplaints((data ?? []) as Complaint[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const filtered = useMemo(
    () => filter === "All" ? complaints : complaints.filter((c) => c.status === filter),
    [complaints, filter]
  );

  const counts = useMemo(() => ({
    All: complaints.length,
    Pending: complaints.filter((c) => c.status === "Pending").length,
    "In Progress": complaints.filter((c) => c.status === "In Progress").length,
    Resolved: complaints.filter((c) => c.status === "Resolved").length,
  }), [complaints]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.image_url) {
        const path = extractStoragePath(deleteTarget.image_url);
        if (path) await supabase.storage.from("complaint-images").remove([path]);
      }
      const { error } = await supabase.from("complaints").delete().eq("complaint_id", deleteTarget.complaint_id);
      if (error) { toast.error(error.message); return; }
      toast.success("Complaint deleted");
      setComplaints((c) => c.filter((x) => x.complaint_id !== deleteTarget.complaint_id));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <CitizenLayout>
      <div className="container py-8 sm:py-10">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">My Complaints</h1>
            <p className="text-muted-foreground mt-1">Track and manage all your filed grievances.</p>
          </div>
          <Button onClick={() => navigate("/citizen/add-complaint")} className="bg-gradient-to-r from-primary to-primary-glow text-primary-foreground shadow-[var(--shadow-elegant)]">
            <Plus className="h-4 w-4 mr-1.5" /> New Complaint
          </Button>
        </div>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="mb-6">
          <TabsList className="flex-wrap h-auto">
            {(["All", "Pending", "In Progress", "Resolved"] as const).map((t) => (
              <TabsTrigger key={t} value={t}>
                {t} <span className="ml-1.5 text-xs opacity-70">({counts[t]})</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-border/80 bg-card/50">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-semibold text-lg">
              {complaints.length === 0 ? "No complaints yet" : `No ${filter.toLowerCase()} complaints`}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              {complaints.length === 0 ? "File your first grievance to get started." : "Try a different filter."}
            </p>
            {complaints.length === 0 && (
              <Button onClick={() => navigate("/citizen/add-complaint")} className="bg-gradient-to-r from-primary to-primary-glow text-primary-foreground">
                <Plus className="h-4 w-4 mr-1.5" /> Add Complaint
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid gap-4">
            {filtered.map((c) => {
              const editable = c.status === "Pending";
              return (
                <Card key={c.complaint_id} className="p-5 shadow-[var(--shadow-card)] border-border/60 hover:border-primary/30 transition">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {c.image_url && (
                      <img src={c.image_url} alt={c.title} className="w-full sm:w-28 h-28 object-cover rounded-lg border border-border flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="min-w-0">
                          {c.tracking_id && (
                            <div className="text-xs font-mono text-muted-foreground mb-0.5">{c.tracking_id}</div>
                          )}
                          <h3 className="font-semibold text-lg truncate">{c.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{c.description}</p>
                        </div>
                        <Badge variant="outline" className={cn("font-medium", STATUS_STYLES[c.status])}>
                          {c.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                        <div className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap">
                          <span>{formatDate(c.created_at)}</span>
                          {c.location_text && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {c.location_text}
                            </span>
                          )}
                          {c.priority && <span>Priority: {c.priority}</span>}
                        </div>
                        <div className="flex gap-1.5">
                          <Button
                            size="sm" variant="ghost"
                            onClick={() => navigate(`/citizen/edit-complaint/${c.complaint_id}`)}
                            disabled={!editable}
                            title={editable ? "Edit" : "Editing locked once status changes"}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm" variant="ghost"
                            onClick={() => setDeleteTarget(c)}
                            disabled={!editable}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            title={editable ? "Delete" : "Delete locked once status changes"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this complaint?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The complaint and any attached image will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CitizenLayout>
  );
};

export default MyComplaints;
