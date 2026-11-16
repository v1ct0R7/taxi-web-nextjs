import { useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { CarTaxiFront, Lock, Phone } from 'lucide-react'

const Login = ({ url, onLogin }) => {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      const response = await axios.post(`${url}/api/driver/login`, { phone, password })
      if (!response.data.success) throw new Error(response.data.message)
      onLogin(response.data.token, response.data.data)
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Nuk mund të hysh')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="driver-login">
      <form className="driver-login-card card" onSubmit={submit}>
        <span className="driver-login-mark"><CarTaxiFront size={24} /></span>
        <span className="eyebrow">Tirana Ride · Shoferi</span>
        <h1>Mirë se erdhe.</h1>
        <p className="muted">Hyr me numrin e telefonit dhe fjalëkalimin që të ka dhënë administratori.</p>
        <label className="field">
          <span>Numri i telefonit</span>
          <div className="input-icon"><Phone size={17} /><input className="input" type="tel" inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="069 123 4567" required autoComplete="username" /></div>
        </label>
        <label className="field">
          <span>Fjalëkalimi</span>
          <div className="input-icon"><Lock size={17} /><input className="input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" /></div>
        </label>
        <button className="btn btn-primary btn-block" disabled={submitting}>{submitting ? 'Po hyn…' : 'Hyr'}</button>
      </form>
    </main>
  )
}

export default Login
