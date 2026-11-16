import { useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Building2, Crosshair, LoaderCircle, MapPinned, Phone, ShieldCheck } from 'lucide-react'
import { StoreContext } from '../../context/storeContext'
import MapPicker from '../MapPicker/MapPicker'
import AddressInput from './AddressInput'
import { reverseGeocode } from '../../utils/geocode'
import { formatDuration, money } from '../../utils/format'
import './BookingForm.css'

const emptyPoint = { lat: null, lng: null, address: '' }
const hasPoint = (point) => Number.isFinite(point.lat) && Number.isFinite(point.lng)

const BookingForm = ({ initialType = 'city', initialRouteId = '' }) => {
    const { url, settings, fares, setActiveRide, setErrorMessage, activeRide } = useContext(StoreContext)
    const navigate = useNavigate()
    const [type, setType] = useState(initialType)
    const [phone, setPhone] = useState('')
    const [pickup, setPickup] = useState(emptyPoint)
    const [dropoff, setDropoff] = useState(emptyPoint)
    const [routeId, setRouteId] = useState(String(initialRouteId))
    const [note, setNote] = useState('')
    const [activePin, setActivePin] = useState('pickup')
    const [quote, setQuote] = useState({ key: '', price: null, distanceKm: null, error: '' })
    const [locating, setLocating] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    const selectedRoute = fares.find((fare) => String(fare.id) === routeId)

    const quoteKey = useMemo(() => (type === 'city' && hasPoint(pickup) && hasPoint(dropoff)
        ? [pickup.lat, pickup.lng, dropoff.lat, dropoff.lng].map((value) => value.toFixed(5)).join(',')
        : ''), [type, pickup, dropoff])

    // Çmimi brenda Tiranës llogaritet nga serveri
    useEffect(() => {
        if (!quoteKey) return
        let active = true
        const timer = setTimeout(() => {
            axios.post(`${url}/api/ride/quote`, {
                type: 'city', pickupLat: pickup.lat, pickupLng: pickup.lng, dropoffLat: dropoff.lat, dropoffLng: dropoff.lng,
            })
                .then((response) => {
                    if (!response.data.success) throw new Error(response.data.message)
                    if (active) setQuote({ key: quoteKey, ...response.data.data, error: '' })
                })
                .catch((error) => {
                    if (active) setQuote({ key: quoteKey, price: null, distanceKm: null, error: error.response?.data?.message || 'Nuk mund të llogaritet çmimi' })
                })
        }, 300)
        return () => { active = false; clearTimeout(timer) }
    }, [quoteKey, url, pickup.lat, pickup.lng, dropoff.lat, dropoff.lng])

    const currentQuote = quote.key === quoteKey ? quote : null
    const price = type === 'intercity' ? selectedRoute?.price : currentQuote?.price

    const setPoint = async (which, point) => {
        const setter = which === 'pickup' ? setPickup : setDropoff
        setter({ ...point, address: point.address || 'Po gjejmë adresën…' })
        if (!point.address) {
            const address = await reverseGeocode(point)
            setter((current) => current.lat === point.lat && current.lng === point.lng
                ? { ...current, address: address || `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}` }
                : current)
        }
    }

    const pickOnMap = (point) => {
        const which = type === 'intercity' ? 'pickup' : activePin
        setPoint(which, point)
        if (type === 'city' && which === 'pickup' && !hasPoint(dropoff)) setActivePin('dropoff')
    }

    const useMyLocation = () => {
        if (!navigator.geolocation) {
            setErrorMessage('Shfletuesi yt nuk e mbështet vendndodhjen. Zgjidhe pikën në hartë.')
            return
        }
        setLocating(true)
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocating(false)
                setPoint('pickup', { lat: position.coords.latitude, lng: position.coords.longitude })
                if (type === 'city') setActivePin('dropoff')
            },
            () => {
                setLocating(false)
                setErrorMessage('Nuk mund të marrim vendndodhjen. Lejo qasjen ose zgjidhe pikën në hartë.')
            },
            { enableHighAccuracy: true, timeout: 10000 }
        )
    }

    const canSubmit = phone.trim().length >= 8 && hasPoint(pickup) && pickup.address.trim().length >= 3 &&
        (type === 'city' ? hasPoint(dropoff) && Boolean(currentQuote?.price) : Boolean(selectedRoute))

    const submit = async (event) => {
        event.preventDefault()
        if (activeRide) {
            navigate('/ride')
            return
        }
        setSubmitting(true)
        setErrorMessage('')
        try {
            const response = await axios.post(`${url}/api/ride/request`, {
                phone, type, note,
                pickupAddress: pickup.address, pickupLat: pickup.lat, pickupLng: pickup.lng,
                ...(type === 'city'
                    ? { dropoffAddress: dropoff.address, dropoffLat: dropoff.lat, dropoffLng: dropoff.lng }
                    : { cityRouteId: Number(routeId), dropoffAddress: dropoff.address }),
            })
            if (!response.data.success) throw new Error(response.data.message)
            setActiveRide(response.data.data)
            navigate('/ride')
        } catch (error) {
            setErrorMessage(error.response?.data?.message || error.message || 'Porosia nuk u dërgua')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <section className="booking container" id="porosit" aria-label="Porosit taksi">
            <form className="booking-form card" onSubmit={submit}>
                <div className="booking-tabs" role="tablist">
                    <button type="button" role="tab" aria-selected={type === 'city'} className={type === 'city' ? 'active' : ''} onClick={() => setType('city')}>
                        <MapPinned size={16} /> Brenda Tiranës
                    </button>
                    <button type="button" role="tab" aria-selected={type === 'intercity'} className={type === 'intercity' ? 'active' : ''} onClick={() => { setType('intercity'); setActivePin('pickup') }}>
                        <Building2 size={16} /> Jashtë Tiranës
                    </button>
                </div>

                <label className="field">
                    <span>Numri i telefonit</span>
                    <div className="input-icon">
                        <Phone size={17} />
                        <input className="input" type="tel" inputMode="tel" placeholder="069 123 4567" value={phone} onChange={(event) => setPhone(event.target.value)} required autoComplete="tel" maxLength={20} />
                    </div>
                </label>

                <div className="booking-route">
                    <AddressInput
                        label="Nisja (në Tiranë)"
                        marker="pickup"
                        value={pickup.address}
                        placeholder="Kërko adresën ose kliko në hartë"
                        active={type === 'city' && activePin === 'pickup'}
                        onFocus={() => setActivePin('pickup')}
                        onChange={(address) => setPickup((current) => ({ ...current, address }))}
                        onSelect={(result) => { setPoint('pickup', result); if (type === 'city') setActivePin('dropoff') }}
                    />
                    <button type="button" className="booking-locate" onClick={useMyLocation} disabled={locating}>
                        {locating ? <LoaderCircle size={15} className="spin" /> : <Crosshair size={15} />} Përdor vendndodhjen time
                    </button>

                    {type === 'city' ? (
                        <AddressInput
                            label="Destinacioni (në Tiranë)"
                            marker="dropoff"
                            value={dropoff.address}
                            placeholder="Ku do të shkosh?"
                            active={activePin === 'dropoff'}
                            onFocus={() => setActivePin('dropoff')}
                            onChange={(address) => setDropoff((current) => ({ ...current, address }))}
                            onSelect={(result) => setPoint('dropoff', result)}
                        />
                    ) : (
                        <>
                            <label className="field">
                                <span>Qyteti i destinacionit</span>
                                <select className="input" value={routeId} onChange={(event) => setRouteId(event.target.value)} required>
                                    <option value="">Zgjidh qytetin</option>
                                    {fares.map((fare) => <option key={fare.id} value={fare.id}>{fare.city} — {money(fare.price)}</option>)}
                                </select>
                            </label>
                            <label className="field">
                                <span>Adresa në destinacion (opsionale)</span>
                                <input className="input" value={dropoff.address} onChange={(event) => setDropoff({ ...emptyPoint, address: event.target.value })} placeholder="P.sh. Hotel Adriatik" maxLength={255} />
                            </label>
                        </>
                    )}
                </div>

                <label className="field">
                    <span>Shënim për shoferin (opsional)</span>
                    <input className="input" value={note} onChange={(event) => setNote(event.target.value)} placeholder="P.sh. kam 2 valixhe, hyrja e pallatit B" maxLength={300} />
                </label>

                <div className="booking-summary">
                    <div>
                        <span className="muted">Çmimi</span>
                        <strong>{price ? money(price) : '—'}</strong>
                    </div>
                    <div className="booking-summary-meta">
                        {type === 'city' && currentQuote?.distanceKm && <span>≈ {currentQuote.distanceKm} km</span>}
                        {type === 'intercity' && selectedRoute && <span>Tarifë fikse · {formatDuration(selectedRoute.durationMinutes)}</span>}
                        {type === 'city' && !currentQuote && <span>Zgjidh nisjen dhe destinacionin</span>}
                        {currentQuote?.error && <span className="booking-error">{currentQuote.error}</span>}
                    </div>
                </div>

                <button className="btn btn-primary btn-block" disabled={submitting || (!activeRide && !canSubmit)}>
                    {submitting ? <><LoaderCircle size={18} className="spin" /> Po dërgohet…</> : activeRide ? 'Shiko porosinë aktive' : 'Porosit taksinë'}
                </button>
                <p className="booking-note"><ShieldCheck size={14} /> Pa llogari, pa fjalëkalim. Paguan shoferit në fund të udhëtimit.</p>
            </form>

            <div className="booking-map">
                <MapPicker
                    center={settings?.tiranaCenter}
                    radiusKm={settings?.tiranaRadiusKm}
                    pickup={hasPoint(pickup) ? pickup : null}
                    dropoff={type === 'city' && hasPoint(dropoff) ? dropoff : null}
                    showDropoff={type === 'city'}
                    onPick={pickOnMap}
                />
                <div className="booking-map-hint">
                    {type === 'intercity'
                        ? 'Kliko në hartë për pikën e nisjes'
                        : activePin === 'pickup' ? 'Kliko në hartë për pikën e nisjes (A)' : 'Kliko në hartë për destinacionin (B)'}
                </div>
            </div>
        </section>
    )
}

export default BookingForm
