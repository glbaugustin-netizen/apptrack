"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useGradesStore, fmtNum, parseNum, sortGrades } from "@/lib/store/grades.store";
import { useAuthStore } from "@/lib/store/auth.store";
import { formatISO } from "@/lib/utils/date";
import { INPUT, LABEL, focusRing, PrimaryButton, SecondaryButton } from "./ui";

export function GradeModal() {
  const { gradeModal, subjects, closeGradeModal, addGrade, updateGrade } = useGradesStore();
  const uid = useAuthStore((s) => s.user?.uid ?? "");
  const editing = gradeModal?.editing ?? null;
  const subject = subjects.find((s) => s.id === gradeModal?.subjectId);

  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [outOf, setOutOf] = useState("20");
  const [coef, setCoef] = useState("1");
  const [date, setDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!gradeModal) return;
    const g = gradeModal.editing;
    // Nouvelle note : on reprend le barème de la dernière note de la matière
    const previous = sortGrades(useGradesStore.getState().grades.filter((x) => x.subjectId === gradeModal.subjectId)).pop();
    setTitle(g?.title ?? "");
    setValue(g ? fmtNum(g.value) : "");
    setOutOf(fmtNum(g?.outOf ?? previous?.outOf ?? 20));
    setCoef(g ? fmtNum(g.coefficient) : "1");
    setDate(g?.date ?? formatISO(new Date()));
    setSaving(false);
    setError(false);
  }, [gradeModal]);

  const v = parseNum(value);
  const o = parseNum(outOf);
  const c = parseNum(coef);

  function validate(): string | null {
    if (v === null) return value.trim() ? "La note doit être un nombre." : null;
    if (o === null || o <= 0) return "Le barème doit être un nombre positif.";
    if (v < 0) return "La note ne peut pas être négative.";
    if (v > o) return `La note dépasse le barème (${fmtNum(o)}).`;
    if (c === null || c <= 0) return "Le coefficient doit être un nombre positif.";
    if (!date) return "Choisis une date.";
    return null;
  }
  const message = validate();
  const valid = v !== null && message === null;

  async function handleSubmit() {
    if (!valid || saving || !gradeModal || v === null || o === null || c === null) return;
    setSaving(true);
    setError(false);
    const data = { title: title.trim(), value: v, outOf: o, coefficient: c, date };
    try {
      if (editing) await updateGrade(uid, editing.id, data);
      else await addGrade(uid, gradeModal.subjectId, data);
      closeGradeModal();
    } catch (err) {
      console.error(err);
      setError(true);
      setSaving(false);
    }
  }

  function onEnter(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSubmit();
  }

  return (
    <Modal
      open={gradeModal !== null}
      onClose={closeGradeModal}
      title={editing ? "Modifier la note" : subject ? `Nouvelle note en ${subject.name}` : "Nouvelle note"}
      maxWidth={400}
      footer={
        <>
          <SecondaryButton onClick={closeGradeModal}>Annuler</SecondaryButton>
          <PrimaryButton onClick={handleSubmit} disabled={!valid || saving}>
            {editing ? "Enregistrer" : "Ajouter la note"}
          </PrimaryButton>
        </>
      }
    >
      <div>
        <label htmlFor="grade-title" style={LABEL}>Intitulé</label>
        <input
          id="grade-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex : Contrôle chapitre 3" autoFocus
          style={INPUT} {...focusRing} onKeyDown={onEnter}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
        <div>
          <label htmlFor="grade-value" style={LABEL}>Note</label>
          <input
            id="grade-value" type="text" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)}
            placeholder="15,5" style={INPUT} {...focusRing} onKeyDown={onEnter}
          />
        </div>
        <div>
          <label htmlFor="grade-outof" style={LABEL}>Sur</label>
          <input
            id="grade-outof" type="text" inputMode="decimal" value={outOf} onChange={(e) => setOutOf(e.target.value)}
            style={INPUT} {...focusRing} onKeyDown={onEnter}
          />
        </div>
        <div>
          <label htmlFor="grade-coef" style={LABEL}>Coef.</label>
          <input
            id="grade-coef" type="text" inputMode="decimal" value={coef} onChange={(e) => setCoef(e.target.value)}
            style={INPUT} {...focusRing} onKeyDown={onEnter}
          />
        </div>
      </div>

      <div>
        <label htmlFor="grade-date" style={LABEL}>Date</label>
        <input
          id="grade-date" type="date" value={date} onChange={(e) => setDate(e.target.value)}
          style={INPUT} {...focusRing} onKeyDown={onEnter}
        />
      </div>

      {message && <div style={{ fontSize: 12, color: "var(--color-text-danger)" }}>{message}</div>}
      {error && (
        <div style={{ fontSize: 12, color: "var(--color-text-danger)" }}>
          Impossible d&apos;enregistrer. Vérifie ta connexion et réessaie.
        </div>
      )}
    </Modal>
  );
}
