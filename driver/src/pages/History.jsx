import { useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { ArrowRight } from 'lucide-react'
import { dateTime, money } from '../utils/format'

const History = ({ url, token }) => {
  const [rides, setRides] = useState([])
  const [summary, setSummary] = useState({ todayRides: 0, todayEarnings: 0 })

  useEffect(() => {
    let active = true
    axios.get(`${url}/api/driver/history`, { headers: { token } })
      .then((response) => {
        if (!response.data.success) throw new Error(response.data.message)
        if (!active) return
        setRides(response.data.data)
        setSummary(response.data.summary)
      })
      .catch((error) => toast.error(error.response?.data?.message || error.message || 'Historiku nuk u ngarkua'))
    return () => { active = false }
  }, [url, token])

  return (
    <div className="dashboard">
      <section className="summary-grid">
        <div className="card"><span className="muted">Udhëtime sot</span><strong>{summary.todayRides}</strong></div>
        <div className="card"><span className="muted">Fitimi sot</span><strong>{money(summary.todayEarnings)}</strong></div>
      </section>
      <div className="section-row"><h2>Udhëtimet e fundit</h2></div>
      {rides.length === 0 && <p className="muted">Ende pa udhëtime.</p>}
      <div className="history-list">
        {rides.map((ride) => (
          <article key={ride.id} className="history-item card">
            <div>
              <strong className="history-route">{ride.originCity}{ride.originCity !== ride.destinationCity && <><ArrowRight size={13} />{ride.destinationCity}</>}</strong>
              <small className="muted">{ride.pickupAddress} → {ride.dropoffAddress}</small>
              <small className="muted">{dateTime(ride.completedAt || ride.cancelledAt)}</small>
            </div>
            <div className="history-right">
              <strong>{money(ride.price)}</strong>
              <span className={`badge ${ride.status === 'completed' ? 'badge-success' : 'badge-danger'}`}>{ride.status === 'completed' ? 'Përfunduar' : 'Anuluar'}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

export default History
