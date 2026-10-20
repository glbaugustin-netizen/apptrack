"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useSkillsStore, skillWithDescendants } from "@/lib/store/skills.store";
import { layoutSkillTree, linkPath, neonColor, wrapLabel, ROOT_RADIUS } from "@/lib/skillTree";

// Écran de jeu : toujours sombre, quel que soit le thème de l'app
const BG = "#06070A";
const LOCKED = "#5C5F66";      // bulles « + » verrouillées et leurs traits
const LOCKED_TEXT = "#B9BCC2";
const LABEL = "#D9DBDF";
const GHOST_R = 12;
const MARGIN = 40;
const MIN_SCALE = 0.7; // en dessous, le texte devient illisible : on fait défiler l'arbre à la place
const MAX_SCALE = 1.25;

function activate(e: React.KeyboardEvent, action: () => void) {
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); action(); }
}

/** Texte avec un halo de la couleur du fond : il reste lisible quand une branche passe derrière. */
function HaloText({ x = 0, y, lines, size, color, weight = 400, spacing = 0, anchor = "middle" }: {
  x?: number; y: number; lines: string[]; size: number; color: string; weight?: number; spacing?: number; anchor?: "start" | "middle" | "end";
}) {
  return (
    <text
      x={x} y={y} textAnchor={anchor} fontSize={size} fontWeight={weight} fill={color} letterSpacing={spacing}
      stroke={BG} strokeWidth={4} strokeLinejoin="round" paintOrder="stroke"
      style={{ pointerEvents: "none", userSelect: "none" }}
    >
      {lines.map((line, i) => <tspan key={i} x={x} dy={i === 0 ? 0 : size * 1.2}>{line}</tspan>)}
    </text>
  );
}

