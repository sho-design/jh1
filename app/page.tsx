import Link from "next/link";
import QuoteTool from "@/components/QuoteTool";
import { SPEEDS, MIN_ORDER, cad, type SpeedId } from "@/lib/pricing";

const PHONE = "416-555-0142";

const faqs = [
  ["Which files can I upload?", "STL today. STEP, 3MF and OBJ are added when the geometry service goes live. If your file will not load, email it and we will price it by hand within two business hours."],
  ["Is the price final?", "Yes, for the file, material, finish and lead time you chose. An engineer reviews every order before printing. If something will not print as drawn, we call you before charging anything extra."],
  ["What does the price include?", "Material, machine time, finishing and the engineer check, in Canadian dollars. Tax is shown before you pay. Shipping is added at checkout, or you pick up free at our counter."],
  ["Can I pay by purchase order?", "Yes. Add your PO number to the quote. Approved business accounts can pay on net-30 invoicing."],
  ["Who sees my files?", "Only the engineer and the operator printing your part. Files are stored privately and we sign NDAs on request, at no charge."],
  ["What about SLS, MJF and metal?", "We route those to vetted partner shops in Ontario, check the parts ourselves, and ship them to you with photos. One order, one invoice, one person to call."],
];

export default function Home() {
  const speeds = Object.keys(SPEEDS) as SpeedId[];
  return (
    <>
      <div className="wrap hero">
        <div className="hero-copy">
          <h1 className="layered">Upload a part. See the price in dollars. Hold it in three days.</h1>
          <p className="lede">FDM and SLA printed in our Mississauga shop, priced in seconds, checked by an engineer you can call.</p>
        </div>
        <div className="hero-tool"><QuoteTool compact /></div>
          <ul className="proof">
            <li>All-in price in CAD before you pay, with tax and shipping shown</li>
            <li>Expedited orders ship in 24 to 72 hours, or pick up at our counter</li>
            <li>Every file reviewed by a named engineer before it prints</li>
            <li>Purchase orders and net-30 accounts for businesses</li>
          </ul>
      </div>

      <section className="band">
        <div className="wrap">
          <h2>How an order moves</h2>
          <p className="sub">Four steps, each one emailed to you as it happens.</p>
          <div className="steps">
            <div className="step"><h3>Upload and price</h3><p>Drop your file, choose material, finish and speed. The price updates as you choose.</p></div>
            <div className="step"><h3>Pay or send a PO</h3><p>Card at checkout, or your PO number on an invoice. Tax is calculated for your province.</p></div>
            <div className="step"><h3>Engineer check</h3><p>We confirm wall thickness, orientation and tolerances. Problems get a phone call, not a surprise.</p></div>
            <div className="step"><h3>Printed and shipped</h3><p>You get photos of your parts before they ship, then tracking. Or collect them at the counter.</p></div>
          </div>
        </div>
      </section>

      <section className="band" id="speed">
        <div className="wrap">
          <h2>Pick your lead time</h2>
          <p className="sub">Same part, same quality. Faster lanes jump the queue on our own printers, which is why we can promise them.</p>
          <div className="table-scroll">
            <table className="table">
              <thead><tr><th>Lead time</th><th>Ready in</th><th>Price</th><th>Best for</th></tr></thead>
              <tbody>
                {speeds.map((s) => (
                  <tr key={s}>
                    <td><b>{SPEEDS[s].name}</b></td>
                    <td>{SPEEDS[s].days}</td>
                    <td>{SPEEDS[s].multiplier === 1 ? "Base price" : SPEEDS[s].multiplier < 1 ? `${Math.round((1 - SPEEDS[s].multiplier) * 100)}% less` : `${Math.round((SPEEDS[s].multiplier - 1) * 100)}% more`}</td>
                    <td>{s === "economy" ? "Batches and parts you can wait for" : s === "standard" ? "Most prototypes" : "Demos, line-down fixes, deadlines"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="muted">Minimum order {cad(MIN_ORDER)} before tax. Business days, Monday to Friday, from the time the engineer approves your file.</p>
        </div>
      </section>

      <section className="band dark">
        <div className="wrap">
          <h2>Printed here, or routed and checked</h2>
          <p className="sub">We run our own FDM and SLA farm for speed. For processes that need industrial machines, we send the job to a partner shop we have vetted and put our own quality check on it.</p>
          <div className="lanes">
            <div className="lane own">
              <h3>In our shop</h3>
              <p className="tag">Fastest lane. Counter pickup available.</p>
              <ul>
                <li><Link href="/processes/fdm"><span>FDM</span><span className="tag">PLA, PETG, ASA, Nylon CF</span></Link></li>
                <li><Link href="/processes/sla"><span>SLA</span><span className="tag">Standard and tough resins</span></Link></li>
              </ul>
            </div>
            <div className="lane">
              <h3>Through our partners</h3>
              <p className="tag">Priced by quote while we connect partner rates.</p>
              <ul>
                <li><Link href="/processes/sls"><span>SLS</span><span className="tag">Nylon PA12</span></Link></li>
                <li><Link href="/processes/mjf"><span>MJF</span><span className="tag">Production nylon</span></Link></li>
                <li><Link href="/processes/metal"><span>Metal</span><span className="tag">Stainless, aluminium</span></Link></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="band">
        <div className="wrap person">
          <div className="avatar" aria-hidden="true">JH</div>
          <div>
            <h2>Talk to the person who checks your file</h2>
            <p className="prose" style={{ margin: "0 0 16px" }}>
              Engineer Name, P.Eng., reviews every order before it prints. Questions about tolerances, materials or a part that failed somewhere else get a real answer, usually within two hours on business days.
            </p>
            <div className="row">
              <a className="btn" href={`tel:${PHONE.replace(/-/g, "")}`}>Call {PHONE}</a>
              <Link className="btn ghost" href="/quote">Get a price first</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="band" id="faq">
        <div className="wrap">
          <h2>Questions</h2>
          <div style={{ maxWidth: 820 }}>
            {faqs.map(([q, a]) => (
              <details key={q}><summary>{q}</summary><p>{a}</p></details>
            ))}
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: "JH1 Parts",
            description: "3D printing service in the GTA with instant online pricing in CAD.",
            telephone: `+1-${PHONE}`,
            address: { "@type": "PostalAddress", addressLocality: "Mississauga", addressRegion: "ON", addressCountry: "CA" },
            areaServed: "CA",
          }),
        }}
      />
    </>
  );
}
