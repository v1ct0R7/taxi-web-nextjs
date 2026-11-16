import { useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { ExternalLink, Search, X } from 'lucide-react'
import { usePolling } from '../../utils/usePolling'
import { actionLabels, actorLabels, adminStatusLabels, dateTime, googleMapsLink, money, statusBadge, typeLabels } from '../../utils/format'

const filters = [
  { value: "", label: "Të gjitha" },
  { value: "active", label: "Aktive" },
  { value: "pending", label: "Në pritje" },
  { value: "accepted", label: "Pranuar" },
  { value: "picked_up", label: "Në udhëtim" },
  { value: "completed", label: "Përfunduar" },
  { value: "cancelled", label: "Anuluar" },
]

const RideDetails = ({ url, token, rideId, onClose, onChanged }) => {
  const [ride, setRide] = useState(null)
  const [refresh, setRefresh] = useState(0)
  const [reason, setReason] = useState("")

  useEffect(() => {
    let active = true
    axios.get(`${url}/api/admin/rides/${rideId}`, { headers: { token } })
      .then((response) => {
        if (!response.data.success) throw new Error(response.data.message)
        if (active) setRide(response.data.data)
      })
      .catch((error) => toast.error(error.response?.data?.message || error.message || "Porosia nuk u ngarkua"))
    return () => { active = false }
  }, [url, token, rideId, refresh])

  const cancel = async () => {
    try {
      const response = await axios.post(`${url}/api/admin/rides/cancel`, { rideId, reason }, { headers: { token } })
      if (!response.data.success) throw new Error(response.data.message)
      toast.success(response.data.message)
      setRefresh((value) => value + 1)
      onChanged()
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Porosia nuk u anulua")
    }
  }

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="drawer" onClick={(event) => event.stopPropagation()}>
        <button className="drawer-close" onClick={onClose} aria-label="Mbyll"><X size={18} /></button>
        {!ride ? <p className="muted">Po ngarkohet…</p> : (
          <>
            <span className="eyebrow">Porosia #{ride.id}</span>
            <h2>{ride.originCity} → {ride.destinationCity}</h2>
            <div className="drawer-badges">
              <span className={`badge ${statusBadge[ride.status]}`}>{adminStatusLabels[ride.status]}</span>
              <span className="badge">{typeLabels[ride.type]}</span>
            </div>
            <dl className="detail-list">
              <div><dt>Klienti</dt><dd><a href={`tel:${ride.phone}`}>{ride.phone}</a></dd></div>
              <div><dt>Çmimi</dt><dd>{money(ride.price)}{ride.distanceKm ? ` · ${ride.distanceKm} km` : ''}</dd></div>
              <div><dt>Nisja</dt><dd>{ride.pickupAddress}{ride.pickupLat !== null && <a className="map-link" href={googleMapsLink(ride.pickupLat, ride.pickupLng)} target="_blank" rel="noreferrer"><ExternalLink size={13} /></a>}</dd></div>
              <div><dt>Destinacioni</dt><dd>{ride.dropoffAddress}{ride.dropoffLat !== null && <a className="map-link" href={googleMapsLink(ride.dropoffLat, ride.dropoffLng)} target="_blank" rel="noreferrer"><ExternalLink size={13} /></a>}</dd></div>
              <div><dt>Shoferi</dt><dd>{ride.driver ? `${ride.driver.name} · ${ride.driver.plateNumber} · ${ride.driver.phone}` : '—'}</dd></div>
              {ride.note && <div><dt>Shënim</dt><dd>{ride.note}</dd></div>}
              {ride.cancelReason && <div><dt>Arsyeja e anulimit</dt><dd>{ride.cancelReason}</dd></div>}
            </dl>
            <h3>Historia e porosisë</h3>
            <ol className="timeline">
              {ride.activity.map((log) => (
                <li key={log.id}>
                  <strong>{actionLabels[log.action] || log.action}</strong>
                  <span className="muted">{actorLabels[log.actorType]}{log.details ? ` · ${log.details}` : ''}</span>
                  <small className="muted">{dateTime(log.createdAt)}</small>
                </li>
              ))}
            </ol>
            {['pending', 'accepted', 'picked_up'].includes(ride.status) && (
              <div className="drawer-cancel">
                <input className="input" placeholder="Arsyeja (opsionale)" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={300} />
                <button className="btn btn-danger" onClick={cancel}>Anulo porosinë</button>
              </div>
            )}
          </>
        )}
      </aside>
    </div>
  )
}

