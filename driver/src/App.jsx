import { useCallback, useEffect, useState } from 'react'
import { Navigate, NavLink, Route, Routes } from 'react-router'
import axios from 'axios'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { CarTaxiFront, History as HistoryIcon, Inbox, LogOut } from 'lucide-react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import History from './pages/History'
import './driver.css'

const url = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const readDriver = () => {
  try {
    return JSON.parse(localStorage.getItem('driverProfile') || 'null')
  } catch {
    return null
  }
}

const App = () => {
  const [token, setToken] = useState(() => localStorage.getItem('driverToken') || '')
  const [driver, setDriver] = useState(readDriver)

  const logout = useCallback(() => {
    localStorage.removeItem('driverToken')
    localStorage.removeItem('driverProfile')
    setToken('')
    setDriver(null)
  }, [])

  const updateDriver = useCallback((profile) => {
    localStorage.setItem('driverProfile', JSON.stringify(profile))
    setDriver(profile)
  }, [])

  // Çdo 401/403 nga API → dil nga llogaria
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(undefined, (error) => {
      if (token && [401, 403].includes(error.response?.status) && error.config?.url?.startsWith(`${url}/api/driver`) && !error.config.url.endsWith('/login')) {
        toast.error(error.response.data?.message || 'Sesioni skadoi')
        logout()
      }
      return Promise.reject(error)
    })
    return () => axios.interceptors.response.eject(interceptor)
  }, [token, logout])

  const login = (authToken, profile) => {
    localStorage.setItem('driverToken', authToken)
    updateDriver(profile)
    setToken(authToken)
  }

  return (
    <>
      <ToastContainer position="top-center" theme="dark" autoClose={2500} />
      {!token ? <Login url={url} onLogin={login} /> : (
        <div className="driver-app">
          <header className="driver-top">
            <div className="driver-brand"><span><CarTaxiFront size={17} /></span> Shoferi</div>
            <div className="driver-top-info">
              <strong>{driver?.name}</strong>
              <small>{driver?.plateNumber}</small>
            </div>
            <button className="driver-icon-btn" onClick={logout} aria-label="Dil"><LogOut size={18} /></button>
          </header>
          <main className="driver-main">
            <Routes>
              <Route path="/" element={<Dashboard url={url} token={token} driver={driver} onDriverChange={updateDriver} />} />
              <Route path="/history" element={<History url={url} token={token} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <nav className="driver-tabs">
            <NavLink to="/" end><Inbox size={20} /><span>Kërkesat</span></NavLink>
            <NavLink to="/history"><HistoryIcon size={20} /><span>Historiku</span></NavLink>
          </nav>
        </div>
      )}
    </>
  )
}

export default App
