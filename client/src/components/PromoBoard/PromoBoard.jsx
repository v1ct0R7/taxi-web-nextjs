import { ArrowRight, Clock3, Sparkles } from 'lucide-react'
import { money, time } from '../../utils/format'
import './PromoBoard.css'

const PromoBoard = ({ promos, onClaim, compact = false }) => {
    if (!promos.length) {
        return (
            <div className="promo-empty card">
                <Sparkles size={22} />
                <div>
                    <strong>Asnjë ofertë kthimi për momentin</strong>
                    <p className="muted">Kur një taksi niset nga Tirana drejt një qyteti tjetër, kthimi shfaqet këtu me çmim të ulur.</p>
                </div>
            </div>
        )
    }

    return (
        <div className={`promo-grid ${compact ? 'promo-grid-compact' : ''}`}>
            {promos.map((promo) => {
                const saving = Math.round((1 - promo.price / promo.regularPrice) * 100)
                const arrived = new Date(promo.availableFrom) <= new Date()
                return (
                    <article key={promo.id} className="promo-card card">
                        <div className="promo-card-top">
                            <span className="badge badge-accent">-{saving}%</span>
                            <span className="promo-card-time"><Clock3 size={14} /> {arrived ? 'Shoferi është në qytet' : `Nga ora ${time(promo.availableFrom)}`}</span>
                        </div>
                        <div className="promo-card-route">
                            <strong>{promo.fromCity}</strong>
                            <ArrowRight size={18} />
                            <strong>{promo.toCity}</strong>
                        </div>
                        <div className="promo-card-price">
                            <span className="promo-card-old">{money(promo.regularPrice)}</span>
                            <span className="promo-card-new">{money(promo.price)}</span>
                        </div>
                        <p className="muted promo-card-meta">
                            {promo.carModel ? `${promo.carModel} · ` : ''}Vlen deri në {time(promo.expiresAt)}
                        </p>
                        <button className="btn btn-primary btn-block" onClick={() => onClaim(promo)}>Rezervo kthimin</button>
                    </article>
                )
            })}
        </div>
    )
}

export default PromoBoard
