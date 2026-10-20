"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useSkillsStore } from "@/lib/store/skills.store";
import { HABIT_COLORS } from "@/lib/habitColors";
import { layoutSkillTree, wrapLabel, nodeRadius, ROOT_RADIUS } from "@/lib/skillTree";

const PLUS_R = 11;
const MARGIN = 36;
const MIN_SCALE = 0.7; // en dessous, le texte devient illisible : on fait défiler l'arbre à la place
const MAX_SCALE = 1.2;

function activate(e: React.KeyboardEvent, action: () => void) {
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); action(); }
}

function PlusButton({ x, y, visible, color, label, onClick }: { x: number; y: number; visible: boolean; color: string; label: string; onClick: () => void }) {
  return (
    <g
      transform={`translate(${x} ${y})`}
      role="button"
      tabIndex={0}
      aria-label={label}
      onClick={onClick}
      onKeyDown={(e) => activate(e, onClick)}
      style={{ cursor: "pointer", opacity: visible ? 1 : 0, pointerEvents: visible ? "auto" : "none", transition: "opacity 0.15s", outline: "none" }}
    >
      <circle r={PLUS_R + 7} fill="transparent" />
      <circle r={PLUS_R} fill="var(--color-background-primary)" stroke={color} strokeWidth={1.5} />
      <path d="M -5 0 H 5 M 0 -5 V 5" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

/** Nom centré dans une bulle : la police rétrécit pour qu'un mot long tienne en entier. */
function Label({ text, radius, maxFont, color, weight = 400 }: { text: string; radius: number; maxFont: number; color: string; weight?: number }) {
  const width = radius * 1.7;
  const longest = Math.max(...text.trim().split(/\s+/).map((w) => w.length), 1);
  const fontSize = Math.max(9, Math.min(maxFont, width / (longest * 0.56)));
  const lines = wrapLabel(text, Math.max(longest, Math.floor(width / (fontSize * 0.56))));
  const lineHeight = fontSize * 1.15;
  return (
    <text textAnchor="middle" fontSize={fontSize} fontWeight={weight} fill={color} style={{ pointerEvents: "none", userSelect: "none" }}>
      {lines.map((line, i) => (
        <tspan key={i} x={0} dy={i === 0 ? -((lines.length - 1) / 2) * lineHeight + fontSize * 0.35 : lineHeight}>{line}</tspan>
      ))}
    </text>
  );
}

/**
 * Arbre de compétences : bulle centrale, compétences principales autour, sous-compétences
 * en éventail. Les « + » n'apparaissent qu'au survol de l'arbre (toujours visibles au doigt).
 */
export function SkillTree({ rootLabel, accent, accentDark }: { rootLabel: string; accent: string; accentDark: string }) {
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
    for (const s of skills) if (s.parentId === null) map.set(s.id, s.color || HABIT_COLORS[0].hex);
    return map;
  }, [skills]);

  // Zone occupée par l'arbre, « + » compris
  const reach = 2 * PLUS_R + 26;
  const spots = [{ x: 0, y: 0, r: ROOT_RADIUS + reach }, ...layout.nodes.map((n) => ({ x: n.x, y: n.y, r: n.r + reach }))];
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

  // Arbre plus grand que l'écran : on centre la vue
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = Math.max(0, (pw - el.clientWidth) / 2);
    el.scrollTop = Math.max(0, (ph - el.clientHeight) / 2);
  }, [pw, ph]);

  return (
    <div
      ref={scrollRef}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => { setHovering(false); setHoveredId(null); }}
      onFocus={() => setFocusInside(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocusInside(false); }}
      style={{ position: "relative", width: "100%", height: "100%", overflow: "auto" }}
    >
      <div style={{ minWidth: "100%", minHeight: "100%", width: pw, height: ph, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width={pw} height={ph} viewBox={`${minX} ${minY} ${w} ${h}`} role="group" aria-label="Arbre de compétences" style={{ display: "block", flexShrink: 0, overflow: "visible" }}>
          {layout.links.map((l, i) => (
            <line key={i} x1={l.from.x} y1={l.from.y} x2={l.to.x} y2={l.to.y} stroke={branchColor.get(l.branchId)} strokeOpacity={0.45} strokeWidth={2} strokeLinecap="round" />
          ))}

          {/* Bulle centrale */}
          <circle r={ROOT_RADIUS + 7} fill="none" stroke={accent} strokeOpacity={0.35} strokeWidth={2} />
          <circle r={ROOT_RADIUS} fill={accentDark} />
          <Label text={rootLabel} radius={ROOT_RADIUS} maxFont={17} color="#fff" weight={500} />

          {layout.nodes.map((n) => {
            const color = branchColor.get(n.branchId) ?? HABIT_COLORS[0].hex;
            const hovered = hoveredId === n.skill.id;
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
                <circle r={n.r} fill="var(--color-background-primary)" />
                <circle r={n.r} fill={color} fillOpacity={n.depth === 1 ? 0.22 : 0.08} stroke={color} strokeWidth={hovered ? 3.5 : n.depth === 1 ? 2.5 : 2} style={{ transition: "stroke-width 0.1s" }} />
                <Label text={n.skill.name} radius={n.r} maxFont={n.depth === 1 ? 14 : 12.5} color="var(--color-text-primary)" weight={n.depth === 1 ? 500 : 400} />
              </g>
            );
          })}

          {/* « + » : nouvelle compétence autour du centre, sous-compétence derrière chaque bulle */}
          {layout.rootSlots.map((slot, i) => (
            <PlusButton
              key={`root-${i}`}
              x={Math.cos(slot.angle) * (ROOT_RADIUS + 24)}
              y={Math.sin(slot.angle) * (ROOT_RADIUS + 24)}
              visible={showPlus}
              color={accent}
              label="Ajouter une compétence"
              onClick={() => openAdd(null, slot.order)}
            />
          ))}
          {layout.nodes.map((n) => (
            <PlusButton
              key={`plus-${n.skill.id}`}
              x={n.x + Math.cos(n.angle) * (nodeRadius(n.depth) + 18)}
              y={n.y + Math.sin(n.angle) * (nodeRadius(n.depth) + 18)}
              visible={showPlus}
              color={branchColor.get(n.branchId) ?? accent}
              label={`Ajouter une sous-compétence à ${n.skill.name}`}
              onClick={() => openAdd(n.skill.id)}
            />
          ))}
        </svg>
      </div>

      {skills.length === 0 && !showPlus && (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 16, textAlign: "center", fontSize: 12, color: "var(--color-text-secondary)", pointerEvents: "none" }}>
          Survole l&apos;arbre et clique sur un + pour ajouter ta première compétence
        </div>
      )}
    </div>
  );
}
