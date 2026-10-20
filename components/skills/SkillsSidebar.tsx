"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSkillsStore, skillWithDescendants } from "@/lib/store/skills.store";
import { useUIStore } from "@/lib/store/ui.store";
import { neonColor } from "@/lib/skillTree";
import { SKILLS_ACCENT } from "./SkillModal";

export function SkillsSidebar() {
  const pathname = usePathname();
  const { skills, openAdd, openEdit } = useSkillsStore();
  const closeSidebar = useUIStore((s) => s.closeSidebar);
  const branches = skills.filter((s) => s.parentId === null).sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt));
  const active = pathname === "/skills";

  return (
    <>
      <div style={{ padding: "14px 14px 8px", fontSize: 11, fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Compétences
      </div>

      <Link
        href="/skills"
        onClick={closeSidebar}
        style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 14px", textDecoration: "none", fontSize: 13, background: active ? "var(--color-background-secondary)" : "transparent", color: active ? "var(--color-text-primary)" : "var(--color-text-secondary)", fontWeight: active ? 500 : 400 }}
      >
        <i className="ti ti-hierarchy" style={{ fontSize: 16, flexShrink: 0 }} />
        Arbre
      </Link>

      <div style={{ height: "0.5px", background: "var(--color-border-tertiary)", margin: "8px 0" }} />

      <div style={{ padding: "4px 14px 6px", fontSize: 11, color: "var(--color-text-secondary)" }}>Branches</div>
      {branches.map((b) => {
        const count = skillWithDescendants(skills, b.id).length - 1;
        return (
          <button
            key={b.id}
            onClick={() => { closeSidebar(); openEdit(b); }}
            style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "6px 14px", border: "none", background: "transparent", cursor: "pointer", fontSize: 13, color: "var(--color-text-secondary)", textAlign: "left" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-background-secondary)"; e.currentTarget.style.color = "var(--color-text-primary)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--color-text-secondary)"; }}
          >
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: neonColor(b.color), flexShrink: 0 }} />
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.name}</span>
            {count > 0 && <span className="tabular-nums" style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{count}</span>}
          </button>
        );
      })}
      {branches.length === 0 && (
        <div style={{ padding: "6px 14px", fontSize: 12, color: "var(--color-text-tertiary)", fontStyle: "italic" }}>Aucune compétence</div>
      )}

      <div style={{ marginTop: "auto", padding: "12px 14px" }}>
        <button
          onClick={() => { closeSidebar(); openAdd(null); }}
          style={{ display: "flex", alignItems: "center", gap: 7, width: "100%", padding: "7px 10px", background: SKILLS_ACCENT, color: "#fff", border: "none", borderRadius: "var(--border-radius-md)", fontSize: 13, cursor: "pointer", fontWeight: 500 }}
        >
          <i className="ti ti-plus" style={{ fontSize: 14 }} />
          Nouvelle branche
        </button>
      </div>
    </>
  );
}
