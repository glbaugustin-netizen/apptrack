export interface Subject {
  id: string;
  name: string;
  color: string;
  coefficient: number; // poids dans la moyenne générale
  createdAt: string;
}

export interface Grade {
  id: string;
  subjectId: string;
  title: string;
  value: number;
  outOf: number;       // barème (20 par défaut)
  coefficient: number;
  date: string;        // "YYYY-MM-DD"
  review: string;      // ce que je dois revoir
  notes: string;       // espace d'écriture libre
  createdAt: string;
}
