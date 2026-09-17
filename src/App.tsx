import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Colors,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'
import { NavLink, Route, Routes } from 'react-router-dom'
import { paymentRecords } from './dataLoader'
import type { PaymentRecord, SummaryRow } from './types'
import './index.css'

ChartJS.register(ArcElement, BarElement, CategoryScale, Colors, Legend, LinearScale, Tooltip)

const currencyFormatter = new Intl.NumberFormat('ja-JP', {
  style: 'currency',
  currency: 'JPY',
  maximumFractionDigits: 0,
})

const monthFormatter = new Intl.DateTimeFormat('ja-JP', {
  year: 'numeric',
  month: 'short',
})

const sortedPayments = [...paymentRecords].sort((left, right) =>
  left.date < right.date ? 1 : left.date > right.date ? -1 : right.payer.localeCompare(left.payer),
)

const summaryTotals = summarizeTotals(sortedPayments)
const fixedSummary = summarizeByLabel(
  sortedPayments.filter((record) => record.costType === 'fixed'),
  (record) => record.category,
)
const variableSummary = summarizeByLabel(
  sortedPayments.filter((record) => record.costType === 'variable'),
  (record) => record.category,
)
const payerSummary = summarizeByLabel(sortedPayments, (record) => record.payer)
const categorySummary = summarizeByLabel(sortedPayments, (record) => record.category)
const subscriptionSummary = summarizeByLabel(
  sortedPayments.filter((record) => record.subscription),
  (record) => record.detail,
)
const hobbySummary = summarizeByLabel(
  sortedPayments.filter((record) => record.hobby),
  (record) => record.detail,
)
const monthlySummary = summarizeByLabel(sortedPayments, (record) => record.month)

const monthlyChartData = {
  labels: monthlySummary.map((row) => formatMonth(row.label)),
  datasets: [
    {
      label: '月別支出',
      data: monthlySummary.map((row) => row.total),
      backgroundColor: '#6d5efc',
      borderRadius: 10,
    },
  ],
}

const categoryChartData = {
  labels: categorySummary.map((row) => row.label),
  datasets: [
    {
      label: 'カテゴリ別支出',
      data: categorySummary.map((row) => row.total),
    },
  ],
}

function App() {
  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">家計の見える化</p>
          <h1>home_memo</h1>
          <p className="hero-copy">
            プロジェクトにコミットされた CSV を支払い者・月をまたいで統合し、固定費・変動費・
            カテゴリ・サブスク・趣味代まで一画面で分析できる SPA です。
          </p>
        </div>
        <nav className="top-nav" aria-label="主要ナビゲーション">
          <NavLink to="/" end>
            ダッシュボード
          </NavLink>
          <NavLink to="/list">支払いリスト</NavLink>
        </nav>
      </header>

      <main className="page">
        <Routes>
          <Route
            path="/"
            element={
              <DashboardPage
                fixedSummary={fixedSummary}
                variableSummary={variableSummary}
                payerSummary={payerSummary}
                categorySummary={categorySummary}
                subscriptionSummary={subscriptionSummary}
                hobbySummary={hobbySummary}
              />
            }
          />
          <Route path="/list" element={<ListPage records={sortedPayments} />} />
          <Route
            path="*"
            element={
              <DashboardPage
                fixedSummary={fixedSummary}
                variableSummary={variableSummary}
                payerSummary={payerSummary}
                categorySummary={categorySummary}
                subscriptionSummary={subscriptionSummary}
                hobbySummary={hobbySummary}
              />
            }
          />
        </Routes>
      </main>
    </div>
  )
}

