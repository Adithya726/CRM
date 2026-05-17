import { useEffect, useState } from 'react'
import AdminDashboardCharts from '../components/AdminDashboardCharts.jsx'
import { listAdminClosedComplaintsApi, listAdminOpenComplaintsApi } from '../services/complaintService.js'
import { listAdminContractsApi } from '../services/contractService.js'
import { listAdminCustomersApi } from '../services/customerService.js'
import { getApiErrorMessage } from '../services/http.js'

const POLL_MS = 30_000

export default function AdminHome() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pollError, setPollError] = useState(null)
  const [customers, setCustomers] = useState([])
  const [contracts, setContracts] = useState([])
  const [openComplaints, setOpenComplaints] = useState([])
  const [closedComplaints, setClosedComplaints] = useState([])
  const [lastUpdated, setLastUpdated] = useState(null)

  useEffect(() => {
    let cancelled = false

    const load = async (isPoll) => {
      if (!isPoll) setLoading(true)
      if (!isPoll) setError(null)
      try {
        const [cCust, cCont, cOpen, cClosed] = await Promise.all([
          listAdminCustomersApi(),
          listAdminContractsApi(),
          listAdminOpenComplaintsApi(),
          listAdminClosedComplaintsApi(),
        ])
        if (cancelled) return
        setCustomers(Array.isArray(cCust) ? cCust : [])
        setContracts(Array.isArray(cCont) ? cCont : [])
        setOpenComplaints(Array.isArray(cOpen) ? cOpen : [])
        setClosedComplaints(Array.isArray(cClosed) ? cClosed : [])
        setLastUpdated(new Date())
        setPollError(null)
      } catch (err) {
        if (cancelled) return
        if (isPoll) setPollError(getApiErrorMessage(err))
        else setError(getApiErrorMessage(err))
      } finally {
        if (!cancelled && !isPoll) setLoading(false)
      }
    }

    load(false)
    const interval = setInterval(() => load(true), POLL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  return (
    <div className="adminDashboardPage">
      <div className="dashboardLiveBar">
        <span className="dashboardLiveDot" aria-hidden />
        <span className="muted" style={{ fontSize: 13 }}>
          Live data · refresh every {POLL_MS / 1000}s
          {lastUpdated
            ? ` · last updated ${lastUpdated.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
            : ''}
        </span>
        {pollError ? (
          <span className="dashboardPollWarn" title={pollError}>
            Refresh failed — showing last data
          </span>
        ) : null}
      </div>
      <AdminDashboardCharts
        customers={customers}
        contracts={contracts}
        openComplaints={openComplaints}
        closedComplaints={closedComplaints}
        loading={loading}
        error={error}
      />
    </div>
  )
}
