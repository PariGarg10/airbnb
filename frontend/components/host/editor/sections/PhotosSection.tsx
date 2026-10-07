"use client";

import { PhotosStep } from "@/components/host/steps/PhotosStep";
import { stepEmbed } from "@/components/host/editor/stepEmbed";

export function PhotosSection() {
  return (
    <div className={stepEmbed}>
      <PhotosStep />
    </div>
  );
}
