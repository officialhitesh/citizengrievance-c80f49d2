import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { LogOut, Shield, AlertTriangle, CheckCircle2, Clock, Loader2, Search, Sparkles, RefreshCw, FileText } from "lucide-react";
import { toast } from "sonner";
import DepartmentBadge from "@/components/admin/DepartmentBadge";
import UrgencyBadge from "@/components/admin/UrgencyBadge";
import StatusBadge from "@/components/admin/StatusBadge";
import { DEPARTMENTS, URGENCIES, STATUSES, URGENCY_RANK, Urgency } from "@/lib/complaintTaxonomy";

type Complaint = {
  complaint_id: string;
  user_id: string;
  title: string;
  description: string;
  city: string | null;
  state: string | null;
  address: string | null;
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string;
  department: string | null;
  urgency: string | null;
  classified_at: string | null;
  created_at: string;
};

type SortKey = "newest" | "oldest" | "urgency";
const PAGE_SIZE = 20;

const AdminDashboard = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState<string>("all");
  const [urgency, setUrgency] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [reclassifying, setReclassifying] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from("complaints")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) toast.error(error.message);
    else setComplaints((data ?? []) as Complaint[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("admin-complaints")
      .on("postgres_changes", { event: "*", schema: "public", table: "complaints" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleLogout = async () => {
    await signOut();
    toast.success("Signed out");
    navigate("/", { replace: true });
  };

  const handleReclassify = async (id: string) => {
    setReclassifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("classify-complaint", { body: { complaintId: id } });
      if (error) throw error;
      if ((data as any)?.success) toast.success(`Classified as ${(data as any).department} • ${(data as any).urgency}`);
      else throw new Error((data as any)?.error ?? "Classification failed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Classification failed");
    } finally {
      setReclassifying(false);
    }
  };

  const filtered = useMemo(() => {
    let list = complaints;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((c) =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        (c.city ?? "").toLowerCase().includes(q),
      );
    }
    if (dept !== "all") list = list.filter((c) => c.department === dept);
    if (urgency !== "all") list = list.filter((c) => c.urgency === urgency);
    if (status !== "all") list = list.filter((c) => c.status === status);

    const sorted = [...list];
    if (sort === "newest") sorted.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    else if (sort === "oldest") sorted.sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
    else sorted.sort((a, b) => (URGENCY_RANK[b.urgency as Urgency] ?? 0) - (URGENCY_RANK[a.urgency as Urgency] ?? 0));
    return sorted;
  }, [complaints, search, dept, urgency, status, sort]);

  useEffect(() => { setPage(1); }, [search, dept, urgency, status, sort]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const stats = useMemo(() => ({
    total: complaints.length,
    pending: complaints.filter((c) => c.status === "Pending").length,
    inProgress: complaints.filter((c) => c.status === "In Progress").length,
    resolved: complaints.filter((c) => c.status === "Resolved").length,
    critical: complaints.filter((c) => c.urgency === "Critical").length,
  }), [complaints]);

  const statCards = [
    { icon: FileText, label: "Total", value: stats.total, tone: "text-foreground" },
    { icon: Clock, label: "Pending", value: stats.pending, tone: "text-amber-600 dark:text-amber-400" },
    { icon: Loader2, label: "In Progress", value: stats.inProgress, tone: "text-blue-600 dark:text-blue-400" },
    { icon: CheckCircle2, label: "Resolved", value: stats.resolved, tone: "text-green-600 dark:text-green-400" },
    { icon: AlertTriangle, label: "Critical", value: stats.critical, tone: "text-red-600 dark:text-red-400" },
  ];

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-10">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-bold">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-admin to-admin-glow text-admin-foreground">
              <Shield className="h-4 w-4" />
            </div>
            Admin Console
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </header>

      <main className="container py-8 space-y-6">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-admin mb-2">
            <Sparkles className="h-3.5 w-3.5" /> AI-classified grievances
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Monitor, filter, and prioritize citizen complaints.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {statCards.map((s) => (
            <Card key={s.label} className="p-4 border-border/60">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">{s.label}</div>
                  <div className={`text-2xl font-bold mt-1 ${s.tone}`}>{s.value}</div>
                </div>
                <s.icon className="h-5 w-5 text-muted-foreground" />
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-4 border-border/60">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto_auto]">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search title, description, city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={dept} onValueChange={setDept}>
              <SelectTrigger className="w-full lg:w-[170px]"><SelectValue placeholder="Department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={urgency} onValueChange={setUrgency}>
              <SelectTrigger className="w-full lg:w-[140px]"><SelectValue placeholder="Urgency" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Urgencies</SelectItem>
                {URGENCIES.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full lg:w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger className="w-full lg:w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="urgency">Urgency ↓</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        <Card className="border-border/60 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Shield className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-semibold">No complaints match your filters</h3>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting search or filters.</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Urgency</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map((c) => (
                      <TableRow key={c.complaint_id} className="cursor-pointer" onClick={() => setSelected(c)}>
                        <TableCell className="font-medium max-w-xs truncate">{c.title}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{c.city ?? "—"}</TableCell>
                        <TableCell><DepartmentBadge value={c.department} /></TableCell>
                        <TableCell><UrgencyBadge value={c.urgency} /></TableCell>
                        <TableCell><StatusBadge value={c.status} /></TableCell>
                        <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                          {new Date(c.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-border">
                {paged.map((c) => (
                  <button key={c.complaint_id} onClick={() => setSelected(c)} className="w-full text-left p-4 hover:bg-accent/40 transition">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-medium truncate">{c.title}</div>
                      <UrgencyBadge value={c.urgency} />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{c.city ?? "—"} • {new Date(c.created_at).toLocaleDateString()}</div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <DepartmentBadge value={c.department} />
                      <StatusBadge value={c.status} />
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between p-3 border-t border-border bg-muted/30">
              <div className="text-xs text-muted-foreground">
                Page {page} of {totalPages} • {filtered.length} results
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
                <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </Card>
      </main>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="text-left pr-8">{selected.title}</SheetTitle>
                <SheetDescription className="text-left">
                  Filed {new Date(selected.created_at).toLocaleString()}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-5">
                <div className="flex flex-wrap gap-2">
                  <DepartmentBadge value={selected.department} />
                  <UrgencyBadge value={selected.urgency} />
                  <StatusBadge value={selected.status} />
                </div>

                {selected.image_url && (
                  <img src={selected.image_url} alt={selected.title} className="w-full rounded-lg border border-border object-cover max-h-64" />
                )}

                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Description</div>
                  <p className="text-sm whitespace-pre-wrap">{selected.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Location</div>
                    <div>{[selected.address, selected.city, selected.state].filter(Boolean).join(", ") || "—"}</div>
                  </div>
                  {selected.latitude && selected.longitude && (
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Coordinates</div>
                      <a
                        href={`https://www.google.com/maps?q=${selected.latitude},${selected.longitude}`}
                        target="_blank" rel="noreferrer" className="text-primary hover:underline"
                      >
                        {selected.latitude.toFixed(4)}, {selected.longitude.toFixed(4)}
                      </a>
                    </div>
                  )}
                </div>

                <div className="text-xs text-muted-foreground">
                  {selected.classified_at
                    ? `Classified ${new Date(selected.classified_at).toLocaleString()}`
                    : "Not yet classified by AI"}
                </div>

                <Button
                  variant="outline" className="w-full" disabled={reclassifying}
                  onClick={() => handleReclassify(selected.complaint_id)}
                >
                  {reclassifying
                    ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Classifying...</>
                    : <><RefreshCw className="h-4 w-4 mr-2" /> Re-classify with AI</>}
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AdminDashboard;
