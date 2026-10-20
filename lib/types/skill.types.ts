export interface Skill {
  id: string;
  name: string;
  parentId: string | null; // null = rattachée à la bulle centrale
  order: number;           // ordre parmi ses sœurs (sens horaire)
  color: string;           // couleur de la branche (compétences principales) ; "" = hérite du parent
  createdAt: string;
}
