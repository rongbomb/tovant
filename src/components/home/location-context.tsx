"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const CONSENT_KEY = "tovant_geo_consent";
const FOUND_CITY = "Minneapolis, MN";

type Consent = "unknown" | "granted" | "denied";

interface LocationState {
  consent: Consent;
  city: string | null;
  requestLocation: () => void;
  dismiss: () => void;
}

const LocationContext = createContext<LocationState | null>(null);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<Consent>("unknown");
  const [city, setCity] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CONSENT_KEY);
      // Deferred to an effect (not a lazy useState initializer) so the
      // server-rendered "unknown consent" markup matches the client's
      // first hydration pass; the saved consent applies right after.
      if (saved === "granted") {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setConsent("granted");
        setCity(FOUND_CITY);
      } else if (saved === "denied") {
        setConsent("denied");
      }
    } catch {
      // localStorage unavailable — fall back to the unknown/default state
    }
  }, []);

  function requestLocation() {
    if (!("geolocation" in navigator)) {
      setConsent("denied");
      try {
        localStorage.setItem(CONSENT_KEY, "denied");
      } catch {}
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => {
        setConsent("granted");
        setCity(FOUND_CITY);
        try {
          localStorage.setItem(CONSENT_KEY, "granted");
        } catch {}
      },
      () => {
        setConsent("denied");
        try {
          localStorage.setItem(CONSENT_KEY, "denied");
        } catch {}
      },
      { timeout: 8000 },
    );
  }

  function dismiss() {
    setConsent("denied");
    try {
      localStorage.setItem(CONSENT_KEY, "denied");
    } catch {}
  }

  return (
    <LocationContext.Provider value={{ consent, city, requestLocation, dismiss }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocation must be used within a LocationProvider");
  return ctx;
}
