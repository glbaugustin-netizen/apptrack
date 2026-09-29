"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGradesStore, subjectAverage, sortGrades, onTwenty, gradeTitle, fmtAvg, fmtNum, fmtDate } from "@/lib/store/grades.store";
import { useAuthStore } from "@/lib/store/auth.store";
import { Grade } from "@/lib/types/grade.types";
import { GradeEvolutionChart, EvolutionLegend, type EvolutionPoint } from "@/components/grades/GradeEvolutionChart";
import { CARD, CARD_TITLE, ConfirmDeleteButton, Delta, PageLoading, PageMessage, PrimaryButton, SecondaryButton } from "@/components/grades/ui";

const TILE: React.CSSProperties = {
  background: "var(--color-background-primary)",
  border: "0.5px solid var(--color-border-tertiary)",
  borderRadius: "var(--border-radius-md)",
  padding: "10px 12px",
  minWidth: 0,
};

function Tile({ label, value, unit, sub }: { label: string; value: string; unit?: string; sub: React.ReactNode }) {
  return (
    <div style={TILE}>
      <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 500, color: "var(--color-text-primary)", lineHeight: 1.2 }}>
        {value}
        {unit && <span style={{ fontSize: 12, fontWeight: 400, color: "var(--color-text-secondary)" }}> {unit}</span>}
      </div>
      <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 20, background: "var(--color-background-secondary)", color: "var(--color-text-secondary)", whiteSpace: "nowrap", flexShrink: 0 }}>
      {children}
    </span>
  );
}

const fmt2 = (n: number) => n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Formule écrite comme dans le détail du calcul de Pronote, pour comparer terme à terme. */
function CalculationDetail({ grades, average }: { grades: Grade[]; average: number }) {
  const [open, setOpen] = useState(false);
  const scaled = (g: Grade) => g.rescale || g.outOf === 20;
  const coef = (g: Grade) => (g.coefficient !== 1 ? `×${fmt2(g.coefficient)}` : "");
  const numerator = grades.map((g) => `${fmt2(g.value)}${coef(g)}${scaled(g) && g.outOf !== 20 ? `×20/${fmtNum(g.outOf)}(r)` : ""}`).join(" + ");
  const denominator = grades.map((g) => `${scaled(g) ? "20" : fmtNum(g.outOf)}${coef(g)}`).join(" + ");

  return (
    <div style={CARD}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: 0, border: "none", background: "transparent", cursor: "pointer", color: "var(--color-text-secondary)" }}
      >
        <span style={CARD_TITLE}>Détail du calcul</span>
        <i className={`ti ti-chevron-${open ? "up" : "down"}`} style={{ fontSize: 16 }} />
      </button>
      {open && (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--color-text-primary)" }}>
            <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
              <span style={{ padding: "0 2px 4px" }}>{numerator}</span>
              <span style={{ padding: "4px 2px 0", borderTop: "1px solid var(--color-border-secondary)" }}>{denominator}</span>
            </div>
            <span style={{ whiteSpace: "nowrap" }}>× 20 = <strong style={{ fontWeight: 500 }}>{fmtAvg(average)}</strong></span>
          </div>
          <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 10 }}>
            (r) note ramenée sur 20 · même écriture que le détail du calcul de Pronote
          </div>
        </div>
      )}
    </div>
  );
}

/** Écart avec l'éval précédente, dans le barème de la note quand les deux ont le même. */
function gapWith(grade: Grade, prev: Grade): number {
  return grade.outOf === prev.outOf ? grade.value - prev.value : onTwenty(grade) - onTwenty(prev);
}

function GradeRow({ grade, prev, href, first }: { grade: Grade; prev: Grade | null; href: string; first: boolean }) {
  const reviewLine = grade.review.trim().split("\n")[0];
  return (
    <Link
      href={href}
      style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderTop: first ? "none" : "0.5px solid var(--color-border-tertiary)", textDecoration: "none", transition: "background 0.1s" }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-background-secondary)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >
      <span className="tabular-nums" style={{ width: 50, flexShrink: 0, fontSize: 11, color: "var(--color-text-secondary)" }}>
        {fmtDate(grade.date)}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 13, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {gradeTitle(grade)}
          </span>
          {grade.coefficient !== 1 && <Pill>coef {fmtNum(grade.coefficient)}</Pill>}
          {!grade.rescale && grade.outOf !== 20 && <Pill>non ramenée sur 20</Pill>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: reviewLine ? "var(--color-text-secondary)" : "var(--color-text-tertiary)", overflow: "hidden", whiteSpace: "nowrap" }}>
          <i className="ti ti-target-arrow" style={{ fontSize: 12, flexShrink: 0 }} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{reviewLine || "Ajoute ce que tu dois revoir"}</span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0 }}>
        <span className="tabular-nums" style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)" }}>
          {fmtNum(grade.value)}
          <span style={{ fontSize: 11, fontWeight: 400, color: "var(--color-text-secondary)" }}>/{fmtNum(grade.outOf)}</span>
        </span>
        {prev && <Delta value={gapWith(grade, prev)} />}
      </div>
      <i className="ti ti-chevron-right" style={{ fontSize: 14, color: "var(--color-text-tertiary)", flexShrink: 0 }} />
    </Link>
  );
}

