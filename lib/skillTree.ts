import type { Skill } from "@/lib/types/skill.types";

/** Rayon de la bulle centrale et des bulles selon la profondeur. */
export const ROOT_RADIUS = 58;
export const nodeRadius = (depth: number) => (depth === 1 ? 48 : 40);
/** Distance au centre de chaque anneau de l'arbre. */
const ringRadius = (depth: number) => 185 + (depth - 1) * 135;
/** Ouverture maximale de l'éventail des sous-compétences autour de leur parent (radians). */
const fanSpread = (depth: number) => (depth === 2 ? 2.2 : 1.6);

export interface PlacedSkill {
  skill: Skill;
  depth: number;
  x: number;
  y: number;
  r: number;
  angle: number; // direction depuis le centre
  branchId: string; // compétence principale dont elle descend
}

export interface SkillLink {
  from: { x: number; y: number };
  to: { x: number; y: number };
  branchId: string;
}

/** Emplacement d'un « + » autour de la bulle centrale, avec l'ordre à donner à la nouvelle compétence. */
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
 * Arbre radial : les compétences principales se partagent le tour de la bulle centrale
 * (proportionnellement à leur nombre de feuilles), et les sous-compétences s'ouvrent
 * en éventail derrière leur parent, en s'élargissant si elles sont nombreuses.
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

  const place = (parentId: string | null, depth: number, from: number, to: number, parent: { x: number; y: number }, branchId: string | null) => {
    const kids = children.get(parentId) ?? [];
    if (!kids.length) return;
    const R = ringRadius(depth);
    const r = nodeRadius(depth);
    const total = kids.reduce((sum, k) => sum + leafCount(k.id), 0);

    let start = from;
    let end = to;
    if (depth >= 2) {
      // Éventail centré sur le parent, assez large pour que les bulles ne se touchent pas
      const needed = total * ((2 * r + 18) / R);
      const spread = Math.min(to - from, Math.max(fanSpread(depth), needed));
      const center = (from + to) / 2;
      start = center - spread / 2;
      end = center + spread / 2;
    } else {
      // La première compétence principale pointe vers le haut
      const first = ((to - from) * leafCount(kids[0].id)) / total;
      start = -Math.PI / 2 - first / 2;
      end = start + (to - from);
    }

    let cursor = start;
    for (const kid of kids) {
      const share = ((end - start) * leafCount(kid.id)) / total;
      const angle = cursor + share / 2;
      const x = Math.cos(angle) * R;
      const y = Math.sin(angle) * R;
      const branch = branchId ?? kid.id;
      nodes.push({ skill: kid, depth, x, y, r, angle, branchId: branch });
      links.push({ from: parent, to: { x, y }, branchId: branch });
      place(kid.id, depth + 1, cursor, cursor + share, { x, y }, branch);
      cursor += share;
    }
  };
  place(null, 1, 0, Math.PI * 2, { x: 0, y: 0 }, null);

  // « + » autour de la bulle centrale : entre deux compétences principales
  const main = nodes.filter((n) => n.depth === 1);
  let rootSlots: RootSlot[];
  if (main.length === 0) {
    rootSlots = [-Math.PI / 2, 0, Math.PI / 2, Math.PI].map((angle) => ({ angle, order: 0 }));
  } else if (main.length === 1) {
    const { angle, skill } = main[0];
    rootSlots = [
      { angle: angle + Math.PI / 2, order: skill.order + 1 },
      { angle: angle + Math.PI, order: skill.order + 1 },
      { angle: angle - Math.PI / 2, order: skill.order - 1 },
    ];
  } else {
    rootSlots = main.map((n, i) => {
      const next = main[(i + 1) % main.length];
      const gap = (next.angle - n.angle + Math.PI * 4) % (Math.PI * 2);
      const last = i === main.length - 1;
      return { angle: n.angle + gap / 2, order: last ? n.skill.order + 1 : (n.skill.order + next.skill.order) / 2 };
    });
  }

  return { nodes, links, rootSlots };
}

/** Découpe un nom en lignes courtes pour tenir dans une bulle (3 lignes maximum). */
export function wrapLabel(text: string, maxChars: number, maxLines = 3): string[] {
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
