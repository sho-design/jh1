import type { Metadata } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import LookSwitch from "@/components/LookSwitch";
import { LOOK_BOOT } from "@/lib/looks";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: "JH1 Parts | 3D printing in Toronto, priced instantly in CAD",
  description:
    "Upload an STL and see an all-in Canadian price in seconds. FDM and SLA printed in our GTA shop, delivered in 24 to 72 hours on Expedited. A named engineer checks every file.",
};

const PHONE = "416-555-0142";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-CA" className={`${archivo.variable} ${mono.variable}`} data-look="a" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: LOOK_BOOT }} /></head>
      <body>
        <div className="notice">Sample site for review. Rates, names, phone numbers and addresses are placeholders.</div>
        <header className="wrap">
          <nav className="nav" aria-label="Main">
            <Link href="/" className="brand">JH1<small>Parts, Toronto</small></Link>
            <div className="nav-links">
              <Link href="/processes/fdm" className="hide-s">FDM</Link>
              <Link href="/processes/sla" className="hide-s">SLA</Link>
              <Link href="/#speed" className="hide-s">Lead times</Link>
              <a href={`tel:${PHONE.replace(/-/g, "")}`} className="hide-s">{PHONE}</a>
              <Link href="/quote" className="btn">Get a price</Link>
            </div>
          </nav>
        </header>
        <main>{children}</main>
        <footer>
          <div className="wrap foot">
            <div>
              <p style={{ margin: "0 0 8px", color: "var(--ink)", fontWeight: 700 }}>JH1 Parts</p>
              <p style={{ margin: 0 }}>Street address, Mississauga, ON. Counter pickup Monday to Friday, 9 to 5.</p>
              <p style={{ margin: "6px 0 0" }}>{PHONE}<br />hello@jh1parts.example</p>
            </div>
            <ul>
              <li><Link href="/processes/fdm">FDM printing</Link></li>
              <li><Link href="/processes/sla">SLA printing</Link></li>
              <li><Link href="/processes/sls">SLS, MJF and metal</Link></li>
            </ul>
            <ul>
              <li><Link href="/quote">Instant quote</Link></li>
              <li><Link href="/#faq">Questions</Link></li>
              <li>Files stay private under NDA</li>
            </ul>
          </div>
        </footer>
        <LookSwitch />
      </body>
    </html>
  );
}
