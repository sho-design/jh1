import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap" style={{ padding: "48px 24px 96px" }}>
      <h1 className="layered" style={{ fontSize: 48 }}>This page is not here</h1>
      <p className="lede">The link may be old. Start a quote or go back to the homepage.</p>
      <div className="row"><Link className="btn" href="/quote">Get a price</Link><Link className="btn ghost" href="/">Homepage</Link></div>
    </div>
  );
}
