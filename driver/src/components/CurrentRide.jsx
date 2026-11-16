import { useState } from 'react'
import { ArrowRight, Flag, Navigation, Phone, StickyNote, UserCheck } from 'lucide-react'
import { googleMapsLink, money } from '../utils/format'

const navigateLink = (lat, lng, address, city) => lat !== null && lat !== undefined
  ? googleMapsLink(lat, lng)
  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address}, ${city}`)}`

const CurrentRide = ({ ride, busyAction, onAction }) => {
  const [confirmCancel, setConfirmCancel] = useState(false)
  const pickedUp = ride.status === 'picked_up'
  const target = pickedUp
    ? navigateLink(ride.dropoffLat, ride.dropoffLng, ride.dropoffAddress, ride.destinationCity)
    : navigateLink(ride.pickupLat, ride.pickupLng, ride.pickupAddress, ride.originCity)

  return (
    <section className="current-ride card">
      <div className="current-head">
        <span className="eyebrow">{pickedUp ? 'Në udhëtim' : 'Shko te klienti'}</span>
        <span className="current-price">{money(ride.price)}</span>
      </div>
      <div className="current-route">
        <strong>{ride.originCity}</strong>
        {ride.originCity !== ride.destinationCity && <><ArrowRight size={16} /><strong>{ride.destinationCity}</strong></>}
      </div>
      <div className="current-points">
        <div className={pickedUp ? 'done' : 'active'}><span>A</span><p><small>Merr klientin</small>{ride.pickupAddress}</p></div>
        <div className={pickedUp ? 'active' : ''}><span>B</span><p><small>Destinacioni</small>{ride.dropoffAddress}</p></div>
      </div>
      {ride.note && <p className="request-note"><StickyNote size={14} /> {ride.note}</p>}
      <div className="current-links">
        <a className="btn btn-ghost" href={`tel:${ride.phone}`}><Phone size={16} /> {ride.phone}</a>
        <a className="btn btn-ghost" href={target} target="_blank" rel="noreferrer"><Navigation size={16} /> Navigo</a>
      </div>
      {pickedUp ? (
        <button className="btn btn-primary btn-block btn-lg" onClick={() => onAction('dropoff', ride.id)} disabled={busyAction === `dropoff-${ride.id}`}>
          <Flag size={18} /> {busyAction === `dropoff-${ride.id}` ? 'Po përfundohet…' : 'Drop off — përfundo udhëtimin'}
        </button>
      ) : (
        <>
          <button className="btn btn-primary btn-block btn-lg" onClick={() => onAction('pickup', ride.id)} disabled={busyAction === `pickup-${ride.id}`}>
            <UserCheck size={18} /> {busyAction === `pickup-${ride.id}` ? 'Po niset…' : 'Klienti hipi — nis udhëtimin'}
          </button>
          {confirmCancel ? (
            <div className="current-confirm">
              <p>Anulo udhëtimin? Klienti do të njoftohet.</p>
              <div>
                <button className="btn btn-ghost btn-sm" onClick={() => setConfirmCancel(false)}>Jo</button>
                <button className="btn btn-danger btn-sm" onClick={() => { setConfirmCancel(false); onAction('cancel', ride.id, { reason: 'Klienti nuk u paraqit' }) }}>Po, anuloje</button>
              </div>
            </div>
          ) : (
            <button className="current-cancel" onClick={() => setConfirmCancel(true)}>Klienti nuk u paraqit? Anulo</button>
          )}
        </>
      )}
    </section>
  )
}

export default CurrentRide
