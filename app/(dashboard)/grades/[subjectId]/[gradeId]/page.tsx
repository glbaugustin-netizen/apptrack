"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGradesStore, subjectAverage, sortGrades, onTwenty, gradeTitle, fmtAvg, fmtNum, fmtDate } from "@/lib/store/grades.store";
import { useAuthStore } from "@/lib/store/auth.store";
import { NoteArea } from "@/components/grades/NoteArea";
import { CARD, ConfirmDeleteButton, Delta, PageLoading, PageMessage, SecondaryButton } from "@/components/grades/ui";

function Compare({ label, children, sub }: { label: string; children: React.ReactNode; sub: string }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 3 }}>{label}</div>
      <div style={{ lineHeight: 1.3 }}>{children}</div>
      <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>{sub}</div>
    </div>
  );
}

export default function GradePage({ params }: { params: { subjectId: string; gradeId: string } }) {
  const router = useRouter();
  const uid = useAuthStore((s) => s.user?.uid ?? "");
  const { subjects, grades, loaded, openGradeModal, updateGrade, deleteGrade } = useGradesStore();
  const [leaving, setLeaving] = useState(false);

  const subject = subjects.find((s) => s.id === params.subjectId);
  const grade = grades.find((g) => g.id === params.gradeId && g.subjectId === params.subjectId);

  if (!loaded) return <PageLoading />;
  if (!subject || !grade) {
    if (leaving) return null;
    return (
      <div style={{ padding: 20 }}>
        <PageMessage
          icon="ti-search"
          title="Note introuvable"
          text="Elle a peut-être été supprimée."
          action={
            <Link href={subject ? `/grades/${subject.id}` : "/grades"} style={{ fontSize: 13, color: "var(--color-text-primary)" }}>
              {subject ? `Retour à ${subject.name}` : "Retour à la vue d'ensemble"}
            </Link>
          }
        />
      </div>
    );
  }

  const subjectId = subject.id;
  const gradeId = grade.id;
  const list = sortGrades(grades.filter((g) => g.subjectId === subjectId));
  const index = list.findIndex((g) => g.id === gradeId);
  const prev = index > 0 ? list[index - 1] : null;
  const avg = subjectAverage(list) ?? 0;
  const value = onTwenty(grade);
  const rank = list.filter((g) => onTwenty(g) > value).length + 1;
  const longDate = fmtDate(grade.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  function handleDelete() {
    setLeaving(true);
    router.push(`/grades/${subjectId}`);
    deleteGrade(uid, gradeId).catch((err) => console.error(err));
  }

  return (
    <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
      <Link
        href={`/grades/${subjectId}`}
        style={{ display: "inline-flex", alignItems: "center", gap: 6, alignSelf: "flex-start", fontSize: 12, color: "var(--color-text-secondary)", textDecoration: "none" }}
      >
        <i className="ti ti-arrow-left" style={{ fontSize: 14 }} />
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: subject.color, flexShrink: 0 }} />
        {subject.name}
      </Link>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontSize: 18, fontWeight: 500, color: "var(--color-text-primary)" }}>{gradeTitle(grade)}</h1>
          <p style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>
            {longDate.charAt(0).toUpperCase() + longDate.slice(1)}
            {grade.coefficient !== 1 && ` · coef ${fmtNum(grade.coefficient)}`}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <SecondaryButton icon="ti-edit" onClick={() => openGradeModal(subjectId, grade)}>Modifier</SecondaryButton>
          <ConfirmDeleteButton label="Supprimer" confirmLabel="Confirmer" onConfirm={handleDelete} />
        </div>
      </div>

      <div style={{ ...CARD, display: "flex", alignItems: "center", gap: "16px 32px", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 2 }}>Note</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
            <span style={{ fontSize: 36, fontWeight: 500, lineHeight: 1.1, color: "var(--color-text-primary)" }}>{fmtNum(grade.value)}</span>
            <span style={{ fontSize: 15, color: "var(--color-text-secondary)" }}>/ {fmtNum(grade.outOf)}</span>
          </div>
          {grade.outOf !== 20 && (
            <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>soit {fmtNum(value)}/20</div>
          )}
        </div>
        {list.length > 1 && (
          <div style={{ display: "flex", gap: "12px 32px", flexWrap: "wrap" }}>
            <Compare label="Écart à ta moyenne" sub={`moyenne : ${fmtAvg(avg)}`}>
              <Delta value={value - avg} size={15} />
            </Compare>
            {prev && (
              <Compare label="Par rapport à l'éval précédente" sub={`précédente : ${fmtNum(onTwenty(prev))}/20`}>
                <Delta value={value - onTwenty(prev)} size={15} />
              </Compare>
            )}
            <Compare label="Classement" sub={`sur ${list.length} évals en ${subject.name}`}>
              <span style={{ fontSize: 15, fontWeight: 500, color: "var(--color-text-primary)" }}>{rank === 1 ? "1re" : `${rank}e`}</span>
            </Compare>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
        <NoteArea
          key={`${gradeId}-review`}
          icon="ti-target-arrow"
          title="Ce que je dois revoir"
          placeholder="Ex : refaire les exercices sur les dérivées, revoir la méthode du tableau de variations…"
          initial={grade.review}
          onSave={(text) => updateGrade(uid, gradeId, { review: text })}
        />
        <NoteArea
          key={`${gradeId}-notes`}
          icon="ti-notes"
          title="Notes libres"
          placeholder="Remarques du prof, ressenti, ce qui a marché ou pas…"
          initial={grade.notes}
          onSave={(text) => updateGrade(uid, gradeId, { notes: text })}
        />
      </div>
    </div>
  );
}
