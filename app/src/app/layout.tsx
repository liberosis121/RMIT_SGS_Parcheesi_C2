import "./globals.css";
import { Providers } from "./providers";
import { Shell } from "@/components/Shell";

export const metadata = { title: "Khiên Nhà – Ví hai chìa cho gia đình" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <Providers>
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  );
}
