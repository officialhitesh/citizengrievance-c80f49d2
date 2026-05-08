import { Badge } from "@/components/ui/badge";

const STYLES: Record<string, string> = {
  Pending: "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400",
  "In Progress": "bg-blue-500/15 text-blue-700 border-blue-500/30 dark:text-blue-400",
  Resolved: "bg-green-500/15 text-green-700 border-green-500/30 dark:text-green-400",
};

const StatusBadge = ({ value }: { value: string }) => (
  <Badge variant="outline" className={STYLES[value] ?? ""}>{value}</Badge>
);

export default StatusBadge;
