import { useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { Plus } from 'lucide-react'
import { usePolling } from '../../utils/usePolling'
import { formatDuration, money } from '../../utils/format'

const emptyRoute = { city: "", price: "", returnPrice: "", durationMinutes: "", distanceKm: "" }

const toPayload = (route) => ({
  ...route,
  price: Number(route.price),
  returnPrice: Number(route.returnPrice),
  durationMinutes: Number(route.durationMinutes),
  distanceKm: Number(route.distanceKm),
})

const Fares = ({ url, token }) => {
  const [refresh, setRefresh] = useState(0)
  const [editing, setEditing] = useState(null)
  const [draft, setDraft] = useState(emptyRoute)
  const [adding, setAdding] = useState(false)
  const [newRoute, setNewRoute] = useState(emptyRoute)
  const { data: fares } = usePolling(`${url}/api/fare/all`, token, { interval: 0, refresh, fallback: "Tarifat nuk u ngarkuan" })

  const post = async (path, body, done) => {
    try {
      const response = await axios.post(`${url}/api/fare/${path}`, body, { headers: { token } })
      if (!response.data.success) throw new Error(response.data.message)
      toast.success(response.data.message)
      done?.()
      setRefresh((value) => value + 1)
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Tarifa nuk u ruajt")
    }
  }

  const startEdit = (fare) => {
    setEditing(fare.id)
    setDraft({ city: fare.city, price: fare.price, returnPrice: fare.returnPrice, durationMinutes: fare.durationMinutes, distanceKm: fare.distanceKm })
  }

  const field = (state, setState, name, props = {}) => (
    <input className="input input-sm" value={state[name]} onChange={(event) => setState({ ...state, [name]: event.target.value })} required {...props} />
  )

  return (
    <div className="admin-page">
      <div className="admin-page-heading row">
        <div>
          <span className="eyebrow">Jashtë Tiranës</span>
          <h1>Tarifat e qyteteve</h1>
          <p className="muted">Çmime fikse nga Tirana. "Kthimi" është çmimi i ofertës kur taksia kthehet drejt Tiranës.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setAdding((open) => !open)}><Plus size={17} /> Shto qytet</button>
      </div>

      {adding && (
        <form className="form-card card" onSubmit={(event) => { event.preventDefault(); post("add", toPayload(newRoute), () => { setNewRoute(emptyRoute); setAdding(false) }) }}>
          <label className="field"><span>Qyteti</span>{field(newRoute, setNewRoute, "city", { maxLength: 80 })}</label>
          <label className="field"><span>Çmimi (€)</span>{field(newRoute, setNewRoute, "price", { type: "number", min: 1, step: "0.5" })}</label>
          <label className="field"><span>Çmimi i kthimit (€)</span>{field(newRoute, setNewRoute, "returnPrice", { type: "number", min: 1, step: "0.5" })}</label>
          <label className="field"><span>Kohëzgjatja (min)</span>{field(newRoute, setNewRoute, "durationMinutes", { type: "number", min: 5, step: 1 })}</label>
          <label className="field"><span>Distanca (km)</span>{field(newRoute, setNewRoute, "distanceKm", { type: "number", min: 0, step: 1 })}</label>
          <div className="form-actions"><button type="button" className="btn btn-ghost" onClick={() => setAdding(false)}>Anulo</button><button className="btn btn-primary">Ruaj</button></div>
        </form>
      )}

      <div className="table-wrap card">
        <table className="data-table">
          <thead><tr><th>Tiranë →</th><th>Çmimi</th><th>Kthimi (ofertë)</th><th>Zbritja</th><th>Kohëzgjatja</th><th>Km</th><th>Aktive</th><th></th></tr></thead>
          <tbody>
            {fares?.map((fare) => editing === fare.id ? (
              <tr key={fare.id} className="row-editing">
                <td>{field(draft, setDraft, "city", { maxLength: 80 })}</td>
                <td>{field(draft, setDraft, "price", { type: "number", min: 1, step: "0.5" })}</td>
                <td>{field(draft, setDraft, "returnPrice", { type: "number", min: 1, step: "0.5" })}</td>
                <td></td>
                <td>{field(draft, setDraft, "durationMinutes", { type: "number", min: 5 })}</td>
                <td>{field(draft, setDraft, "distanceKm", { type: "number", min: 0 })}</td>
                <td></td>
                <td className="cell-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditing(null)}>Anulo</button>
                  <button className="btn btn-primary btn-sm" onClick={() => post("update", { id: fare.id, ...toPayload(draft) }, () => setEditing(null))}>Ruaj</button>
                </td>
              </tr>
            ) : (
              <tr key={fare.id} className={fare.active ? '' : 'row-muted'}>
                <td><strong>{fare.city}</strong></td>
                <td>{money(fare.price)}</td>
                <td className="text-accent">{money(fare.returnPrice)}</td>
                <td className="muted">-{Math.round((1 - fare.returnPrice / fare.price) * 100)}%</td>
                <td>{formatDuration(fare.durationMinutes)}</td>
                <td>{fare.distanceKm}</td>
                <td><button className={`toggle ${fare.active ? 'on' : ''}`} onClick={() => post("update", { id: fare.id, active: !fare.active })} aria-label="Aktive"><span /></button></td>
                <td className="cell-actions"><button className="btn btn-ghost btn-sm" onClick={() => startEdit(fare)}>Ndrysho</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Fares
