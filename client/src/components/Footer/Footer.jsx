import { useContext } from 'react'
import { Link } from 'react-router-dom'
import { StoreContext } from '../../context/storeContext'
import './Footer.css'

const Footer = () => {
    const { settings } = useContext(StoreContext);
    return (
        <footer className="footer">
            <div className="container footer-inner">
                <div>
                    <p className="footer-brand">Tirana <strong>Ride</strong></p>
                    <p className="muted">Taksi brenda Tiranës dhe drejt çdo qyteti në Shqipëri. Çmim i qartë para se të nisesh.</p>
                </div>
                <div className="footer-links">
                    <Link to="/">Porosit taksi</Link>
                    <Link to="/offers">Ofertat e kthimit</Link>
                    {settings?.supportPhone && <a href={`tel:${settings.supportPhone.replace(/\s/g, "")}`}>{settings.supportPhone}</a>}
                </div>
            </div>
            <div className="container footer-bottom muted">© {new Date().getFullYear()} Tirana Ride. Të gjitha të drejtat të rezervuara.</div>
        </footer>
    )
}

export default Footer
