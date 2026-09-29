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

const R = "®"; // remplace « (r) » pour découper plus facilement
const FORMULA_LINE = new RegExp(`^[\\d\\s.,×x*/+${R}]+$`, "i");

function toNumber(s: string): number | null {
  const t = s.replace(/\s/g, "").replace(",", ".");
  return /^\d+(\.\d+)?$/.test(t) ? Number(t) : null;
}

function factors(term: string): string[] {
  return term.split(/[×x*]/i).map((f) => f.trim()).filter(Boolean);
}

/**
 * Lit le détail du calcul copié depuis Pronote, en fraction sur trois lignes :
 *   4,00×0,10×20/4(r) + 15,50×20/17(r) + 5,00×0,10
 *   × 20 = 18,35
 *   20×0,10 + 20 + 6×0,10
 * ou sur une ligne : (4,00×0,10×20/4(r) + …) / (20×0,10 + …) × 20 = 18,35
 */
export function parsePronoteCalculation(text: string): PronoteParse {
  const normalized = text.replace(/[  \t]/g, " ").replace(/\(\s*r\s*\)/gi, R);

  let numerator: string | undefined;
  let denominator: string | undefined;
  const inline = normalized.match(/\(([^()]+)\)\s*\/\s*\(([^()]+)\)/);
  if (inline) {
    [, numerator, denominator] = inline;
  } else {
    const lines = normalized.split(/\r?\n/).map((l) => l.trim()).filter((l) => /\d/.test(l) && !l.includes("=") && FORMULA_LINE.test(l));
    [numerator, denominator] = lines;
  }
  if (!numerator || !denominator) {
    return { ok: false, error: "Je ne trouve pas le calcul. Copie bien la ligne des notes et celle des barèmes." };
  }

  const nums = numerator.split("+").map((t) => t.trim()).filter(Boolean);
  const dens = denominator.split("+").map((t) => t.trim()).filter(Boolean);
  if (nums.length === 0 || nums.length !== dens.length) {
    return { ok: false, error: "Il n'y a pas autant de notes que de barèmes dans ce calcul." };
  }

  const terms: PronoteTerm[] = [];
  for (let i = 0; i < nums.length; i++) {
    const shown = nums[i].replace(R, "(r)");
    const rescale = nums[i].includes(R);
    const [first, ...rest] = factors(nums[i].replace(R, ""));
    const value = toNumber(first ?? "");
    let coef: number | null = null;
    let outOf: number | null = null;
    let valid = value !== null;
    for (const f of rest) {
      const frac = f.match(/^(.+)\/(.+)$/);
      if (frac) {
        outOf = toNumber(frac[2]);
        valid = valid && toNumber(frac[1]) === 20 && outOf !== null && outOf > 0;
      } else {
        coef = toNumber(f);
        valid = valid && coef !== null && coef > 0;
      }
    }

    const [base, denCoefRaw, ...extra] = factors(dens[i]);
    const baseValue = toNumber(base ?? "");
    const denCoef = denCoefRaw !== undefined ? toNumber(denCoefRaw) : null;
    valid = valid && baseValue !== null && baseValue > 0 && extra.length === 0 && (denCoefRaw === undefined || denCoef !== null);
    if (!valid || value === null || baseValue === null) return { ok: false, error: `Je ne comprends pas « ${shown} ».` };

    if (coef !== null && denCoef !== null && Math.abs(coef - denCoef) > 1e-9) {
      return { ok: false, error: `Le coefficient de « ${shown} » ne correspond pas à son barème.` };
    }
    const finalOutOf = rescale ? (outOf ?? 20) : baseValue;
    if (value > finalOutOf) return { ok: false, error: `« ${shown} » dépasse son barème.` };
    // Sur 20, « ramenée » ou non revient au même : on garde la valeur par défaut de l'app
    terms.push({ value, outOf: finalOutOf, coefficient: coef ?? denCoef ?? 1, rescale: rescale || finalOutOf === 20 });
  }

  const results = normalized.match(/=\s*\d+(?:[.,]\d+)?/g);
  const average = results ? toNumber(results[results.length - 1].replace("=", "")) : null;
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
