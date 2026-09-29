import type { Grade } from "@/lib/types/grade.types";

/** Une note telle qu'elle apparaît dans le détail du calcul de la moyenne sur Pronote. */
export interface PronoteTerm {
  value: number;
  outOf: number;
  coefficient: number;
  rescale: boolean;
}

export type PronoteParse =
  | { ok: true; terms: PronoteTerm[]; average: number | null }
  | { ok: false; error: string };

const R = "@"; // repère d'une note « ramenée sur 20 », le (r) de Pronote
const FORMULA_LINE = /^[\d\s.,×x*/+@]+$/i;
const RESULT = /=\s*\d+(?:[.,]\d+)?/g; // « = 18,35 », le résultat parfois sur la ligne suivante

function toNumber(s: string): number | null {
  const t = s.replace(/\s/g, "").replace(",", ".");
  return /^\d+(\.\d+)?$/.test(t) ? Number(t) : null;
}

function factors(term: string): string[] {
  return term.split(/[×x*]/i).map((f) => f.trim()).filter(Boolean);
}

/** Terme du numérateur : note [× coef] [× 20/barème (r)] */
function parseNumeratorTerm(term: string) {
  const rescale = term.includes(R);
  const [first, ...rest] = factors(term.replace(R, ""));
  const value = toNumber(first ?? "");
  if (value === null) return null;
  let coef: number | null = null;
  let scaledFrom: number | null = null; // barème d'origine quand la note est ramenée sur 20
  for (const f of rest) {
    const frac = f.match(/^(.+)\/(.+)$/);
    if (frac) {
      scaledFrom = toNumber(frac[2]);
      if (toNumber(frac[1]) !== 20 || scaledFrom === null || scaledFrom <= 0) return null;
    } else {
      coef = toNumber(f);
      if (coef === null || coef <= 0) return null;
    }
  }
  return { value, coef, scaledFrom, rescale };
}

/** Terme du dénominateur : barème [× coef], ou juste le coef quand toutes les notes sont sur 20 */
function parseDenominatorTerm(term: string) {
  const [base, coefRaw, ...extra] = factors(term);
  const baseValue = toNumber(base ?? "");
  const coef = coefRaw !== undefined ? toNumber(coefRaw) : null;
  if (baseValue === null || baseValue <= 0 || extra.length || (coefRaw !== undefined && (coef === null || coef <= 0))) return null;
  return { base: baseValue, coef };
}

/**
 * Lit le détail du calcul copié depuis Pronote. Pronote l'écrit de deux façons :
 *   avec les barèmes : 4,00×0,10×20/4(r) + 15,50×20/17(r) + 5,00×0,10 / 20×0,10 + 20 + 6×0,10 × 20 = 18,35
 *   notes sur 20     : 16,30 + 7,00 + 20,00 / 1,00 + 1,00 + 1,00 = 14,43 (en bas, la somme des coefs)
 * en fraction sur plusieurs lignes ou sur une seule, entre parenthèses.
 * Les autres repères, comme (nf), sont ignorés.
 */
export function parsePronoteCalculation(text: string): PronoteParse {
  const normalized = text
    .replace(/[^\S\n]+/g, " ")
    .replace(/\(\s*([a-z]{1,3})\s*\)/gi, (_, mark: string) => (mark.toLowerCase() === "r" ? R : ""));

  const results = normalized.match(RESULT);
  const average = results ? toNumber(results[results.length - 1].replace("=", "")) : null;
  const formula = normalized.replace(RESULT, "=");

  let numerator: string | undefined;
  let denominator: string | undefined;
  const inline = formula.match(/\(([^()]+)\)\s*\/\s*\(([^()]+)\)/);
  if (inline) {
    [, numerator, denominator] = inline;
  } else {
    const lines = formula.split("\n").map((l) => l.trim()).filter((l) => /\d/.test(l) && !l.includes("=") && FORMULA_LINE.test(l));
    [numerator, denominator] = lines;
  }
  if (!numerator || !denominator) {
    return { ok: false, error: "Je ne trouve pas le calcul. Copie bien la ligne des notes et celle du dessous." };
  }

  const nums = numerator.split("+").map((t) => t.trim()).filter(Boolean);
  const dens = denominator.split("+").map((t) => t.trim()).filter(Boolean);
  if (nums.length === 0 || nums.length !== dens.length) {
    return { ok: false, error: "Les deux lignes du calcul n'ont pas le même nombre de termes." };
  }

  const numTerms = nums.map(parseNumeratorTerm);
  const denTerms = dens.map(parseDenominatorTerm);
  const bad = numTerms.findIndex((t, i) => !t || !denTerms[i]);
  if (bad >= 0) return { ok: false, error: `Je ne comprends pas « ${nums[bad].replace(R, "(r)")} ».` };

  // « … × 20 = » : le bas du calcul contient les barèmes. Sinon, notes sur 20 et somme des coefs.
  const withScales = /[×x*]\s*20\s*=/i.test(formula)
    || (!formula.includes("=") && numTerms.every((t, i) => t!.rescale || t!.value <= denTerms[i]!.base));

  const terms: PronoteTerm[] = [];
  for (let i = 0; i < nums.length; i++) {
    const n = numTerms[i]!;
    const d = denTerms[i]!;
    const shown = nums[i].replace(R, "(r)");
    const denCoef = withScales ? d.coef : d.base;
    if (n.coef !== null && denCoef !== null && Math.abs(n.coef - denCoef) > 1e-9) {
      return { ok: false, error: `Le coefficient de « ${shown} » n'est pas le même en haut et en bas du calcul.` };
    }
    const outOf = n.rescale ? (n.scaledFrom ?? 20) : withScales ? d.base : 20;
    if (n.value > outOf) return { ok: false, error: `« ${shown} » dépasse son barème.` };
    // Sur 20, « ramenée » ou non revient au même : on garde la valeur par défaut de l'app
    terms.push({ value: n.value, outOf, coefficient: n.coef ?? denCoef ?? 1, rescale: n.rescale || outOf === 20 });
  }

  return { ok: true, terms, average };
}

export type SyncChange = "outOf" | "coefficient" | "rescale";

export interface SyncRow {
  term: PronoteTerm;
  grade: Grade | null; // null = pas de note correspondante dans l'app : elle sera créée
  changes: SyncChange[];
}

/**
 * Associe chaque note du calcul Pronote à une note de l'app de même valeur
 * (même barème en priorité), dans l'ordre de Pronote : la plus récente d'abord.
 */
export function planPronoteSync(terms: PronoteTerm[], gradesRecentFirst: Grade[]): { rows: SyncRow[]; extras: Grade[] } {
  const used = new Set<string>();
  const rows = terms.map((term) => {
    const candidates = gradesRecentFirst.filter((g) => !used.has(g.id) && Math.abs(g.value - term.value) < 1e-9);
    const grade = candidates.find((g) => g.outOf === term.outOf) ?? candidates[0] ?? null;
    const changes: SyncChange[] = [];
    if (grade) {
      used.add(grade.id);
      if (grade.outOf !== term.outOf) changes.push("outOf");
      if (Math.abs(grade.coefficient - term.coefficient) > 1e-9) changes.push("coefficient");
      if (term.outOf !== 20 && grade.rescale !== term.rescale) changes.push("rescale");
    }
    return { term, grade, changes };
  });
  return { rows, extras: gradesRecentFirst.filter((g) => !used.has(g.id)) };
}