/** Bulle « verrouillée » avec un + : ajoute une compétence à cet endroit. */
function GhostNode({ x, y, from, visible, color, label, onClick }: {
  x: number; y: number; from: { x: number; y: number }; visible: boolean; color: string; label: string; onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  const stroke = hover ? color : LOCKED;
  return (
    <g style={{ opacity: visible ? 1 : 0, pointerEvents: visible ? "auto" : "none", transition: "opacity 0.18s" }}>
      <line x1={from.x} y1={from.y} x2={x} y2={y} stroke={stroke} strokeWidth={1.5} />
      <g
        transform={`translate(${x} ${y})`}
        role="button"
        tabIndex={0}
        aria-label={label}
        onClick={onClick}
        onKeyDown={(e) => activate(e, onClick)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{ cursor: "pointer", outline: "none" }}
      >
        <circle r={GHOST_R + 8} fill="transparent" />
        <circle r={GHOST_R} fill={BG} stroke={stroke} strokeWidth={1.5} />
        <path d="M -5 0 H 5 M 0 -5 V 5" stroke={hover ? color : LOCKED_TEXT} strokeWidth={1.8} strokeLinecap="round" />
      </g>
    </g>
  );
}

/**
 * Arbre de compétences façon menu de jeu : il pousse vers le haut depuis ta bulle, en
 * branches néon. Les bulles « + » n'apparaissent qu'au survol (toujours visibles au doigt).
 */
export function SkillTree({ rootLabel }: { rootLabel: string }) {
  const { skills, openAdd, openEdit } = useSkillsStore();
  const layout = useMemo(() => layoutSkillTree(skills), [skills]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [hovering, setHovering] = useState(false);
  const [focusInside, setFocusInside] = useState(false);
  const [touch, setTouch] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const showPlus = hovering || focusInside || touch;

  useEffect(() => {
    setTouch(window.matchMedia("(hover: none)").matches);
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setBox({ width: entry.contentRect.width, height: entry.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const branchColor = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of skills) if (s.parentId === null) map.set(s.id, neonColor(s.color));
    return map;
  }, [skills]);

  // Emplacements des « + » : autour de la bulle de départ, et au bout de chaque compétence
  const rootGhosts = layout.rootSlots.map((slot) => ({
    x: Math.cos(slot.angle) * (ROOT_RADIUS + 62),
    y: Math.sin(slot.angle) * (ROOT_RADIUS + 62),
    from: { x: Math.cos(slot.angle) * ROOT_RADIUS, y: Math.sin(slot.angle) * ROOT_RADIUS },
    order: slot.order,
  }));
  const nodeGhosts = layout.nodes.map((n) => {
    // Avec des sous-compétences, le « + » se place à côté de l'éventail pour ne pas tomber sur une branche
    const kids = layout.nodes.filter((k) => k.skill.parentId === n.skill.id);
    const last = kids[kids.length - 1];
    const angle = last ? Math.atan2(last.y - n.y, last.x - n.x) + 0.6 : n.angle;
    return {
      node: n,
      x: n.x + Math.cos(angle) * (n.r + 40),
      y: n.y + Math.sin(angle) * (n.r + 40),
      from: { x: n.x + Math.cos(angle) * n.r, y: n.y + Math.sin(angle) * n.r },
    };
  });

  // Zone occupée : bulles, noms en dessous et « + »
  const spots = [
    { x: 0, y: 0, r: ROOT_RADIUS + 30 },
    ...rootGhosts.map((g) => ({ x: g.x, y: g.y, r: GHOST_R + 6 })),
    ...layout.nodes.map((n) => ({ x: n.x, y: n.y, r: n.r + 56 })),
    ...nodeGhosts.map((g) => ({ x: g.x, y: g.y, r: GHOST_R + 6 })),
  ];
  const minX = Math.min(...spots.map((p) => p.x - p.r)) - MARGIN;
  const maxX = Math.max(...spots.map((p) => p.x + p.r)) + MARGIN;
  const minY = Math.min(...spots.map((p) => p.y - p.r)) - MARGIN;
  const maxY = Math.max(...spots.map((p) => p.y + p.r)) + MARGIN;
  const w = maxX - minX;
  const h = maxY - minY;
  const fit = box.width && box.height ? Math.min(box.width / w, box.height / h) : 1;
  const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, fit));
  const pw = w * scale;
  const ph = h * scale;

  // Arbre plus grand que l'écran : on montre le bas, là où il prend racine
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = Math.max(0, (pw - el.clientWidth) / 2);
    el.scrollTop = Math.max(0, ph - el.clientHeight);
  }, [pw, ph]);

  const rootLines = wrapLabel(rootLabel.toUpperCase(), 9);

  return (
    <div
      ref={scrollRef}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => { setHovering(false); setHoveredId(null); }}
      onFocus={() => setFocusInside(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocusInside(false); }}
      style={{
        position: "relative", width: "100%", height: "100%", overflow: "auto",
        background: `radial-gradient(circle at 25% 35%, rgba(255,255,255,0.045), transparent 38%), radial-gradient(circle at 78% 60%, rgba(255,255,255,0.035), transparent 35%), ${BG}`,
      }}
    >
      <div style={{ minWidth: "100%", minHeight: "100%", width: pw, height: ph, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width={pw} height={ph} viewBox={`${minX} ${minY} ${w} ${h}`} role="group" aria-label="Arbre de compétences" style={{ display: "block", flexShrink: 0, overflow: "visible", fontFamily: "var(--font-sans)" }}>
          <defs>
            <filter id="skill-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Bulles « + » verrouillées, sous l'arbre */}
          {rootGhosts.map((g, i) => (
            <GhostNode key={`root-${i}`} x={g.x} y={g.y} from={g.from} visible={showPlus} color="#FFFFFF" label="Ajouter une branche" onClick={() => openAdd(null, g.order)} />
          ))}
          {nodeGhosts.map((g) => (
            <GhostNode
              key={`ghost-${g.node.skill.id}`} x={g.x} y={g.y} from={g.from} visible={showPlus}
              color={branchColor.get(g.node.branchId) ?? "#FFFFFF"}
              label={`Ajouter une sous-compétence à ${g.node.skill.name}`}
              onClick={() => openAdd(g.node.skill.id)}
            />
          ))}

          {/* Branches néon */}
          <g filter="url(#skill-glow)">
            {layout.links.map((l, i) => (
              <path key={i} d={linkPath(l)} fill="none" stroke={branchColor.get(l.branchId)} strokeWidth={l.depth === 1 ? 6 : 4} strokeLinecap="round" />
            ))}
          </g>

          {/* Bulle de départ */}
          <circle r={ROOT_RADIUS + 9} fill="none" stroke="#FFFFFF" strokeOpacity={0.18} strokeWidth={1.5} />
          <circle r={ROOT_RADIUS} fill={BG} stroke="#FFFFFF" strokeWidth={2.5} filter="url(#skill-glow)" />
          <text textAnchor="middle" fontSize={rootLines.length > 1 ? 11 : 12.5} fontWeight={700} letterSpacing={1.6} fill="#FFFFFF" style={{ pointerEvents: "none", userSelect: "none" }}>
            {rootLines.map((line, i) => (
              <tspan key={i} x={0} dy={i === 0 ? -((rootLines.length - 1) / 2) * 13 + 4.5 : 13}>{line}</tspan>
            ))}
          </text>

          {/* Compétences */}
          {layout.nodes.map((n) => {
            const color = branchColor.get(n.branchId) ?? "#FFFFFF";
            const hovered = hoveredId === n.skill.id;
            const main = n.depth === 1;
            const count = main ? skillWithDescendants(skills, n.skill.id).length - 1 : 0;
            return (
              <g
                key={n.skill.id}
                transform={`translate(${n.x} ${n.y})`}
                role="button"
                tabIndex={0}
                aria-label={`${n.skill.name} : modifier`}
                onClick={() => openEdit(n.skill)}
                onKeyDown={(e) => activate(e, () => openEdit(n.skill))}
                onMouseEnter={() => setHoveredId(n.skill.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{ cursor: "pointer", outline: "none" }}
              >
                <circle r={n.r + 6} fill="none" stroke={color} strokeOpacity={hovered ? 0.8 : 0.35} strokeWidth={1.5} style={{ transition: "stroke-opacity 0.12s" }} />
                <circle r={n.r} fill={color} filter="url(#skill-glow)" />
                <text textAnchor="middle" dy={n.r * 0.34} fontSize={n.r * 0.95} fontWeight={700} fill={BG} style={{ pointerEvents: "none", userSelect: "none" }}>
                  {n.skill.name.trim().charAt(0).toUpperCase()}
                </text>
                {main ? (
                  <>
                    <HaloText y={n.r + 24} lines={wrapLabel(n.skill.name.toUpperCase(), 14)} size={11.5} color={color} weight={700} spacing={1.4} />
                    <HaloText y={n.r + 24 + (wrapLabel(n.skill.name, 14).length) * 14 + 6} lines={[String(count)]} size={18} color={color} weight={700} />
                  </>
                ) : (
                  <HaloText y={n.r + 18} lines={wrapLabel(n.skill.name, 14)} size={11} color={LABEL} />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {skills.length === 0 && !showPlus && (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 16, textAlign: "center", fontSize: 12, letterSpacing: "0.08em", color: LOCKED_TEXT, pointerEvents: "none", textTransform: "uppercase" }}>
          Survole l&apos;arbre pour débloquer ta première branche
        </div>
      )}
    </div>
  );
}
