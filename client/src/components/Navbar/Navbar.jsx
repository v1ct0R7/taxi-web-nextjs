import { useContext } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { CarTaxiFront, Phone, Route } from 'lucide-react'
import { StoreContext } from '../../context/storeContext'
import './Navbar.css'

const Navbar = () => {
    const { activeRide, promos, settings } = useContext(StoreContext);

    return (
        <header className="navbar">
            <div className="container navbar-inner">
                <Link to="/" className="brand" aria-label="Tirana Ride — kryefaqja">
                    <span className="brand-mark"><CarTaxiFront size={18} /></span>
                    <span>Tirana <strong>Ride</strong></span>
                </Link>
                <nav className="navbar-links" aria-label="Navigimi kryesor">
                    <NavLink to="/" end>Porosit</NavLink>
                    <NavLink to="/offers">
                        Ofertat<span className="navbar-long"> e kthimit</span>
                        {promos.length > 0 && <span className="navbar-count">{promos.length}</span>}
                    </NavLink>
                </nav>
                <div className="navbar-actions">
                    {activeRide && (
                        <Link to="/ride" className="navbar-ride">
                            <Route size={16} /> <span>Porosia ime</span>
                        </Link>
                    )}
                    {settings?.supportPhone && (
                        <a className="navbar-call" href={`tel:${settings.supportPhone.replace(/\s/g, "")}`} aria-label="Telefono">
                            <Phone size={16} /> <span>{settings.supportPhone}</span>
                        </a>
                    )}
                </div>
            </div>
        </header>
    )
}

export default Navbar
