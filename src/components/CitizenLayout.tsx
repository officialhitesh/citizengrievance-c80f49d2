import { ReactNode, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LayoutDashboard, FilePlus2, ListChecks, LogOut, Users, Menu } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/citizen-dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/citizen/add-complaint", label: "Add Complaint", icon: FilePlus2 },
  { to: "/citizen/my-complaints", label: "My Complaints", icon: ListChecks },
];

const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => (
  <nav className="flex flex-col gap-1 p-4">
    {NAV.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        end
        onClick={onNavigate}
        className={({ isActive }) =>
          cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition",
            isActive
              ? "bg-gradient-to-r from-primary to-primary-glow text-primary-foreground shadow-[var(--shadow-elegant)]"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )
        }
      >
        <item.icon className="h-4 w-4" />
        {item.label}
      </NavLink>
    ))}
  </nav>
);

const CitizenLayout = ({ children }: { children: ReactNode }) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    toast.success("Signed out");
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-card/60 backdrop-blur sticky top-0 h-screen">
        <Link to="/citizen-dashboard" className="flex items-center gap-2 px-5 h-16 border-b border-border font-bold">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
            <Users className="h-4 w-4" />
          </div>
          Citizen Portal
        </Link>
        <div className="flex-1 overflow-y-auto">
          <SidebarContent />
        </div>
        <div className="p-4 border-t border-border">
          <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start">
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden border-b border-border bg-card/80 backdrop-blur sticky top-0 z-20">
          <div className="flex h-14 items-center justify-between px-4">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <Link to="/citizen-dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-5 h-16 border-b border-border font-bold">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
                    <Users className="h-4 w-4" />
                  </div>
                  Citizen Portal
                </Link>
                <SidebarContent onNavigate={() => setMobileOpen(false)} />
                <div className="p-4 border-t border-border">
                  <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start">
                    <LogOut className="h-4 w-4 mr-2" /> Logout
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            <div className="font-bold">Citizen Portal</div>
            <div className="w-9" />
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
};

export default CitizenLayout;
