import Link from "next/link";
import { Logo } from "@/components/layout/Logo";

export function CheckoutHeader() {
  return (
    <header className="border-b border-divider bg-white">
      <div className="mx-auto flex h-20 max-w-[1200px] items-center px-6 min-[1440px]:h-24 min-[1440px]:px-10">
        <Link href="/" aria-label="Home" className="inline-flex">
          <Logo wordmark={false} />
        </Link>
      </div>
    </header>
  );
}
