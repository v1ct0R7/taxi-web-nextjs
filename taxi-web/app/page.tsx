import PriceCarousel from "./PriceCarousel";

export default function Home() {
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "TaxiService",
            name: "Tirana Ride",
            description:
              "Shërbim taxi privat nga Tirana drejt çdo destinacioni në Shqipëri.",
            url: "https://tiranaride.al",
            telephone: "+355681234567",
            areaServed: "Albania",
            priceRange: "€€",
            address: {
              "@type": "PostalAddress",
              addressLocality: "Tirana",
              addressCountry: "AL",
            },
            openingHours: "Mo-Su 00:00-23:59",
          }),
        }}
      />
      <header className="site-header">
        <a className="brand" href="#home" aria-label="Tirana Ride - Kryefaqja">
          <span className="brand-mark">TR</span>
          <span>
            Tirana <strong>Ride</strong>
          </span>
        </a>
        <nav className="main-nav" aria-label="Navigimi kryesor">
          <a className="active" href="#home">
            Home
          </a>
          <a href="#about">About</a>
          <a href="#ofertat">Ofertat</a>
          <a href="#contact">Contact</a>
        </nav>
        <a className="header-call" href="tel:+355681234567">
          <span aria-hidden="true">↗</span> Rezervo tani
        </a>
      </header>

      <section className="hero" id="home">
        <div className="hero-overlay" />
        <div className="hero-content page-width">
          <p className="eyebrow">
            <span className="eyebrow-dot" /> Udhëtime private, pa pritje
          </p>
          <h1>
            Shko më larg.
            <br />
            <em>Mbërrij i qetë.</em>
          </h1>
          <p className="hero-copy">
            Taxi premium nga Tirana drejt çdo destinacioni në Shqipëri. Shoferë
            profesionistë, çmime të qarta dhe nisje në kohë.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="tel:+355681234567">
              Rezervo udhëtimin <span aria-hidden="true">→</span>
            </a>
            <a className="button button-ghost" href="#ofertat">
              Shiko çmimet
            </a>
          </div>
          <div className="hero-trust">
            <span>●</span> Disponueshmëri 24/7{" "}
            <span className="trust-divider" /> Përgjigje brenda 2 minutash
          </div>
        </div>
        <PriceCarousel />
        <div className="hero-scroll">
          Zbulo më shumë <span>↓</span>
        </div>
      </section>

      <section
        className="quick-booking page-width"
        aria-label="Rezervim i shpejtë"
      >
        <div className="booking-label">
          <span className="booking-icon">↗</span>
          <span>
            <strong>Nisja jote</strong>
            <small>Gjithmonë nga Tirana</small>
          </span>
        </div>
        <div className="booking-route">
          <span className="pin pin-start" /> Tirane{" "}
          <span className="route-line" /> <span className="pin pin-end" />{" "}
          Destinacioni yt
        </div>
        <a className="booking-button" href="tel:+355681234567">
          Telefono për rezervim <span>→</span>
        </a>
      </section>

      <section className="intro-section page-width" id="about">
        <div className="section-kicker">01 / Për ne</div>
        <div className="intro-grid">
          <h2>
            Udhëtimi i mirë
            <br />
            <em>fillon këtu.</em>
          </h2>
          <div>
            <p className="lead">
              Tirana Ride është mënyra jote më e thjeshtë për të udhëtuar në
              Shqipëri.
            </p>
            <p>
              Ne lidhim Tiranën me aeroportin, bregdetin dhe çdo qytet tjetër,
              me një shërbim të kujdesshëm dhe pa surpriza në fund të rrugës.
            </p>
            <div className="stats">
              <div>
                <strong>24/7</strong>
                <span>Disponueshmëri</span>
              </div>
              <div>
                <strong>15+</strong>
                <span>Destinacione</span>
              </div>
              <div>
                <strong>4.9/5</strong>
                <span>Vlerësimi</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="offers-section" id="ofertat">
        <div className="page-width">
          <div className="section-heading">
            <div>
              <div className="section-kicker">02 / Ofertat</div>
              <h2>
                Çmime të qarta.
                <br />
                <em>Pa surpriza.</em>
              </h2>
            </div>
            <p>
              Tarifa orientuese për udhëtime një-drejtimëshe. Kontakto për një
              ofertë të personalizuar.
            </p>
          </div>
          <div className="offer-note">
            <span>✦</span>
            <strong>Udhëtime vajtje-ardhje</strong>
            <span>Ofertë speciale për rezervime në advance</span>
            <a href="tel:+355681234567">Merr ofertën →</a>
          </div>
        </div>
      </section>

      <section className="contact-section page-width" id="contact">
        <div className="contact-card">
          <div>
            <div className="section-kicker light">03 / Contact</div>
            <h2>
              Gati për të
              <br />
              <em>nisur?</em>
            </h2>
            <p>
              Na telefono ose na shkruaj në WhatsApp. Ekipi ynë është këtu për
              të të ndihmuar.
            </p>
          </div>
          <div className="contact-actions">
            <a className="button button-light" href="tel:+355681234567">
              +355 68 123 4567 <span>↗</span>
            </a>
            <a className="whatsapp-link" href="https://wa.me/355681234567">
              WhatsApp <span>→</span>
            </a>
          </div>
        </div>
      </section>

      <footer className="site-footer page-width">
        <a className="brand" href="#home">
          <span className="brand-mark">TR</span>
          <span>
            Tirana <strong>Ride</strong>
          </span>
        </a>
        <p>Taxi nga Tirana, për kudo.</p>
        <span>© 2025 Tirana Ride</span>
      </footer>
    </main>
  );
}
