"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getRecentNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/app/notifications/actions";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  readAt: string | Date | null;
  createdAt: string | Date;
}

const POLL_MS = 30_000;

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  async function refresh() {
    const result = await getRecentNotifications();
    setItems(result.items as NotificationItem[]);
    setUnreadCount(result.unreadCount);
  }

  useEffect(() => {
    // Deferred so the initial fetch's state updates don't fire
    // synchronously within the effect body itself.
    const timeout = setTimeout(refresh, 0);
    const interval = setInterval(refresh, POLL_MS);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  async function handleOpen(item: NotificationItem) {
    if (!item.readAt) {
      setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, readAt: new Date() } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
      await markNotificationRead(item.id);
    }
    setOpen(false);
    if (item.link) router.push(item.link);
  }

  async function handleMarkAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date() })));
    setUnreadCount(0);
    await markAllNotificationsRead();
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="home-theme-toggle"
        style={{ border: "1px solid var(--home-line)", position: "relative" }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17">
          <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {unreadCount > 0 ? (
          <span
            style={{
              position: "absolute",
              top: -2,
              right: -2,
              minWidth: 16,
              height: 16,
              padding: "0 3px",
              borderRadius: 999,
              background: "var(--home-danger)",
              color: "#fff",
              fontSize: 10,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className="home-card"
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            width: 340,
            maxHeight: 420,
            overflowY: "auto",
            padding: 0,
            zIndex: 50,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              borderBottom: "1px solid var(--home-line)",
            }}
          >
            <p className="font-semibold text-sm">Notifications</p>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={handleMarkAllRead}
                style={{ fontSize: 11, color: "var(--home-accent)", background: "none", border: "none", cursor: "pointer" }}
              >
                Mark all read
              </button>
            ) : null}
          </div>

          {items.length === 0 ? (
            <p className="text-sm" style={{ padding: 20, textAlign: "center", color: "var(--home-text-muted)" }}>
              Nothing yet.
            </p>
          ) : (
            <ul>
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => handleOpen(item)}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "12px 16px",
                      border: "none",
                      borderBottom: "1px solid var(--home-line)",
                      background: item.readAt ? "transparent" : "var(--home-tint)",
                      cursor: "pointer",
                    }}
                  >
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="text-xs" style={{ color: "var(--home-text-muted)", marginTop: 2 }}>
                      {item.body}
                    </p>
                    <p
                      className="text-[10px] uppercase tracking-wide"
                      style={{ marginTop: 4, fontFamily: "var(--home-font-mono)", color: "var(--home-text-muted)" }}
                    >
                      {timeAgo(new Date(item.createdAt))}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
