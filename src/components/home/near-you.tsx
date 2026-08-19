"use client";

import { Gauge } from "@/components/ui/gauge";
import { useLocation } from "./location-context";

const PROVIDERS = [
  {
    initials: "DO",
    avatarBg: "#daf1de",
    name: "Dez Okafor",
    meta: "Okafor Mobile Mechanic · Mechanic",
    rating: 4.9,
    quote: "“Fixed my alternator in the driveway before my shift started, and actually explained what broke and why.”",
    location: "Uptown, Minneapolis",
    distance: "2.1 mi",
  },
  {
    initials: "PC",
    avatarBg: "#8eb69b",
    name: "Priya Chandran",
    meta: "Chandran Auto Detailing · Detailer",
    rating: 4.8,
    quote: "“My car has not looked this good since I drove it off the lot. Booked her again for the winter.”",
    location: "St. Paul",
    distance: "3.4 mi",
  },
  {
    initials: "MW",
    avatarBg: "#daf1de",
    name: "Marcus Webb",
    meta: "Webb & Sons Garage · Mechanic",
    rating: 5.0,
    quote: "“Showed me the worn brake pad instead of just telling me. That kind of honesty is rare.”",
    location: "Northeast Minneapolis",
    distance: "1.8 mi",
  },
];

export function NearYou() {
  const { consent, city, requestLocation, dismiss } = useLocation();

  return (
    <section id="near-you" className="home-section-tint">
      <div className="home-container">
        <div className="home-section-head">
          <div>
            <p className="home-eyebrow">Rated by your neighbors</p>
            <h2 className="home-serif" style={{ marginTop: 8 }}>Top pros near you</h2>
            <p className="home-lede">Real jobs, confirmed through Tovant, rated after the work was done.</p>
          </div>
        </div>

        {consent === "unknown" ? (
          <div className="home-locate-banner">
            <p>
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
                <path d="M12 21s7-6.2 7-12a7 7 0 10-14 0c0 5.8 7 12 7 12z" />
                <circle cx="12" cy="9" r="2.4" />
              </svg>
              Show pros near your actual location?
            </p>
            <div className="home-locate-actions">
              <button className="home-btn home-btn-ghost" onClick={dismiss} type="button">Not now</button>
              <button className="home-btn home-btn-primary" onClick={requestLocation} type="button">Allow location</button>
            </div>
          </div>
        ) : null}

        {consent !== "unknown" ? (
          <div className="home-locate-status is-shown">
            <span className="home-dot" />
            <span>
              Showing pros {consent === "granted" && city ? (
                <>near <strong>{city}</strong></>
              ) : (
                <>in <strong>Minneapolis &ndash; St. Paul</strong></>
              )}
            </span>
          </div>
        ) : null}

        <div className="home-tech-grid">
          {PROVIDERS.map((p) => (
            <div className="home-tech-card" key={p.name}>
              <div className="home-tech-top">
                <div className="home-tech-avatar" style={{ background: p.avatarBg }}>{p.initials}</div>
                <div>
                  <div className="home-tech-name">{p.name}</div>
                  <div className="home-tech-meta">{p.meta}</div>
                </div>
              </div>
              <div className="home-gauge-row">
                <Gauge value={p.rating / 5} size={32} trackColor="#e4ede7" fillColor="#235347" />
                <span className="home-gauge-num">{p.rating.toFixed(1)}</span>
                <span className="home-badge">Verified</span>
              </div>
              <p className="home-tech-quote">{p.quote}</p>
              <div className="home-tech-foot">
                <span>{p.location}</span>
                <span>{p.distance}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
