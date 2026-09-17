import type { CostType } from './types'

const csvFiles = import.meta.glob('./data/**/*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

export const paymentRecords = Object.entries(csvFiles)
  .flatMap(([path, raw]) => {
    const [, payer = '未設定', fileName = 'unknown.csv'] =
      path.match(/\.\/data\/([^/]+)\/([^/]+\.csv)$/) ?? []
    const month = fileName.replace('.csv', '')

    return parseCsv(raw).map((row, index) => ({
      id: `${payer}-${month}-${index}`,
      payer,
      month,
      date: row.date,
      category: row.category,
      detail: row.detail,
      costType: normalizeCostType(row.costType),
      amount: Number(row.amount),
      subscription: normalizeBoolean(row.subscription),
      hobby: normalizeBoolean(row.hobby),
      sourceFile: `${payer}/${fileName}`,
    }))
  })
  .filter((record) => Number.isFinite(record.amount))

function parseCsv(raw: string) {
  const rows: string[][] = []
  let currentField = ''
  let currentRow: string[] = []
  let insideQuotes = false

  for (let index = 0; index < raw.length; index += 1) {
    const character = raw[index]
    const nextCharacter = raw[index + 1]

    if (character === '"') {
      if (insideQuotes && nextCharacter === '"') {
        currentField += '"'
        index += 1
      } else {
        insideQuotes = !insideQuotes
      }
      continue
    }

    if (!insideQuotes && character === ',') {
      currentRow.push(currentField)
      currentField = ''
      continue
    }

    if (!insideQuotes && (character === '\n' || character === '\r')) {
      if (character === '\r' && nextCharacter === '\n') {
        index += 1
      }
      if (currentField.length > 0 || currentRow.length > 0) {
        currentRow.push(currentField)
        rows.push(currentRow)
      }
      currentField = ''
      currentRow = []
      continue
    }

    currentField += character
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField)
    rows.push(currentRow)
  }

  const [headerRow = [], ...dataRows] = rows
  const headers = headerRow.map((header) => header.trim())

  return dataRows
    .filter((row) => row.some((value) => value.trim().length > 0))
    .map((row) =>
      headers.reduce<Record<string, string>>((record, header, columnIndex) => {
        record[header] = row[columnIndex]?.trim() ?? ''
        return record
      }, {}),
    )
}

function normalizeBoolean(value: string) {
  return ['true', '1', 'yes', 'y'].includes(value.trim().toLowerCase())
}

function normalizeCostType(value: string): CostType {
  return value.trim().toLowerCase() === 'fixed' ? 'fixed' : 'variable'
}
