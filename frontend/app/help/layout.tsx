import { Footer } from "@/components/layout/Footer";

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Footer variant="minimal" />
    </>
  );
}
