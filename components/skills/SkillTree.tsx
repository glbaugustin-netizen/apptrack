"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSkillsStore, skillWithDescendants, lockedAncestor } from "@/lib/store/skills.store";
import { layoutSkillTree, linkPath, neonColor, wrapLabel, ROOT_RADIUS } from "@/lib/skillTree";

// Écran de jeu : toujours sombre, quel que soit le thème de l'app
const BG = "#06070A";
const LOCKED = "#5C5F66";      // bulles « + » verrouillées et leurs traits
const LOCKED_TEXT = "#B9BCC2";
const LABEL = "#D9DBDF";
const LOCKED_FILL = "#101217";  // bulle pas encore débloquée
const LOCKED_LINK = "#33363D";  // branche menant à une compétence pas encore débloquée
const GHOST_R = 12;
const MARGIN = 40;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3;
const DOT_SPACING = 24; // grille de points du fond, à l'échelle 1
const DRAG_THRESHOLD = 4; // au-delà, un appui devient un déplacement et n'ouvre rien

interface View { x: number; y: number; k: number }

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

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

function ControlButton({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick} title={label} aria-label={label}
      style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${LOCKED}`, borderRadius: 8, background: "rgba(6,7,10,0.85)", color: LOCKED_TEXT, cursor: "pointer", fontSize: 16 }}
      onMouseEnter={(e) => { e.currentTarget.style.color = "#FFFFFF"; e.currentTarget.style.borderColor = "#FFFFFF"; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = LOCKED_TEXT; e.currentTarget.style.borderColor = LOCKED; }}
    >
      <i className={`ti ${icon}`} />
    </button>
  );
}

/**
 * Arbre de compétences façon menu de jeu : il pousse vers le haut depuis ta bulle, en
 * branches néon. On zoome à la molette (ou en pinçant) et on se déplace en faisant glisser.
 * Les bulles « + » n'apparaissent qu'au survol (toujours visibles au doigt).
 */
export function SkillTree({ rootLabel }: { rootLabel: string }) {
  const { skills, openAdd, openEdit } = useSkillsStore();
  const layout = useMemo(() => layoutSkillTree(skills), [skills]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [view, setView] = useState<View | null>(null);
  const [dragging, setDragging] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [focusInside, setFocusInside] = useState(false);
  const [touch, setTouch] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const showPlus = hovering || focusInside || touch;

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const moved = useRef(0);
  const suppressClick = useRef(false);

  useEffect(() => {
    setTouch(window.matchMedia("(hover: none)").matches);
    const el = containerRef.current;
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
  const unlockedIds = useMemo(() => new Set(skills.filter((s) => s.unlocked).map((s) => s.id)), [skills]);
  const hoveredNode = layout.nodes.find((n) => n.skill.id === hoveredId) ?? null;

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

  // Zone occupée par l'arbre : bulles, noms en dessous et « + »
  const spots = [
    { x: 0, y: 0, r: ROOT_RADIUS + 30 },
    ...rootGhosts.map((g) => ({ x: g.x, y: g.y, r: GHOST_R + 6 })),
    ...layout.nodes.map((n) => ({ x: n.x, y: n.y, r: n.r + 56 })),
    ...nodeGhosts.map((g) => ({ x: g.x, y: g.y, r: GHOST_R + 6 })),
  ];
  const bounds = {
    minX: Math.min(...spots.map((p) => p.x - p.r)) - MARGIN,
    maxX: Math.max(...spots.map((p) => p.x + p.r)) + MARGIN,
    minY: Math.min(...spots.map((p) => p.y - p.r)) - MARGIN,
    maxY: Math.max(...spots.map((p) => p.y + p.r)) + MARGIN,
  };

  /** Cadre tout l'arbre dans la fenêtre. */
  function fitView(): View {
    const w = bounds.maxX - bounds.minX;
    const h = bounds.maxY - bounds.minY;
    const k = clamp(Math.min(box.width / w, box.height / h), 0.45, 1.25);
    return { k, x: box.width / 2 - (bounds.minX + w / 2) * k, y: box.height / 2 - (bounds.minY + h / 2) * k };
  }

  // Premier affichage : l'arbre entier, ensuite c'est toi qui zoomes et te déplaces
  useEffect(() => {
    if (!view && box.width && box.height) setView(fitView());
  }, [box, view]);

  function zoomAt(px: number, py: number, factor: number) {
    setView((v) => {
      if (!v) return v;
      const k = clamp(v.k * factor, MIN_ZOOM, MAX_ZOOM);
      const f = k / v.k;
      return { k, x: px - (px - v.x) * f, y: py - (py - v.y) * f };
    });
  }

  // Molette / pincement du pavé tactile : zoom centré sur la souris
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      zoomAt(e.clientX - rect.left, e.clientY - rect.top, Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if ((e.target as Element).closest("button")) return; // boutons de zoom
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) moved.current = 0;
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const next = { x: e.clientX, y: e.clientY };

    if (pointers.current.size === 2) {
      // Pincement à deux doigts : zoom autour du milieu des doigts
      const other = Array.from(pointers.current.entries()).find(([id]) => id !== e.pointerId)![1];
      const before = Math.hypot(prev.x - other.x, prev.y - other.y);
      const after = Math.hypot(next.x - other.x, next.y - other.y);
      const rect = e.currentTarget.getBoundingClientRect();
      if (before > 0) zoomAt((next.x + other.x) / 2 - rect.left, (next.y + other.y) / 2 - rect.top, after / before);
      moved.current += DRAG_THRESHOLD + 1;
    } else {
      const dx = next.x - prev.x;
      const dy = next.y - prev.y;
      moved.current += Math.abs(dx) + Math.abs(dy);
      if (moved.current > DRAG_THRESHOLD) {
        if (!dragging) {
          setDragging(true);
          e.currentTarget.setPointerCapture(e.pointerId);
        }
        setView((v) => (v ? { ...v, x: v.x + dx, y: v.y + dy } : v));
      }
    }
    pointers.current.set(e.pointerId, next);
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    pointers.current.delete(e.pointerId);
    if (moved.current > DRAG_THRESHOLD) suppressClick.current = true; // la fin d'un glisser n'ouvre pas de bulle
    if (pointers.current.size === 0) setDragging(false);
  }

  const v = view ?? { x: 0, y: 0, k: 1 };
  let dot = DOT_SPACING * v.k;
  while (dot < 14) dot *= 2;
  while (dot > 48) dot /= 2;
  const rootLines = wrapLabel(rootLabel.toUpperCase(), 9);

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => { setHovering(false); setHoveredId(null); }}
      onFocus={() => setFocusInside(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocusInside(false); }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClickCapture={(e) => { if (suppressClick.current) { suppressClick.current = false; e.stopPropagation(); e.preventDefault(); } }}
      style={{
        position: "relative", width: "100%", height: "100%", overflow: "hidden", touchAction: "none",
        cursor: dragging ? "grabbing" : "grab", userSelect: "none",
        background: [
          // Grille de points d'atelier : elle suit le zoom et le déplacement
          `radial-gradient(circle, rgba(255,255,255,0.075) 1px, transparent 1.4px) ${v.x}px ${v.y}px / ${dot}px ${dot}px`,
          "radial-gradient(circle at 25% 35%, rgba(255,255,255,0.045), transparent 38%)",
          "radial-gradient(circle at 78% 60%, rgba(255,255,255,0.035), transparent 35%)",
          BG,
        ].join(", "),
      }}
    >
      {view && (
        <svg width="100%" height="100%" role="group" aria-label="Arbre de compétences" style={{ display: "block", fontFamily: "var(--font-sans)" }}>
          <defs>
            <filter id="skill-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g transform={`translate(${v.x} ${v.y}) scale(${v.k})`}>
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

            {/* Branches : grises tant que la compétence n'est pas débloquée, néon ensuite */}
            {layout.links.filter((l) => !unlockedIds.has(l.childId)).map((l) => (
              <path key={l.childId} d={linkPath(l)} fill="none" stroke={LOCKED_LINK} strokeWidth={l.depth === 1 ? 3 : 2} strokeLinecap="round" />
            ))}
            <g filter="url(#skill-glow)">
              {layout.links.filter((l) => unlockedIds.has(l.childId)).map((l) => (
                <path key={l.childId} d={linkPath(l)} fill="none" stroke={branchColor.get(l.branchId)} strokeWidth={l.depth === 1 ? 6 : 4} strokeLinecap="round" />
              ))}
            </g>

            {/* Bulle de départ */}
            <circle r={ROOT_RADIUS + 9} fill="none" stroke="#FFFFFF" strokeOpacity={0.18} strokeWidth={1.5} />
            <circle r={ROOT_RADIUS} fill={BG} stroke="#FFFFFF" strokeWidth={2.5} filter="url(#skill-glow)" />
            <text textAnchor="middle" fontSize={rootLines.length > 1 ? 11 : 12.5} fontWeight={700} letterSpacing={1.6} fill="#FFFFFF" style={{ pointerEvents: "none" }}>
              {rootLines.map((line, i) => (
                <tspan key={i} x={0} dy={i === 0 ? -((rootLines.length - 1) / 2) * 13 + 4.5 : 13}>{line}</tspan>
              ))}
            </text>

            {/* Compétences */}
            {layout.nodes.map((n) => {
              const unlocked = n.skill.unlocked;
              const branch = branchColor.get(n.branchId) ?? "#FFFFFF";
              const color = unlocked ? branch : LOCKED;
              const hovered = hoveredId === n.skill.id;
              const main = n.depth === 1;
              const branchIds = main ? skillWithDescendants(skills, n.skill.id) : [];
              const branchUnlocked = branchIds.filter((id) => unlockedIds.has(id)).length;
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
                  style={{ cursor: dragging ? "grabbing" : "pointer", outline: "none" }}
                >
                  <circle r={n.r + 6} fill="none" stroke={hovered && !unlocked ? branch : color} strokeOpacity={hovered ? 0.8 : 0.35} strokeWidth={1.5} style={{ transition: "stroke-opacity 0.12s" }} />
                  {unlocked
                    ? <circle r={n.r} fill={branch} filter="url(#skill-glow)" />
                    : <circle r={n.r} fill={LOCKED_FILL} stroke={LOCKED} strokeWidth={1.5} />}
                  {n.skill.emoji ? (
                    <text
                      textAnchor="middle" dy={n.r * 0.36} fontSize={n.r * 1.05}
                      style={{ pointerEvents: "none", filter: unlocked ? undefined : "grayscale(1)", opacity: unlocked ? 1 : 0.45 }}
                    >
                      {n.skill.emoji}
                    </text>
                  ) : (
                    <text textAnchor="middle" dy={n.r * 0.34} fontSize={n.r * 0.95} fontWeight={700} fill={unlocked ? BG : LOCKED_TEXT} style={{ pointerEvents: "none" }}>
                      {n.skill.name.trim().charAt(0).toUpperCase()}
                    </text>
                  )}
                  {main ? (
                    <>
                      <HaloText y={n.r + 24} lines={wrapLabel(n.skill.name.toUpperCase(), 14)} size={11.5} color={unlocked ? branch : LOCKED_TEXT} weight={700} spacing={1.4} />
                      <HaloText y={n.r + 24 + wrapLabel(n.skill.name, 14).length * 14 + 6} lines={[`${branchUnlocked}/${branchIds.length}`]} size={17} color={unlocked ? branch : LOCKED_TEXT} weight={700} />
                    </>
                  ) : (
                    <HaloText y={n.r + 18} lines={wrapLabel(n.skill.name, 14)} size={11} color={unlocked ? LABEL : LOCKED_TEXT} />
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      )}

      {/* Info-bulle au survol : nom, description et état */}
      {view && !dragging && hoveredNode && (() => {
        const n = hoveredNode;
        const color = n.skill.unlocked ? branchColor.get(n.branchId) ?? "#FFFFFF" : LOCKED;
        const below = v.y + (n.y - n.r) * v.k < 150; // pas la place au-dessus : on l'affiche en dessous
        const left = clamp(v.x + n.x * v.k, 135, Math.max(135, box.width - 135));
        const top = below ? v.y + (n.y + n.r + 14) * v.k : v.y + (n.y - n.r - 14) * v.k;
        const blocker = n.skill.unlocked ? null : lockedAncestor(skills, n.skill.parentId);
        return (
          <div
            role="tooltip"
            style={{
              position: "absolute", left, top, transform: below ? "translateX(-50%)" : "translate(-50%, -100%)",
              width: 250, padding: "10px 12px", borderRadius: 10, pointerEvents: "none",
              background: "rgba(10,11,14,0.94)", border: `1px solid ${color}`, color: LABEL, fontSize: 12, lineHeight: 1.5,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 18, filter: n.skill.unlocked ? undefined : "grayscale(1)" }}>{n.skill.emoji || n.skill.name.charAt(0).toUpperCase()}</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "#FFFFFF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.skill.name}</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: n.skill.unlocked ? color : LOCKED_TEXT }}>
                <i className={`ti ${n.skill.unlocked ? "ti-check" : "ti-lock"}`} style={{ fontSize: 12 }} />
                {n.skill.unlocked ? "Débloquée" : "Verrouillée"}
              </span>
            </div>
            <div style={{ whiteSpace: "pre-wrap", color: n.skill.description ? LABEL : LOCKED_TEXT, fontStyle: n.skill.description ? "normal" : "italic" }}>
              {n.skill.description || "Pas encore de description. Clique sur la bulle pour en ajouter une."}
            </div>
            {blocker && blocker.id !== n.skill.id && (
              <div style={{ marginTop: 6, fontSize: 11, color: LOCKED_TEXT }}>Débloque d&apos;abord « {blocker.name} ».</div>
            )}
          </div>
        );
      })()}

      {/* Zoom et recentrage */}
      <div style={{ position: "absolute", right: 12, bottom: 12, display: "flex", gap: 6 }}>
        <ControlButton icon="ti-minus" label="Dézoomer" onClick={() => zoomAt(box.width / 2, box.height / 2, 1 / 1.25)} />
        <ControlButton icon="ti-plus" label="Zoomer" onClick={() => zoomAt(box.width / 2, box.height / 2, 1.25)} />
        <ControlButton icon="ti-focus-centered" label="Recentrer l'arbre" onClick={() => setView(fitView())} />
      </div>

      <div style={{ position: "absolute", left: 14, bottom: 16, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: LOCKED, pointerEvents: "none" }}>
        {touch ? "Pince pour zoomer · glisse pour te déplacer" : "Molette pour zoomer · glisse pour te déplacer"}
      </div>

      {skills.length === 0 && !showPlus && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 18, textAlign: "center", fontSize: 12, letterSpacing: "0.08em", color: LOCKED_TEXT, pointerEvents: "none", textTransform: "uppercase" }}>
          Survole l&apos;arbre pour débloquer ta première branche
        </div>
      )}
    </div>
  );
}
