"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const bookDesktop = pathname.startsWith("/book") || /^\/experiences\/\d+\/book/.test(pathname);
  if (pathname.startsWith("/host")) return <>{children}</>;
  if (pathname.startsWith("/legal") || pathname.startsWith("/help")) {
    return <div className="flex min-h-screen flex-col">{children}</div>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className={bookDesktop ? "min-[1128px]:hidden" : undefined}>
        <Header />
      </div>
      <div className="flex-1">{children}</div>
      <Suspense fallback={<Footer />}>
        <SiteFooter hideOnBookDesktop={bookDesktop} />
      </Suspense>
    </div>
  );
}

function SiteFooter({ hideOnBookDesktop }: { hideOnBookDesktop?: boolean }) {
  const pathname = usePathname();
  return (
    <div className={hideOnBookDesktop ? "min-[1128px]:hidden" : undefined}>
      <Footer variant={pathname === "/s" ? "minimal" : "full"} />
    </div>
  );
}
