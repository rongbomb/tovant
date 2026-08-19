const FEATURES = [
  {
    title: "Fully verified",
    body: "Identity, license, insurance and a background check, cleared before anyone can list.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2">
        <path d="M12 2l7 3v6c0 5-3.4 8.4-7 11-3.6-2.6-7-6-7-11V5l7-3z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: "Protected payment",
    body: "Pay in app and funds are only released once you confirm the work is done right.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2">
        <rect x="3" y="10" width="18" height="10" rx="2" />
        <path d="M7 10V7a5 5 0 0110 0v3" />
      </svg>
    ),
  },
  {
    title: "Your schedule",
    body: "Request a time, get a confirmation. No surprise instant booking to work around.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3.5 2" />
      </svg>
    ),
  },
  {
    title: "Fair cancellations",
    body: "Free to cancel up to 24 hours out. Plain and simple after that, no fine print.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2">
        <path d="M4 12h16M4 12l5-6M4 12l5 6" />
      </svg>
    ),
  },
];

export function FeatureStrip() {
  return (
    <section id="how-it-works">
      <div className="home-container">
        <div className="home-section-head">
          <div>
            <p className="home-eyebrow">Why owners stick around</p>
            <h2 className="home-serif" style={{ marginTop: 8 }}>Built so nothing is left to trust alone</h2>
          </div>
        </div>
        <div className="home-feature-grid">
          {FEATURES.map((f) => (
            <div className="home-feature-cell" key={f.title}>
              <span className="home-feature-icon">{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
