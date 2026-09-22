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
import { useState } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import { paymentRecords } from './dataLoader'
import { sheetValuesToPaymentRecords } from './sheetsLoader'
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

function App() {
  const productionUrl = import.meta.env.VITE_PRODUCTION_URL?.trim() || '#/production'

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">家計の見える化</p>
          <h1>home_memo</h1>
          <p className="hero-copy">
            CSV デモと、Google スプレッドシートから読み込む本番データを、同じ分析画面で確認できます。
          </p>
        </div>
        <nav className="top-nav" aria-label="主要ナビゲーション">
          <NavLink to="/" end>
            ダッシュボード
          </NavLink>
          <NavLink to="/list">支払いリスト</NavLink>
          <a href={productionUrl}>本番ページ</a>
        </nav>
      </header>

      <main className="page">
        <Routes>
          <Route
            path="/"
            element={
              <DashboardPage records={paymentRecords} sourceDescription="コミット済み CSV" />
            }
          />
          <Route path="/list" element={<ListPage records={sortPayments(paymentRecords)} />} />
          <Route path="/production" element={<ProductionPage />} />
          <Route path="*" element={<DashboardPage records={paymentRecords} sourceDescription="コミット済み CSV" />} />
        </Routes>
      </main>
    </div>
  )
}

function DashboardPage({ records, sourceDescription }: { records: PaymentRecord[]; sourceDescription: string }) {
  const sortedPayments = sortPayments(records)
  const summaryTotals = summarizeTotals(sortedPayments)
  const fixedSummary = summarizeByLabel(sortedPayments.filter((record) => record.costType === 'fixed'), (record) => record.category)
  const variableSummary = summarizeByLabel(sortedPayments.filter((record) => record.costType === 'variable'), (record) => record.category)
  const payerSummary = summarizeByLabel(sortedPayments, (record) => record.payer)
  const categorySummary = summarizeByLabel(sortedPayments, (record) => record.category)
  const subscriptionSummary = summarizeByLabel(sortedPayments.filter((record) => record.subscription), (record) => record.detail)
  const hobbySummary = summarizeByLabel(sortedPayments.filter((record) => record.hobby), (record) => record.detail)
  const monthlySummary = summarizeByLabel(sortedPayments, (record) => record.month)
  const monthlyChartData = {
    labels: monthlySummary.map((row) => formatMonth(row.label)),
    datasets: [{ label: '月別支出', data: monthlySummary.map((row) => row.total), backgroundColor: '#6d5efc', borderRadius: 10 }],
  }
  const categoryChartData = {
    labels: categorySummary.map((row) => row.label),
    datasets: [{ label: 'カテゴリ別支出', data: categorySummary.map((row) => row.total) }],
  }

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
            {sourceDescription} / {summaryTotals.payerCount} 人 /{' '}
            {summaryTotals.monthCount} か月 / {summaryTotals.recordCount} 件を集計しています。
          </p>
        </div>
        <div className="chips" aria-label="読み込み済みデータ">
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
          <p>読み込み済みデータの月次合計</p>
        </div>
        <div className="chart-wrap">
          <Bar
            data={monthlyChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
            }}
          />
        </div>
      </section>

      <section className="panel chart-panel">
        <div className="section-heading">
          <h2>カテゴリ別の構成比</h2>
          <p>主要カテゴリにどれだけ支出しているか</p>
        </div>
        <div className="chart-wrap doughnut-wrap">
          <Doughnut
            data={categoryChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
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
        <p>読み込み済みデータの明細一覧</p>
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
                <td data-label="日付">{record.date}</td>
                <td data-label="支払い者">{record.payer}</td>
                <td data-label="月">{formatMonth(record.month)}</td>
                <td data-label="カテゴリ">{record.category}</td>
                <td data-label="内容">{record.detail}</td>
                <td data-label="種別">{record.costType === 'fixed' ? '固定費' : '変動費'}</td>
                <td data-label="金額">{currencyFormatter.format(record.amount)}</td>
                <td data-label="タグ">
                  <div className="tag-list">
                    {record.subscription ? <span className="tag">サブスク</span> : null}
                    {record.hobby ? <span className="tag">趣味</span> : null}
                  </div>
                </td>
                <td data-label="CSV">{record.sourceFile}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function ProductionPage() {
  const [records, setRecords] = useState<PaymentRecord[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'empty' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const signIn = async () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim()
    const spreadsheetId = import.meta.env.VITE_GOOGLE_SPREADSHEET_ID?.trim()
    const range = import.meta.env.VITE_GOOGLE_SHEET_RANGE?.trim() || '支払い!A:G'

    if (!clientId || !spreadsheetId) {
      setStatus('error')
      setMessage('Google の環境変数が設定されていません。')
      return
    }

    setStatus('loading')
    setMessage('')
    try {
      const token = await requestAccessToken(clientId)
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}`,
        { headers: { Authorization: 'Bearer ' + token } },
      )
      if (!response.ok) {
        throw new Error('Google Sheets API からデータを取得できませんでした。')
      }
      const payload = (await response.json()) as { values?: string[][] }
      const loadedRecords = sheetValuesToPaymentRecords(payload.values ?? [])
      setRecords(loadedRecords)
      setStatus(loadedRecords.length > 0 ? 'idle' : 'empty')
    } catch (error) {
      setRecords([])
      setStatus('error')
      setMessage(error instanceof Error ? error.message : '認証またはデータ取得に失敗しました。')
    }
  }

  const signOut = () => {
    setRecords([])
    setStatus('idle')
    setMessage('')
  }

  if (records.length > 0) {
    return (
      <>
        <section className="panel production-actions">
          <p>Google スプレッドシートから読み込んだ非公開データです。</p>
          <button type="button" onClick={signOut}>ログアウトしてデータを消去</button>
        </section>
        <DashboardPage records={records} sourceDescription="Google Sheets" />
      </>
    )
  }

  return (
    <section className="panel production-state">
      <h2>本番ページ</h2>
      <p>Google にログインして、共有を許可されたスプレッドシートを読み込みます。</p>
      {status === 'error' ? <p className="error-message">{message}</p> : null}
      {status === 'loading' ? <p>Google Sheets を読み込んでいます…</p> : null}
      {status === 'empty' ? <p>読み込める支払いデータがありません。</p> : null}
      <button type="button" onClick={() => void signIn()} disabled={status === 'loading'}>
        Google でログイン
      </button>
      {status === 'idle' && !message ? <p>未ログインです。</p> : null}
    </section>
  )
}

function requestAccessToken(clientId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = () => {
      const google = (window as Window & { google?: GoogleIdentity }).google
      if (!google) {
        reject(new Error('Google Identity Services を読み込めませんでした。'))
        return
      }
      const client = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
        callback: (response) => response.access_token ? resolve(response.access_token) : reject(new Error('Google ログインに失敗しました。')),
        error_callback: () => reject(new Error('Google ログインに失敗しました。')),
      })
      client.requestAccessToken({ prompt: '' })
    }
    script.onerror = () => reject(new Error('Google Identity Services を読み込めませんでした。'))
    document.head.append(script)
  })
}

type GoogleIdentity = {
  accounts: {
    oauth2: {
      initTokenClient: (config: {
        client_id: string
        scope: string
        callback: (response: { access_token?: string }) => void
        error_callback: () => void
      }) => { requestAccessToken: (config: { prompt: string }) => void }
    }
  }
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
                <td data-label="項目">{row.label}</td>
                <td data-label="合計">{currencyFormatter.format(row.total)}</td>
                <td data-label="件数">{row.count.toLocaleString('ja-JP')} 件</td>
                <td data-label="平均">{currencyFormatter.format(row.average)}</td>
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

function sortPayments(records: PaymentRecord[]) {
  return [...records].sort((left, right) =>
    left.date < right.date ? 1 : left.date > right.date ? -1 : right.payer.localeCompare(left.payer),
  )
}

function formatMonth(value: string) {
  return monthFormatter.format(new Date(`${value}-01T00:00:00`))
}

export default App
