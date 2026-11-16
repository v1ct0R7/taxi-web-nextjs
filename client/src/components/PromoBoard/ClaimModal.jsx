import { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { ArrowRight, LoaderCircle, Phone, X } from 'lucide-react'
import { StoreContext } from '../../context/storeContext'
import { money, time } from '../../utils/format'

const ClaimModal = ({ promo, onClose }) => {
    const { url, setActiveRide, setErrorMessage, refreshPromos, activeRide } = useContext(StoreContext)
    const navigate = useNavigate()
    const [phone, setPhone] = useState('')
    const [pickupAddress, setPickupAddress] = useState('')
    const [dropoffAddress, setDropoffAddress] = useState('')
    const [note, setNote] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const submit = async (event) => {
        event.preventDefault()
        if (activeRide) {
            navigate('/ride')
            return
        }
        setSubmitting(true)
        try {
            const response = await axios.post(`${url}/api/promo/claim`, { promoId: promo.id, phone, pickupAddress, dropoffAddress, note })
            if (!response.data.success) throw new Error(response.data.message)
            setActiveRide(response.data.data)
            refreshPromos()
            navigate('/ride')
        } catch (error) {
            setErrorMessage(error.response?.data?.message || error.message || 'Oferta nuk u rezervua')
            refreshPromos()
            onClose()
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <form className="modal card" onSubmit={submit} onClick={(event) => event.stopPropagation()} aria-label="Rezervo kthimin">
                <button type="button" className="modal-close" onClick={onClose} aria-label="Mbyll"><X size={18} /></button>
                <span className="eyebrow">Ofertë kthimi</span>
                <h2 className="modal-route">{promo.fromCity} <ArrowRight size={22} /> {promo.toCity}</h2>
                <p className="muted">Shoferi të merr në {promo.fromCity} pasi të mbërrijë (rreth orës {time(promo.availableFrom)}) dhe do të telefonojë para se të vijë.</p>
                <div className="modal-price"><span>Çmimi fiks</span><strong>{money(promo.price)}</strong></div>
                <label className="field">
                    <span>Numri i telefonit</span>
                    <div className="input-icon"><Phone size={17} /><input className="input" type="tel" inputMode="tel" placeholder="069 123 4567" value={phone} onChange={(event) => setPhone(event.target.value)} required maxLength={20} autoComplete="tel" /></div>
                </label>
                <label className="field">
                    <span>Ku të të marrë në {promo.fromCity}?</span>
                    <input className="input" value={pickupAddress} onChange={(event) => setPickupAddress(event.target.value)} placeholder="Adresa, hoteli ose pika e takimit" required minLength={3} maxLength={255} />
                </label>
                <label className="field">
                    <span>Ku të të lërë në Tiranë? (opsionale)</span>
                    <input className="input" value={dropoffAddress} onChange={(event) => setDropoffAddress(event.target.value)} placeholder="P.sh. Sheshi Skënderbej" maxLength={255} />
                </label>
                <label className="field">
                    <span>Shënim (opsional)</span>
                    <input className="input" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Numri i personave, bagazhe…" maxLength={300} />
                </label>
                <button className="btn btn-primary btn-block" disabled={submitting}>
                    {submitting ? <><LoaderCircle size={18} className="spin" /> Po rezervohet…</> : activeRide ? 'Ke një porosi aktive — shikoje' : `Rezervo për ${money(promo.price)}`}
                </button>
            </form>
        </div>
    )
}

export default ClaimModal
