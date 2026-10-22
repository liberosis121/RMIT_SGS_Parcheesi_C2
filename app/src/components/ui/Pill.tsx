export type PillKind = "completed" | "waiting" | "denied" | "blocked" | "approved";
const MAP: Record<PillKind, [string, string]> = {
  completed: ["pill-ok", "Completed"],
  approved: ["pill-ok", "Approved – ready to send"],
  waiting: ["pill-wait", "Waiting for family approval"],
  denied: ["pill-bad", "Denied"],
  blocked: ["pill-bad", "Blocked by bank"],
};
export function Pill({ kind }: { kind: PillKind }) {
  const [cls, label] = MAP[kind];
  return <span className={`pill ${cls}`}>{label}</span>;
}
