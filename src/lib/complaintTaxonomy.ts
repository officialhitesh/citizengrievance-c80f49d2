export const DEPARTMENTS = [
  "Sanitation",
  "Roads",
  "Water",
  "Electricity",
  "Public Safety",
  "Health",
  "Other",
] as const;

export type Department = (typeof DEPARTMENTS)[number];

export const URGENCIES = ["Low", "Medium", "High", "Critical"] as const;
export type Urgency = (typeof URGENCIES)[number];

export const STATUSES = ["Pending", "In Progress", "Resolved"] as const;
export type Status = (typeof STATUSES)[number];

export const URGENCY_RANK: Record<Urgency, number> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};
