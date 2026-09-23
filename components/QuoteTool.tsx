"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { parseStl } from "@/lib/stl";
import {
  MATERIALS, FINISHES, SPEEDS, quote, cad,
  type FinishId, type Geometry, type SpeedId,
} from "@/lib/pricing";

type Loaded = { name: string; geometry: Geometry & { triangles: number } };

export default function QuoteTool({ compact = false }: { compact?: boolean }) {
  const [file, setFile] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const [materialId, setMaterialId] = useState("pla");
  const [finish, setFinish] = useState<FinishId>("raw");
  const [speed, setSpeed] = useState<SpeedId>("standard");
  const [quantity, setQuantity] = useState(1);
  const [po, setPo] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const KEY = "jh1-quote";

  // Carry a part from the homepage tool to the full quote page.
  useEffect(() => {
    if (compact) return;
    try {
      const saved = sessionStorage.getItem(KEY);
      if (!saved) return;
      const d = JSON.parse(saved);
      setFile(d.file); setMaterialId(d.materialId); setFinish(d.finish); setSpeed(d.speed); setQuantity(d.quantity);
    } catch { /* storage unavailable: start empty */ }
  }, [compact]);

  const continueToOrder = () => {
    try { sessionStorage.setItem(KEY, JSON.stringify({ file, materialId, finish, speed, quantity })); } catch { /* ignore */ }
    window.location.href = "/quote";
  };

  const load = useCallback(async (name: string, buf: ArrayBuffer) => {
    setError(null); setMessage(null);
    if (!/\.stl$/i.test(name)) {
      setError("This preview prices STL files. STEP, 3MF and OBJ are accepted when the geometry service is connected in week 1.");
      return;
    }
    try {
      setFile({ name, geometry: parseStl(buf) });
    } catch (e) {
      setError(e instanceof Error ? e.message : "This file could not be read. Export it again as STL and retry.");
    }
  }, []);

  const onFiles = async (files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    if (f.size > 100 * 1024 * 1024) { setError("Files up to 100 MB are accepted."); return; }
    await load(f.name, await f.arrayBuffer());
  };

  const trySample = async () => {
    const res = await fetch("/sample-bracket.stl");
    await load("sample-bracket.stl", await res.arrayBuffer());
    setQuantity(5);
  };

  const q = useMemo(
    () => (file ? quote({ geometry: file.geometry, materialId, finish, speed, quantity }) : null),
    [file, materialId, finish, speed, quantity],
  );
  const bySpeed = useMemo(() => {
    if (!file) return null;
    return (Object.keys(SPEEDS) as SpeedId[]).map((s) => ({ s, total: quote({ geometry: file.geometry, materialId, finish, speed: s, quantity }).subtotal }));
  }, [file, materialId, finish, quantity]);

  const checkout = async () => {
    if (!file) return;
    setBusy(true); setMessage(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, geometry: file.geometry, materialId, finish, speed, quantity, poNumber: po || undefined }),
      });
      const data = await res.json();
      if (data.url) { window.location.href = data.url; return; }
      setMessage(data.message ?? "Checkout is not available right now. Call us and we will take the order by phone.");
    } catch {
      setMessage("Checkout could not start. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="panel" aria-live="polite">
      <div
        className={`drop${over ? " over" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); onFiles(e.dataTransfer.files); }}
      >
        <strong>{file ? file.name : "Drop an STL file here"}</strong>
        <p className="muted" style={{ margin: "0 0 14px" }}>
          {file ? "Drop another file to replace it." : "Priced in your browser. Nothing is uploaded until you order."}
        </p>
        <div className="row" style={{ justifyContent: "center" }}>
          <label className="btn">
            Choose a file
            <input ref={inputRef} type="file" accept=".stl" onChange={(e) => onFiles(e.target.files)} />
          </label>
          {!file && <button type="button" className="btn ghost" onClick={trySample}>Try a sample part</button>}
        </div>
      </div>

      {error && <p className="flag" role="alert">{error}</p>}

      {file && q && (
        <>
          <div className="geo">
            <span><b>{file.geometry.bbox.join(" × ")}</b> mm</span>
            <span><b>{file.geometry.volumeCm3.toFixed(2)}</b> cm³</span>
            <span><b>{q.grams}</b> g printed</span>
          </div>

          <div className="fields">
            <label className="f">Material
              <select value={materialId} onChange={(e) => setMaterialId(e.target.value)}>
                <optgroup label="FDM, printed in-house">
                  {MATERIALS.filter((m) => m.process === "fdm").map((m) => <option key={m.id} value={m.id}>{m.name}: {m.note}</option>)}
                </optgroup>
                <optgroup label="SLA, printed in-house">
                  {MATERIALS.filter((m) => m.process === "sla").map((m) => <option key={m.id} value={m.id}>{m.name}: {m.note}</option>)}
                </optgroup>
              </select>
            </label>
            <label className="f">Finish
              <select value={finish} onChange={(e) => setFinish(e.target.value as FinishId)}>
                {(Object.keys(FINISHES) as FinishId[]).map((f) => <option key={f} value={f}>{FINISHES[f].name}</option>)}
              </select>
            </label>
            <label className="f">Quantity
              <input type="number" min={1} max={500} value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))} />
            </label>
            {!compact && (
              <label className="f">PO number (optional)
                <input type="text" value={po} maxLength={40} onChange={(e) => setPo(e.target.value)} placeholder="For your invoice" />
              </label>
            )}
          </div>

          <div className="speeds" role="group" aria-label="Lead time">
            {bySpeed?.map(({ s, total }) => (
              <button key={s} type="button" className="speed" aria-pressed={speed === s} onClick={() => setSpeed(s)}>
                <b>{SPEEDS[s].name}</b>
                <span>{SPEEDS[s].days}</span>
                <em>{cad(total)}</em>
              </button>
            ))}
          </div>

          {q.flags.map((f) => <p key={f} className="flag">{f}</p>)}

          {!compact && (
            <table className="lines"><tbody>
              {q.lines.map((l) => <tr key={l.label}><td>{l.label}</td><td>{cad(l.amount)}</td></tr>)}
              <tr><td>HST (13%, Ontario; set by province at checkout)</td><td>{cad(q.tax)}</td></tr>
            </tbody></table>
          )}

          <div className="total">
            <span>{compact ? "Subtotal before tax" : "Total in CAD, tax included"}</span>
            <b>{cad(compact ? q.subtotal : q.total)}</b>
          </div>
          <p className="muted" style={{ margin: "0 0 16px" }}>
            {SPEEDS[speed].days}. Shipping is added at checkout, or pick up free at our counter. Price version {q.version}.
          </p>

          {compact ? (
            <button type="button" className="btn plate" style={{ width: "100%" }} onClick={continueToOrder}>Continue to order</button>
          ) : (
            <button type="button" className="btn plate" style={{ width: "100%" }} onClick={checkout} disabled={busy}>
              {busy ? "Starting checkout" : `Pay ${cad(q.total)} and order`}
            </button>
          )}
          {message && <p className="flag" role="status">{message}</p>}
        </>
      )}
    </div>
  );
}
