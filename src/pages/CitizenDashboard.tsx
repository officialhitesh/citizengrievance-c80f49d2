import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogOut, Users, FileText, Clock, CheckCircle2, Plus, ListChecks, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const CitizenDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [counts, setCounts] = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0 });

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("name").eq("id", user.id).maybeSingle()
      .then(({ data }) => setName(data?.name ?? ""));

    supabase.from("complaints").select("status").eq("user_id", user.id)
      .then(({ data }) => {
        const rows = data ?? [];
        setCounts({
          total: rows.length,
          pending: rows.filter((r: any) => r.status === "Pending").length,
          inProgress: rows.filter((r: any) => r.status === "In Progress").length,
          resolved: rows.filter((r: any) => r.status === "Resolved").length,
        });
      });
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    toast.success("Signed out");
    navigate("/", { replace: true });
  };

  const stats = [
    { icon: FileText, label: "Total", value: counts.total, color: "text-foreground" },
    { icon: Clock, label: "Pending", value: counts.pending, color: "text-yellow-600 dark:text-yellow-400" },
    { icon: ListChecks, label: "In Progress", value: counts.inProgress, color: "text-blue-600 dark:text-blue-400" },
    { icon: CheckCircle2, label: "Resolved", value: counts.resolved, color: "text-green-600 dark:text-green-400" },
  ];

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-10">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-bold">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
              <Users className="h-4 w-4" />
            </div>
            Citizen Portal
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </header>

      <main className="container py-12">
        <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">
              Welcome, <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">{name || "Citizen"}</span>
            </h1>
            <p className="text-muted-foreground mt-2">Here's an overview of your grievance activity.</p>
          </div>
          <Button onClick={() => navigate("/citizen/add-complaint")} size="lg" className="bg-gradient-to-r from-primary to-primary-glow text-primary-foreground shadow-[var(--shadow-elegant)]">
            <Plus className="h-4 w-4 mr-2" /> File New Grievance
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {stats.map((s) => (
            <Card key={s.label} className="p-6 shadow-[var(--shadow-card)] border-border/60">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">{s.label}</div>
                  <div className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</div>
                </div>
                <div className="p-3 rounded-xl bg-accent text-accent-foreground"><s.icon className="h-5 w-5" /></div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Link to="/citizen/add-complaint">
            <Card className="p-6 shadow-[var(--shadow-card)] border-border/60 hover:border-primary/40 transition group cursor-pointer h-full">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground"><Plus className="h-5 w-5" /></div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">File a Grievance</h3>
                  <p className="text-sm text-muted-foreground mt-1">Report an issue with photo and location.</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition" />
              </div>
            </Card>
          </Link>
          <Link to="/citizen/my-complaints">
            <Card className="p-6 shadow-[var(--shadow-card)] border-border/60 hover:border-primary/40 transition group cursor-pointer h-full">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-accent text-accent-foreground"><ListChecks className="h-5 w-5" /></div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">My Complaints</h3>
                  <p className="text-sm text-muted-foreground mt-1">Track status and manage your filed grievances.</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition" />
              </div>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default CitizenDashboard;
