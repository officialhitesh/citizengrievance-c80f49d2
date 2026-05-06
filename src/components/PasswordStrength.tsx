import { Check, X } from "lucide-react";
import { evaluatePassword } from "@/lib/authValidation";
import { cn } from "@/lib/utils";

const PasswordStrength = ({ password }: { password: string }) => {
  const { score, checks } = evaluatePassword(password);
  const labels = ["Too weak", "Weak", "Fair", "Good", "Strong"];
  const colors = ["bg-destructive", "bg-destructive", "bg-amber-500", "bg-amber-500", "bg-success"];

  if (!password) return null;

  const items = [
    { ok: checks.length, label: "At least 8 characters" },
    { ok: checks.upper, label: "One uppercase letter" },
    { ok: checks.lower, label: "One lowercase letter" },
    { ok: checks.number, label: "One number" },
  ];

  return (
    <div className="space-y-2 pt-1">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              i < score ? colors[score] : "bg-muted",
            )}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Password strength</span>
        <span className="text-xs font-medium">{labels[score]}</span>
      </div>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1 pt-1">
        {items.map((it) => (
          <li key={it.label} className="flex items-center gap-1.5 text-xs">
            {it.ok ? (
              <Check className="h-3 w-3 text-success" />
            ) : (
              <X className="h-3 w-3 text-muted-foreground" />
            )}
            <span className={it.ok ? "text-foreground" : "text-muted-foreground"}>{it.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PasswordStrength;
