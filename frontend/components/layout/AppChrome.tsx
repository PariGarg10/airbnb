"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/host")) return <>{children}</>;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex-1">{children}</div>
      <Suspense fallback={<Footer />}>
        <SiteFooter />
      </Suspense>
    </div>
  );
}

function SiteFooter() {
  const pathname = usePathname();
  return <Footer variant={pathname === "/s" ? "minimal" : "full"} />;
}
