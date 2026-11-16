import { useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { money } from '../../utils/format'

const Settings = ({ url, token }) => {
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    axios.get(`${url}/api/settings`, { headers: { token } })
      .then((response) => {
        if (!response.data.success) throw new Error(response.data.message)
        const { baseFare, perKm, minimumFare, promoWindowHours, supportPhone } = response.data.data
        if (active) setForm({ baseFare, perKm, minimumFare, promoWindowHours, supportPhone })
      })
      .catch((error) => toast.error(error.response?.data?.message || error.message || "Cilësimet nuk u ngarkuan"))
    return () => { active = false }
  }, [url, token])

  const save = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      const response = await axios.patch(`${url}/api/settings`, {
        baseFare: Number(form.baseFare), perKm: Number(form.perKm), minimumFare: Number(form.minimumFare),
        promoWindowHours: Number(form.promoWindowHours), supportPhone: form.supportPhone,
      }, { headers: { token } })
      if (!response.data.success) throw new Error(response.data.message)
      toast.success(response.data.message)
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Cilësimet nuk u ruajtën")
    } finally {
      setSaving(false)
    }
  }

  if (!form) return <div className="admin-page"><p className="muted">Po ngarkohet…</p></div>

  const change = (field) => (event) => setForm({ ...form, [field]: event.target.value })
  const example = Math.max(Number(form.minimumFare), Number(form.baseFare) + 5 * Number(form.perKm))

  return (
    <div className="admin-page">
      <div className="admin-page-heading">
        <span className="eyebrow">Konfigurimi</span>
        <h1>Cilësimet</h1>
        <p className="muted">Tarifat brenda Tiranës llogariten: nisja + km × çmimi për km (jo më pak se minimumi).</p>
      </div>
      <form className="settings-card card" onSubmit={save}>
        <label className="field"><span>Tarifa e nisjes (€)</span><input className="input" type="number" min="0" step="0.1" value={form.baseFare} onChange={change("baseFare")} required /></label>
        <label className="field"><span>Çmimi për km (€)</span><input className="input" type="number" min="0" step="0.05" value={form.perKm} onChange={change("perKm")} required /></label>
        <label className="field"><span>Udhëtimi minimal (€)</span><input className="input" type="number" min="0" step="0.5" value={form.minimumFare} onChange={change("minimumFare")} required /></label>
        <label className="field"><span>Vlefshmëria e ofertës së kthimit (orë pas mbërritjes)</span><input className="input" type="number" min="1" max="48" step="1" value={form.promoWindowHours} onChange={change("promoWindowHours")} required /></label>
        <label className="field"><span>Telefoni i shërbimit</span><input className="input" value={form.supportPhone} onChange={change("supportPhone")} required /></label>
        <p className="settings-example muted">Shembull: udhëtim 5 km brenda Tiranës = <strong>{money(example)}</strong></p>
        <button className="btn btn-primary" disabled={saving}>{saving ? "Po ruhet…" : "Ruaj cilësimet"}</button>
      </form>
    </div>
  )
}

export default Settings
