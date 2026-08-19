"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DOW = ["S", "M", "T", "W", "T", "F", "S"];
const QUICK_LABELS: Record<string, string> = {
  today: "Today",
  week: "This week",
  nextweek: "Next week",
  flex: "Flexible",
};

function sameDay(a: Date | null, b: Date) {
  return !!a && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function SearchCard({ categories }: { categories: { id: string; label: string }[] }) {
  const router = useRouter();
  const today = new Date();
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState<Date | null>(null);
  const [triggerLabel, setTriggerLabel] = useState("This week");
  const fieldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (fieldRef.current && !fieldRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

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

  function pickQuick(key: string) {
    setTriggerLabel(QUICK_LABELS[key]);
    setSelected(null);
    setOpen(false);
  }

  function pickDay(date: Date) {
    setSelected(date);
    setTriggerLabel(date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }));
    setOpen(false);
  }

  const firstDow = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(viewYear, viewMonth, i + 1)),
  ];

  return (
    <div className="home-search-card-wrap">
      <div className="home-search-card">
        <div className="home-search-field">
          <label htmlFor="home-svc">Service</label>
          <select id="home-svc" defaultValue={categories[0]?.id}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="home-search-field">
          <label htmlFor="home-loc">Location</label>
          <input id="home-loc" type="text" placeholder="ZIP or neighborhood" />
        </div>
        <div className="home-search-field" ref={fieldRef}>
          <label htmlFor="home-date-trigger">When</label>
          <button
            type="button"
            id="home-date-trigger"
            className="home-date-trigger"
            onClick={() => setOpen((v) => !v)}
          >
            {triggerLabel}
          </button>
          <div className={`home-calendar-pop${open ? " is-open" : ""}`}>
            <div className="home-cal-quick">
              {Object.keys(QUICK_LABELS).map((key) => (
                <button key={key} type="button" onClick={() => pickQuick(key)}>
                  {QUICK_LABELS[key]}
                </button>
              ))}
            </div>
            <div className="home-cal-head">
              <button type="button" aria-label="Previous month" onClick={() => goToMonth(-1)}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <path d="M15 6l-6 6 6 6" />
                </svg>
              </button>
              <span>{MONTHS[viewMonth]} {viewYear}</span>
              <button type="button" aria-label="Next month" onClick={() => goToMonth(1)}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>
            </div>
            <div className="home-cal-grid">
              {DOW.map((d, i) => (
                <div className="home-cal-dow" key={`dow-${i}`}>{d}</div>
              ))}
              {cells.map((date, i) =>
                date ? (
                  <button
                    key={date.toISOString()}
                    type="button"
                    className={`home-cal-day${sameDay(today, date) ? " is-today" : ""}${sameDay(selected, date) ? " is-selected" : ""}`}
                    onClick={() => pickDay(date)}
                  >
                    {date.getDate()}
                  </button>
                ) : (
                  <button key={`blank-${i}`} className="home-cal-day" disabled />
                ),
              )}
            </div>
          </div>
        </div>
        <label className="home-mode-toggle">
          <span className="home-mode-toggle-label">Mobile<br />only</span>
          <input type="checkbox" />
          <span className="home-mode-track"><span className="home-mode-thumb" /></span>
        </label>
        <button
          className="home-btn home-btn-primary"
          type="button"
          onClick={() => router.push("/discover")}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2.2" />
            <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
          Find pros
        </button>
      </div>
    </div>
  );
}
