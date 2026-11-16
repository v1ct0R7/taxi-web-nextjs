import { NavLink } from 'react-router'
import { Activity, BadgePercent, Car, LayoutDashboard, Route, Settings, Users } from 'lucide-react'

const links = [
  { to: "/", label: "Përmbledhje", icon: LayoutDashboard, end: true },
  { to: "/rides", label: "Porositë", icon: Car },
  { to: "/drivers", label: "Shoferët", icon: Users },
  { to: "/fares", label: "Tarifat e qyteteve", icon: Route },
  { to: "/promos", label: "Ofertat e kthimit", icon: BadgePercent },
  { to: "/activity", label: "Aktiviteti", icon: Activity },
  { to: "/settings", label: "Cilësimet", icon: Settings },
]

const Sidebar = ({ open, onNavigate }) => {
  return (
    <aside className={`admin-sidebar ${open ? 'open' : ''}`}>
      <p className="sidebar-label">MENAXHIMI</p>
      <nav className="sidebar-options">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className="sidebar-option" onClick={onNavigate}>
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
