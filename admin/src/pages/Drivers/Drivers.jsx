import { useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { KeyRound, UserPlus } from 'lucide-react'
import { usePolling } from '../../utils/usePolling'
import { dateTime, driverStatusLabels } from '../../utils/format'

const emptyForm = { name: "", phone: "", carModel: "", plateNumber: "", password: "" }
const statusTone = { available: "badge-success", busy: "badge-accent", offline: "" }

const Drivers = ({ url, token }) => {
  const [refresh, setRefresh] = useState(0)
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [passwordFor, setPasswordFor] = useState(null)
  const [newPassword, setNewPassword] = useState("")
  const { data: drivers } = usePolling(`${url}/api/driver/list`, token, { interval: 10000, refresh, fallback: "Shoferët nuk u ngarkuan" })

  const post = async (path, body, done) => {
    try {
      const response = await axios.post(`${url}/api/driver/${path}`, body, { headers: { token } })
      if (!response.data.success) throw new Error(response.data.message)
      toast.success(response.data.message)
      done?.()
      setRefresh((value) => value + 1)
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Veprimi nuk u krye")
    }
  }

  const addDriver = (event) => {
    event.preventDefault()
    post("add", form, () => { setForm(emptyForm); setShowForm(false) })
  }

  const change = (field) => (event) => setForm({ ...form, [field]: event.target.value })

  return (
    <div className="admin-page">
      <div className="admin-page-heading row">
        <div>
          <span className="eyebrow">Flota</span>
          <h1>Shoferët</h1>
          <p className="muted">Krijo llogaritë e shoferëve. Ata hyjnë në aplikacionin e shoferit me telefon dhe fjalëkalim.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm((open) => !open)}><UserPlus size={17} /> Shto shofer</button>
      </div>

      {showForm && (
        <form className="form-card card" onSubmit={addDriver}>
          <label className="field"><span>Emri i plotë</span><input className="input" value={form.name} onChange={change("name")} required maxLength={100} /></label>
          <label className="field"><span>Telefoni</span><input className="input" type="tel" value={form.phone} onChange={change("phone")} placeholder="069 123 4567" required /></label>
          <label className="field"><span>Makina</span><input className="input" value={form.carModel} onChange={change("carModel")} placeholder="Mercedes E-Class" required maxLength={80} /></label>
          <label className="field"><span>Targa</span><input className="input" value={form.plateNumber} onChange={change("plateNumber")} placeholder="AA 123 BB" required maxLength={20} /></label>
          <label className="field"><span>Fjalëkalimi (min. 6)</span><input className="input" type="text" value={form.password} onChange={change("password")} required minLength={6} autoComplete="new-password" /></label>
          <div className="form-actions"><button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Anulo</button><button className="btn btn-primary">Ruaj shoferin</button></div>
        </form>
      )}

      <div className="table-wrap card">
        <table className="data-table">
          <thead><tr><th>Shoferi</th><th>Telefoni</th><th>Makina</th><th>Statusi</th><th>Udhëtime</th><th>Aktiv së fundi</th><th>Llogaria</th><th></th></tr></thead>
          <tbody>
            {drivers?.map((driver) => (
              <tr key={driver.id} className={driver.active ? '' : 'row-muted'}>
                <td><strong>{driver.name}</strong></td>
                <td>{driver.phone}</td>
                <td>{driver.carModel} <span className="plate">{driver.plateNumber}</span></td>
                <td><span className={`badge ${statusTone[driver.status]}`}>{driverStatusLabels[driver.status]}</span></td>
                <td>{driver.completedRides}</td>
                <td className="muted">{driver.lastSeenAt ? dateTime(driver.lastSeenAt) : '—'}</td>
                <td>
                  <button className={`toggle ${driver.active ? 'on' : ''}`} onClick={() => post("update", { id: driver.id, active: !driver.active })} aria-label={driver.active ? 'Çaktivizo' : 'Aktivizo'}><span /></button>
                </td>
                <td>
                  {passwordFor === driver.id ? (
                    <form className="inline-form" onSubmit={(event) => { event.preventDefault(); post("update", { id: driver.id, password: newPassword }, () => { setPasswordFor(null); setNewPassword("") }) }}>
                      <input className="input input-sm" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="Fjalëkalim i ri" minLength={6} required autoFocus />
                      <button className="btn btn-primary btn-sm">Ruaj</button>
                    </form>
                  ) : (
                    <button className="btn btn-ghost btn-sm" onClick={() => { setPasswordFor(driver.id); setNewPassword("") }}><KeyRound size={14} /> Fjalëkalimi</button>
                  )}
                </td>
              </tr>
            ))}
            {drivers && drivers.length === 0 && <tr><td colSpan="8" className="table-empty">Ende pa shoferë. Shto shoferin e parë.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Drivers
