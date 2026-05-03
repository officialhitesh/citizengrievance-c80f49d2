import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogOut, Users, FileText, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const CitizenDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("name").eq("id", user.id).maybeSingle()
      .then(({ data }) => setName(data?.name ?? ""));
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    toast.success("Signed out");
    navigate("/", { replace: true });
  };

  const stats = [
    { icon: FileText, label: "Total Grievances", value: "0" },
    { icon: Clock, label: "Pending", value: "0" },
    { icon: CheckCircle2, label: "Resolved", value: "0" },
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
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight">
            Welcome, <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">{name || "Citizen"}</span>
          </h1>
          <p className="text-muted-foreground mt-2">Here's an overview of your grievance activity.</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          {stats.map((s) => (
            <Card key={s.label} className="p-6 shadow-[var(--shadow-card)] border-border/60">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">{s.label}</div>
                  <div className="text-3xl font-bold mt-1">{s.value}</div>
                </div>
                <div className="p-3 rounded-xl bg-accent text-accent-foreground"><s.icon className="h-5 w-5" /></div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-10 text-center border-dashed border-border/80 bg-card/50">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-semibold text-lg">No grievances yet</h3>
          <p className="text-sm text-muted-foreground mt-1">File your first grievance to get started.</p>
        </Card>
      </main>
    </div>
  );
};

export default CitizenDashboard;
