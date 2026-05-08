import { Badge } from "@/components/ui/badge";
import { Department } from "@/lib/complaintTaxonomy";

const STYLES: Record<string, string> = {
  Sanitation: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400",
  Roads: "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400",
  Water: "bg-sky-500/15 text-sky-700 border-sky-500/30 dark:text-sky-400",
  Electricity: "bg-yellow-500/15 text-yellow-700 border-yellow-500/30 dark:text-yellow-400",
  "Public Safety": "bg-red-500/15 text-red-700 border-red-500/30 dark:text-red-400",
  Health: "bg-pink-500/15 text-pink-700 border-pink-500/30 dark:text-pink-400",
  Other: "bg-muted text-muted-foreground border-border",
};

const DepartmentBadge = ({ value }: { value: Department | string | null }) => {
  if (!value) return <Badge variant="outline" className="text-muted-foreground">Unclassified</Badge>;
  return <Badge variant="outline" className={STYLES[value] ?? STYLES.Other}>{value}</Badge>;
};

export default DepartmentBadge;
