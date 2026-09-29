"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useGradesStore, sortGrades, subjectAverage, gradeTitle, fmtAvg, fmtNum, type GradeSync } from "@/lib/store/grades.store";
import { useAuthStore } from "@/lib/store/auth.store";
import { parsePronoteCalculation, planPronoteSync, type SyncRow } from "@/lib/pronote";
import { formatISO } from "@/lib/utils/date";
import type { Grade } from "@/lib/types/grade.types";
import { ACCENT, INPUT, focusRing, PrimaryButton, SecondaryButton } from "./ui";

const PLACEHOLDER = "4,00×0,10×20/4(r) + 15,50×20/17(r) + 5,00×0,10\n× 20 = 18,35\n20×0,10 + 20 + 6×0,10";

function describe(g: Pick<Grade, "value" | "outOf" | "coefficient" | "rescale">): string {
  const scale = g.outOf === 20 ? "" : g.rescale ? " · ramenée sur 20" : " · non ramenée";
  return `${fmtNum(g.value)}/${fmtNum(g.outOf)} · coef ${fmtNum(g.coefficient)}${scale}`;
}

function previousValues(row: SyncRow): string {
  const g = row.grade;
  if (!g || row.changes.length === 0) return "";
  const parts = row.changes.map((c) => (c === "outOf" ? `sur ${fmtNum(g.outOf)}` : c === "coefficient" ? `coef ${fmtNum(g.coefficient)}` : g.rescale ? "ramenée sur 20" : "non ramenée"));
  return ` (avant : ${parts.join(", ")})`;
}

function RowView({ row }: { row: SyncRow }) {
  const status = !row.grade ? { icon: "ti-plus", label: "ajoutée" } : row.changes.length ? { icon: "ti-pencil", label: "corrigée" } : { icon: "ti-check", label: "à jour" };
  const quiet = row.grade !== null && row.changes.length === 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)" }}>
      <i className={`ti ${status.icon}`} style={{ fontSize: 15, color: quiet ? "var(--color-text-tertiary)" : ACCENT, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {row.grade ? gradeTitle(row.grade) : "Nouvelle note, datée d'aujourd'hui"}
        </div>
        <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{describe(row.term)}{previousValues(row)}</div>
      </div>
      <span style={{ fontSize: 11, color: "var(--color-text-secondary)", flexShrink: 0 }}>{status.label}</span>
    </div>
  );
}

