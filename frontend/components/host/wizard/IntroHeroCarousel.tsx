"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";

const SLIDES = [
  {
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=900&q=80",
    tint: "#f6f1f1",
    card: true,
    line: "Entire home in Goa, India",
  },
  {
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=900&q=80",
    tint: "#eef3fa",
    card: false,
    line: "Entire home in Jaipur, India",
  },
  {
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&q=80",
    tint: "#f3f0eb",
    card: true,
    line: "Entire home in Udaipur, India",
  },
  {
    image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=900&q=80",
    tint: "#eef6f0",
    card: false,
    line: "Entire home in Manali, India",
  },
] as const;

export function IntroHeroCarousel() {
  const { user } = useAuth();
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setVisible(false);
      window.setTimeout(() => {
        setIndex((current) => (current + 1) % SLIDES.length);
        setVisible(true);
      }, 220);
    }, 3000);
    return () => window.clearInterval(timer);
  }, []);

  const slide = SLIDES[index];
  const host = user?.name ?? "you";

  return (
    <div
      className="relative hidden min-h-[420px] rounded-[32px] p-8 min-[1128px]:flex min-[1128px]:items-center min-[1128px]:justify-center"
      style={{ backgroundColor: slide.tint }}
    >
      <div
        className={`w-full max-w-sm transition-opacity duration-200 ease-out ${visible ? "opacity-100" : "opacity-0"}`}
      >
        {slide.card ? (
          <div className="overflow-hidden rounded-3xl bg-white shadow-[var(--shadow-primary)]">
            <div className="relative m-4 aspect-[4/3] overflow-hidden rounded-2xl">
              <Image src={slide.image} alt="" fill className="object-cover" sizes="360px" priority={index === 0} />
            </div>
            <div className="px-6 pb-6">
              <p className="text-[15px] font-semibold leading-[19px] text-ink">{slide.line}</p>
              <div className="mt-6 flex items-center justify-between border-t border-hairline pt-4 text-[15px] leading-[19px]">
                <span>Hosted by {host}</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">
                  {host.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative aspect-[4/5] overflow-hidden rounded-[32px]">
            <Image src={slide.image} alt="" fill className="object-cover" sizes="400px" />
          </div>
        )}
      </div>
    </div>
  );
}
