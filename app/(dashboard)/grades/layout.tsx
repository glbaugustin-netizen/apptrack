import { SubjectModal } from "@/components/grades/SubjectModal";
import { GradeModal } from "@/components/grades/GradeModal";
import { PronoteModal } from "@/components/grades/PronoteModal";

export default function GradesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <SubjectModal />
      <GradeModal />
      <PronoteModal />
    </>
  );
}
