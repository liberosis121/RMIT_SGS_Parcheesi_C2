// Client-safe re-export of the seed (state.ts imports node:fs and must stay server-side).
import seed from "../../../seed/seed.json";
export { seed };
