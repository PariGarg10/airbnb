"use client";

import Image from "next/image";
import { toast } from "sonner";

export function toastComingSoonWishlist(image?: string | null) {
  toast(
    <span className="t-toast">
      <span className="t-toast-strong">Coming soon</span>
    </span>,
    {
      icon: image ? <Image alt="" src={image} width={48} height={48} className="toast-thumb" /> : undefined,
      action: {
        label: "Change",
        onClick: () => toast("Coming soon"),
      },
    },
  );
}
