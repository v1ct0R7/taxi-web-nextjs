import { CarTaxiFront, LogOut, Menu } from 'lucide-react'

const Navbar = ({ adminName, onLogout, onMenu }) => {
  return (
    <header className="admin-navbar">
      <button className="admin-menu-btn" onClick={onMenu} aria-label="Menuja"><Menu size={20} /></button>
      <div className="admin-brand"><span><CarTaxiFront size={17} /></span> Tirana <strong>Ride</strong> <small>ADMIN</small></div>
      <div className="admin-navbar-right">
        <span className="admin-live"><i /> LIVE</span>
        <span className="admin-name">{adminName}</span>
        <button className="btn btn-ghost btn-sm" onClick={onLogout}><LogOut size={15} /> Dil</button>
      </div>
    </header>
  )
}

export default Navbar
