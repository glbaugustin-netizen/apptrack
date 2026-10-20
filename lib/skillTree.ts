import type { Skill } from "@/lib/types/skill.types";
import { HABIT_COLORS } from "@/lib/habitColors";

/** Couleurs néon des branches (même ordre que la palette de l'app, pour convertir les anciennes). */
export const NEON_COLORS = ["#B26BFF", "#3BC8FF", "#2CF28A", "#A6F53B", "#FFD21F", "#FF7A1A", "#FF3BA1", "#E6E6E6"];

export function neonColor(hex: string): string {
  const i = HABIT_COLORS.findIndex((c) => c.hex.toLowerCase() === hex.toLowerCase());
  return i >= 0 ? NEON_COLORS[i] : hex || NEON_COLORS[0];
}

/** Rayon de la bulle de départ et des bulles selon la profondeur. */
export const ROOT_RADIUS = 40;
export const nodeRadius = (depth: number) => (depth === 1 ? 26 : 18);
/** Distance à la bulle de départ de chaque niveau de l'arbre. */
const ringRadius = (depth: number) => 210 + (depth - 1) * 150;
/** L'arbre pousse vers le haut : les branches principales se partagent cet arc. */
const ARC_START = -Math.PI + 0.32;
const ARC_END = -0.32;
/** Ouverture maximale de l'éventail des sous-compétences autour de leur parent (radians). */
const fanSpread = (depth: number) => (depth === 2 ? 1.2 : 0.9);

export interface PlacedSkill {
  skill: Skill;
  depth: number;
  x: number;
  y: number;
  r: number;
  angle: number; // direction depuis la bulle de départ
  branchId: string; // compétence principale dont elle descend
}

export interface SkillLink {
  from: { x: number; y: number; angle: number };
  to: { x: number; y: number; angle: number };
  branchId: string;
  depth: number; // profondeur de la compétence d'arrivée
}

/** Emplacement d'un « + » autour de la bulle de départ, avec l'ordre à donner à la nouvelle branche. */
export interface RootSlot {
  angle: number;
  order: number;
}

export interface SkillTreeLayout {
  nodes: PlacedSkill[];
  links: SkillLink[];
  rootSlots: RootSlot[];
}

function sortSiblings(a: Skill, b: Skill) {
  return a.order - b.order || a.createdAt.localeCompare(b.createdAt);
}

/**
 * Arbre qui pousse vers le haut : les branches principales se partagent l'arc au-dessus
 * de la bulle de départ (selon leur nombre de feuilles), les sous-compétences s'ouvrent
 * en éventail au bout de leur parent, en s'élargissant si elles sont nombreuses.
 */
export function layoutSkillTree(skills: Skill[]): SkillTreeLayout {
  const children = new Map<string | null, Skill[]>();
  for (const s of skills) {
    const list = children.get(s.parentId) ?? [];
    list.push(s);
    children.set(s.parentId, list);
  }
  children.forEach((list) => list.sort(sortSiblings));

  const leaves = new Map<string, number>();
  const leafCount = (id: string): number => {
    const cached = leaves.get(id);
    if (cached !== undefined) return cached;
    const kids = children.get(id) ?? [];
    const n = kids.length ? kids.reduce((sum, k) => sum + leafCount(k.id), 0) : 1;
    leaves.set(id, n);
    return n;
  };

  const nodes: PlacedSkill[] = [];
  const links: SkillLink[] = [];

  const place = (parentId: string | null, depth: number, from: number, to: number, parent: { x: number; y: number; angle: number }, branchId: string | null) => {
    const kids = children.get(parentId) ?? [];
    if (!kids.length) return;
    const R = ringRadius(depth);
    const r = nodeRadius(depth);
    const total = kids.reduce((sum, k) => sum + leafCount(k.id), 0);

    let start = from;
    let end = to;
    if (depth >= 2) {
      // Éventail centré sur le parent, assez large pour les bulles et leur nom
      const needed = total * ((2 * r + 64) / R);
      const spread = Math.min(to - from, Math.max(fanSpread(depth), needed));
      const center = (from + to) / 2;
      start = center - spread / 2;
      end = center + spread / 2;
    }

    let cursor = start;
    for (const kid of kids) {
      const share = ((end - start) * leafCount(kid.id)) / total;
      const angle = cursor + share / 2;
      const x = Math.cos(angle) * R;
      const y = Math.sin(angle) * R;
      const branch = branchId ?? kid.id;
      nodes.push({ skill: kid, depth, x, y, r, angle, branchId: branch });
      links.push({ from: parent, to: { x, y, angle }, branchId: branch, depth });
      place(kid.id, depth + 1, cursor, cursor + share, { x, y, angle }, branch);
      cursor += share;
    }
  };
  // Depuis la bulle de départ, les branches partent vers le haut
  place(null, 1, ARC_START, ARC_END, { x: 0, y: 0, angle: -Math.PI / 2 }, null);

  // « + » autour de la bulle de départ : à gauche, entre deux branches et à droite
  const main = nodes.filter((n) => n.depth === 1);
  let rootSlots: RootSlot[];
  if (main.length === 0) {
    rootSlots = [-Math.PI / 2 - 0.75, -Math.PI / 2, -Math.PI / 2 + 0.75].map((angle) => ({ angle, order: 0 }));
  } else {
    rootSlots = [{ angle: (ARC_START + main[0].angle) / 2, order: main[0].skill.order - 1 }];
    main.forEach((n, i) => {
      const next = main[i + 1];
      rootSlots.push(next
        ? { angle: (n.angle + next.angle) / 2, order: (n.skill.order + next.skill.order) / 2 }
        : { angle: (n.angle + ARC_END) / 2, order: n.skill.order + 1 });
    });
  }

  return { nodes, links, rootSlots };
}

/** Courbe douce d'une bulle à l'autre : elle part dans la direction du parent et arrive dans celle de l'enfant. */
export function linkPath(link: SkillLink): string {
  const { from, to } = link;
  const k = Math.hypot(to.x - from.x, to.y - from.y) * 0.45;
  const c1x = from.x + Math.cos(from.angle) * k;
  const c1y = from.y + Math.sin(from.angle) * k;
  const c2x = to.x - Math.cos(to.angle) * k;
  const c2y = to.y - Math.sin(to.angle) * k;
  return `M ${from.x.toFixed(1)} ${from.y.toFixed(1)} C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${to.x.toFixed(1)} ${to.y.toFixed(1)}`;
}

/** Découpe un nom en lignes courtes (2 lignes maximum). */
export function wrapLabel(text: string, maxChars: number, maxLines = 2): string[] {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length <= maxChars || !line) line = candidate;
    else { lines.push(line); line = word; }
  }
  if (line) lines.push(line);
  const shown = lines.slice(0, maxLines).map((l) => (l.length > maxChars ? `${l.slice(0, maxChars - 1)}…` : l));
  if (lines.length > maxLines) shown[maxLines - 1] = `${shown[maxLines - 1].slice(0, maxChars - 1)}…`;
  return shown;
}
