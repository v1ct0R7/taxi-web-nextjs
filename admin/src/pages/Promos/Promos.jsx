import { usePolling } from '../../utils/usePolling'
import { dateTime, money, promoStatusLabels } from '../../utils/format'

const tone = { active: "badge-success", claimed: "badge-accent", expired: "", cancelled: "badge-danger" }

const Promos = ({ url, token }) => {
  const { data: promos } = usePolling(`${url}/api/promo/list`, token, { interval: 10000, fallback: "Ofertat nuk u ngarkuan" })

  return (
    <div className="admin-page">
      <div className="admin-page-heading">
        <span className="eyebrow">Krijohen automatikisht</span>
        <h1>Ofertat e kthimit</h1>
        <p className="muted">Sa herë që një shofer pranon një udhëtim Tiranë → qytet, kthimi bëhet ofertë publike për klientët e atij qyteti.</p>
      </div>
      <div className="table-wrap card">
        <table className="data-table">
          <thead><tr><th>#</th><th>Rruga</th><th>Shoferi</th><th>Çmimi</th><th>Normal</th><th>Nga ora</th><th>Skadon</th><th>Porosia burim</th><th>Rezervuar nga</th><th>Statusi</th></tr></thead>
          <tbody>
            {promos?.map((promo) => (
              <tr key={promo.id}>
                <td className="muted">{promo.id}</td>
                <td><strong>{promo.fromCity} → {promo.toCity}</strong></td>
                <td>{promo.driver ? `${promo.driver.name} · ${promo.driver.plateNumber}` : '—'}</td>
                <td className="text-accent">{money(promo.price)}</td>
                <td className="muted">{money(promo.regularPrice)}</td>
                <td>{dateTime(promo.availableFrom)}</td>
                <td>{dateTime(promo.expiresAt)}</td>
                <td className="muted">#{promo.sourceRideId}</td>
                <td className="muted">{promo.claimedRideId ? `#${promo.claimedRideId}` : '—'}</td>
                <td><span className={`badge ${tone[promo.status]}`}>{promoStatusLabels[promo.status]}</span></td>
              </tr>
            ))}
            {promos && promos.length === 0 && <tr><td colSpan="10" className="table-empty">Ende pa oferta. Krijohen kur pranohet një udhëtim jashtë Tiranës.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Promos
