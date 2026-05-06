import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import PasswordInput from "@/components/PasswordInput";
import PasswordStrength from "@/components/PasswordStrength";
import { signupSchema, loginSchema, resetRequestSchema } from "@/lib/authValidation";
import { toast } from "sonner";
import { Loader2, Shield, Users, Building2, ArrowRight, MailCheck } from "lucide-react";
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

  const [verificationSent, setVerificationSent] = useState<string | null>(null);

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSubmitting, setForgotSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && user && currentRole) {
      navigate(currentRole === "admin" ? "/admin-dashboard" : "/citizen-dashboard", { replace: true });
    }
  }, [user, currentRole, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (role === "citizen" && mode === "signup") {
        const parsed = signupSchema.safeParse({ name, email, password, confirm });
        if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }

        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { name: parsed.data.name, role: "citizen" },
          },
        });
        if (error) {
          if (error.message.toLowerCase().includes("already")) {
            toast.error("This email is already registered. Try logging in.");
          } else {
            toast.error(error.message);
          }
          return;
        }
        setVerificationSent(parsed.data.email);
        // Fire-and-forget welcome email via Resend
        supabase.functions.invoke("send-welcome-email", {
          body: { email: parsed.data.email, name: parsed.data.name },
        }).catch(() => {});
        toast.success("Check your inbox to verify your email.");
      } else {
        const parsed = loginSchema.safeParse({ email, password });
        if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email, password: parsed.data.password,
        });
        if (error) {
          if (error.message.toLowerCase().includes("email not confirmed")) {
            toast.error("Please verify your email before logging in.");
            setVerificationSent(parsed.data.email);
          } else {
            toast.error("Invalid email or password");
          }
          return;
        }

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

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = resetRequestSchema.safeParse({ email: forgotEmail });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setForgotSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setForgotSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("If an account exists, a reset link has been sent.");
    setForgotOpen(false);
    setForgotEmail("");
  };

  const resendVerification = async () => {
    if (!verificationSent) return;
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: verificationSent,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    if (error) toast.error(error.message);
    else toast.success("Verification email re-sent.");
  };

  const isAdmin = role === "admin";
  const showSignup = role === "citizen" && mode === "signup";

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Brand panel */}
        <div className="hidden lg:flex flex-col gap-6 px-6">
          <div className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Building2 className="h-4 w-4" /> CIVIC PLATFORM
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight leading-[1.05]">
            Citizen Grievance{" "}
            <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              System
            </span>
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

        {/* Form */}
        <Card className="p-8 shadow-[var(--shadow-card)] border-border/60 backdrop-blur bg-card/95">
          {verificationSent ? (
            <div className="text-center space-y-4 py-4">
              <div className="mx-auto w-14 h-14 rounded-full bg-accent flex items-center justify-center">
                <MailCheck className="h-7 w-7 text-accent-foreground" />
              </div>
              <h2 className="text-2xl font-bold">Verify your email</h2>
              <p className="text-sm text-muted-foreground">
                We sent a verification link to <span className="font-medium text-foreground">{verificationSent}</span>.
                Click it to activate your account, then log in.
              </p>
              <div className="flex flex-col gap-2 pt-2">
                <Button onClick={resendVerification} variant="outline">Resend verification email</Button>
                <Button variant="ghost" onClick={() => { setVerificationSent(null); setMode("login"); }}>
                  Back to login
                </Button>
              </div>
            </div>
          ) : (
            <>
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
                    {r === "admin"
                      ? <span className="inline-flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" />Admin</span>
                      : <span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />Citizen</span>}
                  </button>
                ))}
              </div>

              <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight">
                  {showSignup ? "Create your account" : isAdmin ? "Admin sign in" : "Welcome back"}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {showSignup ? "Verify your email after signup." : isAdmin ? "Authorized personnel only." : "Sign in to continue."}
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
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    {!showSignup && role === "citizen" && (
                      <button
                        type="button"
                        onClick={() => { setForgotEmail(email); setForgotOpen(true); }}
                        className="text-xs text-primary font-medium hover:underline"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <PasswordInput
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete={showSignup ? "new-password" : "current-password"}
                    required
                  />
                  {showSignup && <PasswordStrength password={password} />}
                </div>
                {showSignup && (
                  <div className="space-y-1.5">
                    <Label htmlFor="confirm">Confirm Password</Label>
                    <PasswordInput id="confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" required />
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
            </>
          )}
        </Card>
      </div>

      {/* Forgot password dialog */}
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset your password</DialogTitle>
            <DialogDescription>
              Enter your account email and we'll send you a secure reset link.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgot} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="forgot-email">Email</Label>
              <Input id="forgot-email" type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setForgotOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={forgotSubmitting}>
                {forgotSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset link"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default Index;
