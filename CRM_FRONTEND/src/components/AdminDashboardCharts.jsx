import { useMemo } from 'react'
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  bucketByMonth,
  bucketContractsByPeriodFrom,
  formatTrendLabel,
  rollingMonthKeys,
  trendVsPriorMonth,
} from '../utils/dashboardAnalytics.js'

const COL = {
  red: '#dc2626',
  cyan: '#06b6d4',
  bar1: '#3b82f6',
  bar2: '#ec4899',
  bar3: '#22c55e',
  bar4: '#eab308',
}

function MiniBars({ data, color, height = 52 }) {
  const chartData = data.map((v, i) => ({ i, v }))
  if (chartData.length === 0) return <div className="dashboardSparkEmpty" style={{ height }} />
  return (
    <div className="dashboardSpark" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 4, right: 2, left: 2, bottom: 0 }}>
          <Bar dataKey="v" fill={color} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function MiniLine({ data, color, height = 52 }) {
  const chartData = data.map((v, i) => ({ i, v }))
  if (chartData.length === 0) return <div className="dashboardSparkEmpty" style={{ height }} />
  return (
    <div className="dashboardSpark" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 4, right: 2, left: 2, bottom: 0 }}>
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

/**
 * @param {object} props
 * @param {object[]} props.customers
 * @param {object[]} props.contracts
 * @param {object[]} props.openComplaints
 * @param {object[]} props.closedComplaints
 * @param {boolean} props.loading
 * @param {string|null} props.error
 */
export default function AdminDashboardCharts({ customers, contracts, openComplaints, closedComplaints, loading, error }) {
  const keys12 = useMemo(() => rollingMonthKeys(12), [])

  const mergedComplaints = useMemo(
    () => [...openComplaints, ...closedComplaints],
    [openComplaints, closedComplaints],
  )

  const raised12 = useMemo(
    () => bucketByMonth(mergedComplaints, 'raisedAt', keys12),
    [mergedComplaints, keys12],
  )
  const closed12 = useMemo(() => bucketByMonth(closedComplaints, 'closedAt', keys12), [closedComplaints, keys12])
  const contractStarts12 = useMemo(
    () => bucketContractsByPeriodFrom(contracts, keys12),
    [contracts, keys12],
  )

  const mainChartData = useMemo(
    () =>
      keys12.map((_, i) => ({
        label: raised12[i].label,
        raised: raised12[i].count,
        closed: closed12[i].count,
      })),
    [keys12, raised12, closed12],
  )

  const volumeChartData = useMemo(
    () => [
      { name: 'Customers', n: customers.length, fill: COL.bar1 },
      { name: 'Contracts', n: contracts.length, fill: COL.bar2 },
      { name: 'Open', n: openComplaints.length, fill: COL.bar3 },
      { name: 'Closed', n: closedComplaints.length, fill: COL.bar4 },
    ],
    [customers.length, contracts.length, openComplaints.length, closedComplaints.length],
  )

  const raised6Counts = useMemo(() => raised12.slice(-6).map((r) => r.count), [raised12])
  const closed6Counts = useMemo(() => closed12.slice(-6).map((r) => r.count), [closed12])
  const contract6Counts = useMemo(() => contractStarts12.slice(-6).map((r) => r.count), [contractStarts12])

  const raisedTrend = useMemo(() => formatTrendLabel(trendVsPriorMonth(raised12.map((r) => r.count))), [raised12])
  const closedTrend = useMemo(() => formatTrendLabel(trendVsPriorMonth(closed12.map((r) => r.count))), [closed12])
  const contractTrend = useMemo(
    () => formatTrendLabel(trendVsPriorMonth(contractStarts12.map((r) => r.count))),
    [contractStarts12],
  )

  if (loading) {
    return <div className="muted dashboardChartsLoading">Loading charts…</div>
  }

  if (error) {
    return (
      <div className="error dashboardChartsError" style={{ marginTop: 12 }}>
        {error}
      </div>
    )
  }

  const nCustomers = customers.length
  const nContracts = contracts.length
  const nOpen = openComplaints.length
  const nClosed = closedComplaints.length

  return (
    <div className="adminDashboardCharts">
      <div className="dashboardKpiRow">
        <div className="card dashboardKpiCard">
          <div className="dashboardKpiTitle">Customers</div>
          <div className="dashboardKpiValue">{nCustomers.toLocaleString()}</div>
          <div className="dashboardKpiHint muted">{raisedTrend ?? 'Complaints raised / month'}</div>
          <MiniBars data={raised6Counts} color={COL.bar1} />
        </div>
        <div className="card dashboardKpiCard">
          <div className="dashboardKpiTitle">Contracts</div>
          <div className="dashboardKpiValue">{nContracts.toLocaleString()}</div>
          <div className="dashboardKpiHint muted">{contractTrend ?? 'New periods by start month'}</div>
          <MiniLine data={contract6Counts} color={COL.bar2} />
        </div>
        <div className="card dashboardKpiCard">
          <div className="dashboardKpiTitle">Open complaints</div>
          <div className="dashboardKpiValue">{nOpen.toLocaleString()}</div>
          <div className="dashboardKpiHint muted">Currently open</div>
          <MiniBars data={raised6Counts} color={COL.bar3} />
        </div>
        <div className="card dashboardKpiCard">
          <div className="dashboardKpiTitle">Closed complaints</div>
          <div className="dashboardKpiValue">{nClosed.toLocaleString()}</div>
          <div className="dashboardKpiHint muted">{closedTrend ?? 'Closed by month'}</div>
          <MiniBars data={closed6Counts} color={COL.bar4} />
        </div>
      </div>

      <div className="dashboardChartsRow">
        <div className="card dashboardMainChartCard">
          <div className="dashboardMainChartHead">
            <h2 className="dashboardMainChartTitle">Complaints over time</h2>
            <p className="muted dashboardMainChartSub">Raised vs closed by month (last 12 months)</p>
          </div>
          <div className="dashboardMainChartPlot">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={mainChartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashRaisedFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COL.red} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={COL.red} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.08)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="rgba(15,23,42,0.35)" />
                <YAxis tick={{ fontSize: 11 }} stroke="rgba(15,23,42,0.35)" allowDecimals={false} width={32} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    border: '1px solid rgba(15,23,42,0.1)',
                    fontSize: 13,
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="raised"
                  name="Raised"
                  stroke={COL.red}
                  fill="url(#dashRaisedFill)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="closed"
                  name="Closed"
                  stroke={COL.cyan}
                  strokeWidth={2}
                  dot={{ r: 3, fill: COL.cyan }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card dashboardVolumeCard">
          <div className="dashboardMainChartHead">
            <h2 className="dashboardMainChartTitle">Current volumes</h2>
            <p className="muted dashboardMainChartSub">Live totals from your CRM</p>
          </div>
          <div className="dashboardVolumePlot">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeChartData} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.08)" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} stroke="rgba(15,23,42,0.35)" />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={88}
                  tick={{ fontSize: 12 }}
                  stroke="rgba(15,23,42,0.35)"
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    border: '1px solid rgba(15,23,42,0.1)',
                    fontSize: 13,
                  }}
                />
                <Bar dataKey="n" radius={[0, 6, 6, 0]}>
                  {volumeChartData.map((e) => (
                    <Cell key={e.name} fill={e.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
