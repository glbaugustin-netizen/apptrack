"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { fmtAvg, fmtDate, fmtNum } from "@/lib/store/grades.store";

export interface EvolutionPoint {
  id: string;
  title: string;
  date: string;       // "YYYY-MM-DD"
  value: number;      // note ramenée sur 20
  raw: string | null; // "7/10" quand le barème n'est pas 20
  average: number;    // moyenne cumulée /20 après cette éval
}

const HEIGHT = 220;
const PAD = { top: 18, right: 18, bottom: 28, left: 30 };
const TICKS = [0, 5, 10, 15, 20];
const LABEL_GAP = 46; // espace mini entre deux dates sur l'axe
// Série de contexte : gris neutre sans points (la note garde les points + la couleur de la matière).
// text-secondary à 70 % reste au-dessus de 3:1 sur le fond clair comme sur le fond sombre.
const AVERAGE_COLOR = "var(--color-text-secondary)";
const AVERAGE_OPACITY = 0.7;

function LineKey({ color, dot, opacity = 1 }: { color: string; dot?: boolean; opacity?: number }) {
  return (
    <svg width={18} height={10} aria-hidden style={{ flexShrink: 0 }} opacity={opacity}>
      <line x1={1} y1={5} x2={17} y2={5} stroke={color} strokeWidth={2} strokeLinecap="round" />
      {dot && <circle cx={9} cy={5} r={3} fill={color} />}
    </svg>
  );
}

export function EvolutionLegend({ color }: { color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--color-text-secondary)" }}>
        <LineKey color={color} dot /> Note
      </span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--color-text-secondary)" }}>
        <LineKey color={AVERAGE_COLOR} opacity={AVERAGE_OPACITY} /> Moyenne cumulée
      </span>
    </div>
  );
}