function DashboardPage({
  fixedSummary,
  variableSummary,
  payerSummary,
  categorySummary,
  subscriptionSummary,
  hobbySummary,
}: {
  fixedSummary: SummaryRow[]
  variableSummary: SummaryRow[]
  payerSummary: SummaryRow[]
  categorySummary: SummaryRow[]
  subscriptionSummary: SummaryRow[]
  hobbySummary: SummaryRow[]
}) {
  return (
    <div className="content-grid">
      <section className="panel stats-grid">
        <MetricCard label="総支出" value={currencyFormatter.format(summaryTotals.total)} />
        <MetricCard label="固定費" value={currencyFormatter.format(summaryTotals.fixedTotal)} />
        <MetricCard label="変動費" value={currencyFormatter.format(summaryTotals.variableTotal)} />
        <MetricCard
          label="サブスク件数"
          value={`${summaryTotals.subscriptionCount.toLocaleString('ja-JP')} 件`}
        />
      </section>

      <section className="panel overview">
        <div>
          <h2>データ概要</h2>
          <p>
            {summaryTotals.fileCount} ファイル / {summaryTotals.payerCount} 人 /{' '}
            {summaryTotals.monthCount} か月 / {summaryTotals.recordCount} 件を集計しています。
          </p>
        </div>
        <div className="chips" aria-label="読み込み済み CSV">
          {summaryTotals.sources.map((source) => (
            <span className="chip" key={source}>
              {source}
            </span>
          ))}
        </div>
      </section>

      <section className="panel chart-panel">
        <div className="section-heading">
          <h2>月別の支出推移</h2>
          <p>すべての CSV を統合した月次合計</p>
        </div>
        <Bar
          data={monthlyChartData}
          options={{
            responsive: true,
            plugins: { legend: { display: false } },
          }}
        />
      </section>

      <section className="panel chart-panel">
        <div className="section-heading">
          <h2>カテゴリ別の構成比</h2>
          <p>主要カテゴリにどれだけ支出しているか</p>
        </div>
        <div className="doughnut-wrap">
          <Doughnut
            data={categoryChartData}
            options={{
              responsive: true,
              plugins: { legend: { position: 'bottom' } },
            }}
          />
        </div>
      </section>

      <SummarySection
        title="固定費のサマリー"
        description="住居・通信・保険などの固定費をカテゴリ別に集計"
        rows={fixedSummary}
      />
      <SummarySection
        title="変動費のサマリー"
        description="食費・日用品・交際費など月ごとに変動する支出"
        rows={variableSummary}
      />
      <SummarySection
        title="支払い者別のサマリー"
        description="だれがどれだけ支払っているかを比較"
        rows={payerSummary}
      />
      <SummarySection
        title="カテゴリ別のサマリー"
        description="全支出をカテゴリごとに横断集計"
        rows={categorySummary}
      />
      <SummarySection
        title="サブスクのサマリー"
        description="継続課金中の支出をサービス単位で確認"
        rows={subscriptionSummary}
      />
      <SummarySection
        title="趣味代のサマリー"
        description="ゲーム・書籍・ライブなど趣味用途の支出を把握"
        rows={hobbySummary}
      />
    </div>
  )
}

function ListPage({ records }: { records: PaymentRecord[] }) {
  return (
    <section className="panel">
      <div className="section-heading">
        <h2>支払いリスト</h2>
        <p>すべての CSV を統合した明細一覧</p>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>日付</th>
              <th>支払い者</th>
              <th>月</th>
              <th>カテゴリ</th>
              <th>内容</th>
              <th>種別</th>
              <th>金額</th>
              <th>タグ</th>
              <th>CSV</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id}>
                <td>{record.date}</td>
                <td>{record.payer}</td>
                <td>{formatMonth(record.month)}</td>
                <td>{record.category}</td>
                <td>{record.detail}</td>
                <td>{record.costType === 'fixed' ? '固定費' : '変動費'}</td>
                <td>{currencyFormatter.format(record.amount)}</td>
                <td>
                  <div className="tag-list">
                    {record.subscription ? <span className="tag">サブスク</span> : null}
                    {record.hobby ? <span className="tag">趣味</span> : null}
                  </div>
                </td>
                <td>{record.sourceFile}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  )
}

function SummarySection({
  title,
  description,
  rows,
}: {
  title: string
  description: string
  rows: SummaryRow[]
}) {
  return (
    <section className="panel">
      <div className="section-heading">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>項目</th>
              <th>合計</th>
              <th>件数</th>
              <th>平均</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <td>{row.label}</td>
                <td>{currencyFormatter.format(row.total)}</td>
                <td>{row.count.toLocaleString('ja-JP')} 件</td>
                <td>{currencyFormatter.format(row.average)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function summarizeTotals(records: PaymentRecord[]) {
  const files = new Set(records.map((record) => record.sourceFile))
  const payers = new Set(records.map((record) => record.payer))
  const months = new Set(records.map((record) => record.month))

  return {
    total: sumAmounts(records),
    fixedTotal: sumAmounts(records.filter((record) => record.costType === 'fixed')),
    variableTotal: sumAmounts(records.filter((record) => record.costType === 'variable')),
    subscriptionCount: records.filter((record) => record.subscription).length,
    recordCount: records.length,
    fileCount: files.size,
    payerCount: payers.size,
    monthCount: months.size,
    sources: [...files].sort(),
  }
}

function summarizeByLabel(
  records: PaymentRecord[],
  getLabel: (record: PaymentRecord) => string,
): SummaryRow[] {
  const grouped = new Map<string, PaymentRecord[]>()

  records.forEach((record) => {
    const label = getLabel(record)
    const current = grouped.get(label) ?? []
    current.push(record)
    grouped.set(label, current)
  })

  return [...grouped.entries()]
    .map(([label, items]) => ({
      label,
      total: sumAmounts(items),
      count: items.length,
      average: sumAmounts(items) / items.length,
    }))
    .sort((left, right) => right.total - left.total)
}

function sumAmounts(records: PaymentRecord[]) {
  return records.reduce((total, record) => total + record.amount, 0)
}

function formatMonth(value: string) {
  return monthFormatter.format(new Date(`${value}-01T00:00:00`))
}

export default App
