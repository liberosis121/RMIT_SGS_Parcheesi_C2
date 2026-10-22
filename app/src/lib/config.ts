import tcConfig from "../../data/tidecloak.json";
import personas from "../../data/personas.json";
import seed from "../../seed/seed.json";

export { seed };
export const TC_URL = (tcConfig as any)["auth-server-url"].replace(/\/+$/, "") as string;
export const REALM = (tcConfig as any).realm as string;
export const BANK_URL = process.env.NEXT_PUBLIC_BANK_URL || "http://localhost:4000";
export const BANK_CLIENT = "mock-bank";
export const BIG_ROLE = "chuyen-khoan-lon";
export const ADMIN_API = `${TC_URL}/admin/realms/${REALM}`;

export type Persona = { username: string; display: string; role: "parent" | "child" };

/** Personas are keyed by Keycloak user id (`sub`): Tide may turn usernames into vuids after linking. */
export function personaFor(sub: string | undefined | null): Persona | null {
  if (!sub) return null;
  return (personas as Record<string, Persona>)[sub] ?? null;
}

export function recipientName(id: string) {
  return seed.recipients.find((r) => r.id === id)?.name ?? id;
}

export const vnd = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + " đ";
