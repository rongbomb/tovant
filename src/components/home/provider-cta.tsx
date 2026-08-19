export function ProviderCta() {
  return (
    <section id="for-providers">
      <div className="home-container">
        <div className="home-provider-cta">
          <div>
            <p className="home-eyebrow">For mechanics and detailers</p>
            <h2 className="home-serif">Bring your own tools. We bring the trust.</h2>
            <p>
              Get verified once, then take the jobs you want on your own schedule. Get paid in app or
              handle it your own way, whatever fits your business best.
            </p>
            <div className="home-provider-cta-actions">
              <a className="home-btn home-btn-on-photo" href="/become-a-provider">Apply to join Tovant</a>
              <a className="home-btn home-btn-ghost-on-photo" href="#how-it-works">See requirements</a>
            </div>
          </div>
          <div className="home-provider-stats">
            <div className="home-provider-stat">
              <div className="home-provider-stat-num">4</div>
              <div className="home-provider-stat-label">Verification steps, tracked in one dashboard</div>
            </div>
            <div className="home-provider-stat">
              <div className="home-provider-stat-num">2 min</div>
              <div className="home-provider-stat-label">To start your application</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
