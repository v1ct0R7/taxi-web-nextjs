import { useContext, useState } from 'react'
import { StoreContext } from '../../context/storeContext'
import PromoBoard from '../../components/PromoBoard/PromoBoard'
import ClaimModal from '../../components/PromoBoard/ClaimModal'

const Offers = () => {
    const { promos } = useContext(StoreContext)
    const [claiming, setClaiming] = useState(null)

    return (
        <main className="container section">
            <div className="section-heading">
                <div>
                    <span className="eyebrow">Oferta kthimi · LIVE</span>
                    <h2>Taksi që kthehen drejt Tiranës.</h2>
                </div>
                <p>Këto taksi janë nisur nga Tirana drejt qyteteve të tjera. Nëse je në atë qytet dhe do të vish në Tiranë, rezervo kthimin me çmim të ulur.</p>
            </div>
            <PromoBoard promos={promos} onClaim={setClaiming} />
            {claiming && <ClaimModal promo={claiming} onClose={() => setClaiming(null)} />}
        </main>
    )
}

export default Offers
