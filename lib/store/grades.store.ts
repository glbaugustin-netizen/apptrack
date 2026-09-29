import { create } from "zustand";
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Grade, Subject } from "@/lib/types/grade.types";

function makeId() { return Math.random().toString(36).slice(2, 10); }

export type SubjectInput = Pick<Subject, "name" | "color" | "coefficient">;
export type GradeInput = Pick<Grade, "title" | "value" | "outOf" | "coefficient" | "date">;

interface GradesState {
  subjects: Subject[];
  grades: Grade[];
  loaded: boolean;
  loadError: boolean;
  subjectModal: { editing: Subject | null } | null;
  gradeModal: { subjectId: string; editing: Grade | null } | null;

  load: (uid: string) => Promise<void>;
  openSubjectModal: (subject?: Subject) => void;
  closeSubjectModal: () => void;
  openGradeModal: (subjectId: string, grade?: Grade) => void;
  closeGradeModal: () => void;
  addSubject: (uid: string, data: SubjectInput) => Promise<string>;
  updateSubject: (uid: string, id: string, updates: SubjectInput) => Promise<void>;
  deleteSubject: (uid: string, id: string) => Promise<void>;
  addGrade: (uid: string, subjectId: string, data: GradeInput) => Promise<void>;
  updateGrade: (uid: string, id: string, updates: Partial<Omit<Grade, "id" | "subjectId" | "createdAt">>) => Promise<void>;
  deleteGrade: (uid: string, id: string) => Promise<void>;
}

export const useGradesStore = create<GradesState>((set, get) => ({
  subjects: [],
  grades: [],
  loaded: false,
  loadError: false,
  subjectModal: null,
  gradeModal: null,

  load: async (uid) => {
    try {
      const [subjectSnap, gradeSnap] = await Promise.all([
        getDocs(collection(db, "users", uid, "subjects")),
        getDocs(collection(db, "users", uid, "grades")),
      ]);
      set({
        subjects: subjectSnap.docs.map((d) => ({ coefficient: 1, ...d.data() } as Subject)),
        grades: gradeSnap.docs.map((d) => ({ title: "", outOf: 20, coefficient: 1, review: "", notes: "", ...d.data() } as Grade)),
        loaded: true,
        loadError: false,
      });
    } catch (err) {
      console.error("Chargement des notes impossible", err);
      set({ loaded: true, loadError: true });
    }
  },

  openSubjectModal: (subject) => set({ subjectModal: { editing: subject ?? null } }),
  closeSubjectModal: () => set({ subjectModal: null }),
  openGradeModal: (subjectId, grade) => set({ gradeModal: { subjectId, editing: grade ?? null } }),
  closeGradeModal: () => set({ gradeModal: null }),

  addSubject: async (uid, data) => {
    const id = makeId();
    const subject: Subject = { id, ...data, createdAt: new Date().toISOString() };
    await setDoc(doc(db, "users", uid, "subjects", id), subject);
    set((s) => ({ subjects: [...s.subjects, subject] }));
    return id;
  },

  updateSubject: async (uid, id, updates) => {
    await updateDoc(doc(db, "users", uid, "subjects", id), updates);
    set((s) => ({ subjects: s.subjects.map((x) => (x.id === id ? { ...x, ...updates } : x)) }));
  },

  // Supprime aussi toutes les notes de la matière
  deleteSubject: async (uid, id) => {
    const batch = writeBatch(db);
    batch.delete(doc(db, "users", uid, "subjects", id));
    get().grades.filter((g) => g.subjectId === id).forEach((g) => batch.delete(doc(db, "users", uid, "grades", g.id)));
    set((s) => ({ subjects: s.subjects.filter((x) => x.id !== id), grades: s.grades.filter((g) => g.subjectId !== id) }));
    await batch.commit();
  },

  addGrade: async (uid, subjectId, data) => {
    const id = makeId();
    const grade: Grade = { id, subjectId, ...data, review: "", notes: "", createdAt: new Date().toISOString() };
    await setDoc(doc(db, "users", uid, "grades", id), grade);
    set((s) => ({ grades: [...s.grades, grade] }));
  },

  updateGrade: async (uid, id, updates) => {
    if (!get().grades.some((g) => g.id === id)) return;
    set((s) => ({ grades: s.grades.map((g) => (g.id === id ? { ...g, ...updates } : g)) }));
    await updateDoc(doc(db, "users", uid, "grades", id), updates);
  },

  deleteGrade: async (uid, id) => {
    set((s) => ({ grades: s.grades.filter((g) => g.id !== id) }));
    await deleteDoc(doc(db, "users", uid, "grades", id));
  },
}));

/** Note ramenée sur 20. */
export function onTwenty(g: Pick<Grade, "value" | "outOf">): number {
  return (g.value / g.outOf) * 20;
}

/** Moyenne /20 pondérée par les coefficients des notes, null s'il n'y a aucune note. */
export function subjectAverage(grades: Grade[]): number | null {
  let sum = 0, weight = 0;
  for (const g of grades) { sum += onTwenty(g) * g.coefficient; weight += g.coefficient; }
  return weight > 0 ? sum / weight : null;
}

/** Moyenne générale /20 pondérée par les coefficients des matières qui ont au moins une note. */
export function generalAverage(subjects: Subject[], grades: Grade[]): number | null {
  let sum = 0, weight = 0;
  for (const s of subjects) {
    const avg = subjectAverage(grades.filter((g) => g.subjectId === s.id));
    if (avg === null) continue;
    sum += avg * s.coefficient;
    weight += s.coefficient;
  }
  return weight > 0 ? sum / weight : null;
}

/** Ordre chronologique (date de l'éval, puis ordre de saisie). */
export function sortGrades(grades: Grade[]): Grade[] {
  return grades.slice().sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
}

export function sortSubjects(subjects: Subject[]): Subject[] {
  return subjects.slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function gradeTitle(g: Pick<Grade, "title" | "date">): string {
  return g.title.trim() || `Évaluation du ${fmtDate(g.date)}`;
}

/** Moyenne affichée comme sur un bulletin : 14,50 */
export function fmtAvg(n: number): string {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Nombre sans zéros inutiles : 15,5 */
export function fmtNum(n: number): string {
  return n.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
}

export function fmtDelta(n: number): string {
  const r = Math.round(n * 100) / 100;
  if (r === 0) return "0";
  return `${r > 0 ? "+" : "−"}${fmtNum(Math.abs(r))}`;
}

export function fmtDate(iso: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }): string {
  return new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", opts);
}

/** Accepte "15,5" comme "15.5" ; null si la saisie n'est pas un nombre. */
export function parseNum(s: string): number | null {
  const t = s.trim().replace(",", ".");
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}