const Rides = ({ url, token }) => {
  const [status, setStatus] = useState("")
  const [type, setType] = useState("")
  const [query, setQuery] = useState("")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState(null)
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setSearch(query), 400)
    return () => clearTimeout(timer)
  }, [query])

  const params = new URLSearchParams({ page: String(page) })
  if (status) params.set("status", status)
  if (type) params.set("type", type)
  if (search) params.set("q", search)
  const { data: rides, meta } = usePolling(`${url}/api/admin/rides?${params}`, token, { interval: 8000, refresh, fallback: "Porositë nuk u ngarkuan" })

  return (
    <div className="admin-page">
      <div className="admin-page-heading">
        <span className="eyebrow">Kërkesat e klientëve</span>
        <h1>Porositë</h1>
        <p className="muted">Çdo kërkesë, çdo status dhe çdo veprim. Kliko një porosi për historinë e plotë.</p>
      </div>
      <div className="toolbar">
        <div className="chip-group">
          {filters.map((filter) => (
            <button key={filter.value} className={`chip ${status === filter.value ? 'active' : ''}`} onClick={() => { setStatus(filter.value); setPage(1) }}>{filter.label}</button>
          ))}
        </div>
        <div className="toolbar-right">
          <select className="input input-sm" value={type} onChange={(event) => { setType(event.target.value); setPage(1) }}>
            <option value="">Çdo lloj</option>
            {Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <div className="input-icon"><Search size={16} /><input className="input input-sm" placeholder="Telefon, adresë, qytet, #" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} /></div>
        </div>
      </div>
      <p className="list-count muted">{meta.total ?? 0} porosi</p>
      <div className="table-wrap card">
        <table className="data-table clickable">
          <thead><tr><th>#</th><th>Klienti</th><th>Nisja</th><th>Destinacioni</th><th>Lloji</th><th>Shoferi</th><th>Çmimi</th><th>Statusi</th><th>Koha</th></tr></thead>
          <tbody>
            {rides?.map((ride) => (
              <tr key={ride.id} onClick={() => setSelected(ride.id)}>
                <td className="muted">{ride.id}</td>
                <td>{ride.phone}</td>
                <td className="cell-ellipsis">{ride.pickupAddress}</td>
                <td className="cell-ellipsis">{ride.destinationCity !== ride.originCity ? `${ride.destinationCity} · ` : ''}{ride.dropoffAddress}</td>
                <td>{typeLabels[ride.type]}</td>
                <td>{ride.driver ? `${ride.driver.name}` : <span className="muted">—</span>}</td>
                <td>{money(ride.price)}</td>
                <td><span className={`badge ${statusBadge[ride.status]}`}>{adminStatusLabels[ride.status]}</span></td>
                <td className="muted">{dateTime(ride.createdAt)}</td>
              </tr>
            ))}
            {rides && rides.length === 0 && <tr><td colSpan="9" className="table-empty">Asnjë porosi me këto filtra.</td></tr>}
          </tbody>
        </table>
      </div>
      {meta.pages > 1 && (
        <div className="pagination">
          <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Mbrapa</button>
          <span className="muted">Faqja {page} / {meta.pages}</span>
          <button className="btn btn-ghost btn-sm" disabled={page >= meta.pages} onClick={() => setPage(page + 1)}>Para</button>
        </div>
      )}
      {selected && <RideDetails url={url} token={token} rideId={selected} onClose={() => setSelected(null)} onChanged={() => setRefresh((value) => value + 1)} />}
    </div>
  )
}

export default Rides
