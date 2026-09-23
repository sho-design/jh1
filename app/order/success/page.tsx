import Link from "next/link";

export const metadata = { title: "Order received | JH1 Parts", robots: { index: false } };

export default function Success() {
  return (
    <div className="wrap" style={{ padding: "48px 24px 96px", maxWidth: 720 }}>
      <h1 className="layered" style={{ fontSize: "clamp(34px, 5vw, 56px)" }}>Order received</h1>
      <p className="lede">Your payment went through and your file is in the engineer queue. You will get an email when it is approved, another when it prints, and photos before it ships.</p>
      <Link className="btn ghost" href="/">Back to the homepage</Link>
    </div>
  );
}
