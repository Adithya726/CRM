import { FileText, Gauge, MessageSquare, Package, User } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listAdminCustomersApi } from '../services/customerService.js'
import {
  listAdminActiveContractsByCustomerApi,
  listAdminContractsByCustomerApi,
} from '../services/contractService.js'
import { raiseComplaintApi } from '../services/complaintService.js'
import { getApiErrorMessage } from '../services/http.js'

/**
 * Shared raise-complaint form for Admin and Operator.
 * @param {{ redirectTo: string }} props
 */
export default function RaiseComplaint({ redirectTo }) {
  const navigate = useNavigate()

  const [allCustomers, setAllCustomers] = useState([])
  const [loadingCustomers, setLoadingCustomers] = useState(true)

  const [q, setQ] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [customerId, setCustomerId] = useState(null)
  const [customerLabel, setCustomerLabel] = useState('')
  const [customerDisplayId, setCustomerDisplayId] = useState('')

  const [contracts, setContracts] = useState([])
  const [contractId, setContractId] = useState('')
  const [selectedContract, setSelectedContract] = useState(null)

  const [productTypes, setProductTypes] = useState([])
  const [description, setDescription] = useState('')

  const [loadingContracts, setLoadingContracts] = useState(false)
  const [contractEmptyHint, setContractEmptyHint] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoadingCustomers(true)
      setError(null)
      try {
        const data = await listAdminCustomersApi()
        if (!cancelled) setAllCustomers(Array.isArray(data) ? data : [])
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err))
      } finally {
        if (!cancelled) setLoadingCustomers(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const term = q.trim().toLowerCase()
    if (term.length < 2) {
      setSuggestions([])
      return
    }
    const t = setTimeout(() => {
      const hits = allCustomers
        .filter((c) => c.name && String(c.name).toLowerCase().includes(term))
        .slice(0, 20)
      setSuggestions(hits)
    }, 250)
    return () => clearTimeout(t)
  }, [q, allCustomers])

  const pickCustomer = async (c) => {
    setCustomerId(c.id)
    setCustomerLabel(`${c.name}`)
    setCustomerDisplayId(c.displayId ?? '')
    setQ(c.name)
    setSuggestions([])
    setContractId('')
    setSelectedContract(null)
    setProductTypes([])
    setSuccess(null)
    setContractEmptyHint(null)

    setLoadingContracts(true)
    setError(null)
    try {
      // Same "active" rule as the backend (server date, inclusive periodFrom..periodTo)
      const active = await listAdminActiveContractsByCustomerApi(c.id)
      const activeList = Array.isArray(active) ? active : []
      setContracts(activeList)

      if (activeList.length === 0) {
        const all = await listAdminContractsByCustomerApi(c.id)
        const allList = Array.isArray(all) ? all : []
        if (allList.length > 0) {
          setContractEmptyHint(
            `This customer has ${allList.length} contract(s), but none are active today on the server calendar. ` +
              'The current date must fall on or after Period from and on or before Period to. ' +
              'If the period has not started yet, wait until the start date or adjust the contract in Contracts.',
          )
        }
      }
    } catch (err) {
      setError(getApiErrorMessage(err))
      setContracts([])
    } finally {
      setLoadingContracts(false)
    }
  }

  useEffect(() => {
    const c = contracts.find((x) => String(x.id) === String(contractId)) || null
    setSelectedContract(c)
    setProductTypes([])
  }, [contractId, contracts])

  const productOptions = useMemo(() => {
    const pts = selectedContract?.productTypes
    return Array.isArray(pts) ? pts : []
  }, [selectedContract])

  const canSubmit = Boolean(customerId && contractId && productTypes.length > 0 && description.trim())

  const lbl = (Icon, node) => (
    <label className="label labelWithIcon">
      <Icon size={17} strokeWidth={1.7} aria-hidden />
      <span>{node}</span>
    </label>
  )

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSubmitting(true)
    try {
      await Promise.all(
        productTypes.map((p) =>
          raiseComplaintApi({
            customerId,
            contractId: Number(contractId),
            productType: p,
            description: description.trim(),
          }),
        ),
      )
      setSuccess(
        productTypes.length === 1
          ? 'Complaint submitted successfully.'
          : `${productTypes.length} complaints submitted successfully.`,
      )
      setTimeout(() => navigate(redirectTo, { replace: true }), 700)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ padding: '18px 16px', boxSizing: 'border-box', maxWidth: '100%' }}>
      <div className="pageTitleRow" style={{ justifyContent: 'center' }}>
        <h1 style={{ margin: 0 }}>Raise complaint</h1>
      </div>

      <form
        className="card"
        onSubmit={onSubmit}
        style={{
          marginTop: 14,
          maxWidth: 720,
          width: '100%',
          marginLeft: 'auto',
          marginRight: 'auto',
          boxSizing: 'border-box',
        }}
      >
        <div className="cardHeader">
          <h2>New complaint</h2>
          <span className="muted" style={{ fontSize: 13 }}>
            {loadingCustomers ? 'Loading customers…' : `${allCustomers.length} customers loaded`}
          </span>
        </div>

        {lbl(User, 'Customer *')}
        <div className="typeaheadWrap">
          <input
            value={q}
            readOnly={Boolean(customerId)}
            onChange={(e) => {
              setQ(e.target.value)
              setCustomerId(null)
              setCustomerLabel('')
              setCustomerDisplayId('')
              setContracts([])
              setContractId('')
              setSelectedContract(null)
              setProductTypes([])
              setContractEmptyHint(null)
            }}
            placeholder="Type customer name (min 2 characters)…"
            autoComplete="off"
          />
          {suggestions.length > 0 && !customerId ? (
            <div className="typeaheadMenu" role="listbox">
              {suggestions.map((c) => (
                <div key={c.id} className="typeaheadItem" onClick={() => pickCustomer(c)} role="option">
                  <div style={{ fontWeight: 700 }}>{c.name}</div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {c.displayId ?? '—'}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
        {customerId ? (
          <div className="muted" style={{ marginTop: 8, fontSize: 13 }}>
            Selected: <b>{customerLabel}</b>
          </div>
        ) : null}
        {customerId ? (
          <>
            <label className="label labelWithIcon" style={{ marginTop: 10 }}>
              <User size={17} strokeWidth={1.7} aria-hidden />
              <span>Customer ID</span>
            </label>
            <input value={customerDisplayId || '—'} readOnly />
          </>
        ) : null}

        {lbl(FileText, 'Contract *')}
        <select
          value={contractId}
          onChange={(e) => setContractId(e.target.value)}
          disabled={!customerId || loadingContracts}
          required
        >
          <option value="">
            {customerId ? (loadingContracts ? 'Loading…' : 'Select contract…') : 'Select a customer first'}
          </option>
          {contracts.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.contractType} ({c.periodFrom ?? '?'} → {c.periodTo ?? '?'}) [{(c.productTypes || []).join(', ')}]
            </option>
          ))}
        </select>
        {customerId && !loadingContracts && contracts.length === 0 ? (
          <div className="muted" style={{ marginTop: 8, maxWidth: 560, lineHeight: 1.45 }}>
            {contractEmptyHint ??
              'No active contracts for this customer. Period from and period to must both be set, and today’s date (server) must fall within that range.'}
          </div>
        ) : null}

        <div style={{ marginTop: 14 }}>{lbl(Gauge, 'SLA (from contract)')}</div>
        <input value={selectedContract?.sla ?? ''} readOnly placeholder="Select a contract" />

        <div style={{ marginTop: 14 }}>{lbl(Package, 'Product type *')}</div>
        <div className="card subtle" style={{ padding: 12 }}>
          {!selectedContract ? (
            <div className="muted">Select a contract to load product types.</div>
          ) : productOptions.length === 0 ? (
            <div className="muted">This contract has no product types configured.</div>
          ) : (
            <div className="grid-2">
              {productOptions.map((p) => (
                <label key={p} style={{ display: 'flex', gap: 10, alignItems: 'center', margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={productTypes.includes(p)}
                    onChange={() =>
                      setProductTypes((prev) =>
                        prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
                      )
                    }
                    style={{ width: 16, height: 16 }}
                  />
                  <span style={{ fontWeight: 650 }}>{p}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: 14 }}>{lbl(MessageSquare, 'Description *')}</div>
        <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} required />

        {error ? (
          <div className="error" style={{ marginTop: 12 }}>
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="success" style={{ marginTop: 12 }}>
            {success}
          </div>
        ) : null}

        <div style={{ marginTop: 16 }}>
          <button className="primary" type="submit" disabled={!canSubmit || submitting}>
            {submitting ? 'Submitting…' : 'Submit complaint'}
          </button>
        </div>
      </form>
    </div>
  )
}
