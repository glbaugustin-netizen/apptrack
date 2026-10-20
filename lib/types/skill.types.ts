export interface Skill {
  id: string;
  name: string;
  emoji: string;           // "" = l'initiale du nom s'affiche à la place
  description: string;     // visible au survol de la bulle
  unlocked: boolean;       // cochée : la bulle et sa branche s'allument
  parentId: string | null; // null = rattachée à la bulle centrale
  order: number;           // ordre parmi ses sœurs (sens horaire)
  color: string;           // couleur de la branche (compétences principales) ; "" = hérite du parent
  createdAt: string;
}
