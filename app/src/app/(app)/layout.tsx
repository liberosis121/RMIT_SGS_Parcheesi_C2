import { Providers } from "../providers";
import { Shell } from "@/components/Shell";

// Real pages: TideCloak provider + real nav. Preview pages (/preview/*) live outside this group on purpose.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <Shell>{children}</Shell>
    </Providers>
  );
}
