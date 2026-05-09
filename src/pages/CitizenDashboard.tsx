import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Clock, CheckCircle2, Plus, ListChecks, ArrowRight, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import CitizenLayout from "@/components/CitizenLayout";

type Status = "Pending" | "In Progress" | "Resolved";
interface Row {
  complaint_id: string;
  tracking_id: string | null;
  title: string;
  status: Status;
  created_at: string;
}

const STATUS_STYLES: Record<Status, string> = {
  "Pending": "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30",
  "In Progress": "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
  "Resolved": "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",
};

const CitizenDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("name").eq("id", user.id).maybeSingle()
      .then(({ data }) => setName(data?.name ?? ""));

    supabase.from("complaints")
      .select("complaint_id,tracking_id,title,status,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setRows((data ?? []) as Row[]);
        setLoading(false);
      });
  }, [user]);

  const counts = useMemo(() => ({
    total: rows.length,
    pending: rows.filter((r) => r.status === "Pending").length,
    inProgress: rows.filter((r) => r.status === "In Progress").length,
    resolved: rows.filter((r) => r.status === "Resolved").length,
  }), [rows]);

  const recent = rows.slice(0, 5);

  const stats = [
    { label: "Total", value: counts.total, icon: FileText, accent: "from-primary/10 to-primary/5", text: "text-foreground" },
    { label: "Pending", value: counts.pending, icon: Clock, accent: "from-yellow-500/15 to-yellow-500/5", text: "text-yellow-600 dark:text-yellow-400" },
    { label: "In Progress", value: counts.inProgress, icon: ListChecks, accent: "from-blue-500/15 to-blue-500/5", text: "text-blue-600 dark:text-blue-400" },
    { label: "Resolved", value: counts.resolved, icon: CheckCircle2, accent: "from-green-500/15 to-green-500/5", text: "text-green-600 dark:text-green-400" },
  ];

  return (
    <CitizenLayout>
      <div className="container py-8 sm:py-12">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Welcome, <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">{name || "Citizen"}</span>
            </h1>
            <p className="text-muted-foreground mt-2">Here's an overview of your grievance activity.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="lg" onClick={() => navigate("/citizen/track")}>
              <Search className="h-4 w-4 mr-2" /> Track Complaint
            </Button>
            <Button onClick={() => navigate("/citizen/add-complaint")} size="lg" className="bg-gradient-to-r from-primary to-primary-glow text-primary-foreground shadow-[var(--shadow-elegant)]">
              <Plus className="h-4 w-4 mr-2" /> Add New Complaint
            </Button>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {stats.map((s) => (
            <Card key={s.label} className={cn("p-6 shadow-[var(--shadow-card)] border-border/60 bg-gradient-to-br", s.accent)}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">{s.label}</div>
                  <div className={cn("text-3xl font-bold mt-1", s.text)}>{s.value}</div>
                </div>
                <div className="p-3 rounded-xl bg-card/80 backdrop-blur"><s.icon className={cn("h-5 w-5", s.text)} /></div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="shadow-[var(--shadow-card)] border-border/60 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div>
              <h2 className="font-semibold text-lg">Recent Complaints</h2>
              <p className="text-sm text-muted-foreground">Your 5 most recent submissions.</p>
            </div>
            <Link to="/citizen/my-complaints" className="text-sm font-medium text-primary inline-flex items-center hover:underline">
              View all <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : recent.length === 0 ? (
            <div className="p-10 text-center">
              <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No complaints filed yet.</p>
              <Button className="mt-4 bg-gradient-to-r from-primary to-primary-glow text-primary-foreground" onClick={() => navigate("/citizen/add-complaint")}>
                <Plus className="h-4 w-4 mr-1.5" /> File Your First Grievance
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tracking ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((r) => (
                  <TableRow
                    key={r.complaint_id}
                    className="cursor-pointer"
                    onClick={() => navigate("/citizen/my-complaints")}
                  >
                    <TableCell className="font-mono text-xs">{r.tracking_id ?? "—"}</TableCell>
                    <TableCell className="font-medium max-w-[280px] truncate">{r.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("font-medium", STATUS_STYLES[r.status])}>{r.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </CitizenLayout>
  );
};

export default CitizenDashboard;
