import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogOut, Shield, Users, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const AdminDashboard = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    toast.success("Signed out");
    navigate("/", { replace: true });
  };

  const stats = [
    { icon: Users, label: "Total Citizens", value: "—" },
    { icon: AlertTriangle, label: "Open Issues", value: "0" },
    { icon: CheckCircle2, label: "Resolved", value: "0" },
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

      <main className="container py-12">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-admin mb-2">
            <Shield className="h-3.5 w-3.5" /> Restricted Access
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">Monitor and manage citizen grievances.</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          {stats.map((s) => (
            <Card key={s.label} className="p-6 shadow-[var(--shadow-card)] border-border/60">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">{s.label}</div>
                  <div className="text-3xl font-bold mt-1">{s.value}</div>
                </div>
                <div className="p-3 rounded-xl bg-admin/10 text-admin"><s.icon className="h-5 w-5" /></div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-10 text-center border-dashed border-border/80 bg-card/50">
          <Shield className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-semibold text-lg">All systems operational</h3>
          <p className="text-sm text-muted-foreground mt-1">No grievances require attention right now.</p>
        </Card>
      </main>
    </div>
  );
};

export default AdminDashboard;
