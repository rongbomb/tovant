"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "./location-context";
import { SearchCard } from "./search-card";

export interface HeroSlide {
  path: string;
  alt: string;
}

const AUTOPLAY_MS = 6000;

export function Hero({
  slides,
  categories,
}: {
  slides: HeroSlide[];
  categories: { id: string; label: string }[];
}) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { consent, city } = useLocation();

  function show(index: number) {
    setCurrent(((index % slides.length) + slides.length) % slides.length);
  }

  function resetTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduceMotion) {
      timerRef.current = setInterval(() => setCurrent((c) => (c + 1) % slides.length), AUTOPLAY_MS);
    }
  }

  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.length]);

  function pauseTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
  }

  const showEyebrow = consent === "granted" && city;

  return (
    <section id="hero" className="home-hero">
      <div className="home-hero-slideshow" onMouseEnter={pauseTimer} onMouseLeave={resetTimer}>
        {slides.map((slide, i) => (
          <div key={slide.path} className={`home-hero-slide${i === current ? " is-current" : ""}`}>
            <div className="home-hero-slide-art">
              <Image src={slide.path} alt={slide.alt} fill priority={i === 0} sizes="100vw" style={{ objectFit: "cover" }} />
            </div>
          </div>
        ))}

        <div className="home-hero-overlay">
          <div className="home-container">
            {showEyebrow ? (
              <p className="home-eyebrow home-hero-eyebrow">
                <span className="home-dot" />
                <span>{city}</span>
              </p>
            ) : null}
            <h1 className="home-serif home-hero-headline">Trusted pros, right in your neighborhood.</h1>
            <p className="home-hero-sub">
              Every mechanic on Tovant passes a real background check, identity verification, and
              proof of license and insurance before they can take a single job. Book them mobile
              or in their own shop, then pay however works best for you.
            </p>
            <div className="home-hero-cta-row">
              <a className="home-btn home-btn-on-photo" href="/discover">Find a pro</a>
              <a className="home-btn home-btn-ghost-on-photo" href="#how-it-works">See how verification works</a>
            </div>
          </div>
        </div>

        <div className="home-hero-dots">
          {slides.map((slide, i) => (
            <button
              key={slide.path}
              type="button"
              className={`home-hero-dot${i === current ? " is-current" : ""}`}
              aria-label={`Show photo ${i + 1}`}
              onClick={() => {
                show(i);
                resetTimer();
              }}
            />
          ))}
        </div>
        <button
          type="button"
          className="home-hero-arrow home-hero-arrow-prev"
          aria-label="Previous photo"
          onClick={() => {
            show(current - 1);
            resetTimer();
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>
        <button
          type="button"
          className="home-hero-arrow home-hero-arrow-next"
          aria-label="Next photo"
          onClick={() => {
            show(current + 1);
            resetTimer();
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      </div>

      <SearchCard categories={categories} />

      <div className="home-trust-row">
        <div className="home-trust-item">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
            <path d="M9 12l2 2 4-4M12 3l7 4v5c0 4.5-3 8-7 9-4-1-7-4.5-7-9V7l7-4z" />
          </svg>
          Background checked
        </div>
        <div className="home-trust-item">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
            <path d="M4 4h16v16H4z" />
            <path d="M8 9h8M8 13h5" />
          </svg>
          Licensed &amp; insured
        </div>
        <div className="home-trust-item">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 3" />
          </svg>
          Free cancel, 24h out
        </div>
      </div>
    </section>
  );
}
