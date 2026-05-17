import {
  Building2,
  Calculator,
  CalendarRange,
  Check,
  CreditCard,
  FileText,
  Fingerprint,
  Hash,
  IndianRupee,
  Layers,
  Package,
  User,
  Wrench,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  createContractApi,
  deleteContractApi,
  listAdminContractsApi,
  updateContractApi,
} from '../services/contractService.js'
import { listAdminCustomersApi } from '../services/customerService.js'
import { getApiErrorMessage } from '../services/http.js'
import { exportContractsListAsExcelCsv } from '../utils/customerContractExport.js'
import { contractPeriodStatus } from '../utils/contractPeriodStatus.js'

const PAGE_SIZE = 10
const iconSize = 18
const iconStroke = 1.65
const BASE_PRODUCT_TYPES = ['CCTV', 'ACS', 'FAS', 'PAS', 'FFS']

function toNumOrNull(v) {
  const s = String(v ?? '').trim()
  if (!s) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

/** Match ContractServiceImpl rounding (2 dp). */
function roundMoney2(n) {
  return Math.round(Number(n) * 100) / 100
}

function formatMoneyPreview(n) {
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatListCell(v) {
  if (v == null) return '—'
  if (Array.isArray(v)) return v.length ? v.join(', ') : '—'
  if (typeof v === 'number' && Number.isFinite(v)) {
    return String(v)
  }
  const s = String(v).trim()
  return s || '—'
}

function formatMoneyCell(v) {
  if (v == null || v === '' || Number.isNaN(Number(v))) return '—'
  return Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const emptyForm = {
  customerId: '',
  contractType: 'AMC',
  sla: '0-4 hrs',
  pmFrequency: '',
  periodFrom: '',
  periodTo: '',
  pcbText: '',
  productTypes: [],
  paymentTerm: 'Advance',
  paymentSide: 'Quarterly',
  poNumber: '',
  poBasicValue: '',
  taxPercent: '',
  sparesProvisionPercent: '',
}

export default function ManageContracts() {
  const [items, setItems] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [tab, setTab] = useState('add')

  const [customerQuery, setCustomerQuery] = useState('')
  const [customerMenuOpen, setCustomerMenuOpen] = useState(false)
  const [customerDisplayName, setCustomerDisplayName] = useState('')
  const [selectedCustomerDisplayId, setSelectedCustomerDisplayId] = useState('')

  const [listSearch, setListSearch] = useState('')
  const [page, setPage] = useState(1)
  const [detailContract, setDetailContract] = useState(null)
  const [notice, setNotice] = useState(null)
  const [showOtherProductInput, setShowOtherProductInput] = useState(false)
  const [otherProductInput, setOtherProductInput] = useState('')
  const otherProductInputRef = useRef(null)

  const isNcamc = form.contractType === 'NCAMC'
  const isAmcLike = form.contractType === 'AMC' || form.contractType === 'NCAMC'
  const isPcbLike = form.contractType === 'PCB' || form.contractType === 'Others'
  const showPeriod = form.contractType !== 'NCAMC'
  const customProductTypes = useMemo(
    () => form.productTypes.filter((p) => !BASE_PRODUCT_TYPES.includes(p)),
    [form.productTypes],
  )

  const canSubmit = useMemo(() => {
    return Boolean(form.customerId && form.contractType)
  }, [form.customerId, form.contractType])

  const showNotice = (type, message) => {
    setNotice({ type, message })
    window.setTimeout(() => setNotice(null), 1700)
  }

  const customerSuggestions = useMemo(() => {
    const q = customerQuery.trim().toLowerCase()
    if (q.length < 2) return []
    return customers
      .filter((c) => c.name && String(c.name).toLowerCase().includes(q))
      .slice(0, 20)
  }, [customerQuery, customers])

  const liveDerived = useMemo(() => {
    const basic = toNumOrNull(form.poBasicValue) ?? 0
    const taxPct = toNumOrNull(form.taxPercent) ?? 0
    const sparesPct = isNcamc ? 0 : toNumOrNull(form.sparesProvisionPercent) ?? 0
    const taxVal = roundMoney2((basic * taxPct) / 100)
    const totalPo = roundMoney2(basic + taxVal)
    const sparesVal = roundMoney2((basic * sparesPct) / 100)
    return { taxVal, totalPo, sparesVal, sparesPct }
  }, [form.poBasicValue, form.taxPercent, form.sparesProvisionPercent, isNcamc])

  const load = async () => {
    setError(null)
    setLoading(true)
    try {
      const [contractsData, customersData] = await Promise.all([
        listAdminContractsApi(),
        listAdminCustomersApi(),
      ])
      setItems(Array.isArray(contractsData) ? contractsData : [])
      setCustomers(Array.isArray(customersData) ? customersData : [])
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    setForm((p) => ({
      ...p,
      pmFrequency: isAmcLike ? p.pmFrequency : '',
      pcbText: isPcbLike ? p.pcbText : '',
    }))
  }, [isAmcLike, isPcbLike])

  useEffect(() => {
    if (isNcamc) {
      setForm((p) => ({
        ...p,
        periodFrom: '',
        periodTo: '',
        sparesProvisionPercent: '0',
      }))
    }
  }, [isNcamc])

  const isClosedContract = (c) => {
    const st = contractPeriodStatus(c)
    return Boolean(c.closed) || st.tone === 'closed'
  }

  const openItems = useMemo(() => items.filter((c) => !isClosedContract(c)), [items])
  const closedItems = useMemo(() => items.filter((c) => isClosedContract(c)), [items])

  const filteredOpenList = useMemo(() => {
    const q = listSearch.trim().toLowerCase()
    if (!q) return openItems
    return openItems.filter(
      (c) =>
        (c.customerName && String(c.customerName).toLowerCase().includes(q)) ||
        (c.contractType && String(c.contractType).toLowerCase().includes(q)) ||
        (c.customerDisplayId && String(c.customerDisplayId).toLowerCase().includes(q)),
    )
  }, [openItems, listSearch])

  const filteredClosedList = useMemo(() => {
    const q = listSearch.trim().toLowerCase()
    if (!q) return closedItems
    return closedItems.filter(
      (c) =>
        (c.customerName && String(c.customerName).toLowerCase().includes(q)) ||
        (c.contractType && String(c.contractType).toLowerCase().includes(q)) ||
        (c.customerDisplayId && String(c.customerDisplayId).toLowerCase().includes(q)),
    )
  }, [closedItems, listSearch])

  const currentList = tab === 'closed' ? filteredClosedList : filteredOpenList

  useEffect(() => {
    const maxP = Math.max(1, Math.ceil(currentList.length / PAGE_SIZE))
    if (page > maxP) setPage(maxP)
  }, [currentList.length, page])

  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return currentList.slice(start, start + PAGE_SIZE)
  }, [currentList, page])

  const totalPages = Math.max(1, Math.ceil(currentList.length / PAGE_SIZE))

  const detailCustomerRecord = useMemo(() => {
    if (!detailContract?.customerId) return null
    const id = String(detailContract.customerId)
    return customers.find((x) => String(x.id) === id) ?? null
  }, [detailContract, customers])

  const onChange = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))
  const onNumericChange = (k) => (e) =>
    setForm((p) => ({ ...p, [k]: e.target.value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1') }))
  const onAlphaNumericChange = (k) => (e) =>
    setForm((p) => ({ ...p, [k]: e.target.value.replace(/[^a-zA-Z0-9]/g, '') }))

  const onToggleProduct = (value) => (e) => {
    const checked = e.target.checked
    setForm((p) => ({
      ...p,
      productTypes: checked ? [...p.productTypes, value] : p.productTypes.filter((x) => x !== value),
    }))
  }

  const onToggleOthers = (checked) => {
    setShowOtherProductInput(checked)
    setOtherProductInput('')
  }

  const addCustomProductType = () => {
    const value = otherProductInput.trim()
    if (!value) return
    if (form.productTypes.some((x) => x.toLowerCase() === value.toLowerCase())) return
    setForm((p) => ({ ...p, productTypes: [...p.productTypes, value] }))
    setOtherProductInput('')
    setShowOtherProductInput(false)
  }

  const removeCustomProductType = (value) => {
    setForm((p) => ({ ...p, productTypes: p.productTypes.filter((x) => x !== value) }))
  }

  const pickCustomer = (c) => {
    setForm((p) => ({ ...p, customerId: String(c.id) }))
    setCustomerDisplayName(c.name ?? '')
    setSelectedCustomerDisplayId(c.displayId ?? '')
    setCustomerQuery('')
    setCustomerMenuOpen(false)
  }

  const clearCustomerPick = () => {
    setForm((p) => ({ ...p, customerId: '' }))
    setCustomerDisplayName('')
    setSelectedCustomerDisplayId('')
    setCustomerQuery('')
    setCustomerMenuOpen(false)
  }

  const resetAddFormUi = () => {
    setForm(emptyForm)
    setShowOtherProductInput(false)
    setOtherProductInput('')
    setCustomerDisplayName('')
    setSelectedCustomerDisplayId('')
    setCustomerQuery('')
    setCustomerMenuOpen(false)
  }

  const onCancel = () => {
    setEditingId(null)
    resetAddFormUi()
    setTab('view')
  }

  const onEdit = (c) => {
    setTab('add')
    setEditingId(c.id)
    setShowOtherProductInput(false)
    setOtherProductInput('')
    setCustomerDisplayName(c.customerName ?? '')
    setSelectedCustomerDisplayId(c.customerDisplayId ?? '')
    setCustomerQuery('')
    setCustomerMenuOpen(false)
    const pay =
      Array.isArray(c.paymentTerms) && c.paymentTerms.length
        ? c.paymentTerms.includes('Arrears')
          ? 'Arrears'
          : 'Advance'
        : 'Advance'
    setForm({
      customerId: String(c.customerId ?? ''),
      contractType: c.contractType ?? 'AMC',
      sla: c.sla ?? '0-4 hrs',
      pmFrequency: c.pmFrequency ?? '',
      periodFrom: c.periodFrom ?? '',
      periodTo: c.periodTo ?? '',
      pcbText: c.pcbText ?? '',
      productTypes: Array.isArray(c.productTypes)
        ? c.productTypes
            .map((x) => String(x))
            .map((x) => x.replace(/^\+?Others[:\s-]*/i, '').trim())
            .filter(Boolean)
        : [],
      paymentTerm: pay,
      paymentSide: c.paymentSide ?? 'Quarterly',
      poNumber: c.poNumber ?? '',
      poBasicValue: c.poBasicValue ?? '',
      taxPercent: c.taxPercent ?? '',
      sparesProvisionPercent:
        c.contractType === 'NCAMC' ? '0' : c.sparesProvisionPercent ?? '',
    })
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      const sparesPct = isNcamc ? 0 : toNumOrNull(form.sparesProvisionPercent)
      const payload = {
        customerId: Number(form.customerId),
        contractType: form.contractType,
        sla: form.sla || null,
        periodFrom: showPeriod ? form.periodFrom || null : null,
        periodTo: showPeriod ? form.periodTo || null : null,
        pmFrequency: isAmcLike ? form.pmFrequency || null : null,
        pcbText: isPcbLike ? form.pcbText || null : null,
        productTypes: form.productTypes,
        paymentTerms: [form.paymentTerm],
        paymentSide: form.paymentSide || null,
        poNumber: form.poNumber || null,
        poValue: null,
        poBasicValue: toNumOrNull(form.poBasicValue),
        taxPercent: toNumOrNull(form.taxPercent),
        sparesProvisionPercent: sparesPct,
      }

      if (editingId) await updateContractApi(editingId, payload)
      else {
        await createContractApi(payload)
        showNotice('success', 'Created successfully')
      }
      onCancel()
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  const onCloseContract = async (id) => {
    setError(null)
    if (!confirm('Close this contract?')) return
    const remark = window.prompt('Enter close remark', '') ?? ''
    if (!remark.trim()) {
      setError('Close remark is required for manual close.')
      return
    }
    try {
      await deleteContractApi(id, remark.trim())
      setDetailContract((d) => (d && d.id === id ? null : d))
      await load()
      showNotice('success', 'Contract closed successfully')
    } catch (err) {
      const msg = getApiErrorMessage(err)
      if (/active complaints/i.test(msg)) {
        setError('Cannot delete this contract while complaints are active. Close all complaints first.')
        return
      }
      if (/foreign key|complaints|cannot delete or update a parent row/i.test(msg)) {
        setError('Cannot delete this contract because complaints exist. Delete related complaints first.')
        return
      }
      setError(msg)
    }
  }

  return (
    <div style={{ padding: '20px 0 48px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div className="customerTabs" role="tablist" aria-label="Contracts">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'add'}
            className={`customerTab ${tab === 'add' ? 'customerTabActive' : ''}`}
            onClick={() => {
              setTab('add')
              setEditingId(null)
              resetAddFormUi()
            }}
          >
            Add contract
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'view'}
            className={`customerTab ${tab === 'view' ? 'customerTabActive' : ''}`}
            onClick={() => {
              setTab('view')
              setEditingId(null)
              resetAddFormUi()
            }}
          >
            View contracts
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'closed'}
            className={`customerTab ${tab === 'closed' ? 'customerTabActive' : ''}`}
            onClick={() => {
              setTab('closed')
              setEditingId(null)
              resetAddFormUi()
              setPage(1)
            }}
          >
            Closed contracts
          </button>
        </div>
      </div>

      {error ? (
        <div className="error" style={{ marginBottom: 14 }}>
          {error}
        </div>
      ) : null}

      <div className="customersTabStage">
        <div key={tab} className={`customersTabPane customersTabPane--${tab}`}>
          {tab === 'add' ? (
            <div className="customersAddShell">
              <form onSubmit={onSubmit} className="card customersFormCard">
                <div className="cardHeader">
                  <h2 style={{ margin: 0 }}>{editingId ? `Edit contract #${editingId}` : 'Add contract'}</h2>
                </div>

                <label className="label">Customer *</label>
                <div className="typeaheadWrap">
                  <div className="inputIconRow">
                    <span className="inputIconRow__icon" aria-hidden>
                      <User size={iconSize} strokeWidth={iconStroke} />
                    </span>
                    <input
                      value={form.customerId ? customerDisplayName : customerQuery}
                      onChange={(e) => {
                        if (form.customerId) {
                          clearCustomerPick()
                          setCustomerQuery(e.target.value)
                        } else {
                          setCustomerQuery(e.target.value)
                        }
                        setCustomerMenuOpen(true)
                      }}
                      onFocus={() => setCustomerMenuOpen(true)}
                      placeholder="Search customer by name…"
                      autoComplete="off"
                      required={!form.customerId}
                    />
                  </div>
                  {customerMenuOpen && !form.customerId && customerSuggestions.length > 0 ? (
                    <div className="typeaheadMenu" role="listbox">
                      {customerSuggestions.map((c) => (
                        <div
                          key={c.id}
                          className="typeaheadItem"
                          role="option"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => pickCustomer(c)}
                        >
                          <div style={{ fontWeight: 700 }}>{c.name}</div>
                          <div className="muted" style={{ fontSize: 12 }}>
                            {c.displayId ?? '—'}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                {form.customerId ? (
                  <>
                    <label className="label" style={{ marginTop: 12 }}>
                      Customer ID
                    </label>
                    <div className="inputIconRow">
                      <span className="inputIconRow__icon" aria-hidden>
                        <Fingerprint size={iconSize} strokeWidth={iconStroke} />
                      </span>
                      <input value={selectedCustomerDisplayId || '—'} readOnly />
                    </div>
                  </>
                ) : null}

                <label className="label" style={{ marginTop: 12 }}>
                  Contract Type *
                </label>
                <div className="inputIconRow">
                  <span className="inputIconRow__icon" aria-hidden>
                    <Layers size={iconSize} strokeWidth={iconStroke} />
                  </span>
                  <select value={form.contractType} onChange={onChange('contractType')} required>
                    <option value="AMC">AMC</option>
                    <option value="NCAMC">NCAMC</option>
                    <option value="PCB">PCB</option>
                    <option value="Others">Others</option>
                  </select>
                </div>

                <label className="label" style={{ marginTop: 12 }}>
                  SLA *
                </label>
                <div className="inputIconRow">
                  <span className="inputIconRow__icon" aria-hidden>
                    <Wrench size={iconSize} strokeWidth={iconStroke} />
                  </span>
                  <select value={form.sla} onChange={onChange('sla')} required>
                    <option value="0-4 hrs">0-4 hrs</option>
                    <option value="4-8 hrs">4-8 hrs</option>
                    <option value="8-12 hrs">8-12 hrs</option>
                    <option value="12-16 hrs">12-16 hrs</option>
                    <option value="16-24 hrs">16-24 hrs</option>
                  </select>
                </div>

                {isAmcLike ? (
                  <div style={{ marginTop: 12 }}>
                    <label className="label" style={{ marginBottom: 6 }}>
                      PM Frequency
                    </label>
                    <div className="inputIconRow">
                      <span className="inputIconRow__icon" aria-hidden>
                        <Package size={iconSize} strokeWidth={iconStroke} />
                      </span>
                      <select
                        value={form.pmFrequency}
                        onChange={onChange('pmFrequency')}
                        required={isAmcLike}
                      >
                        <option value="" disabled>
                          Select frequency...
                        </option>
                        <option value="Monthly">Monthly</option>
                        <option value="Quarterly">Quarterly</option>
                        <option value="Half Yearly">Half Yearly</option>
                        <option value="Yearly">Yearly</option>
                      </select>
                    </div>
                  </div>
                ) : null}

                {showPeriod ? (
                  <div className="grid-2" style={{ marginTop: 12 }}>
                    <div>
                      <label className="label">AMC Start</label>
                      <div className="inputIconRow">
                        <span className="inputIconRow__icon" aria-hidden>
                          <CalendarRange size={iconSize} strokeWidth={iconStroke} />
                        </span>
                        <input type="date" value={form.periodFrom} onChange={onChange('periodFrom')} />
                      </div>
                    </div>
                    <div>
                      <label className="label">AMC End</label>
                      <div className="inputIconRow">
                        <span className="inputIconRow__icon" aria-hidden>
                          <CalendarRange size={iconSize} strokeWidth={iconStroke} />
                        </span>
                        <input type="date" value={form.periodTo} onChange={onChange('periodTo')} />
                      </div>
                    </div>
                  </div>
                ) : null}

                {isPcbLike ? (
                  <>
                    <label className="label" style={{ marginTop: 12 }}>
                      Contract text
                    </label>
                    <div className="inputIconRow inputIconRow--top">
                      <span className="inputIconRow__icon" aria-hidden>
                        <FileText size={iconSize} strokeWidth={iconStroke} />
                      </span>
                      <textarea value={form.pcbText} onChange={onChange('pcbText')} rows={3} />
                    </div>
                  </>
                ) : null}

                <label className="label" style={{ marginTop: 12 }}>
                  Product Types
                </label>
                <div className="card subtle" style={{ padding: 12 }}>
                  <div className="grid-2">
                    {BASE_PRODUCT_TYPES.map((t) => (
                      <label key={t} style={{ display: 'flex', gap: 10, alignItems: 'center', margin: 0 }}>
                        <input
                          type="checkbox"
                          checked={form.productTypes.includes(t)}
                          onChange={onToggleProduct(t)}
                          style={{ width: 16, height: 16 }}
                        />
                        <span style={{ color: 'var(--text)', fontSize: 14 }}>{t}</span>
                      </label>
                    ))}
                  </div>
                  <label style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 10, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={showOtherProductInput || customProductTypes.length > 0}
                      onChange={(e) => onToggleOthers(e.target.checked)}
                      style={{ width: 16, height: 16 }}
                    />
                    <span style={{ color: 'var(--text)', fontSize: 14 }}>Others</span>
                  </label>

                  <div className="productTypeChips">
                    {customProductTypes.map((p) => (
                      <span key={p} className="productTypeChip">
                        {p}
                        <button type="button" className="productTypeChipRemove" onClick={() => removeCustomProductType(p)} aria-label={`Remove ${p}`}>
                          ×
                        </button>
                      </span>
                    ))}
                  </div>

                  {showOtherProductInput ? (
                    <div style={{ marginTop: 10 }}>
                      <div className="inputIconRow">
                        <span className="inputIconRow__icon" aria-hidden>
                          <FileText size={iconSize} strokeWidth={iconStroke} />
                        </span>
                        <input
                          ref={otherProductInputRef}
                          value={otherProductInput}
                          onChange={(e) => setOtherProductInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              addCustomProductType()
                            }
                          }}
                          placeholder="Enter other product type"
                        />
                      </div>
                    </div>
                  ) : null}
                  {!showOtherProductInput && customProductTypes.length > 0 ? (
                    <button
                      type="button"
                      className="productTypeAddMore"
                      onClick={() => {
                        setShowOtherProductInput(true)
                        window.setTimeout(() => otherProductInputRef.current?.focus(), 0)
                      }}
                    >
                      + Add more
                    </button>
                  ) : null}
                </div>

                <div className="label" style={{ marginTop: 12, color: 'var(--muted)', fontWeight: 700 }}>
                  Payment Terms
                </div>
                <div className="card subtle" style={{ padding: 12 }}>
                  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', gap: 8, alignItems: 'center', margin: 0, cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="paymentTerm"
                        checked={form.paymentTerm === 'Advance'}
                        onChange={() => setForm((p) => ({ ...p, paymentTerm: 'Advance' }))}
                      />
                      <span style={{ fontWeight: 600 }}>Advance</span>
                    </label>
                    <label style={{ display: 'flex', gap: 8, alignItems: 'center', margin: 0, cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="paymentTerm"
                        checked={form.paymentTerm === 'Arrears'}
                        onChange={() => setForm((p) => ({ ...p, paymentTerm: 'Arrears' }))}
                      />
                      <span style={{ fontWeight: 600 }}>Arrears</span>
                    </label>
                  </div>

                  <label className="label" style={{ marginTop: 14 }}>
                    Billing Frequency
                  </label>
                  <div className="inputIconRow">
                    <span className="inputIconRow__icon" aria-hidden>
                      <CreditCard size={iconSize} strokeWidth={iconStroke} />
                    </span>
                    <select value={form.paymentSide} onChange={onChange('paymentSide')}>
                      <option value="Quarterly">Quarterly</option>
                      <option value="Half Yearly">Half Yearly</option>
                      <option value="Yearly">Yearly</option>
                    </select>
                  </div>
                </div>

                <div className="label" style={{ marginTop: 12, color: 'var(--muted)', fontWeight: 700 }}>
                  PO Details
                </div>
                <div className="card subtle" style={{ padding: 12 }}>
                  <div className="grid-2">
                    <div>
                      <label className="label">PO Number</label>
                      <div className="inputIconRow">
                        <span className="inputIconRow__icon" aria-hidden>
                          <Hash size={iconSize} strokeWidth={iconStroke} />
                        </span>
                        <input value={form.poNumber} onChange={onAlphaNumericChange('poNumber')} />
                      </div>
                    </div>
                    <div>
                      <label className="label">PO Basic Value</label>
                      <div className="inputIconRow">
                        <span className="inputIconRow__icon" aria-hidden>
                          <Building2 size={iconSize} strokeWidth={iconStroke} />
                        </span>
                        <input value={form.poBasicValue} onChange={onNumericChange('poBasicValue')} inputMode="decimal" />
                      </div>
                    </div>
                    <div>
                      <label className="label">Tax %</label>
                      <div className="inputIconRow">
                        <span className="inputIconRow__icon" aria-hidden>
                          <Building2 size={iconSize} strokeWidth={iconStroke} />
                        </span>
                        <input value={form.taxPercent} onChange={onNumericChange('taxPercent')} inputMode="decimal" />
                        <span style={{ fontWeight: 700, color: 'var(--muted)' }}>%</span>
                      </div>
                    </div>
                    <div>
                      <label className="label">Tax Value</label>
                      <div className="inputIconRow">
                        <span className="inputIconRow__icon" aria-hidden>
                          <Calculator size={iconSize} strokeWidth={iconStroke} />
                        </span>
                        <input readOnly value={formatMoneyPreview(liveDerived.taxVal)} />
                      </div>
                    </div>
                    <div>
                      <label className="label">Total PO Value</label>
                      <div className="inputIconRow">
                        <span className="inputIconRow__icon" aria-hidden>
                          <IndianRupee size={iconSize} strokeWidth={iconStroke} />
                        </span>
                        <input readOnly value={formatMoneyPreview(liveDerived.totalPo)} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="label" style={{ marginTop: 12, color: 'var(--muted)', fontWeight: 700 }}>
                  Spares Provision
                </div>
                <div className="card subtle" style={{ padding: 12 }}>
                  <div className="grid-2">
                    <div>
                      <label className="label">Provision %</label>
                      <div className="inputIconRow">
                        <span className="inputIconRow__icon" aria-hidden>
                          <Package size={iconSize} strokeWidth={iconStroke} />
                        </span>
                        <input
                          value={isNcamc ? '0' : form.sparesProvisionPercent}
                          onChange={onNumericChange('sparesProvisionPercent')}
                          inputMode="decimal"
                          disabled={isNcamc}
                        />
                        <span style={{ fontWeight: 700, color: 'var(--muted)' }}>%</span>
                      </div>
                    </div>
                    <div>
                      <label className="label">Provision Value</label>
                      <div className="inputIconRow">
                        <span className="inputIconRow__icon" aria-hidden>
                          <Package size={iconSize} strokeWidth={iconStroke} />
                        </span>
                        <input readOnly value={formatMoneyPreview(liveDerived.sparesVal)} />
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
                  <button type="submit" className="primary" disabled={!canSubmit}>
                    {editingId ? 'Update' : 'Create'}
                  </button>
                  <button type="button" className="secondary" onClick={onCancel}>
                    {editingId ? 'Cancel' : 'Close'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="customersViewShell">
              <div className="pageTitleRow">
                <h1>{tab === 'closed' ? 'Closed contracts' : 'All contracts'}</h1>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  <button type="button" onClick={load} disabled={loading}>
                    Refresh
                  </button>
                  {!loading && currentList.length > 0 ? (
                    <button type="button" className="success" onClick={() => exportContractsListAsExcelCsv(currentList)}>
                      Export
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="card">
                <div className="closedComplaintsToolbar">
                  <span className="muted" style={{ fontSize: 13 }}>
                    {currentList.length} of {tab === 'closed' ? closedItems.length : openItems.length}
                  </span>
                  <input
                    type="search"
                    className="closedComplaintsSearch"
                    placeholder="Search by customer or type…"
                    value={listSearch}
                    onChange={(e) => {
                      setListSearch(e.target.value)
                      setPage(1)
                    }}
                  />
                </div>

                {loading ? (
                  <div className="muted">Loading…</div>
                ) : currentList.length === 0 ? (
                  <div className="muted">{items.length === 0 ? 'No contracts yet.' : 'No matches.'}</div>
                ) : (
                  <>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="table">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Customer</th>
                            <th>Type</th>
                            <th>SLA</th>
                            <th>From</th>
                            <th>To</th>
                            <th>Status</th>
                            {tab === 'closed' ? <th>Remarks</th> : null}
                            <th>PO #</th>
                            <th>Total</th>
                            <th />
                          </tr>
                        </thead>
                        <tbody>
                          {pageItems.map((c) => {
                            const st = contractPeriodStatus(c)
                            return (
                            <tr key={c.id}>
                              <td className="muted" style={{ fontSize: 13 }}>
                                {c.customerDisplayId ?? '—'}
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="customerNameLink"
                                  onClick={() => setDetailContract(c)}
                                >
                                  {c.customerName ?? '—'}
                                </button>
                              </td>
                              <td>{c.contractType}</td>
                              <td>{c.sla ?? '-'}</td>
                              <td>{c.periodFrom ?? '-'}</td>
                              <td>{c.periodTo ?? '-'}</td>
                              <td>
                                <span className={`contractStatus contractStatus--${tab === 'closed' ? 'closed' : st.tone}`}>
                                  {tab === 'closed' ? 'Closed' : st.label}
                                </span>
                              </td>
                              {tab === 'closed' ? <td>{c.closed ? c.closeRemark || '-' : '-'}</td> : null}
                              <td>{c.poNumber ?? '-'}</td>
                              <td>{c.totalPoValue ?? '-'}</td>
                              <td style={{ textAlign: 'right' }}>
                                {tab === 'closed' ? null : (
                                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                    <button type="button" className="success" onClick={() => onEdit(c)}>
                                      Update
                                    </button>
                                    <button type="button" className="danger" onClick={() => onCloseContract(c.id)}>
                                      Close
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    {totalPages > 1 ? (
                      <div className="paginationBar">
                        <button
                          type="button"
                          className="secondary"
                          disabled={page <= 1}
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                        >
                          Previous
                        </button>
                        <span className="muted" style={{ fontSize: 13 }}>
                          Page {page} of {totalPages}
                        </span>
                        <button
                          type="button"
                          className="secondary"
                          disabled={page >= totalPages}
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        >
                          Next
                        </button>
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {detailContract ? (
        <div
          className="modalBackdrop"
          onMouseDown={() => setDetailContract(null)}
          role="presentation"
        >
          <div
            className="modal contractDetailModal"
            onMouseDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="contract-detail-title"
          >
            <h2 id="contract-detail-title" style={{ marginTop: 0 }}>
              Contract #{detailContract.id}
              {detailContract.customerName ? (
                <span className="muted" style={{ display: 'block', fontSize: 16, fontWeight: 600, marginTop: 6 }}>
                  {detailContract.customerName}
                </span>
              ) : null}
            </h2>
            {(() => {
              const st = contractPeriodStatus(detailContract)
              return (
                <p style={{ margin: '0 0 16px' }}>
                  <span className={`contractStatus contractStatus--${st.tone}`}>{st.label}</span>
                  <span className="muted" style={{ marginLeft: 10, fontSize: 13 }}>
                    From {detailContract.periodFrom ?? '—'} → {detailContract.periodTo ?? '—'}
                  </span>
                </p>
              )
            })()}
            <dl className="customerDetailList">
              <dt>Customer ID</dt>
              <dd>{detailContract.customerDisplayId ?? '—'}</dd>
              {detailCustomerRecord ? (
                <>
                  <dt>Customer phone</dt>
                  <dd>{detailCustomerRecord.phone ?? '—'}</dd>
                  <dt>Customer email</dt>
                  <dd>{detailCustomerRecord.email ?? '—'}</dd>
                  <dt>Contact name</dt>
                  <dd>{detailCustomerRecord.organization ?? '—'}</dd>
                  <dt>Address</dt>
                  <dd>{detailCustomerRecord.address ?? '—'}</dd>
                  <dt>Location</dt>
                  <dd>{detailCustomerRecord.location ?? '—'}</dd>
                  <dt>Building</dt>
                  <dd>{detailCustomerRecord.building ?? '—'}</dd>
                  <dt>Site</dt>
                  <dd>{detailCustomerRecord.site ?? '—'}</dd>
                </>
              ) : null}
              <dt>Type</dt>
              <dd>{formatListCell(detailContract.contractType)}</dd>
              <dt>SLA</dt>
              <dd>{formatListCell(detailContract.sla)}</dd>
              <dt>Period from</dt>
              <dd>{formatListCell(detailContract.periodFrom)}</dd>
              <dt>Period to</dt>
              <dd>{formatListCell(detailContract.periodTo)}</dd>
              <dt>PM frequency</dt>
              <dd>{formatListCell(detailContract.pmFrequency)}</dd>
              <dt>Contract text</dt>
              <dd>{formatListCell(detailContract.pcbText)}</dd>
              <dt>Product types</dt>
              <dd>{formatListCell(detailContract.productTypes)}</dd>
              <dt>Payment terms</dt>
              <dd>{formatListCell(detailContract.paymentTerms)}</dd>
              <dt>Payment side</dt>
              <dd>{formatListCell(detailContract.paymentSide)}</dd>
              <dt>PO number</dt>
              <dd>{formatListCell(detailContract.poNumber)}</dd>
              <dt>PO basic value</dt>
              <dd>{formatMoneyCell(detailContract.poBasicValue)}</dd>
              <dt>Tax %</dt>
              <dd>{formatListCell(detailContract.taxPercent)}</dd>
              <dt>Tax value</dt>
              <dd>{formatMoneyCell(detailContract.taxValue)}</dd>
              <dt>Total PO value</dt>
              <dd>{formatMoneyCell(detailContract.totalPoValue)}</dd>
              <dt>Provision %</dt>
              <dd>{formatListCell(detailContract.sparesProvisionPercent)}</dd>
              <dt>Provision Value</dt>
              <dd>{formatMoneyCell(detailContract.sparesProvisionValue)}</dd>
              <dt>Remarks</dt>
              <dd>{isClosedContract(detailContract) ? (detailContract.closed ? detailContract.closeRemark || '-' : '-') : '-'}</dd>
            </dl>
            <div className="customerDetailActions">
              {!isClosedContract(detailContract) ? (
                <button
                  type="button"
                  className="success"
                  onClick={() => {
                    onEdit(detailContract)
                    setDetailContract(null)
                  }}
                >
                  Update
                </button>
              ) : null}
              <button type="button" className="danger" onClick={() => setDetailContract(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {notice ? (
        <div className="noticeOverlay" role="status" aria-live="polite">
          <div className={`noticeBox contractNoticeBox noticeBox--${notice.type}`}>
            <span className="noticeTick" aria-hidden>
              <Check size={18} strokeWidth={3} />
            </span>
            <span>{notice.message}</span>
          </div>
        </div>
      ) : null}
    </div>
  )
}
