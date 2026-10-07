import { KeyRound, Medal, Volume2 } from "lucide-react";
import type { ReactNode } from "react";

function HighlightRow({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="flex gap-4 py-4 first:pt-0 last:pb-0">
      <span className="mt-0.5 shrink-0 text-ink">{icon}</span>
      <div>
        <p className="text-base font-semibold leading-5 text-ink">{title}</p>
        <p className="mt-1 text-sm leading-[18px] text-muted">{body}</p>
      </div>
    </div>
  );
}

export function ListingHighlights({
  selfCheckIn,
  superhostName,
  isSuperhost,
}: {
  selfCheckIn: boolean;
  superhostName: string;
  isSuperhost: boolean;
}) {
  return (
    <div className="hidden min-[1128px]:block">
      {selfCheckIn ? (
        <HighlightRow
          icon={<KeyRound size={24} strokeWidth={1.5} />}
          title="Self check-in"
          body="Check yourself in with the lockbox."
        />
      ) : null}
      <HighlightRow
        icon={<Volume2 size={24} strokeWidth={1.5} />}
        title="Peace and quiet"
        body="Guests say this home is in a quiet area."
      />
      {isSuperhost ? (
        <HighlightRow
          icon={<Medal size={24} strokeWidth={1.5} />}
          title={`${superhostName} is a Superhost`}
          body="Superhosts are experienced, highly rated hosts."
        />
      ) : null}
    </div>
  );
}
