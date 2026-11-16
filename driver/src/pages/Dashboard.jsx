import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { Inbox, Power } from 'lucide-react'
import RequestCard from '../components/RequestCard'
import CurrentRide from '../components/CurrentRide'
import { beep } from '../utils/beep'

const Dashboard = ({ url, token, driver, onDriverChange }) => {
  const [current, setCurrent] = useState(null)
  const [requests, setRequests] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const [busyAction, setBusyAction] = useState('')
  const knownRequests = useRef(null)

  const status = driver?.status || 'offline'

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const headers = { headers: { token } }
        const [currentResponse, requestsResponse] = await Promise.all([
          axios.get(`${url}/api/driver/current`, headers),
          axios.get(`${url}/api/driver/requests`, headers),
        ])
        if (!active) return
        if (!currentResponse.data.success) throw new Error(currentResponse.data.message)
        setCurrent(currentResponse.data.data)
        onDriverChange(currentResponse.data.driver)
        const list = requestsResponse.data.data || []
        const ids = new Set(list.map((ride) => ride.id))
        if (knownRequests.current && list.some((ride) => !knownRequests.current.has(ride.id))) {
          beep()
          toast.info('Kërkesë e re')
        }
        knownRequests.current = ids
        setRequests(list)
      } catch (error) {
        if (active && ![401, 403].includes(error.response?.status)) toast.error(error.response?.data?.message || 'Nuk ka lidhje me serverin', { toastId: 'connection' })
      } finally {
        if (active) setLoaded(true)
      }
    }
    load()
    const timer = setInterval(load, 4000)
    return () => { active = false; clearInterval(timer) }
  }, [url, token, onDriverChange, refresh])

  const act = async (action, rideId, extra = {}) => {
    setBusyAction(`${action}-${rideId}`)
    try {
      const response = await axios.post(`${url}/api/driver/${action}`, { rideId, ...extra }, { headers: { token } })
      if (!response.data.success) throw new Error(response.data.message)
      toast.success(response.data.message)
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Veprimi nuk u krye')
    } finally {
      setBusyAction('')
      setRefresh((value) => value + 1)
    }
  }

  const toggleStatus = async () => {
    const next = status === 'available' ? 'offline' : 'available'
    setBusyAction('status')
    try {
      const response = await axios.post(`${url}/api/driver/status`, { status: next }, { headers: { token } })
      if (!response.data.success) throw new Error(response.data.message)
      onDriverChange(response.data.data)
      toast.success(response.data.message)
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Statusi nuk u ndryshua')
    } finally {
      setBusyAction('')
      setRefresh((value) => value + 1)
    }
  }

  const statusText = { available: 'Në dispozicion', busy: 'Në udhëtim', offline: 'Jashtë linje' }

  return (
    <div className="dashboard">
      <section className={`status-card card status-${status}`}>
        <div>
          <span className="status-label">Statusi</span>
          <strong>{statusText[status]}</strong>
          <small className="muted">
            {status === 'available' && 'Po merr kërkesa të reja'}
            {status === 'offline' && 'Nuk merr kërkesa. Aktivizohu për të punuar'}
            {status === 'busy' && 'Përfundo udhëtimin për të marrë të tjera'}
          </small>
        </div>
        <button
          className={`status-switch ${status === 'available' ? 'on' : ''}`}
          onClick={toggleStatus}
          disabled={status === 'busy' || busyAction === 'status'}
          aria-label={status === 'available' ? 'Kalo jashtë linje' : 'Kalo në dispozicion'}
        >
          <span><Power size={16} /></span>
        </button>
      </section>

      {current && <CurrentRide ride={current} busyAction={busyAction} onAction={act} />}

      <section>
        <div className="section-row">
          <h2>Kërkesat</h2>
          <span className="badge">{requests.length}</span>
        </div>
        {!loaded && <p className="muted">Po ngarkohen…</p>}
        {loaded && requests.length === 0 && (
          <div className="empty card">
            <Inbox size={26} />
            <strong>{status === 'available' ? 'Asnjë kërkesë për momentin' : 'Je jashtë linje'}</strong>
            <p className="muted">{status === 'available' ? 'Kërkesat e reja shfaqen këtu automatikisht, me tingull.' : 'Kalo "Në dispozicion" për të parë kërkesat e klientëve.'}</p>
          </div>
        )}
        <div className="request-list">
          {requests.map((ride) => (
            <RequestCard
              key={ride.id}
              ride={ride}
              canAccept={status === 'available' && !current}
              busyAction={busyAction}
              onAccept={() => act('accept', ride.id)}
              onDecline={() => act('decline', ride.id)}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

export default Dashboard