/** Colle le détail du calcul de Pronote : les barèmes, coefs et « ramenée sur 20 » des notes sont corrigés d'un coup. */
export function PronoteModal() {
  const { pronoteModal, subjects, grades, closePronoteModal, syncGrades } = useGradesStore();
  const uid = useAuthStore((s) => s.user?.uid ?? "");
  const subjectId = pronoteModal?.subjectId ?? "";
  const subject = subjects.find((s) => s.id === subjectId);

  const [text, setText] = useState("");
  const [removeExtras, setRemoveExtras] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!pronoteModal) return;
    setText("");
    setRemoveExtras(false);
    setSaving(false);
    setError(false);
  }, [pronoteModal]);

  const current = sortGrades(grades.filter((g) => g.subjectId === subjectId)).reverse(); // plus récente d'abord, comme Pronote
  const parsed = text.trim() ? parsePronoteCalculation(text) : null;
  const plan = parsed?.ok ? planPronoteSync(parsed.terms, current) : null;

  let sync: GradeSync | null = null;
  let resultAverage: number | null = null;
  if (plan) {
    const today = formatISO(new Date());
    const next: GradeSync = {
      update: plan.rows.flatMap((r) => (r.grade && r.changes.length ? [{ id: r.grade.id, updates: { outOf: r.term.outOf, coefficient: r.term.coefficient, rescale: r.term.rescale } }] : [])),
      create: plan.rows.filter((r) => !r.grade).reverse().map((r) => ({ title: `Note Pronote (${fmtNum(r.term.value)}/${fmtNum(r.term.outOf)})`, date: today, ...r.term })),
      remove: removeExtras ? plan.extras.map((g) => g.id) : [],
    };
    const updated = new Map(next.update.map((u) => [u.id, u.updates]));
    const kept = current.filter((g) => !next.remove.includes(g.id)).map((g) => ({ ...g, ...updated.get(g.id) }));
    const added: Grade[] = next.create.map((c, i) => ({ ...c, id: `new-${i}`, subjectId, review: "", notes: "", createdAt: "" }));
    resultAverage = subjectAverage([...kept, ...added]);
    sync = next;
  }
  const nothingToDo = sync !== null && sync.update.length + sync.create.length + sync.remove.length === 0;
  const pronoteAverage = parsed?.ok ? parsed.average : null;
  const sameAsPronote = pronoteAverage !== null && resultAverage !== null && Math.abs(resultAverage - pronoteAverage) < 0.006;

  async function apply() {
    if (!sync || nothingToDo || saving) return;
    setSaving(true);
    setError(false);
    try {
      await syncGrades(uid, subjectId, sync);
      closePronoteModal();
    } catch (err) {
      console.error(err);
      setError(true);
      setSaving(false);
    }
  }

  return (
    <Modal
      open={pronoteModal !== null}
      onClose={closePronoteModal}
      title="Synchroniser avec Pronote"
      maxWidth={460}
      footer={
        <>
          <SecondaryButton onClick={closePronoteModal}>Annuler</SecondaryButton>
          <PrimaryButton onClick={apply} disabled={!sync || nothingToDo || saving}>
            {nothingToDo ? "Déjà à jour" : "Appliquer"}
          </PrimaryButton>
        </>
      }
    >
      <div style={{ fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
        Sur Pronote, copie le détail du calcul de ta moyenne{subject ? ` en ${subject.name}` : ""} et colle-le ici.
        Le barème, le coef et le « ramenée sur 20 » de tes notes sont corrigés. Les titres, les dates et ce que tu as écrit ne bougent pas.
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={PLACEHOLDER}
        rows={4}
        autoFocus
        aria-label="Détail du calcul copié depuis Pronote"
        style={{ ...INPUT, fontFamily: "var(--font-mono)", fontSize: 12, lineHeight: 1.6, resize: "vertical" }}
        {...focusRing}
      />

      {parsed && !parsed.ok && <div style={{ fontSize: 12, color: "var(--color-text-danger)" }}>{parsed.error}</div>}

      {plan && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {/* La liste défile : le bouton Appliquer reste visible même avec beaucoup de notes */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: "38vh", overflowY: "auto" }}>
            {plan.rows.map((row, i) => <RowView key={i} row={row} />)}
          </div>

          {plan.extras.length > 0 && (
            <label style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer", marginTop: 4 }}>
              <input
                type="checkbox" checked={removeExtras} onChange={(e) => setRemoveExtras(e.target.checked)}
                style={{ width: 16, height: 16, margin: "2px 0 0", accentColor: ACCENT, cursor: "pointer", flexShrink: 0 }}
              />
              <span style={{ fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
                Supprimer {plan.extras.length > 1 ? `les ${plan.extras.length} notes absentes` : "la note absente"} du calcul Pronote :{" "}
                {plan.extras.map((g) => `${gradeTitle(g)} (${fmtNum(g.value)}/${fmtNum(g.outOf)})`).join(", ")}
              </span>
            </label>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", fontSize: 13, color: "var(--color-text-primary)", marginTop: 4 }}>
            Moyenne après synchro : <strong style={{ fontWeight: 500 }}>{resultAverage !== null ? fmtAvg(resultAverage) : "—"}</strong>
            {sameAsPronote ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 500, color: "var(--color-text-success)" }}>
                <i className="ti ti-check" style={{ fontSize: 12 }} /> comme Pronote
              </span>
            ) : pronoteAverage !== null ? (
              <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>(Pronote : {fmtAvg(pronoteAverage)})</span>
            ) : null}
          </div>
        </div>
      )}

      {error && (
        <div style={{ fontSize: 12, color: "var(--color-text-danger)" }}>
          Impossible d&apos;enregistrer. Vérifie ta connexion et réessaie.
        </div>
      )}
    </Modal>
  );
}
