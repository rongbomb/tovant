import { LogoMark } from "./logo-mark";

export function SiteFooter() {
  return (
    <footer className="home-footer">
      <div className="home-container">
        <div className="home-footer-top">
          <div className="home-footer-brand">
            <div className="home-nav-logo">
              <LogoMark />
              TOVANT
            </div>
            <p>A trust-first marketplace connecting car owners with verified mechanics and detailers.</p>
            <div className="home-footer-news">
              <input type="email" placeholder="Your email" suppressHydrationWarning />
              <button aria-label="Subscribe" type="button" suppressHydrationWarning>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="#051F20" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
          <div className="home-footer-col">
            <h4>For Owners</h4>
            <ul>
              <li><a href="#near-you">Find a provider</a></li>
              <li><a href="#how-it-works">How verification works</a></li>
              <li><a href="#">Trust and safety</a></li>
              <li><a href="#">Help center</a></li>
            </ul>
          </div>
          <div className="home-footer-col">
            <h4>For Providers</h4>
            <ul>
              <li><a href="/become-a-provider">Become a provider</a></li>
              <li><a href="#how-it-works">Verification requirements</a></li>
              <li><a href="/provider/dashboard">Provider dashboard</a></li>
            </ul>
          </div>
          <div className="home-footer-col">
            <h4>Company</h4>
            <ul>
              <li><a href="#">About</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Contact</a></li>
              <li><a href="#">Blog</a></li>
            </ul>
          </div>
        </div>
        <div className="home-footer-bottom">
          <span>&copy; 2026 Tovant. Minneapolis &ndash; St. Paul.</span>
          <div className="home-footer-legal">
            <a href="#">Terms</a>
            <a href="#">Privacy</a>
            <a href="#">Accessibility</a>
          </div>
          <div className="home-footer-social">
            <a href="#" aria-label="Instagram">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="5" stroke="#DAF1DE" strokeWidth="1.8" />
                <circle cx="12" cy="12" r="4" stroke="#DAF1DE" strokeWidth="1.8" />
                <circle cx="17.2" cy="6.8" r="1" fill="#DAF1DE" />
              </svg>
            </a>
            <a href="#" aria-label="X">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M4 4l16 16M20 4L4 20" stroke="#DAF1DE" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