export default function SubjectPage({ params }: { params: { subjectId: string } }) {
  const router = useRouter();
  const uid = useAuthStore((s) => s.user?.uid ?? "");
  const { subjects, grades, loaded, openSubjectModal, openGradeModal, deleteSubject } = useGradesStore();
  const [leaving, setLeaving] = useState(false);

  const subject = subjects.find((s) => s.id === params.subjectId);

  if (!loaded) return <PageLoading />;
  if (!subject) {
    if (leaving) return null;
    return (
      <div style={{ padding: 20 }}>
        <PageMessage
          icon="ti-search"
          title="Matière introuvable"
          text="Elle a peut-être été supprimée."
          action={<Link href="/grades" style={{ fontSize: 13, color: "var(--color-text-primary)" }}>Retour à la vue d&apos;ensemble</Link>}
        />
      </div>
    );
  }

  const subjectId = subject.id;
  const list = sortGrades(grades.filter((g) => g.subjectId === subjectId));
  const avg = subjectAverage(list);

  // Moyenne cumulée après chaque éval
  const points: EvolutionPoint[] = list.map((g, i) => ({
    id: g.id,
    title: gradeTitle(g),
    date: g.date,
    value: onTwenty(g),
    raw: g.outOf !== 20 ? `${fmtNum(g.value)}/${fmtNum(g.outOf)}` : null,
    average: subjectAverage(list.slice(0, i + 1)) ?? 0,
  }));

  const last = list[list.length - 1];
  const prev = list[list.length - 2];
  const best = list.length ? list.reduce((a, b) => (onTwenty(b) > onTwenty(a) ? b : a)) : null;
  const byCoef = list.some((g) => g.coefficient !== 1);
  const byScale = list.some((g) => !g.rescale && g.outOf !== 20);
  const averageNote = byCoef && byScale ? "pondérée par coef. et barèmes" : byCoef ? "pondérée par les coef." : byScale ? "pondérée par les barèmes" : `sur ${list.length} éval${list.length > 1 ? "s" : ""}`;

  function handleDelete() {
    setLeaving(true);
    router.push("/grades");
    deleteSubject(uid, subjectId).catch((err) => console.error(err));
  }

  return (
    <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: subject.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <i className="ti ti-book" style={{ fontSize: 16, color: "#fff" }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: 18, fontWeight: 500, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {subject.name}
            </h1>
            <p style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>
              {list.length} évaluation{list.length > 1 ? "s" : ""}
              {subject.coefficient !== 1 && ` · coef ${fmtNum(subject.coefficient)}`}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <SecondaryButton icon="ti-edit" onClick={() => openSubjectModal(subject)} title="Modifier la matière" aria-label="Modifier la matière" style={{ padding: "6px 8px" }} />
          <ConfirmDeleteButton iconOnly label="Supprimer la matière et toutes ses notes" confirmLabel="Confirmer la suppression" onConfirm={handleDelete} />
          <PrimaryButton icon="ti-plus" onClick={() => openGradeModal(subjectId)}>Ajouter une note</PrimaryButton>
        </div>
      </div>

      {list.length === 0 || avg === null || !best ? (
        <PageMessage
          icon="ti-chart-line"
          title={`Aucune note en ${subject.name}`}
          text="Ajoute tes notes pour suivre ton évolution d'une éval à l'autre et noter ce que tu dois revoir."
          action={<PrimaryButton icon="ti-plus" onClick={() => openGradeModal(subjectId)}>Ajouter une note</PrimaryButton>}
        />
      ) : (
        <>
          <div className="grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8 }}>
            <Tile label="Moyenne" value={fmtAvg(avg)} unit="/ 20" sub={averageNote} />
            <Tile
              label="Dernière note"
              value={fmtNum(onTwenty(last))}
              unit="/ 20"
              sub={prev ? <Delta value={onTwenty(last) - onTwenty(prev)} suffix=" vs précédente" /> : fmtDate(last.date)}
            />
            <Tile label="Meilleure note" value={fmtNum(onTwenty(best))} unit="/ 20" sub={gradeTitle(best)} />
            <Tile label="Évaluations" value={String(list.length)} sub={`depuis le ${fmtDate(list[0].date)}`} />
          </div>

          <CalculationDetail grades={[...list].reverse()} average={avg} />

          <div style={CARD}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
              <span style={CARD_TITLE}>Évolution</span>
              <EvolutionLegend color={subject.color} />
            </div>
            <GradeEvolutionChart points={points} color={subject.color} onOpen={(id) => router.push(`/grades/${subjectId}/${id}`)} />
          </div>

          <div style={{ ...CARD, padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
              <span style={CARD_TITLE}>Évaluations</span>
            </div>
            {list
              .map((g, i) => ({ grade: g, prev: i > 0 ? list[i - 1] : null }))
              .reverse()
              .map(({ grade, prev: before }, i) => (
                <GradeRow key={grade.id} grade={grade} prev={before} href={`/grades/${subjectId}/${grade.id}`} first={i === 0} />
              ))}
          </div>
        </>
      )}
    </div>
  );
}
