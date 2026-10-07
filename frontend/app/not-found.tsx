import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="container-airbnb flex flex-col items-start gap-4 py-24">
      <p className="text-body font-semibold text-muted">404</p>
      <h1 className="t-page-title">We can&apos;t find that page</h1>
      <p className="max-w-md text-meta text-muted">The link may be broken, or the page may have been removed.</p>
      <Link href="/" className={buttonClasses("primary")}>
        Go home
      </Link>
    </main>
  );
}
