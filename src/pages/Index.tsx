import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Shield, Users, Building2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Role = "citizen" | "admin";
type Mode = "login" | "signup";

const Index = () => {
  const navigate = useNavigate();
  const { user, role: currentRole, loading: authLoading } = useAuth();

  const [role, setRole] = useState<Role>("citizen");
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && user && currentRole) {
      navigate(currentRole === "admin" ? "/admin-dashboard" : "/citizen-dashboard", { replace: true });
    }
  }, [user, currentRole, authLoading, navigate]);

  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) return toast.error("Please enter a valid email");
    if (password.length < 8) return toast.error("Password must be at least 8 characters");

    setSubmitting(true);
    try {
      if (role === "citizen" && mode === "signup") {
        if (!name.trim()) { toast.error("Name is required"); return; }
        if (password !== confirm) { toast.error("Passwords do not match"); return; }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { name, role: "citizen" },
          },
        });
        if (error) { toast.error(error.message); return; }
        toast.success("Account created! Redirecting...");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { toast.error("Invalid email or password"); return; }

        const { data: roleRow } = await supabase
          .from("user_roles").select("role").eq("user_id", data.user.id).maybeSingle();

        const userRole = roleRow?.role;
        if (role === "admin" && userRole !== "admin") {
          await supabase.auth.signOut();
          toast.error("Access Denied: Admin credentials required");
          setPassword("");
          return;
        }
        if (role === "citizen" && userRole !== "citizen") {
          await supabase.auth.signOut();
          toast.error("This account is not a citizen account");
          return;
        }
        toast.success("Welcome back!");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isAdmin = role === "admin";
  const showSignup = role === "citizen" && mode === "signup";

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left brand panel */}
        <div className="hidden lg:flex flex-col gap-6 px-6">
          <div className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Building2 className="h-4 w-4" /> CIVIC PLATFORM
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight leading-[1.05]">
            Citizen Grievance <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">System</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-md">
            A transparent, secure platform connecting citizens with administrators to resolve community concerns swiftly.
          </p>
          <div className="flex flex-col gap-3 mt-4">
            {[
              { icon: Users, title: "For Citizens", desc: "File and track grievances effortlessly." },
              { icon: Shield, title: "For Admins", desc: "Manage and resolve community issues." },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-3 p-4 rounded-xl bg-card/60 backdrop-blur border border-border">
                <div className="p-2 rounded-lg bg-accent text-accent-foreground"><f.icon className="h-5 w-5" /></div>
                <div>
                  <div className="font-semibold">{f.title}</div>
                  <div className="text-sm text-muted-foreground">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right form card */}
        <Card className="p-8 shadow-[var(--shadow-card)] border-border/60 backdrop-blur bg-card/95">
          {/* Role toggle */}
          <div className="flex p-1 bg-muted rounded-xl mb-6">
            {(["citizen", "admin"] as Role[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => { setRole(r); setMode("login"); }}
                className={cn(
                  "flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all capitalize",
                  role === r
                    ? r === "admin"
                      ? "bg-admin text-admin-foreground shadow-md"
                      : "bg-card text-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {r === "admin" ? <span className="inline-flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" />Admin</span>
                              : <span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />Citizen</span>}
              </button>
            ))}
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight">
              {showSignup ? "Create your account" : isAdmin ? "Admin sign in" : "Welcome back"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {showSignup ? "Join the platform in seconds." : isAdmin ? "Authorized personnel only." : "Sign in to continue."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {showSignup && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" required />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            {showSignup && (
              <div className="space-y-1.5">
                <Label htmlFor="confirm">Confirm Password</Label>
                <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" required />
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className={cn(
                "w-full h-11 font-semibold text-base group",
                isAdmin
                  ? "bg-admin hover:bg-admin/90 text-admin-foreground shadow-[var(--shadow-admin)]"
                  : "bg-gradient-to-r from-primary to-primary-glow hover:opacity-95 text-primary-foreground shadow-[var(--shadow-elegant)]"
              )}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <span className="inline-flex items-center gap-2">
                  {showSignup ? "Sign Up" : isAdmin ? "Admin Login" : "Login"}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              )}
            </Button>
          </form>

          {role === "citizen" && (
            <p className="text-center text-sm text-muted-foreground mt-6">
              {mode === "login" ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
                className="text-primary font-semibold hover:underline"
              >
                {mode === "login" ? "Sign Up" : "Login"}
              </button>
            </p>
          )}
        </Card>
      </div>
    </main>
  );
};

export default Index;
