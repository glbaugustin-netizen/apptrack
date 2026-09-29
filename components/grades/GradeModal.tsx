"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useGradesStore, fmtNum, parseNum, parseGradeInput } from "@/lib/store/grades.store";
import { useAuthStore } from "@/lib/store/auth.store";
import { formatISO } from "@/lib/utils/date";
import { ACCENT, INPUT, LABEL, focusRing, PrimaryButton, SecondaryButton } from "./ui";

export function GradeModal() {
  const { gradeModal, subjects, closeGradeModal, addGrade, updateGrade } = useGradesStore();
  const uid = useAuthStore((s) => s.user?.uid ?? "");
  const editing = gradeModal?.editing ?? null;
  const subject = subjects.find((s) => s.id === gradeModal?.subjectId);

  const [title, setTitle] = useState("");
  const [note, setNote] = useState(""); // « 15,50/17 », comme affiché sur Pronote
  const [rescale, setRescale] = useState(true);
  const [coef, setCoef] = useState("1");
  const [date, setDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!gradeModal) return;
    const g = gradeModal.editing;
    setTitle(g?.title ?? "");
    setNote(g ? `${fmtNum(g.value)}/${fmtNum(g.outOf)}` : "");
    setRescale(g?.rescale ?? true);
    setCoef(g ? fmtNum(g.coefficient) : "1");
    setDate(g?.date ?? formatISO(new Date()));
    setSaving(false);
    setError(false);
  }, [gradeModal]);

  const parsed = parseGradeInput(note);
  const c = parseNum(coef);

  function validate(): string | null {
    if (!note.trim()) return null;
    if (!parsed) return "Écris la note comme sur Pronote : 15,50/17, ou 15,5 si elle est sur 20.";
    if (parsed.outOf <= 0) return "Le barème doit être un nombre positif.";
    if (parsed.value > parsed.outOf) return `La note dépasse son barème (${fmtNum(parsed.outOf)}).`;
    if (c === null || c <= 0) return "Le coefficient doit être un nombre positif.";
    if (!date) return "Choisis une date.";
    return null;
  }
  const message = validate();
  const valid = parsed !== null && message === null;

  async function handleSubmit() {
    if (!valid || saving || !gradeModal || !parsed || c === null) return;
    setSaving(true);
    setError(false);
    const data = { title: title.trim(), value: parsed.value, outOf: parsed.outOf, rescale, coefficient: c, date };
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

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)", gap: 8 }}>
        <div>
          <label htmlFor="grade-value" style={LABEL}>Note, comme sur Pronote</label>
          <input
            id="grade-value" type="text" inputMode="decimal" value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="15,50/17" style={INPUT} {...focusRing} onKeyDown={onEnter}
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

      {parsed && parsed.outOf > 0 && parsed.outOf !== 20 && (
        <label style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer" }}>
          <input
            type="checkbox" checked={rescale} onChange={(e) => setRescale(e.target.checked)}
            style={{ width: 16, height: 16, margin: "2px 0 0", accentColor: ACCENT, cursor: "pointer", flexShrink: 0 }}
          />
          <span>
            <span style={{ display: "block", fontSize: 13, color: "var(--color-text-primary)" }}>Ramener sur 20</span>
            <span style={{ display: "block", fontSize: 11, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
              Laisse coché si cette note a un (r) dans le détail du calcul Pronote. Sans (r), elle compte au prorata de son barème : elle pèse {parsed.outOf < 20 ? "moins" : "plus"} qu&apos;une note sur 20.
            </span>
          </span>
        </label>
      )}

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
