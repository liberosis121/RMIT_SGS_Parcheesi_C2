import personas from "../../data/personas.json";
import type { Persona } from "./config";

/** Map CR authorizer usernames (may be Tide vuids) to family display names where we can. */
export function approverNames(auth: { username: string }[]): string[] {
  const list = Object.values(personas as Record<string, Persona>);
  return Array.from(
    new Set(
      auth.map((a) => {
        const p = list.find((x) => x.username === a.username);
        return p ? p.display : a.username.length > 16 ? a.username.slice(0, 8) + "…" : a.username;
      })
    )
  );
}
