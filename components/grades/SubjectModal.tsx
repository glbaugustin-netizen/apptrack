"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { HABIT_COLORS } from "@/lib/habitColors";
import { useGradesStore, fmtNum, parseNum } from "@/lib/store/grades.store";
import { useAuthStore } from "@/lib/store/auth.store";
import { INPUT, LABEL, focusRing, PrimaryButton, SecondaryButton } from "./ui";

export function SubjectModal() {
  const router = useRouter();
  const { subjectModal, closeSubjectModal, addSubject, updateSubject } = useGradesStore();
  const uid = useAuthStore((s) => s.user?.uid ?? "");
  const editing = subjectModal?.editing ?? null;

  const [name, setName] = useState("");
  const [color, setColor] = useState(HABIT_COLORS[0].hex);
  const [coef, setCoef] = useState("1");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!subjectModal) return;
    const e = subjectModal.editing;
    // Nouvelle matière : première couleur pas encore prise
    const used = new Set(useGradesStore.getState().subjects.map((s) => s.color));
    setName(e?.name ?? "");
    setColor(e?.color ?? (HABIT_COLORS.find((c) => !used.has(c.hex)) ?? HABIT_COLORS[0]).hex);
    setCoef(e ? fmtNum(e.coefficient) : "1");
    setSaving(false);
    setError(false);
  }, [subjectModal]);

  const coefNum = parseNum(coef);
  const coefInvalid = coefNum === null || coefNum <= 0;
  const valid = name.trim() !== "" && !coefInvalid;

  async function handleSubmit() {
    if (!valid || saving || coefNum === null) return;
    setSaving(true);
    setError(false);
    const data = { name: name.trim(), color, coefficient: coefNum };
    try {
      if (editing) {
        await updateSubject(uid, editing.id, data);
        closeSubjectModal();
      } else {
        const id = await addSubject(uid, data);
        closeSubjectModal();
        router.push(`/grades/${id}`);
      }
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
      open={subjectModal !== null}
      onClose={closeSubjectModal}
      title={editing ? "Modifier la matière" : "Nouvelle matière"}
      maxWidth={380}
      footer={
        <>
          <SecondaryButton onClick={closeSubjectModal}>Annuler</SecondaryButton>
          <PrimaryButton onClick={handleSubmit} disabled={!valid || saving}>
            {editing ? "Enregistrer" : "Créer la matière"}
          </PrimaryButton>
        </>
      }
    >
      <div>
        <label htmlFor="subject-name" style={LABEL}>Nom</label>
        <input
          id="subject-name" type="text" value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Ex : Mathématiques, Anglais…" autoFocus
          style={INPUT} {...focusRing} onKeyDown={onEnter}
        />
      </div>

      <div>
        <span style={LABEL}>Couleur</span>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {HABIT_COLORS.map((c, i) => {
            const sel = c.hex === color;
            return (
              <button
                key={c.hex} onClick={() => setColor(c.hex)}
                aria-label={`Couleur ${i + 1}`} aria-pressed={sel} title={c.hex}
                style={{ width: 26, height: 26, borderRadius: "50%", background: c.hex, border: sel ? "2px solid var(--color-text-primary)" : "2px solid transparent", cursor: "pointer", padding: 0, flexShrink: 0 }}
              />
            );
          })}
        </div>
      </div>

      <div>
        <label htmlFor="subject-coef" style={LABEL}>Coefficient</label>
        <input
          id="subject-coef" type="text" inputMode="decimal" value={coef} onChange={(e) => setCoef(e.target.value)}
          style={{ ...INPUT, width: 90 }} {...focusRing} onKeyDown={onEnter}
        />
        <div style={{ fontSize: 11, color: coefInvalid ? "var(--color-text-danger)" : "var(--color-text-secondary)", marginTop: 5 }}>
          {coefInvalid ? "Le coefficient doit être un nombre positif." : "Poids de la matière dans ta moyenne générale."}
        </div>
      </div>

      {error && (
        <div style={{ fontSize: 12, color: "var(--color-text-danger)" }}>
          Impossible d&apos;enregistrer. Vérifie ta connexion et réessaie.
        </div>
      )}
    </Modal>
  );
}
