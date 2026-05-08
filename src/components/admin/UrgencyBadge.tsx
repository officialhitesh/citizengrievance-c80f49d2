import { Badge } from "@/components/ui/badge";
import { Urgency } from "@/lib/complaintTaxonomy";

const STYLES: Record<string, string> = {
  Low: "bg-green-500/15 text-green-700 border-green-500/30 dark:text-green-400",
  Medium: "bg-yellow-500/15 text-yellow-700 border-yellow-500/30 dark:text-yellow-400",
  High: "bg-orange-500/15 text-orange-700 border-orange-500/30 dark:text-orange-400",
  Critical: "bg-red-500/20 text-red-700 border-red-500/40 dark:text-red-400 font-semibold",
};

const UrgencyBadge = ({ value }: { value: Urgency | string | null }) => {
  if (!value) return <Badge variant="outline" className="text-muted-foreground">—</Badge>;
  return <Badge variant="outline" className={STYLES[value] ?? ""}>{value}</Badge>;
};

export default UrgencyBadge;