export function GradeEvolutionChart({ points, color, onOpen }: { points: EvolutionPoint[]; color: string; onOpen: (id: string) => void }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const lastTap = useRef<number | null>(null);
  const [width, setWidth] = useState(0);
  const [tipWidth, setTipWidth] = useState(170);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => setWidth(Math.floor(entries[0].contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const n = points.length;
  const current = active !== null && active < n ? active : null;

  const plotW = Math.max(width - PAD.left - PAD.right, 0);
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const inset = n > 1 ? 12 : 0;
  const step = n > 1 ? (plotW - 2 * inset) / (n - 1) : 0;
  const x = (i: number) => (n > 1 ? PAD.left + inset + i * step : PAD.left + plotW / 2);
  const y = (v: number) => PAD.top + plotH * (1 - Math.min(Math.max(v, 0), 20) / 20);
  const path = (key: "value" | "average") =>
    points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p[key]).toFixed(1)}`).join(" ");

  // Une date sur `every` pour ne pas chevaucher, la dernière toujours affichée
  const every = n > 1 ? Math.max(1, Math.ceil(LABEL_GAP / Math.max(step, 1))) : 1;
  const showDate = (i: number) => i === n - 1 || (i % every === 0 && (n - 1 - i) * step >= LABEL_GAP);

  function indexAt(clientX: number, el: Element): number {
    if (n <= 1) return 0;
    const px = clientX - el.getBoundingClientRect().left;
    return Math.min(n - 1, Math.max(0, Math.round((px - PAD.left - inset) / step)));
  }

  function handlePointerUp(e: React.PointerEvent<SVGSVGElement>) {
    if (e.button !== 0 || n === 0) return;
    const i = indexAt(e.clientX, e.currentTarget);
    // Souris : clic = ouvrir. Tactile : 1er tap = infobulle, 2e tap sur le même point = ouvrir.
    if (e.pointerType === "mouse" || lastTap.current === i) onOpen(points[i].id);
    lastTap.current = i;
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (n === 0) return;
    if (e.key === "ArrowRight") { e.preventDefault(); setActive(current === null ? 0 : Math.min(n - 1, current + 1)); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); setActive(current === null ? n - 1 : Math.max(0, current - 1)); }
    else if (e.key === "Enter" && current !== null) onOpen(points[current].id);
    else if (e.key === "Escape") setActive(null);
  }

  useLayoutEffect(() => {
    if (tipRef.current) setTipWidth(tipRef.current.offsetWidth);
  }, [current, points]);

  const tip = current !== null ? points[current] : null;
  const tipX = current !== null ? x(current) : 0;
  // À droite du repère si la place le permet, sinon à gauche, toujours dans le cadre
  let tipLeft = tipX + 12;
  if (tipLeft + tipWidth > width) tipLeft = tipX - 12 - tipWidth;
  tipLeft = Math.max(0, Math.min(tipLeft, width - tipWidth));
  // Point dans la moitié haute : infobulle en bas, pour ne pas masquer les courbes
  const tipLow = tip !== null && tip.value >= 10;

  const last = n > 0 ? points[n - 1] : null;
  let lastLabelY = 0;
  if (last) {
    const ly = y(last.value);
    const above = last.value >= last.average ? ly - 11 >= PAD.top - 4 : ly + 18 > PAD.top + plotH;
    lastLabelY = above ? ly - 11 : ly + 18;
  }

  return (
    <div
      ref={wrapRef}
      tabIndex={0}
      aria-label="Graphique d'évolution des notes. Flèches gauche et droite pour parcourir les évaluations, Entrée pour ouvrir."
      onKeyDown={handleKeyDown}
      onFocus={() => setActive((a) => a ?? n - 1)}
      onBlur={() => setActive(null)}
      style={{ position: "relative", height: HEIGHT, borderRadius: "var(--border-radius-md)" }}
    >
      {width > 0 && (
        <svg
          width={width}
          height={HEIGHT}
          role="img"
          aria-label={last ? `${n} évaluation${n > 1 ? "s" : ""}, dernière note ${fmtNum(last.value)} sur 20, moyenne ${fmtAvg(last.average)}` : "Aucune évaluation"}
          style={{ display: "block", cursor: n ? "pointer" : "default", touchAction: "pan-y" }}
          onPointerDown={(e) => n && setActive(indexAt(e.clientX, e.currentTarget))}
          onPointerMove={(e) => { if (n && (e.pointerType === "mouse" || e.buttons)) setActive(indexAt(e.clientX, e.currentTarget)); }}
          onPointerLeave={(e) => { if (e.pointerType === "mouse") setActive(null); }}
          onPointerUp={handlePointerUp}
        >
          {TICKS.map((t) => {
            const ty = Math.round(y(t)) + 0.5;
            return (
              <g key={t}>
                <line x1={PAD.left} x2={width - PAD.right} y1={ty} y2={ty} stroke="var(--color-border-tertiary)" strokeWidth={1} shapeRendering="crispEdges" />
                <text x={PAD.left - 8} y={ty} dy="0.32em" textAnchor="end" fontSize={10} fill="var(--color-text-secondary)" className="tabular-nums">{t}</text>
              </g>
            );
          })}

          {points.map((p, i) => showDate(i) && (
            <text key={p.id} x={x(i)} y={HEIGHT - 8} textAnchor="middle" fontSize={10} fill="var(--color-text-secondary)" className="tabular-nums">
              {fmtDate(p.date, { day: "2-digit", month: "2-digit" })}
            </text>
          ))}

          {current !== null && (
            <line x1={Math.round(tipX) + 0.5} x2={Math.round(tipX) + 0.5} y1={PAD.top} y2={PAD.top + plotH} stroke="var(--color-border-secondary)" strokeWidth={1} shapeRendering="crispEdges" />
          )}

          <path d={path("average")} fill="none" stroke={AVERAGE_COLOR} strokeOpacity={AVERAGE_OPACITY} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          <path d={path("value")} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

          {points.map((p, i) => (
            <circle key={p.id} cx={x(i)} cy={y(p.value)} r={i === current ? 5.5 : 4} fill={color} stroke="var(--color-background-primary)" strokeWidth={2} />
          ))}

          {last && current !== n - 1 && (
            <text x={x(n - 1)} y={lastLabelY} textAnchor="middle" fontSize={11} fontWeight={500} fill="var(--color-text-primary)" className="tabular-nums">
              {fmtNum(last.value)}
            </text>
          )}
        </svg>
      )}

      {tip && (
        <div
          ref={tipRef}
          role="status"
          aria-live="polite"
          style={{
            position: "absolute",
            left: tipLeft,
            top: tipLow ? undefined : PAD.top - 8,
            bottom: tipLow ? PAD.bottom + 6 : undefined,
            maxWidth: 200,
            padding: "8px 10px",
            background: "var(--color-background-primary)",
            border: "0.5px solid var(--color-border-secondary)",
            borderRadius: "var(--border-radius-md)",
            pointerEvents: "none",
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>
            {fmtDate(tip.date, { day: "numeric", month: "long", year: "numeric" })}
          </span>
          <span style={{ fontSize: 12, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 3 }}>
            {tip.title}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <LineKey color={color} dot />
            <strong className="tabular-nums" style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>{fmtNum(tip.value)}/20</strong>
            <span style={{ fontSize: 11, color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>{tip.raw ? `note (${tip.raw})` : "note"}</span>
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <LineKey color={AVERAGE_COLOR} opacity={AVERAGE_OPACITY} />
            <strong className="tabular-nums" style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>{fmtAvg(tip.average)}</strong>
            <span style={{ fontSize: 11, color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>moyenne</span>
          </span>
        </div>
      )}
    </div>
  );
}
