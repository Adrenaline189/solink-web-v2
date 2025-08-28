// lib/currencies.ts
// เรียงตามความนิยม/การใช้งานโดยรวม (ประมาณการ)
export const CURRENCIES: readonly string[] = [
  "USD","EUR","JPY","GBP","CNY","KRW","INR","TWD","HKD","SGD",
  "AUD","CAD","CHF","SEK","NOK","DKK","PLN","THB",
  "IDR","VND","MYR","PHP",
  "MXN","BRL","COP","CLP",
  "TRY","ZAR","AED","SAR","NZD"
] as const;
