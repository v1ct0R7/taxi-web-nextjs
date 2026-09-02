"use client";

import { useEffect, useState } from "react";

const routes = [
  { from: "Tirane", to: "Durres", time: "35 min", price: "25€" },
  { from: "Tirane", to: "Rinas", time: "25 min", price: "18€" },
  { from: "Tirane", to: "Vlore", time: "1h 35 min", price: "75€" },
  { from: "Tirane", to: "Sarande", time: "3h 20 min", price: "150€" },
  { from: "Tirane", to: "Vore", time: "35 min", price: "25€" },
  { from: "Tirane", to: "Pogradec", time: "35 min", price: "25€" },
  { from: "Tirane", to: "Ksamil", time: "35 min", price: "25€" },
  { from: "Tirane", to: "Kruje", time: "35 min", price: "25€" },
  { from: "Tirane", to: "Shkoder", time: "35 min", price: "25€" },
];

export default function PriceCarousel() {
  const [activeRouteIndex, setActiveRouteIndex] = useState(0);
  const activeRoute = routes[activeRouteIndex];

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveRouteIndex((currentIndex) => (currentIndex + 1) % routes.length);
    }, 2000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <aside className="price-carousel" aria-label="Çmime orientuese nga Tirana">
      <div className="carousel-heading">
        <span>Çmime nga Tirana</span>
        <span className="carousel-live">
          <i /> LIVE
        </span>
      </div>
      <div className="carousel-window" aria-live="polite">
        <div className="price-slide">
          <span className="slide-label">ONE WAY</span>
          <div className="slide-route">
            <strong>{activeRoute.from}</strong>
            <span>→</span>
            <strong>{activeRoute.to}</strong>
          </div>
          <div className="slide-bottom">
            <span>{activeRoute.time}</span>
            <strong>nga {activeRoute.price}</strong>
          </div>
        </div>
      </div>
      <div className="carousel-controls">
        <span>Tarifa orientuese</span>
        <div className="carousel-dots">
          {routes.map((route, index) => (
            <button
              aria-label={`Shiko çmimin Tirane - ${route.to}`}
              className={index === activeRouteIndex ? "is-active" : ""}
              key={route.to}
              onClick={() => setActiveRouteIndex(index)}
              type="button"
            />
          ))}
        </div>
      </div>
    </aside>
  );
}
