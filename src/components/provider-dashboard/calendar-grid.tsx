"use client";

import { useState } from "react";
import Link from "next/link";
import { toggleUnavailable } from "@/app/provider/calendar/actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DOW = ["S", "M", "T", "W", "T", "F", "S"];

const STATUS_DOT: Record<string, string> = {
  scheduled: "var(--home-text-muted)",
  confirmed: "var(--home-accent)",
  in_progress: "var(--home-accent)",
  completed: "var(--home-success)",
  cancelled: "var(--home-line)",
  disputed: "var(--home-danger)",
};

export interface CalendarJob {
  id: string;
  status: string;
  scheduledAt: string;
  ownerName: string | null;
}

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function CalendarGrid({
  jobs,
  unavailableDates,
}: {
  jobs: CalendarJob[];
  unavailableDates: string[];
}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState<string>(toDateKey(today));

  const unavailableSet = new Set(unavailableDates);
  const jobsByDate = new Map<string, CalendarJob[]>();
  for (const job of jobs) {
    const key = toDateKey(new Date(job.scheduledAt));
    jobsByDate.set(key, [...(jobsByDate.get(key) ?? []), job]);
  }

  function goToMonth(delta: number) {
    let month = viewMonth + delta;
    let year = viewYear;
    if (month < 0) {
      month = 11;
      year -= 1;
    } else if (month > 11) {
      month = 0;
      year += 1;
    }
    setViewMonth(month);
    setViewYear(year);
  }

  const firstDow = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(viewYear, viewMonth, i + 1)),
  ];

  const selectedJobs = jobsByDate.get(selected) ?? [];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div>
        <div className="mb-4 flex items-center justify-between">
          <Button type="button" variant="ghost" onClick={() => goToMonth(-1)} style={{ padding: "6px 14px" }}>
            ←
          </Button>
          <p className="home-serif" style={{ fontSize: 15 }}>
            {MONTHS[viewMonth]} {viewYear}
          </p>
          <Button type="button" variant="ghost" onClick={() => goToMonth(1)} style={{ padding: "6px 14px" }}>
            →
          </Button>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {DOW.map((d, i) => (
            <div
              key={i}
              className="text-center text-[10px]"
              style={{ fontFamily: "var(--home-font-mono)", color: "var(--home-text-muted)" }}
            >
              {d}
            </div>
          ))}
          {cells.map((date, i) => {
            if (!date) return <div key={`blank-${i}`} />;
            const key = toDateKey(date);
            const isToday = key === toDateKey(today);
            const isSelected = key === selected;
            const isUnavailable = unavailableSet.has(key);
            const dayJobs = jobsByDate.get(key) ?? [];
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelected(key)}
                className="flex aspect-square flex-col items-center justify-center gap-1 text-xs transition-colors"
                style={{
                  borderRadius: 10,
                  fontFamily: "var(--home-font-mono)",
                  background: "var(--home-surface)",
                  border: isSelected
                    ? "1px solid var(--home-accent)"
                    : isToday
                      ? "1px solid var(--home-accent)"
                      : "1px solid var(--home-line)",
                  color: isUnavailable ? "var(--home-text-muted)" : "var(--home-text)",
                  textDecoration: isUnavailable ? "line-through" : "none",
                }}
              >
                {date.getDate()}
                {dayJobs.length > 0 ? (
                  <span className="flex gap-0.5">
                    {dayJobs.slice(0, 3).map((j) => (
                      <span
                        key={j.id}
                        className="h-1 w-1 rounded-full"
                        style={{ background: STATUS_DOT[j.status] ?? "var(--home-text-muted)" }}
                      />
                    ))}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <Card>
          <p className="home-field-label" style={{ marginBottom: 12 }}>
            {selected}
          </p>
          {selectedJobs.length === 0 ? (
            <EmptyState>No jobs scheduled.</EmptyState>
          ) : (
            <ul className="flex flex-col gap-2">
              {selectedJobs.map((j) => (
                <li key={j.id}>
                  <Link
                    href={`/provider/jobs/${j.id}`}
                    className="block text-sm transition-colors"
                    style={{ borderRadius: 10, background: "var(--home-tint)", padding: "10px 12px" }}
                  >
                    {j.ownerName ?? "Tovant owner"} ·{" "}
                    <span className="text-[11px]" style={{ fontFamily: "var(--home-font-mono)", color: "var(--home-text-muted)" }}>
                      {new Date(j.scheduledAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <form action={toggleUnavailable} className="mt-3">
            <input type="hidden" name="date" value={selected} />
            <Button type="submit" variant="ghost" style={{ width: "100%" }}>
              {unavailableSet.has(selected) ? "Mark as available" : "Mark as unavailable"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
