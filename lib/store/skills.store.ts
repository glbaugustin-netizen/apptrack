import { create } from "zustand";
import { collection, getDocs, doc, setDoc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { HABIT_COLORS } from "@/lib/habitColors";
import { Skill } from "@/lib/types/skill.types";

function makeId() { return Math.random().toString(36).slice(2, 10); }

export type SkillModal =
  | { mode: "add"; parentId: string | null; order?: number }
  | { mode: "edit"; skill: Skill }
  | null;

interface SkillsState {
  skills: Skill[];
  loaded: boolean;
  loadError: boolean;
  modal: SkillModal;

  load: (uid: string) => Promise<void>;
  openAdd: (parentId: string | null, order?: number) => void;
  openEdit: (skill: Skill) => void;
  closeModal: () => void;
  addSkill: (uid: string, data: { name: string; parentId: string | null; order?: number; color?: string }) => Promise<void>;
  updateSkill: (uid: string, id: string, updates: Partial<Pick<Skill, "name" | "color">>) => Promise<void>;
  deleteSkill: (uid: string, id: string) => Promise<void>;
}

/** La compétence et toutes ses sous-compétences, à n'importe quelle profondeur. */
export function skillWithDescendants(skills: Skill[], id: string): string[] {
  const ids = [id];
  for (let i = 0; i < ids.length; i++) {
    for (const s of skills) if (s.parentId === ids[i]) ids.push(s.id);
  }
  return ids;
}

/** Couleur d'une compétence : celle de sa branche (compétence principale). */
export function skillColor(skills: Skill[], skill: Skill): string {
  let current: Skill | undefined = skill;
  while (current && current.parentId !== null) current = skills.find((s) => s.id === current!.parentId);
  return current?.color || HABIT_COLORS[0].hex;
}

export const useSkillsStore = create<SkillsState>((set, get) => ({
  skills: [],
  loaded: false,
  loadError: false,
  modal: null,

  load: async (uid) => {
    try {
      const snap = await getDocs(collection(db, "users", uid, "skills"));
      set({ skills: snap.docs.map((d) => ({ color: "", order: 0, ...d.data() } as Skill)), loaded: true, loadError: false });
    } catch (err) {
      console.error("Chargement des compétences impossible", err);
      set({ loaded: true, loadError: true });
    }
  },

  openAdd: (parentId, order) => set({ modal: { mode: "add", parentId, order } }),
  openEdit: (skill) => set({ modal: { mode: "edit", skill } }),
  closeModal: () => set({ modal: null }),

  addSkill: async (uid, { name, parentId, order, color }) => {
    const siblings = get().skills.filter((s) => s.parentId === parentId);
    const skill: Skill = {
      id: makeId(),
      name,
      parentId,
      order: order ?? (siblings.length ? Math.max(...siblings.map((s) => s.order)) + 1 : 0),
      color: parentId === null ? color ?? HABIT_COLORS[0].hex : "",
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, "users", uid, "skills", skill.id), skill);
    set((s) => ({ skills: [...s.skills, skill] }));
  },

  updateSkill: async (uid, id, updates) => {
    await updateDoc(doc(db, "users", uid, "skills", id), updates);
    set((s) => ({ skills: s.skills.map((x) => (x.id === id ? { ...x, ...updates } : x)) }));
  },

  // Supprime aussi toutes les sous-compétences, en un seul lot
  deleteSkill: async (uid, id) => {
    const ids = new Set(skillWithDescendants(get().skills, id));
    const batch = writeBatch(db);
    ids.forEach((x) => batch.delete(doc(db, "users", uid, "skills", x)));
    await batch.commit();
    set((s) => ({ skills: s.skills.filter((x) => !ids.has(x.id)) }));
  },
}));
