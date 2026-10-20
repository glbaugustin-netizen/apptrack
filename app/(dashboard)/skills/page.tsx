"use client";

import { useSkillsStore } from "@/lib/store/skills.store";
import { useAuthStore } from "@/lib/store/auth.store";
import { SkillTree } from "@/components/skills/SkillTree";
import { SkillModal, SKILLS_ACCENT } from "@/components/skills/SkillModal";
import { PageLoading, PageMessage } from "@/components/grades/ui";

export default function SkillsPage() {
  const { skills, loaded, loadError } = useSkillsStore();
  const user = useAuthStore((s) => s.user);
  const firstName = user?.displayName?.trim().split(/\s+/)[0] || "Moi";
  const branches = skills.filter((s) => s.parentId === null).length;

  if (!loaded) return <PageLoading />;

  return (
    <div style={{ padding: 20, height: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h1 style={{ fontSize: 18, fontWeight: 500, color: "var(--color-text-primary)" }}>Arbre de compétences</h1>
        <p style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>
          {skills.length} compétence{skills.length > 1 ? "s" : ""} · {branches} branche{branches > 1 ? "s" : ""}
        </p>
      </div>

      {loadError ? (
        <PageMessage
          icon="ti-cloud-off"
          title="Impossible de charger tes compétences"
          text="Vérifie ta connexion puis recharge la page. Si ça continue, les règles Firestore bloquent peut-être la collection skills."
        />
      ) : (
        <div style={{ flex: 1, minHeight: 420, background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", overflow: "hidden" }}>
          <SkillTree rootLabel={firstName} accent={SKILLS_ACCENT} accentDark="#854F0B" />
        </div>
      )}

      <SkillModal />
    </div>
  );
}
