import type { CostType, PaymentRecord } from './types'

const requiredHeaders = ['date', 'category', 'detail', 'costType', 'amount', 'subscription', 'hobby']

export function sheetValuesToPaymentRecords(values: string[][]): PaymentRecord[] {
  const [headerRow = [], ...dataRows] = values
  const headers = headerRow.map((header) => header.trim())

  if (!requiredHeaders.every((header) => headers.includes(header))) {
    throw new Error('シートのヘッダーが正しくありません。README の CSV 形式を確認してください。')
  }

  return dataRows.flatMap((row, index) => {
    const value = headers.reduce<Record<string, string>>((record, header, columnIndex) => {
      record[header] = row[columnIndex]?.trim() ?? ''
      return record
    }, {})
    const amount = Number(value.amount)

    if (!value.date || !Number.isFinite(amount)) {
      return []
    }

    return [
      {
        id: `google-sheets-${index}`,
        payer: value.payer || 'スプレッドシート',
        month: value.date.slice(0, 7),
        date: value.date,
        category: value.category,
        detail: value.detail,
        costType: normalizeCostType(value.costType),
        amount,
        subscription: normalizeBoolean(value.subscription),
        hobby: normalizeBoolean(value.hobby),
        sourceFile: 'Google Sheets',
      },
    ]
  })
}

function normalizeBoolean(value: string) {
  return ['true', '1', 'yes', 'y'].includes(value.trim().toLowerCase())
}

function normalizeCostType(value: string): CostType {
  return value.trim().toLowerCase() === 'fixed' ? 'fixed' : 'variable'
}
