import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PROCESS_PAGES, getProcess } from "@/lib/processes";

export function generateStaticParams() {
  return PROCESS_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = getProcess((await params).slug);
  if (!p) return {};
  return { title: `${p.title} | JH1 Parts`, description: p.answer.slice(0, 155) };
}

export default async function ProcessPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = getProcess((await params).slug);
  if (!p) notFound();
  return (
    <article className="wrap" style={{ padding: "24px 24px 80px", maxWidth: 860 }}>
      <p className="muted" style={{ margin: "0 0 8px" }}>
        {p.lane === "in_house" ? "Printed in our shop" : "Printed by a vetted partner, checked by us"}
      </p>
      <h1 className="layered" style={{ fontSize: "clamp(34px, 5vw, 58px)" }}>{p.title}</h1>
      <p className="lede" style={{ maxWidth: "60ch" }}>{p.answer}</p>
      <div className="row" style={{ marginBottom: 48 }}>
        {p.lane === "in_house" ? (
          <Link className="btn plate" href="/quote">Price {p.slug === "sla" ? "an" : "a"} {p.name} part</Link>
        ) : (
          <a className="btn plate" href="mailto:hello@jh1parts.example?subject=Quote%20request">Email a file for a {p.name} quote</a>
        )}
      </div>
      <div className="lanes" style={{ gap: 32 }}>
        <div><h2 style={{ fontSize: 26 }}>Best for</h2><ul className="proof">{p.bestFor.map((x) => <li key={x}>{x}</li>)}</ul></div>
        <div><h2 style={{ fontSize: 26 }}>Materials</h2><ul className="proof">{p.materials.map((x) => <li key={x}>{x}</li>)}</ul></div>
      </div>
      <h2 style={{ fontSize: 26, marginTop: 40 }}>Limits to know</h2>
      <ul className="proof">{p.limits.map((x) => <li key={x}>{x}</li>)}</ul>
    </article>
  );
}
