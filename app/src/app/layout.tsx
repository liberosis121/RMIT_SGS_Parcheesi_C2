import "./globals.css";
import { Inter, Fraunces } from "next/font/google";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-inter", display: "swap" });
const serif = Fraunces({ subsets: ["latin"], variable: "--font-serif", display: "swap", axes: ["opsz"] });

export const metadata = {
  title: "KinKey – Two keys for every big transfer",
  description: "Parents stay in control of everyday money. Big transfers wait for a second key from someone they trust.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
