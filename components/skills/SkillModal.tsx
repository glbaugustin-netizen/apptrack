"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDeleteButton, LABEL, INPUT, PrimaryButton, SecondaryButton } from "@/components/grades/ui";
import { NEON_COLORS, neonColor } from "@/lib/skillTree";
import { useSkillsStore, skillWithDescendants } from "@/lib/store/skills.store";
import { useAuthStore } from "@/lib/store/auth.store";

export const SKILLS_ACCENT = "#BA7517";

export function SkillModal() {
  const { modal, skills, closeModal, addSkill, updateSkill, deleteSkill } = useSkillsStore();
  const uid = useAuthStore((s) => s.user?.uid ?? "");

  const editing = modal?.mode === "edit" ? modal.skill : null;
  const parentId = modal?.mode === "add" ? modal.parentId : editing?.parentId ?? null;
  const parent = parentId ? skills.find((s) => s.id === parentId) : null;
  const isMain = parentId === null; // compétence principale : elle choisit la couleur de sa branche

  const [name, setName] = useState("");
  const [color, setColor] = useState(NEON_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!modal) return;
    const used = new Set(useSkillsStore.getState().skills.filter((s) => s.parentId === null).map((s) => neonColor(s.color)));
    setName(modal.mode === "edit" ? modal.skill.name : "");
    setColor(modal.mode === "edit" ? neonColor(modal.skill.color) : NEON_COLORS.find((c) => !used.has(c)) ?? NEON_COLORS[0]);
    setSaving(false);
    setError(false);
  }, [modal]);

  const valid = name.trim() !== "";
  const subCount = editing ? skillWithDescendants(skills, editing.id).length - 1 : 0;

  async function run(action: () => Promise<void>) {
    setSaving(true);
    setError(false);
    try {
      await action();
      closeModal();
    } catch (err) {
      console.error(err);
      setError(true);
      setSaving(false);
    }
  }

  function handleSubmit() {
    if (!valid || saving || !modal) return;
    if (modal.mode === "edit") {
      run(() => updateSkill(uid, modal.skill.id, isMain ? { name: name.trim(), color } : { name: name.trim() }));
    } else {
      run(() => addSkill(uid, { name: name.trim(), parentId: modal.parentId, order: modal.order, color }));
    }
  }

  const title = editing ? "Modifier la compétence" : parent ? `Nouvelle sous-compétence de ${parent.name}` : "Nouvelle compétence";

  return (
    <Modal
      open={modal !== null}
      onClose={closeModal}
      title={title}
      maxWidth={380}
      footer={
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", gap: 8 }}>
          <div>
            {editing && (
              <ConfirmDeleteButton
                label="Supprimer"
                confirmLabel={subCount ? "Tout supprimer ?" : "Confirmer"}
                onConfirm={() => run(() => deleteSkill(uid, editing.id))}
              />
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <SecondaryButton onClick={closeModal}>Annuler</SecondaryButton>
            <PrimaryButton onClick={handleSubmit} disabled={!valid || saving} style={valid && !saving ? { background: SKILLS_ACCENT } : undefined}>
              {editing ? "Enregistrer" : "Ajouter"}
            </PrimaryButton>
          </div>
        </div>
      }
    >
      <div>
        <label htmlFor="skill-name" style={LABEL}>Nom</label>
        <input
          id="skill-name" type="text" value={name} onChange={(e) => setName(e.target.value)} autoFocus
          placeholder={parent ? "Ex : Dérivées, Vocabulaire, Service…" : "Ex : Maths, Anglais, Sport…"}
          style={INPUT}
          onFocus={(e) => { e.currentTarget.style.borderColor = SKILLS_ACCENT; e.currentTarget.style.boxShadow = `0 0 0 2px ${SKILLS_ACCENT}33`; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-border-secondary)"; e.currentTarget.style.boxShadow = "none"; }}
          onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
        />
      </div>

      {isMain && (
        <div>
          <span style={LABEL}>Couleur de la branche</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {NEON_COLORS.map((hex, i) => {
              const sel = hex === color;
              return (
                <button
                  key={hex} onClick={() => setColor(hex)} aria-label={`Couleur ${i + 1}`} aria-pressed={sel} title={hex}
                  style={{ width: 26, height: 26, borderRadius: "50%", background: hex, border: sel ? "2px solid var(--color-text-primary)" : "2px solid transparent", cursor: "pointer", padding: 0, flexShrink: 0 }}
                />
              );
            })}
          </div>
        </div>
      )}

      {editing && subCount > 0 && (
        <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>
          La supprimer supprime aussi ses {subCount} sous-compétence{subCount > 1 ? "s" : ""}.
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
