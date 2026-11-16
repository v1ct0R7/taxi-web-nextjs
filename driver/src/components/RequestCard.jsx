import { ArrowRight, Clock3, MapPin, Sparkles, StickyNote } from 'lucide-react'
import { money, time } from '../utils/format'

const typeLabels = { city: 'Brenda Tiranës', intercity: 'Ndërqytetëse', return_promo: 'Kthim i rezervuar për ty' }

const RequestCard = ({ ride, canAccept, busyAction, onAccept, onDecline }) => {
  const targeted = ride.type === 'return_promo'
  return (
    <article className={`request-card card ${targeted ? 'request-card-targeted' : ''}`}>
      <div className="request-top">
        <span className={`badge ${targeted ? 'badge-accent' : ''}`}>{targeted && <Sparkles size={12} />} {typeLabels[ride.type]}</span>
        <span className="request-time"><Clock3 size={13} /> {time(ride.createdAt)}</span>
      </div>
      <div className="request-route">
        <strong>{ride.originCity}</strong>
        {ride.originCity !== ride.destinationCity && <><ArrowRight size={16} /><strong>{ride.destinationCity}</strong></>}
        <span className="request-price">{money(ride.price)}</span>
      </div>
      <div className="request-points">
        <p><MapPin size={14} /> <span><small>Nisja</small>{ride.pickupAddress}</span></p>
        <p><MapPin size={14} className="dest" /> <span><small>Destinacioni</small>{ride.dropoffAddress}</span></p>
        {ride.distanceKm && <p className="muted request-km">≈ {ride.distanceKm} km</p>}
        {ride.note && <p className="request-note"><StickyNote size={14} /> {ride.note}</p>}
      </div>
      <div className="request-actions">
        {targeted && <button className="btn btn-ghost" onClick={onDecline} disabled={busyAction === `decline-${ride.id}`}>Refuzo</button>}
        <button className="btn btn-primary" onClick={onAccept} disabled={!canAccept || busyAction === `accept-${ride.id}`}>
          {busyAction === `accept-${ride.id}` ? 'Po pranohet…' : canAccept ? 'Prano' : 'Përfundo udhëtimin aktual'}
        </button>
      </div>
    </article>
  )
}

export default RequestCard
