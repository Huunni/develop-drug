import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { csv } = await req.json()
    const lines = csv.split('\n').filter((l: string) => l.trim())

    // 구분자 자동 감지
    const delimiter = lines[0].includes('\t') ? '\t' : ','
    const headers = lines[0].split(delimiter).map((h: string) => h.trim().replace(/"/g, ''))

    const idx = {
      brand: headers.indexOf('브랜드명'),
      item: headers.indexOf('품목명'),
      qty: headers.indexOf('제품총수량'),
      type: headers.indexOf('문전약국구분'),
      package: headers.indexOf('포장형태'),
      price: headers.indexOf('공급가(중앙값)'),
      seller: headers.indexOf('판매사명'),
      maker: headers.indexOf('제조사명'),
      atc3: headers.indexOf('ATC3_코드명'),
      atc5: headers.indexOf('ATC5 코드명'),
      class: headers.indexOf('복지부분류 코드명'),
      ingrKo: headers.indexOf('성분명'),
      ingrEng: headers.indexOf('성분명(영문)'),
      period: headers.indexOf('기간(월/주)'),
      value: headers.indexOf('측정값'),
    }

    console.log('감지된 구분자:', delimiter)
    console.log('헤더:', headers)
    console.log('인덱스:', idx)

    // 품목별로 월별 데이터 집계
    const map = new Map<string, {
      brand_name: string
      item_name: string
      seller_name: string
      maker_name: string
      atc3_code: string
      atc5_code: string
      classification: string
      ingredient_ko: string
      ingredient_eng: string
      package_type: string
      supply_price: number
      values: number[]
      periods: string[]
    }>()

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(delimiter).map((c: string) => c.trim().replace(/"/g, ''))
      if (cols.length < 10) continue

      const itemName = cols[idx.item]?.trim()
      const sellerName = cols[idx.seller]?.trim()
      if (!itemName || !sellerName) continue

      const key = `${itemName}__${sellerName}`
      const val = parseFloat(cols[idx.value]?.replace(/,/g, '') || '0')
      const period = cols[idx.period]?.trim()

      if (!map.has(key)) {
        map.set(key, {
          brand_name: cols[idx.brand]?.trim() || '',
          item_name: itemName,
          seller_name: sellerName,
          maker_name: cols[idx.maker]?.trim() || '',
          atc3_code: cols[idx.atc3]?.trim() || '',
          atc5_code: cols[idx.atc5]?.trim() || '',
          classification: cols[idx.class]?.trim() || '',
          ingredient_ko: cols[idx.ingrKo]?.trim() || '',
          ingredient_eng: cols[idx.ingrEng]?.trim() || '',
          package_type: cols[idx.package]?.trim() || '',
          supply_price: parseFloat(cols[idx.price]?.replace(/,/g, '') || '0'),
          values: [],
          periods: [],
        })
      }

      const entry = map.get(key)!
      if (val > 0) entry.values.push(val)
      if (period && !entry.periods.includes(period)) entry.periods.push(period)
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
        ? Math.round(entry.values.reduce((a, b) => a + b, 0) / entry.values.length)
        : 0,
      total_supply: Math.round(entry.values.reduce((a, b) => a + b, 0)),
      month_count: entry.values.length,
      data_start: entry.periods.sort()[0] || '',
      data_end: entry.periods.sort().slice(-1)[0] || '',
    }))

    console.log(`총 ${rows.length}개 품목 집계 완료`)

    let success = 0
    let error = 0

    for (let i = 0; i < rows.length; i += 500) {
      const chunk = rows.slice(i, i + 500)
      const { error: err } = await supabase
        .from('drug_supply')
        .upsert(chunk, { onConflict: 'item_name,seller_name' })

      if (err) {
        console.error('저장 오류:', err)
        error += chunk.length
      } else {
        success += chunk.length
      }
    }

    return NextResponse.json({ success, error, total: rows.length })

  } catch (err: any) {
    console.error('전체 오류:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}