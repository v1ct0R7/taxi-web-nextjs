import { useContext, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BadgeCheck, Clock3, MapPin, Smartphone } from 'lucide-react'
import { StoreContext } from '../../context/storeContext'
import BookingForm from '../../components/BookingForm/BookingForm'
import PromoBoard from '../../components/PromoBoard/PromoBoard'
import ClaimModal from '../../components/PromoBoard/ClaimModal'
import { formatDuration, money } from '../../utils/format'
import './Home.css'

const steps = [
    { icon: Smartphone, title: 'Shkruaj numrin', text: 'Vetëm numri i telefonit — pa llogari dhe pa fjalëkalim.' },
    { icon: MapPin, title: 'Zgjidh vendndodhjen', text: 'Vendos nisjen dhe destinacionin në hartë. Çmimin e sheh menjëherë.' },
    { icon: BadgeCheck, title: 'Shoferi pranon', text: 'Shoferi më i afërt e pranon dhe ti sheh makinën, targën dhe numrin e tij.' },
]

const Home = () => {
    const { fares, promos, settings } = useContext(StoreContext)
    const [preset, setPreset] = useState({ n: 0, type: 'city', routeId: '' })
    const [claiming, setClaiming] = useState(null)

    const bookCity = (routeId) => {
        setPreset((current) => ({ n: current.n + 1, type: 'intercity', routeId }))
        document.getElementById('porosit')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    return (
        <main className="home">
            <section className="hero container">
                <span className="eyebrow">Taksi në Tiranë · 24/7</span>
                <h1>Taksia jote, <em>me një prekje.</em></h1>
                <p>Shkruaj numrin e telefonit, vendos vendndodhjen dhe shoferi më i afërt është rrugës. Çmim i qartë para se të nisesh — brenda Tiranës ose drejt çdo qyteti.</p>
                <div className="hero-stats">
                    <div><strong>{settings ? money(settings.minimumFare) : '—'}</strong><span>Udhëtimi minimal</span></div>
                    <div><strong>{fares.length || '—'}</strong><span>Qytete me tarifë fikse</span></div>
                    <div><strong>{promos.length}</strong><span>Oferta kthimi tani</span></div>
                </div>
            </section>

            <BookingForm key={preset.n} initialType={preset.type} initialRouteId={preset.routeId} />

            <section className="section container" id="ofertat">
                <div className="section-heading">
                    <div>
                        <span className="eyebrow">Oferta kthimi</span>
                        <h2>Kthehu në Tiranë me çmim të ulur.</h2>
                    </div>
                    <p>Kur një taksi niset nga Tirana drejt një qyteti tjetër, kthimi bëhet ofertë për këdo që ka nevojë të vijë në Tiranë.</p>
                </div>
                <PromoBoard promos={promos.slice(0, 6)} onClaim={setClaiming} />
                {promos.length > 6 && <Link className="home-more" to="/offers">Shiko të gjitha ofertat <ArrowRight size={16} /></Link>}
            </section>

            <section className="section container">
                <div className="section-heading">
                    <div>
                        <span className="eyebrow">Tarifa fikse</span>
                        <h2>Nga Tirana, drejt çdo qyteti.</h2>
                    </div>
                    <p>Çmimi është fiks dhe i njohur që në fillim — pa taksimetër dhe pa surpriza në fund të rrugës.</p>
                </div>
                <div className="fare-grid">
                    {fares.map((fare) => (
                        <button key={fare.id} className="fare-card" onClick={() => bookCity(fare.id)}>
                            <span className="fare-card-city">Tiranë <ArrowRight size={14} /> <strong>{fare.city}</strong></span>
                            <span className="fare-card-meta"><Clock3 size={13} /> {formatDuration(fare.durationMinutes)} · {fare.distanceKm} km</span>
                            <span className="fare-card-price">{money(fare.price)}</span>
                        </button>
                    ))}
                </div>
            </section>

            <section className="section container">
                <div className="section-heading">
                    <div>
                        <span className="eyebrow">Si funksionon</span>
                        <h2>Tre hapa. Asnjë komplikim.</h2>
                    </div>
                </div>
                <div className="steps">
                    {steps.map(({ icon: Icon, title, text }, index) => (
                        <article key={title} className="step card">
                            <span className="step-number">0{index + 1}</span>
                            <Icon size={22} />
                            <h3>{title}</h3>
                            <p className="muted">{text}</p>
                        </article>
                    ))}
                </div>
            </section>

            {claiming && <ClaimModal promo={claiming} onClose={() => setClaiming(null)} />}
        </main>
    )
}

export default Home
