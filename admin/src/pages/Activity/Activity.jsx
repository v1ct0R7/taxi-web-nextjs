import { useState } from 'react'
import { usePolling } from '../../utils/usePolling'
import { actionLabels, actorLabels, dateTime } from '../../utils/format'

const actorFilters = [["", "Të gjitha"], ["client", "Klientët"], ["driver", "Shoferët"], ["admin", "Admin"], ["system", "Sistemi"]]

const Activity = ({ url, token }) => {
  const [actorType, setActorType] = useState("")
  const query = actorType ? `?actorType=${actorType}` : ""
  const { data: logs } = usePolling(`${url}/api/admin/activity${query}`, token, { interval: 5000, fallback: "Aktiviteti nuk u ngarkua" })

  return (
    <div className="admin-page">
      <div className="admin-page-heading">
        <span className="eyebrow">Live · rifreskohet çdo 5 sekonda</span>
        <h1>Aktiviteti</h1>
        <p className="muted">Çdo veprim i klientëve, shoferëve dhe administratorëve, sipas radhës.</p>
      </div>
      <div className="toolbar">
        <div className="chip-group">
          {actorFilters.map(([value, label]) => <button key={value} className={`chip ${actorType === value ? 'active' : ''}`} onClick={() => setActorType(value)}>{label}</button>)}
        </div>
      </div>
      <div className="activity-list card">
        {logs?.map((log) => (
          <div key={log.id} className="activity-item">
            <span className={`activity-actor actor-${log.actorType}`}>{actorLabels[log.actorType]}</span>
            <div>
              <strong>{actionLabels[log.action] || log.action}{log.rideId ? <span className="muted"> · porosia #{log.rideId}</span> : null}</strong>
              {log.details && <p className="muted">{log.details}</p>}
            </div>
            <small className="muted">{dateTime(log.createdAt)}</small>
          </div>
        ))}
        {logs && logs.length === 0 && <p className="table-empty">Asnjë veprim ende.</p>}
      </div>
    </div>
  )
}

export default Activity
