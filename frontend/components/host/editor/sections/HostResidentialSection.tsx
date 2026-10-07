"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ApiError, hostApi } from "@/lib/api";
import type { HostProfileInput } from "@/types";

export function HostResidentialSection({ onSaved }: { onSaved?: () => void }) {
  const profile = useQuery({ queryKey: ["host-profile"], queryFn: hostApi.profile, retry: false });
  const [form, setForm] = useState<HostProfileInput>({
    country: "India",
    street: "",
    city: "",
    pin_code: "",
    is_business: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile.data) {
      setForm({
        country: profile.data.country,
        flat: profile.data.flat,
        street: profile.data.street,
        landmark: profile.data.landmark,
        district: profile.data.district,
        city: profile.data.city,
        state: profile.data.state,
        pin_code: profile.data.pin_code,
        is_business: profile.data.is_business,
      });
    }
  }, [profile.data]);

  const save = async () => {
    setSaving(true);
    try {
      await hostApi.upsertProfile(form);
      toast.success("Residential address saved");
      onSaved?.();
      await profile.refetch();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Could not save address");
    } finally {
      setSaving(false);
    }
  };

  if (profile.isLoading) return <p className="text-meta text-muted">Loading profile…</p>;

  const field = (label: string, key: keyof HostProfileInput, required?: boolean) => (
    <label className="block">
      <span className="text-label text-muted">
        {label}
        {required ? " *" : ""}
      </span>
      <input
        value={(form[key] as string | null | undefined) ?? ""}
        onChange={(event) => setForm({ ...form, [key]: event.target.value })}
        className="mt-1 w-full rounded-lg border border-hairline px-3 py-2"
      />
    </label>
  );

  return (
    <div className="space-y-4">
      <p className="text-meta text-muted">Guests won&apos;t see this information.</p>
      {field("Country / region", "country", true)}
      {field("Flat, house, etc.", "flat")}
      {field("Street address", "street", true)}
      {field("Landmark", "landmark")}
      {field("District", "district")}
      {field("City", "city", true)}
      {field("State", "state")}
      {field("PIN code", "pin_code", true)}
      <fieldset className="pt-2">
        <legend className="font-medium">Are you hosting as a business?</legend>
        <div className="mt-2 flex gap-4">
          {[true, false].map((value) => (
            <label key={String(value)} className="flex items-center gap-2">
              <input type="radio" checked={form.is_business === value} onChange={() => setForm({ ...form, is_business: value })} />
              {value ? "Yes" : "No"}
            </label>
          ))}
        </div>
      </fieldset>
      <button
        type="button"
        disabled={saving || !form.street.trim() || !form.city.trim() || !form.pin_code.trim()}
        onClick={() => void save()}
        className="rounded-lg bg-ink px-6 py-3 font-semibold text-white disabled:opacity-40"
      >
        Save address
      </button>
    </div>
  );
}
