import * as fs from 'fs'
import * as path from 'path'
import axios from 'axios'
import { parse } from 'csv-parse/sync'

const SUPABASE_URL = 'https://ttcfssyrrmepeggeaeqq.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0Y2Zzc3lycm1lcGVnZ2VhZXFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTk1OTY0MCwiZXhwIjoyMDkxNTM1NjQwfQ.teN9v34f-VhAofmbnjJXcJuKbpN8gEI6s-JLKW2LFTA'.trim()

const trim = (s: string, max = 500) => (s || '').slice(0, max)

async function upsertChunk(rows: any[]) {
  await axios.post(
    `${SUPABASE_URL}/rest/v1/drug_supply`,
    rows,
    {
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'resolution=merge-duplicates',
      },
    }
  )
}

async function syncSupply() {
  console.log('CSV 파일 읽는 중...')

  const csvPath = path.join(process.cwd(), 'data', 'supply.csv')
  const buffer = fs.readFileSync(csvPath)
  const text = buffer.toString('utf-8')

  const records = parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_quotes: true,
    relax_column_count: true,
    }) as Record<string, string>[]

  console.log(`총 ${records.length}행 처리 중...`)
  console.log('첫 행 샘플:', JSON.stringify(records[0]).slice(0, 200))

  const map = new Map<string, any>()

  for (let i = 0; i < records.length; i++) {
    const r = records[i]
    const itemName = r['품목명']?.trim()
    const sellerName = r['판매사명']?.trim()
    if (!itemName || !sellerName) continue

    const key = `${itemName}__${sellerName}`
    const val = parseFloat(r['측정값']?.replace(/,/g, '') || '0')
    const period = r['기간(월/주)']?.trim()

    if (!map.has(key)) {
      map.set(key, {
        brand_name: trim(r['브랜드명'] || ''),
        item_name: trim(itemName),
        seller_name: trim(sellerName),
        maker_name: trim(r['제조사명'] || ''),
        atc3_code: trim(r['ATC3_코드명'] || '', 100),
        atc5_code: trim(r['ATC5 코드명'] || '', 200),
        classification: trim(r['복지부분류 코드명'] || '', 200),
        ingredient_ko: trim(r['성분명'] || '', 2000),
        ingredient_eng: trim(r['성분명(영문)'] || '', 2000),
        package_type: trim(r['포장형태'] || '', 200),
        supply_price: parseFloat(r['공급가(중앙값)']?.replace(/,/g, '') || '0'),
        values: [],
        periods: [],
      })
    }

    const entry = map.get(key)!
    if (val > 0) entry.values.push(val)
    if (period && !entry.periods.includes(period)) entry.periods.push(period)

    if (i % 10000 === 0) console.log(`${i}/${records.length}행 처리 중...`)
  }

  const rows = Array.from(map.values()).map(entry => ({
    brand_name: entry.brand_name,
    item_name: entry.item_name,
    seller_name: entry.seller_name,
    maker_name: entry.maker_name,
    atc3_code: entry.atc3_code,
    atc5_code: entry.atc5_code,
    classification: entry.classification,
    ingredient_ko: entry.ingredient_ko,
    ingredient_eng: entry.ingredient_eng,
    package_type: entry.package_type,
    supply_price: entry.supply_price,
    monthly_avg: entry.values.length > 0
      ? Math.round(entry.values.reduce((a: number, b: number) => a + b, 0) / entry.values.length)
      : 0,
    total_supply: Math.round(entry.values.reduce((a: number, b: number) => a + b, 0)),
    month_count: entry.values.length,
    data_start: entry.periods.sort()[0] || '',
    data_end: entry.periods.sort().slice(-1)[0] || '',
  }))

  console.log(`총 ${rows.length}개 품목 집계 완료! Supabase에 저장 중...`)

  let success = 0
  let error = 0

  for (let i = 0; i < rows.length; i += 200) {
    const chunk = rows.slice(i, i + 200)
    try {
      await upsertChunk(chunk)
      success += chunk.length
      console.log(`${i + chunk.length}/${rows.length} 저장 완료`)
    } catch (err: any) {
      console.error('저장 오류:', err.response?.data || err.message)
      error += chunk.length
    }
  }

  console.log(`완료! 성공: ${success}건 / 오류: ${error}건`)
}

syncSupply()