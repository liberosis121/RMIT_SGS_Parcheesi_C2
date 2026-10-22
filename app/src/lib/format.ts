const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
/** ₫200,000,000 */
export const money = (n: number) => fmt.format(n);
export const maskAccount = (acc: string) => `•••• ${acc.slice(-4)}`;
export function timeAgo(iso: string | number | undefined) {
  if (!iso) return "";
  const t = typeof iso === "number" ? iso : Date.parse(iso);
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
