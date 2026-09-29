"use client";

import Link from "next/link";
import { useGradesStore, subjectAverage, generalAverage, sortSubjects, fmtAvg, fmtNum } from "@/lib/store/grades.store";
import { Subject } from "@/lib/types/grade.types";
import { CARD, CARD_TITLE, PageLoading, PageMessage, PrimaryButton } from "@/components/grades/ui";

interface Row {
  subject: Subject;
  count: number;
  avg: number | null;
}

function rowHover(e: React.MouseEvent<HTMLAnchorElement>, on: boolean) {
  e.currentTarget.style.background = on ? "var(--color-background-secondary)" : "transparent";
}

function SubjectRow({ subject, count, avg }: Row) {
  return (
    <Link
      href={`/grades/${subject.id}`}
      style={{ display: "block", padding: 10, margin: "0 -10px", borderRadius: "var(--border-radius-md)", textDecoration: "none", transition: "background 0.1s" }}
      onMouseEnter={(e) => rowHover(e, true)}
      onMouseLeave={(e) => rowHover(e, false)}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: subject.color, flexShrink: 0 }} />
        <span style={{ flex: 1, minWidth: 0, fontSize: 13, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {subject.name}
        </span>
        {subject.coefficient !== 1 && (
          <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 20, background: "var(--color-background-secondary)", color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>
            coef {fmtNum(subject.coefficient)}
          </span>
        )}
        <span style={{ fontSize: 11, color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>
          {count} note{count > 1 ? "s" : ""}
        </span>
        <span className="tabular-nums" style={{ minWidth: 40, textAlign: "right", fontSize: 13, fontWeight: 500, color: avg !== null ? "var(--color-text-primary)" : "var(--color-text-tertiary)" }}>
          {avg !== null ? fmtAvg(avg) : "—"}
        </span>
      </div>
      {/* Barre sur 20 : bord droit arrondi, base carrée ; repère à 10 */}
      <div style={{ position: "relative", height: 8, background: "var(--color-border-tertiary)", borderRadius: "0 4px 4px 0" }}>
        {avg !== null && (
          <div style={{ width: `${(avg / 20) * 100}%`, height: "100%", background: subject.color, borderRadius: "0 4px 4px 0", transition: "width 0.3s ease" }} />
        )}
        <div style={{ position: "absolute", left: "50%", top: -2, bottom: -2, width: 1, background: "var(--color-border-primary)" }} />
      </div>
    </Link>
  );
}

function Highlight({ icon, label, row }: { icon: string; label: string; row: Row & { avg: number } }) {
  return (
    <Link href={`/grades/${row.subject.id}`} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", minWidth: 0 }}>
      <i className={`ti ${icon}`} style={{ fontSize: 17, color: "var(--color-text-secondary)", flexShrink: 0 }} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{label}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--color-text-primary)" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: row.subject.color, flexShrink: 0 }} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.subject.name}</span>
          <span className="tabular-nums" style={{ fontWeight: 500 }}>{fmtAvg(row.avg)}</span>
        </div>
      </div>
    </Link>
  );
}

export default function GradesOverviewPage() {
  const { subjects, grades, loaded, loadError, openSubjectModal } = useGradesStore();

  if (!loaded) return <PageLoading />;

  const rows: Row[] = sortSubjects(subjects).map((subject) => {
    const list = grades.filter((g) => g.subjectId === subject.id);
    return { subject, count: list.length, avg: subjectAverage(list) };
  });
  const graded = rows.filter((r): r is Row & { avg: number } => r.avg !== null);
  const general = generalAverage(subjects, grades);
  const best = graded.length >= 2 ? graded.reduce((a, b) => (b.avg > a.avg ? b : a)) : null;
  const weakest = graded.length >= 2 ? graded.reduce((a, b) => (b.avg < a.avg ? b : a)) : null;
  const weighted = graded.some((r) => r.subject.coefficient !== 1);

  return (
    <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h1 style={{ fontSize: 18, fontWeight: 500, color: "var(--color-text-primary)" }}>Vue d&apos;ensemble</h1>
        <p style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>
          {subjects.length} matière{subjects.length > 1 ? "s" : ""} · {grades.length} évaluation{grades.length > 1 ? "s" : ""}
        </p>
      </div>

      {loadError ? (
        <PageMessage
          icon="ti-cloud-off"
          title="Impossible de charger tes notes"
          text="Vérifie ta connexion puis recharge la page. Si ça continue, les règles Firestore bloquent peut-être les collections subjects et grades."
        />
      ) : rows.length === 0 ? (
        <PageMessage
          icon="ti-school"
          title="Aucune matière pour l'instant"
          text="Ajoute tes matières puis tes notes : tu verras ici ta moyenne générale et la moyenne de chaque matière."
          action={<PrimaryButton icon="ti-plus" onClick={() => openSubjectModal()}>Ajouter une matière</PrimaryButton>}
        />
      ) : (
        <>
          <div style={CARD}>
            <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 4 }}>Moyenne générale</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 40, fontWeight: 500, lineHeight: 1.1, color: general !== null ? "var(--color-text-primary)" : "var(--color-text-tertiary)" }}>
                {general !== null ? fmtAvg(general) : "—"}
              </span>
              <span style={{ fontSize: 15, color: "var(--color-text-secondary)" }}>/ 20</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 6 }}>
              {general === null
                ? "Ajoute une note dans une matière pour calculer ta moyenne."
                : `Sur ${graded.length} matière${graded.length > 1 ? "s notées" : " notée"}${weighted ? ", pondérée par les coefficients" : ""}`}
            </div>
            {best && weakest && best.subject.id !== weakest.subject.id && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 28px", marginTop: 14, paddingTop: 12, borderTop: "0.5px solid var(--color-border-tertiary)" }}>
                <Highlight icon="ti-trending-up" label="Meilleure matière" row={best} />
                <Highlight icon="ti-target-arrow" label="À renforcer" row={weakest} />
              </div>
            )}
          </div>

          <div style={CARD}>
            <div style={{ ...CARD_TITLE, marginBottom: 6 }}>Moyenne par matière</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {rows.map((r) => <SubjectRow key={r.subject.id} {...r} />)}
            </div>
            <div className="tabular-nums" style={{ position: "relative", height: 14, marginTop: 2, fontSize: 10, color: "var(--color-text-secondary)" }}>
              <span style={{ position: "absolute", left: 0 }}>0</span>
              <span style={{ position: "absolute", left: "50%", transform: "translateX(-50%)" }}>10</span>
              <span style={{ position: "absolute", right: 0 }}>20</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
