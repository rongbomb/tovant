"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Gauge } from "@/components/ui/gauge";
import { Card } from "@/components/ui/card";
import { Select, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { requestQuote } from "@/app/providers/[id]/actions";

export interface OwnerVehicle {
  id: string;
  label: string;
}

const ADD_VEHICLE = "__add_vehicle__";

export interface CategoryOption {
  id: string;
  label: string;
}

export function QuoteRequestCard({
  providerId,
  category,
  categories,
  isLoggedIn,
  vehicles,
  ratingAvg,
  hourlyRateCents,
  acceptingLeads,
}: {
  providerId: string;
  category: string | null;
  categories: CategoryOption[];
  isLoggedIn: boolean;
  vehicles: OwnerVehicle[];
  ratingAvg: number | null;
  hourlyRateCents: number | null;
  acceptingLeads: boolean;
}) {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id ?? "");

  if (!acceptingLeads) {
    return (
      <Card as="aside" className="sticky top-24 flex flex-col gap-3">
        <p className="home-serif" style={{ fontSize: 16 }}>
          Not accepting new requests
        </p>
        <p className="text-sm" style={{ color: "var(--home-text-muted)" }}>
          This pro has paused new leads for now. Check back later, or find another verified pro.
        </p>
      </Card>
    );
  }

  if (!isLoggedIn) {
    return (
      <Card as="aside" className="sticky top-24 flex flex-col gap-4">
        <p className="text-sm">Log in to request a quote from this pro.</p>
        <Link href="/login" className="home-btn home-btn-primary" style={{ textAlign: "center" }}>
          Log in
        </Link>
      </Card>
    );
  }

  if (submitted) {
    return (
      <Card as="aside" className="sticky top-24 flex flex-col gap-3">
        <p className="home-serif" style={{ fontSize: 16 }}>
          Quote requested
        </p>
        <p className="text-sm" style={{ color: "var(--home-text-muted)" }}>
          The pro has been notified and will follow up with a firm price before any work starts.
        </p>
      </Card>
    );
  }

  return (
    <Card as="aside" className="sticky top-24 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        {hourlyRateCents ? (
          <p style={{ fontFamily: "var(--home-font-mono)", fontSize: 22, fontWeight: 600 }}>
            ${(hourlyRateCents / 100).toFixed(0)}
            <span className="text-xs font-normal" style={{ color: "var(--home-text-muted)" }}> / hr, typical</span>
          </p>
        ) : (
          <span className="text-xs" style={{ fontFamily: "var(--home-font-mono)", color: "var(--home-text-muted)" }}>
            Request a quote
          </span>
        )}
        <Gauge value={ratingAvg ? ratingAvg / 5 : 0} size={56} />
      </div>

      <form
        action={async (formData) => {
          await requestQuote(formData);
          setSubmitted(true);
        }}
        className="flex flex-col gap-4"
      >
        <input type="hidden" name="providerId" value={providerId} />

        {categories.length > 1 ? (
          <Select label="Category" name="category" defaultValue={category ?? categories[0]?.id}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </Select>
        ) : (
          <input type="hidden" name="category" value={category ?? categories[0]?.id ?? ""} />
        )}

        <Select
          label="Vehicle"
          name="vehicleId"
          value={vehicleId}
          onChange={(e) => {
            if (e.target.value === ADD_VEHICLE) {
              router.push("/owner/settings#my-garage");
              return;
            }
            setVehicleId(e.target.value);
          }}
        >
          {vehicles.length === 0 ? <option value="">No saved vehicles</option> : null}
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>{v.label}</option>
          ))}
          <option value={ADD_VEHICLE}>+ Add a vehicle</option>
        </Select>

        <Textarea
          label="What's going on?"
          name="description"
          required
          placeholder="Grinding noise when braking, started about a week ago..."
        />

        <div
          className="text-center text-xs"
          style={{ border: "1px dashed var(--home-line)", borderRadius: 12, padding: 16, color: "var(--home-text-muted)" }}
        >
          Photo upload isn&apos;t wired up yet — describe the issue above for now.
        </div>

        <Button type="submit">Request a quote</Button>
        <p className="text-center text-[11px] leading-snug" style={{ color: "var(--home-text-muted)" }}>
          This pro responds with a firm price before you commit to anything.
        </p>
      </form>
    </Card>
  );
}
