import { Link } from 'react-router'
import { ArrowRight, BadgePercent, Car, CircleCheck, CircleX, Clock3, Euro, Users } from 'lucide-react'
import { usePolling } from '../../utils/usePolling'
import { adminStatusLabels, dateTime, money, statusBadge, typeLabels } from '../../utils/format'

const Dashboard = ({ url, token }) => {
  const { data: stats } = usePolling(`${url}/api/admin/stats`, token, { interval: 6000, fallback: "Statistikat nuk u ngarkuan" })

  const cards = stats ? [
    { label: "Në pritje të shoferit", value: stats.pending, icon: Clock3, tone: stats.pending ? "accent" : "" },
    { label: "Në proces tani", value: stats.inProgress, icon: Car },
    { label: "Përfunduar sot", value: stats.completedToday, icon: CircleCheck, tone: "success" },
    { label: "Anuluar sot", value: stats.cancelledToday, icon: CircleX },
    { label: "Të ardhura sot", value: money(stats.revenueToday), icon: Euro },
    { label: "Të ardhura gjithsej", value: money(stats.revenueTotal), icon: Euro },
    { label: "Shoferë në dispozicion", value: `${stats.drivers.available} / ${stats.drivers.available + stats.drivers.busy + stats.drivers.offline}`, icon: Users, hint: `${stats.drivers.busy} në udhëtim` },
    { label: "Oferta kthimi aktive", value: stats.activePromos, icon: BadgePercent },
  ] : []

  return (
    <div className="admin-page">
      <div className="admin-page-heading">
        <span className="eyebrow">Live</span>
        <h1>Përmbledhje</h1>
        <p className="muted">Gjendja e shërbimit në kohë reale. Rifreskohet automatikisht.</p>
      </div>
      <div className="metric-grid">
        {cards.map(({ label, value, icon: Icon, tone, hint }) => (
          <div key={label} className={`metric-card card ${tone ? `metric-${tone}` : ''}`}>
            <div className="metric-top"><span>{label}</span><Icon size={17} /></div>
            <strong>{value}</strong>
            {hint && <small className="muted">{hint}</small>}
          </div>
        ))}
      </div>

      <section className="admin-section">
        <div className="admin-section-head">
          <h2>Porositë e fundit</h2>
          <Link to="/rides">Të gjitha <ArrowRight size={15} /></Link>
        </div>
        <div className="table-wrap card">
          <table className="data-table">
            <thead><tr><th>#</th><th>Klienti</th><th>Rruga</th><th>Lloji</th><th>Shoferi</th><th>Çmimi</th><th>Statusi</th><th>Koha</th></tr></thead>
            <tbody>
              {stats?.recentRides.map((ride) => (
                <tr key={ride.id}>
                  <td className="muted">{ride.id}</td>
                  <td>{ride.phone}</td>
                  <td>{ride.originCity} → {ride.destinationCity}</td>
                  <td>{typeLabels[ride.type]}</td>
                  <td>{ride.driver ? ride.driver.name : <span className="muted">—</span>}</td>
                  <td>{money(ride.price)}</td>
                  <td><span className={`badge ${statusBadge[ride.status]}`}>{adminStatusLabels[ride.status]}</span></td>
                  <td className="muted">{dateTime(ride.createdAt)}</td>
                </tr>
              ))}
              {stats && stats.recentRides.length === 0 && <tr><td colSpan="8" className="table-empty">Ende pa porosi.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default Dashboard
