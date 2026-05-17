import { Link, useSearchParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { Check, User, Users } from 'lucide-react'
import {
  assignComplaintEngineerApi,
  closeComplaintApi,
  listAdminOpenComplaintsApi,
} from '../services/complaintService.js'
import { listEngineersApi } from '../services/engineerService.js'
import { getApiErrorMessage } from '../services/http.js'

export default function ManageComplaints() {
  const [searchParams] = useSearchParams()
  const assignableOnly = searchParams.get('assignable') === '1'

  const [items, setItems] = useState([])
  const [engineers, setEngineers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [assigningId, setAssigningId] = useState(null)
  const [assignModalComplaint, setAssignModalComplaint] = useState(null)
  const [pendingEngineerId, setPendingEngineerId] = useState(null)
  const [closeFor, setCloseFor] = useState(null)
  const [closeForm, setCloseForm] = useState({
    resolutionProofImage: '',
    sparesUsed: false,
    spareDetails: '',
    spareCost: '',
  })
  const [closing, setClosing] = useState(false)

  const engineerOptions = useMemo(() => (Array.isArray(engineers) ? engineers : []), [engineers])

  const visibleItems = useMemo(() => {
    if (!assignableOnly) return items
    return items.filter(
      (c) =>
        !c.engineerId && ['OPEN', 'REOPENED'].includes(String(c.status || '').toUpperCase()),
    )
  }, [items, assignableOnly])

  const load = async () => {
    setError(null)
    setLoading(true)
    try {
      const [cData, eData] = await Promise.all([listAdminOpenComplaintsApi(), listEngineersApi()])
      setItems(Array.isArray(cData) ? cData : [])
      setEngineers(Array.isArray(eData) ? eData : [])
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const onAssign = async (complaintId, engineerId) => {
    if (!engineerId) return
    setAssigningId(complaintId)
    setError(null)
    try {
      await assignComplaintEngineerApi(complaintId, Number(engineerId))
      setAssignModalComplaint(null)
      setPendingEngineerId(null)
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setAssigningId(null)
    }
  }

  const getSingleIconColor = (c) => {
    if (!c.engineerId) return '#dc2626' // red
    if (c.previousEngineerUsername) return '#ca8a04' // yellow (reassigned)
    return '#16a34a' // green
  }

  const openAssignModal = (c) => {
    setAssignModalComplaint(c)
    setPendingEngineerId(c.engineerId != null ? Number(c.engineerId) : null)
  }

  const closeAssignModal = () => {
    setAssignModalComplaint(null)
    setPendingEngineerId(null)
  }

  const confirmAssignFromModal = () => {
    if (!assignModalComplaint || pendingEngineerId == null) return
    onAssign(assignModalComplaint.id, pendingEngineerId)
  }

  const openClose = (c) => {
    setCloseFor(c)
    setCloseForm({
      resolutionProofImage: '',
      sparesUsed: false,
      spareDetails: '',
      spareCost: '',
    })
  }

  const submitClose = async (e) => {
    e.preventDefault()
    if (!closeFor) return
    setClosing(true)
    setError(null)
    try {
      await closeComplaintApi(closeFor.id, {
        resolutionProofImage: closeForm.resolutionProofImage.trim(),
        sparesUsed: closeForm.sparesUsed,
        spareDetails: closeForm.sparesUsed ? closeForm.spareDetails.trim() : null,
        spareCost: closeForm.sparesUsed ? Number(closeForm.spareCost) : null,
      })
      setCloseFor(null)
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setClosing(false)
    }
  }

  return (
    <div style={{ padding: '18px 0' }}>
      <div className="pageTitleRow" style={{ justifyContent: 'space-between', width: '100%' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', flexWrap: 'wrap' }}>
          <h1>{assignableOnly ? 'Assign queue' : 'Complaints'}</h1>
          <button onClick={load} disabled={loading}>
            Refresh
          </button>
        </div>
        <Link className="button" to="/admin/complaints/raise">
          Raise Complaint
        </Link>
      </div>

      {error ? (
        <div className="error" style={{ marginTop: 12 }}>
          {error}
        </div>
      ) : null}

      <div className="card" style={{ marginTop: 14 }}>
        <div className="cardHeader">
          <h2>{assignableOnly ? 'Needs engineer assignment' : 'Open / active complaints'}</h2>
          <span className="muted" style={{ fontSize: 13 }}>
            {assignableOnly ? `${visibleItems.length} of ${items.length} shown` : `${items.length} total`}
          </span>
        </div>

        {assignableOnly ? (
          <p className="muted" style={{ fontSize: 13, marginTop: 0, marginBottom: 12 }}>
            Showing OPEN / REOPENED complaints with no engineer assigned.{' '}
            <Link to="/admin/complaints/active">View all active</Link>
          </p>
        ) : null}

        {loading ? (
          <div className="muted">Loading…</div>
        ) : items.length === 0 ? (
          <div className="muted">No active complaints.</div>
        ) : visibleItems.length === 0 ? (
          <div className="muted">
            {assignableOnly
              ? 'No complaints need assignment right now.'
              : 'No rows to display.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Contract</th>
                  <th>Product</th>
                  <th>Status</th>
                  <th>SLA</th>
                  <th>Engineer</th>
                  <th>Raised</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((c) => (
                  <tr key={c.id}>
                    <td>{c.customerDisplayId ?? '—'}</td>
                    <td>
                      {c.customerName}
                    </td>
                    <td>
                      {c.contractType}
                    </td>
                    <td>{c.productType}</td>
                    <td>{c.status}</td>
                    <td>{c.sla}</td>
                    <td style={{ minWidth: 200 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <User size={18} color={getSingleIconColor(c)} aria-hidden />
                        <button
                          type="button"
                          title="Choose engineer"
                          aria-label="Choose engineer"
                          aria-expanded={assignModalComplaint?.id === c.id}
                          onClick={() =>
                            assignModalComplaint?.id === c.id ? closeAssignModal() : openAssignModal(c)
                          }
                          style={{
                            width: 40,
                            height: 40,
                            padding: 0,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 10,
                            border:
                              assignModalComplaint?.id === c.id
                                ? '2px solid #2563eb'
                                : '1px solid var(--border)',
                            background:
                              assignModalComplaint?.id === c.id ? 'rgba(37, 99, 235, 0.12)' : 'var(--card)',
                            color: assignModalComplaint?.id === c.id ? '#1d4ed8' : 'var(--text)',
                            cursor: 'pointer',
                          }}
                        >
                          <Users size={20} strokeWidth={2} />
                        </button>
                      </div>
                      {c.engineerUsername ? (
                        <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
                          Current: {c.engineerUsername}
                          {c.assignedAt ? ` @ ${String(c.assignedAt).replace('T', ' ')}` : ''}
                        </div>
                      ) : (
                        <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
                          Not assigned yet
                        </div>
                      )}
                      {c.previousEngineerUsername ? (
                        <div className="muted" style={{ marginTop: 4, fontSize: 12 }}>
                          Previous: {c.previousEngineerUsername}
                          {c.previousAssignedAt ? ` @ ${String(c.previousAssignedAt).replace('T', ' ')}` : ''}
                        </div>
                      ) : null}
                    </td>
                    <td className="muted" style={{ fontSize: 13 }}>
                      {c.raisedAt ? String(c.raisedAt).replace('T', ' ') : '-'}
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {c.status === 'ASSIGNED' || c.status === 'REOPENED' ? (
                        <button className="danger" type="button" onClick={() => openClose(c)}>
                          Close
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {assignModalComplaint ? (
        <div className="modalBackdrop" onMouseDown={closeAssignModal} role="presentation">
          <div
            className="modal"
            style={{ maxWidth: 420 }}
            onMouseDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="assign-engineer-title"
          >
            <div className="modalHeader">
              <h2 id="assign-engineer-title" style={{ margin: 0 }}>
                {assignModalComplaint.engineerId ? 'Engineer assignment' : 'Assign engineer'}
              </h2>
              <button type="button" className="secondary" onClick={closeAssignModal}>
                Close
              </button>
            </div>
            <p className="muted" style={{ marginTop: 0, fontSize: 13 }}>
              Select an engineer.{' '}
              {assignModalComplaint.engineerId
                ? 'Choosing someone else shows Reassign—confirm at the bottom.'
                : 'Confirm with Assign below.'}
            </p>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                maxHeight: 320,
                overflowY: 'auto',
                marginTop: 8,
              }}
            >
              {engineerOptions.map((en) => {
                const id = Number(en.id)
                const selected = pendingEngineerId === id
                const currentId =
                  assignModalComplaint.engineerId != null
                    ? Number(assignModalComplaint.engineerId)
                    : null
                const isCurrentOnServer = currentId != null && id === currentId
                const showReassignHint =
                  selected && currentId != null && id !== currentId

                return (
                  <button
                    key={en.id}
                    type="button"
                    onClick={() =>
                      setPendingEngineerId((prev) => (prev === id ? null : id))
                    }
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto auto',
                      gap: 10,
                      alignItems: 'center',
                      textAlign: 'left',
                      padding: '12px 14px',
                      borderRadius: 12,
                      border: selected ? '2px solid #2563eb' : '1px solid var(--border)',
                      background: selected ? 'rgba(37, 99, 235, 0.08)' : 'var(--card)',
                      cursor: 'pointer',
                      font: 'inherit',
                      color: 'var(--text)',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700 }}>{en.username}</div>
                      <div className="muted" style={{ fontSize: 12 }}>
                        {en.phone ?? '—'}
                      </div>
                    </div>
                    <div style={{ minWidth: 72, textAlign: 'right' }}>
                      {showReassignHint ? (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: 0.4,
                            color: '#b45309',
                          }}
                        >
                          Reassign
                        </span>
                      ) : isCurrentOnServer && selected ? (
                        <span className="muted" style={{ fontSize: 11, fontWeight: 700 }}>
                          Current
                        </span>
                      ) : isCurrentOnServer ? (
                        <span className="muted" style={{ fontSize: 11 }}>
                          Assigned
                        </span>
                      ) : null}
                    </div>
                    <div style={{ width: 24, display: 'flex', justifyContent: 'center' }}>
                      {selected ? (
                        <Check size={20} strokeWidth={2.5} color="#16a34a" aria-hidden />
                      ) : null}
                    </div>
                  </button>
                )
              })}
            </div>
            <div
              style={{
                display: 'flex',
                gap: 10,
                justifyContent: 'flex-end',
                marginTop: 16,
                flexWrap: 'wrap',
              }}
            >
              <button type="button" className="secondary" onClick={closeAssignModal}>
                Cancel
              </button>
              <button
                type="button"
                className="primary"
                disabled={
                  assigningId === assignModalComplaint.id ||
                  pendingEngineerId == null ||
                  (assignModalComplaint.engineerId != null &&
                    Number(assignModalComplaint.engineerId) === pendingEngineerId)
                }
                onClick={confirmAssignFromModal}
              >
                {assigningId === assignModalComplaint.id
                  ? 'Saving…'
                  : assignModalComplaint.engineerId &&
                      Number(assignModalComplaint.engineerId) !== pendingEngineerId
                    ? 'Confirm reassign'
                    : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {closeFor ? (
        <div
          className="modalBackdrop"
          onMouseDown={() => {
            if (closing) return
            setCloseFor(null)
          }}
        >
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h2>Close complaint</h2>
              <button className="danger" type="button" disabled={closing} onClick={() => setCloseFor(null)}>
                Close
              </button>
            </div>

            <div className="muted" style={{ fontSize: 13, marginBottom: 10 }}>
              Closing requires proof image URL/path. Complaint must be ASSIGNED or REOPENED.
            </div>

            <form onSubmit={submitClose}>
              <label className="label">Resolution proof (URL or path) *</label>
              <input
                value={closeForm.resolutionProofImage}
                onChange={(e) => setCloseForm((p) => ({ ...p, resolutionProofImage: e.target.value }))}
                required
              />

              <label className="label" style={{ marginTop: 12 }}>
                Spares used?
              </label>
              <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'center' }}>
                <label style={{ display: 'flex', gap: 10, alignItems: 'center', margin: 0, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="closeSparesUsed"
                    checked={!closeForm.sparesUsed}
                    onChange={() =>
                      setCloseForm((p) => ({
                        ...p,
                        sparesUsed: false,
                        spareDetails: '',
                        spareCost: '',
                      }))
                    }
                    style={{ width: 16, height: 16 }}
                  />
                  <span style={{ fontWeight: 650 }}>No</span>
                </label>
                <label style={{ display: 'flex', gap: 10, alignItems: 'center', margin: 0, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="closeSparesUsed"
                    checked={closeForm.sparesUsed}
                    onChange={() => setCloseForm((p) => ({ ...p, sparesUsed: true }))}
                    style={{ width: 16, height: 16 }}
                  />
                  <span style={{ fontWeight: 650 }}>Yes</span>
                </label>
              </div>

              {closeForm.sparesUsed ? (
                <>
                  <label className="label" style={{ marginTop: 12 }}>
                    Spare details *
                  </label>
                  <textarea
                    rows={3}
                    value={closeForm.spareDetails}
                    onChange={(e) => setCloseForm((p) => ({ ...p, spareDetails: e.target.value }))}
                    required
                  />

                  <label className="label" style={{ marginTop: 12 }}>
                    Spare cost *
                  </label>
                  <input
                    value={closeForm.spareCost}
                    onChange={(e) => setCloseForm((p) => ({ ...p, spareCost: e.target.value }))}
                    inputMode="decimal"
                    required
                  />
                </>
              ) : null}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 14 }}>
                <button className="primary" type="submit" disabled={closing}>
                  {closing ? 'Closing…' : 'Close complaint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
