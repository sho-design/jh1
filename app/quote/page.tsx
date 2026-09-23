import type { Metadata } from "next";
import QuoteTool from "@/components/QuoteTool";

export const metadata: Metadata = {
  title: "Instant 3D printing quote in CAD | JH1 Parts",
  description: "Upload an STL, choose material, finish and lead time, and pay in Canadian dollars. Engineer-checked before printing.",
};

export default function QuotePage() {
  return (
    <div className="wrap" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", maxWidth: 760, padding: "24px 24px 80px" }}>
      <h1 className="layered" style={{ fontSize: "clamp(34px, 5vw, 56px)" }}>Your instant quote</h1>
      <p className="lede" style={{ maxWidth: "52ch" }}>Choose material, finish, quantity and lead time. The total includes tax for Ontario; your province is applied at checkout.</p>
      <QuoteTool />
      <p className="muted" style={{ marginTop: 20 }}>
        Need SLS, MJF, metal or more than 500 parts? Email the file and we will quote within two business hours.
      </p>
    </div>
  );
}
