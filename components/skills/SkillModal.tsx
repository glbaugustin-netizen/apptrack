"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDeleteButton, LABEL, INPUT, PrimaryButton, SecondaryButton } from "@/components/grades/ui";
import { NEON_COLORS, neonColor } from "@/lib/skillTree";
import { useSkillsStore, skillWithDescendants, lockedAncestor } from "@/lib/store/skills.store";
import { useAuthStore } from "@/lib/store/auth.store";

export const SKILLS_ACCENT = "#BA7517";

const EMOJIS = [
  "⭐", "🔥", "🧠", "📚", "✍️", "🧮", "📐", "🔬",
  "🧪", "💻", "🛠️", "💡", "🗣️", "🌍", "🎨", "🎵",
  "🏃", "🏋️", "⚽", "🧘", "🚴", "🏊", "🎯", "🚀",
  "💰", "📈", "🍳", "🎮", "📷", "♟️", "🌱", "❤️",
];

/** Premier caractère visible d'une saisie (un emoji peut faire plusieurs caractères). */
function firstGrapheme(text: string): string {
  const value = text.trim();
  if (!value) return "";
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segments = Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(value));
    return segments[0]?.segment ?? "";
  }
  return Array.from(value)[0] ?? "";
}

function focusStyle(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>, on: boolean) {
  e.currentTarget.style.borderColor = on ? SKILLS_ACCENT : "var(--color-border-secondary)";
  e.currentTarget.style.boxShadow = on ? `0 0 0 2px ${SKILLS_ACCENT}33` : "none";
}

export function SkillModal() {
  const { modal, skills, closeModal, addSkill, updateSkill, deleteSkill } = useSkillsStore();
  const uid = useAuthStore((s) => s.user?.uid ?? "");

  const editing = modal?.mode === "edit" ? modal.skill : null;
  const parentId = modal?.mode === "add" ? modal.parentId : editing?.parentId ?? null;
  const parent = parentId ? skills.find((s) => s.id === parentId) : null;
  const isMain = parentId === null; // compétence principale : elle choisit la couleur de sa branche
  const blocker = lockedAncestor(skills, parentId); // compétence à débloquer avant celle-ci

  const [emoji, setEmoji] = useState("⭐");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [color, setColor] = useState(NEON_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!modal) return;
    const used = new Set(useSkillsStore.getState().skills.filter((s) => s.parentId === null).map((s) => neonColor(s.color)));
    const s = modal.mode === "edit" ? modal.skill : null;
    setEmoji(s ? s.emoji : "⭐");
    setName(s?.name ?? "");
    setDescription(s?.description ?? "");
    setUnlocked(s?.unlocked ?? false);
    setColor(s ? neonColor(s.color) : NEON_COLORS.find((c) => !used.has(c)) ?? NEON_COLORS[0]);
    setSaving(false);
    setError(false);
  }, [modal]);

  const valid = name.trim() !== "";
  const subCount = editing ? skillWithDescendants(skills, editing.id).length - 1 : 0;
  const unlockedSubs = editing ? skillWithDescendants(skills, editing.id).slice(1).filter((id) => skills.find((s) => s.id === id)?.unlocked).length : 0;

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
    const data = { name: name.trim(), emoji, description: description.trim(), unlocked: unlocked && !blocker, color: isMain ? color : "" };
    if (modal.mode === "edit") run(() => updateSkill(uid, modal.skill.id, data));
    else run(() => addSkill(uid, modal.parentId, data, modal.order));
  }

  const title = editing ? "Modifier la compétence" : parent ? `Nouvelle sous-compétence de ${parent.name}` : "Nouvelle branche";

  return (
    <Modal
      open={modal !== null}
      onClose={closeModal}
      title={title}
      maxWidth={400}
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
      {/* Emoji */}
      <div>
        <span style={LABEL}>Emoji</span>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", border: "0.5px solid var(--color-border-secondary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
            {emoji || <span style={{ fontSize: 16, fontWeight: 500, color: "var(--color-text-secondary)" }}>{name.trim().charAt(0).toUpperCase() || "?"}</span>}
          </div>
          <input
            type="text" aria-label="Coller un autre emoji" placeholder="Ou colle un autre emoji"
            onChange={(e) => { const g = firstGrapheme(e.target.value); if (g) { setEmoji(g); e.target.value = ""; } }}
            style={{ ...INPUT, fontSize: 13 }}
            onFocus={(e) => focusStyle(e, true)} onBlur={(e) => focusStyle(e, false)}
          />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(8, minmax(0, 1fr))", gap: 4 }}>
          {EMOJIS.map((e) => {
            const sel = e === emoji;
            return (
              <button
                key={e} onClick={() => setEmoji(e)} aria-label={`Emoji ${e}`} aria-pressed={sel}
                style={{ height: 36, borderRadius: "var(--border-radius-md)", border: sel ? `1px solid ${SKILLS_ACCENT}` : "0.5px solid var(--color-border-tertiary)", background: sel ? `${SKILLS_ACCENT}1F` : "transparent", fontSize: 18, cursor: "pointer", padding: 0 }}
              >
                {e}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label htmlFor="skill-name" style={LABEL}>Nom</label>
        <input
          id="skill-name" type="text" value={name} onChange={(e) => setName(e.target.value)} autoFocus
          placeholder={parent ? "Ex : Dérivées, Vocabulaire, Service…" : "Ex : Maths, Anglais, Sport…"}
          style={INPUT} onFocus={(e) => focusStyle(e, true)} onBlur={(e) => focusStyle(e, false)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
        />
      </div>

      <div>
        <label htmlFor="skill-description" style={LABEL}>Description</label>
        <textarea
          id="skill-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
          placeholder="Ce que ça veut dire de maîtriser cette compétence… (visible au survol de la bulle)"
          style={{ ...INPUT, resize: "vertical", lineHeight: 1.5, fontFamily: "inherit" }}
          onFocus={(e) => focusStyle(e, true)} onBlur={(e) => focusStyle(e, false)}
        />
      </div>

      {/* Déblocage : seulement si toutes les compétences d'avant sont débloquées */}
      <label style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: blocker ? "not-allowed" : "pointer", opacity: blocker ? 0.6 : 1 }}>
        <input
          type="checkbox" checked={unlocked && !blocker} disabled={!!blocker} onChange={(e) => setUnlocked(e.target.checked)}
          style={{ width: 16, height: 16, margin: "2px 0 0", accentColor: SKILLS_ACCENT, cursor: "inherit", flexShrink: 0 }}
        />
        <span>
          <span style={{ display: "block", fontSize: 13, color: "var(--color-text-primary)" }}>Débloquée</span>
          <span style={{ display: "block", fontSize: 11, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
            {blocker
              ? `Débloque d'abord « ${blocker.name} » pour pouvoir cocher celle-ci.`
              : editing && unlockedSubs > 0 && !unlocked
                ? `En la décochant, ses ${unlockedSubs} sous-compétence${unlockedSubs > 1 ? "s débloquées repassent" : " débloquée repasse"} en gris.`
                : "Cochée, la bulle et sa branche s'allument. Sinon elles restent grises."}
          </span>
        </span>
      </label>

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
