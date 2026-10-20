import { create } from "zustand";
import { collection, getDocs, doc, setDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { NEON_COLORS } from "@/lib/skillTree";
import { Skill } from "@/lib/types/skill.types";

function makeId() { return Math.random().toString(36).slice(2, 10); }

export type SkillModal =
  | { mode: "add"; parentId: string | null; order?: number }
  | { mode: "edit"; skill: Skill }
  | null;

export type SkillInput = Pick<Skill, "name" | "emoji" | "description" | "unlocked" | "color">;

interface SkillsState {
  skills: Skill[];
  loaded: boolean;
  loadError: boolean;
  modal: SkillModal;

  load: (uid: string) => Promise<void>;
  openAdd: (parentId: string | null, order?: number) => void;
  openEdit: (skill: Skill) => void;
  closeModal: () => void;
  addSkill: (uid: string, parentId: string | null, data: SkillInput, order?: number) => Promise<void>;
  updateSkill: (uid: string, id: string, updates: Partial<SkillInput>) => Promise<void>;
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

/** Les compétences au-dessus d'elle, de la plus proche à la compétence principale. */
export function skillAncestors(skills: Skill[], skill: Skill): Skill[] {
  const chain: Skill[] = [];
  let parent = skills.find((s) => s.id === skill.parentId);
  while (parent) {
    chain.push(parent);
    parent = skills.find((s) => s.id === parent!.parentId);
  }
  return chain;
}

/** On ne peut débloquer une compétence que si toutes celles d'avant le sont. */
export function lockedAncestor(skills: Skill[], parentId: string | null): Skill | null {
  if (parentId === null) return null;
  const parent = skills.find((s) => s.id === parentId);
  if (!parent) return null;
  return [parent, ...skillAncestors(skills, parent)].reverse().find((s) => !s.unlocked) ?? null;
}

/**
 * Modification d'une compétence avec les règles de déblocage : impossible de la cocher si une
 * compétence d'avant ne l'est pas, et la décocher décoche aussi celles qui en dépendent (relock).
 */
export function planSkillUpdate(skills: Skill[], id: string, updates: Partial<SkillInput>): { changes: Partial<SkillInput>; relock: string[] } | null {
  const skill = skills.find((s) => s.id === id);
  if (!skill) return null;
  const changes = { ...updates };
  if (changes.unlocked && lockedAncestor(skills, skill.parentId)) changes.unlocked = false;
  const relock = changes.unlocked === false
    ? skillWithDescendants(skills, id).slice(1).filter((x) => skills.find((s) => s.id === x)?.unlocked)
    : [];
  return { changes, relock };
}

export const useSkillsStore = create<SkillsState>((set, get) => ({
  skills: [],
  loaded: false,
  loadError: false,
  modal: null,

  load: async (uid) => {
    try {
      const snap = await getDocs(collection(db, "users", uid, "skills"));
      // Compétences créées avant l'ajout des emojis et du déblocage : elles restent allumées
      set({ skills: snap.docs.map((d) => ({ color: "", order: 0, emoji: "", description: "", unlocked: true, ...d.data() } as Skill)), loaded: true, loadError: false });
    } catch (err) {
      console.error("Chargement des compétences impossible", err);
      set({ loaded: true, loadError: true });
    }
  },

  openAdd: (parentId, order) => set({ modal: { mode: "add", parentId, order } }),
  openEdit: (skill) => set({ modal: { mode: "edit", skill } }),
  closeModal: () => set({ modal: null }),

  addSkill: async (uid, parentId, data, order) => {
    const { skills } = get();
    const siblings = skills.filter((s) => s.parentId === parentId);
    const skill: Skill = {
      id: makeId(),
      ...data,
      unlocked: data.unlocked && !lockedAncestor(skills, parentId),
      parentId,
      order: order ?? (siblings.length ? Math.max(...siblings.map((s) => s.order)) + 1 : 0),
      color: parentId === null ? data.color || NEON_COLORS[0] : "",
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, "users", uid, "skills", skill.id), skill);
    set((s) => ({ skills: [...s.skills, skill] }));
  },

  updateSkill: async (uid, id, updates) => {
    const plan = planSkillUpdate(get().skills, id, updates);
    if (!plan) return;
    const { changes, relock } = plan;

    const batch = writeBatch(db);
    batch.update(doc(db, "users", uid, "skills", id), changes);
    relock.forEach((x) => batch.update(doc(db, "users", uid, "skills", x), { unlocked: false }));
    await batch.commit();
    const relocked = new Set(relock);
    set((s) => ({
      skills: s.skills.map((x) => (x.id === id ? { ...x, ...changes } : relocked.has(x.id) ? { ...x, unlocked: false } : x)),
    }));
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
