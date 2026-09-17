export type CostType = 'fixed' | 'variable'

export type PaymentRecord = {
  id: string
  payer: string
  month: string
  date: string
  category: string
  detail: string
  costType: CostType
  amount: number
  subscription: boolean
  hobby: boolean
  sourceFile: string
}

export type SummaryRow = {
  label: string
  total: number
  count: number
  average: number
}
