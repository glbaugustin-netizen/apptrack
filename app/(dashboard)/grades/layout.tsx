import { SubjectModal } from "@/components/grades/SubjectModal";
import { GradeModal } from "@/components/grades/GradeModal";

export default function GradesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <SubjectModal />
      <GradeModal />
    </>
  );
}
