import { useContext, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { ArrowRight, Car, CheckCircle2, CircleX, LoaderCircle, Phone, Sparkles } from 'lucide-react'
import { StoreContext } from '../../context/storeContext'
import MapPicker from '../../components/MapPicker/MapPicker'
import { dateTime, money, statusLabels, time } from '../../utils/format'
import './Track.css'

const steps = [
    { key: 'pending', label: 'Porosia u dërgua' },
    { key: 'accepted', label: 'Shoferi pranoi' },
    { key: 'picked_up', label: 'Në udhëtim' },
    { key: 'completed', label: 'Mbërritët' },
]

const cancelledByLabel = { client: 'nga ti', driver: 'nga shoferi', admin: 'nga operatori', system: 'automatikisht' }

const Track = () => {
    const { url, activeRide, setActiveRide, setErrorMessage, settings } = useContext(StoreContext)
    const navigate = useNavigate()
    const [ride, setRide] = useState(null)
    const [loading, setLoading] = useState(Boolean(activeRide))
    const [refresh, setRefresh] = useState(0)
    const [confirmCancel, setConfirmCancel] = useState(false)
    const [cancelling, setCancelling] = useState(false)

    useEffect(() => {
        if (!activeRide) return
        let active = true
        const load = async () => {
            try {
                const response = await axios.post(`${url}/api/ride/status`, activeRide)
                if (!response.data.success) throw new Error(response.data.message)
                if (active) setRide(response.data.data)
            } catch (error) {
                if (!active) return
                if (error.response?.status === 404) setActiveRide(null)
                else setErrorMessage(error.response?.data?.message || 'Nuk mund të ngarkohet porosia')
            } finally {
                if (active) setLoading(false)
            }
        }
        load()
        const timer = setInterval(load, 4000)
        return () => { active = false; clearInterval(timer) }
    }, [url, activeRide, setActiveRide, setErrorMessage, refresh])

    const cancel = async () => {
        setCancelling(true)
        try {
            const response = await axios.post(`${url}/api/ride/cancel`, activeRide)
            if (!response.data.success) throw new Error(response.data.message)
            setConfirmCancel(false)
            setRefresh((value) => value + 1)
        } catch (error) {
            setErrorMessage(error.response?.data?.message || error.message || 'Porosia nuk u anulua')
        } finally {
            setCancelling(false)
        }
    }

    const newRide = () => {
        setActiveRide(null)
        navigate('/')
    }

    if (!activeRide) {
        return (
            <main className="container section track-empty">
                <Car size={30} />
                <h1>Nuk ke asnjë porosi aktive.</h1>
                <p className="muted">Porosit një taksi dhe ndiqe këtu në kohë reale.</p>
                <Link className="btn btn-primary" to="/">Porosit taksi <ArrowRight size={16} /></Link>
            </main>
        )
    }

    if (loading || !ride) {
        return <main className="container section track-empty"><LoaderCircle size={28} className="spin" /><p className="muted">Po ngarkohet porosia…</p></main>
    }

    const finished = ['completed', 'cancelled'].includes(ride.status)
    const stepIndex = steps.findIndex((step) => step.key === ride.status)
    const pickup = ride.pickupLat !== null ? { lat: ride.pickupLat, lng: ride.pickupLng } : null
    const dropoff = ride.dropoffLat !== null ? { lat: ride.dropoffLat, lng: ride.dropoffLng } : null

    return (
        <main className="container track">
            <section className="track-panel card">
                <div className="track-head">
                    <div>
                        <span className="eyebrow">Porosia #{ride.id}</span>
                        <h1>{statusLabels[ride.status]}</h1>
                    </div>
                    {ride.type === 'return_promo' && <span className="badge badge-accent"><Sparkles size={13} /> Ofertë kthimi</span>}
                </div>

                {ride.status === 'cancelled' ? (
                    <div className="track-cancelled">
                        <CircleX size={22} />
                        <div>
                            <strong>Porosia u anulua {cancelledByLabel[ride.cancelledBy] || ''}</strong>
                            {ride.cancelReason && <p className="muted">{ride.cancelReason}</p>}
                        </div>
                    </div>
                ) : (
                    <ol className="track-steps">
                        {steps.map((step, index) => (
                            <li key={step.key} className={index < stepIndex || ride.status === 'completed' ? 'done' : index === stepIndex ? 'current' : ''}>
                                <span className="track-dot">{index < stepIndex || ride.status === 'completed' ? <CheckCircle2 size={16} /> : index + 1}</span>
                                <span>{step.label}</span>
                            </li>
                        ))}
                    </ol>
                )}

                {ride.status === 'pending' && (
                    <div className="track-waiting">
                        <span className="track-pulse" />
                        <p>{ride.type === 'return_promo'
                            ? 'Kërkesa iu dërgua shoferit që po vjen në qytetin tënd. Do ta pranojë sapo të mbërrijë.'
                            : 'Po kërkojmë shoferin më të afërt. Zakonisht zgjat pak minuta.'}</p>
                    </div>
                )}

                {ride.driver && (
                    <div className="track-driver">
                        <div className="track-driver-avatar">{ride.driver.name.charAt(0)}</div>
                        <div className="track-driver-info">
                            <strong>{ride.driver.name}</strong>
                            <span className="muted">{ride.driver.carModel}</span>
                            <span className="track-plate">{ride.driver.plateNumber}</span>
                        </div>
                        {!finished && <a className="btn btn-ghost btn-sm" href={`tel:${ride.driver.phone}`}><Phone size={15} /> Telefono</a>}
                    </div>
                )}

                <div className="track-route">
                    <div><span className="track-route-marker">A</span><div><small className="muted">{ride.originCity}</small><p>{ride.pickupAddress}</p></div></div>
                    <div><span className="track-route-marker track-route-marker-b">B</span><div><small className="muted">{ride.destinationCity}</small><p>{ride.dropoffAddress}</p></div></div>
                </div>

                <div className="track-facts">
                    <div><span className="muted">Çmimi</span><strong>{money(ride.price)}</strong></div>
                    <div><span className="muted">Porositur</span><strong>{dateTime(ride.createdAt)}</strong></div>
                    {ride.acceptedAt && <div><span className="muted">Pranuar</span><strong>{time(ride.acceptedAt)}</strong></div>}
                    {ride.completedAt && <div><span className="muted">Mbërritur</span><strong>{time(ride.completedAt)}</strong></div>}
                </div>

                {!finished && ['pending', 'accepted'].includes(ride.status) && (
                    confirmCancel ? (
                        <div className="track-confirm">
                            <p>Je i sigurt që do ta anulosh porosinë?</p>
                            <div>
                                <button className="btn btn-ghost btn-sm" onClick={() => setConfirmCancel(false)} disabled={cancelling}>Jo, mbaje</button>
                                <button className="btn btn-danger btn-sm" onClick={cancel} disabled={cancelling}>{cancelling ? 'Po anulohet…' : 'Po, anuloje'}</button>
                            </div>
                        </div>
                    ) : (
                        <button className="btn btn-danger btn-block" onClick={() => setConfirmCancel(true)}>Anulo porosinë</button>
                    )
                )}
                {ride.status === 'picked_up' && <p className="muted track-help">Udhëtimi ka nisur. Për ndihmë telefono {settings?.supportPhone}.</p>}
                {finished && <button className="btn btn-primary btn-block" onClick={newRide}>Porosi e re</button>}
            </section>

            <div className={`track-map ${pickup ? '' : 'track-map-empty'}`}>
                {pickup ? <MapPicker pickup={pickup} dropoff={dropoff} showDropoff={Boolean(dropoff)} center={pickup} /> : (
                    <div className="track-map-placeholder card"><span className="eyebrow">{ride.originCity} → {ride.destinationCity}</span><h2>{ride.pickupAddress}</h2></div>
                )}
            </div>
        </main>
    )
}

export default Track
