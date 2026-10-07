import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";

export default function ComingSoonPage() {
  return (
    <main className="container-airbnb flex flex-col items-start gap-4 py-24">
      <h1 className="t-page-title">Coming soon</h1>
      <p className="max-w-md text-meta text-muted">This part of the trip is not ready yet.</p>
      <Link href="/" className={buttonClasses("outline")}>
        Go home
      </Link>
    </main>
  );
}
