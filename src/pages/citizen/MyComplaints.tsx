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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Pencil, Trash2, Plus, FileText, Loader2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "Pending" | "In Progress" | "Resolved";
interface Complaint {
  complaint_id: string;
  title: string;
  description: string;
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
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

const MyComplaints = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"All" | Status>("All");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Complaint | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [saving, setSaving] = useState(false);

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
    if (!deleteId) return;
    const { error } = await supabase.from("complaints").delete().eq("complaint_id", deleteId);
    if (error) toast.error(error.message);
    else {
      toast.success("Complaint deleted");
      setComplaints((c) => c.filter((x) => x.complaint_id !== deleteId));
    }
    setDeleteId(null);
  };

  const openEdit = (c: Complaint) => {
    setEditing(c);
    setEditTitle(c.title);
    setEditDesc(c.description);
  };

  const handleSave = async () => {
    if (!editing) return;
    if (!editTitle.trim() || !editDesc.trim()) return toast.error("Title and description required");
    setSaving(true);
    const { error } = await supabase
      .from("complaints")
      .update({ title: editTitle.trim(), description: editDesc.trim() })
      .eq("complaint_id", editing.complaint_id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Updated");
    setComplaints((c) => c.map((x) => x.complaint_id === editing.complaint_id ? { ...x, title: editTitle.trim(), description: editDesc.trim() } : x));
    setEditing(null);
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-10">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/citizen-dashboard" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" /> Dashboard
          </Link>
          <Button size="sm" onClick={() => navigate("/citizen/add-complaint")} className="bg-gradient-to-r from-primary to-primary-glow text-primary-foreground">
            <Plus className="h-4 w-4 mr-1.5" /> New Complaint
          </Button>
        </div>
      </header>

      <main className="container py-10">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">My Complaints</h1>
            <p className="text-muted-foreground mt-1">Track and manage all your filed grievances.</p>
          </div>
        </div>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="mb-6">
          <TabsList>
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
            {filtered.map((c) => (
              <Card key={c.complaint_id} className="p-5 shadow-[var(--shadow-card)] border-border/60 hover:border-primary/30 transition">
                <div className="flex flex-col sm:flex-row gap-4">
                  {c.image_url && (
                    <img src={c.image_url} alt={c.title} className="w-full sm:w-28 h-28 object-cover rounded-lg border border-border flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-lg truncate">{c.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{c.description}</p>
                      </div>
                      <Badge variant="outline" className={cn("font-medium", STATUS_STYLES[c.status])}>
                        {c.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                      <div className="text-xs text-muted-foreground flex items-center gap-3">
                        <span>{formatDate(c.created_at)}</span>
                        {c.latitude && c.longitude && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {c.latitude.toFixed(3)}, {c.longitude.toFixed(3)}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1.5">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(c)} disabled={c.status === "Resolved"}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setDeleteId(c.complaint_id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this complaint?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Complaint</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="et">Title</Label>
              <Input id="et" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ed">Description</Label>
              <Textarea id="ed" rows={5} value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-primary to-primary-glow text-primary-foreground">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyComplaints;
