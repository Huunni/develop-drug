import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const ingredientKo = searchParams.get('ingredientKo')
  const ingredientEng = searchParams.get('ingredientEng')

  if (!ingredientKo && !ingredientEng) {
    return NextResponse.json({ error: '검색어를 입력해주세요' }, { status: 400 })
  }

  try {
    let query = supabase.from('drug_supply_view').select('*')

    if (ingredientKo) {
      query = query.ilike('ingredient_ko', `%${ingredientKo}%`)
    } else if (ingredientEng) {
      query = query.ilike('ingredient_eng', `%${ingredientEng}%`)
    }

    const { data, error } = await query
    if (error) throw error

    const items = data || []

    const monthCols = [
      'm202501','m202502','m202503','m202504','m202505','m202506',
      'm202507','m202508','m202509','m202510','m202511','m202512','m202601'
    ]

    // 연간 시장규모
    const annualMarket = items.reduce((sum, item) => {
      const itemTotal = monthCols.reduce((s, col) => s + (Number(item[col]) || 0), 0)
      return sum + itemTotal
    }, 0)

    // 공급가 중앙값
    const prices = items
      .map(i => Number(String(i.supply_price_median || '0').replace(/,/g, '')))
      .filter(p => p > 0)
      .sort((a, b) => a - b)
    const medianPrice = prices.length > 0 ? prices[Math.floor(prices.length / 2)] : 0
    const minPrice = prices.length > 0 ? prices[0] : 0
    const avgPrice = prices.length > 0 ? Math.round(prices.reduce((s, p) => s + p, 0) / prices.length) : 0

// 제품명 TOP5
    const sellerMap = new Map<string, number>()
    items.forEach(item => {
      const productName = item.item_name || item.seller_name || '기타'
      const itemTotal = monthCols.reduce((s, col) => s + (Number(item[col]) || 0), 0)
      sellerMap.set(productName, (sellerMap.get(productName) || 0) + itemTotal)
    })
    const topSellers = Array.from(sellerMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, annual]) => ({ name, annual }))

    // 포장단위별 가격 정보
    const packMap = new Map<string, { prices: number[], count: number }>()
    items.forEach(item => {
      const spec = item.item_standard || '-'
      const qty = item.total_quantity || ''
      const pkg = item.package_type || ''
      const key = `${spec}||${qty}||${pkg}`
      const price = Number(String(item.supply_price_median || '0').replace(/,/g, ''))
      if (!packMap.has(key)) packMap.set(key, { prices: [], count: 0 })
      const entry = packMap.get(key)!
      if (price > 0) entry.prices.push(price)
      entry.count++
    })

    const packUnits = Array.from(packMap.entries())
      .map(([key, val]) => {
        const [spec, qty, pkg] = key.split('||')
        const sortedP = val.prices.sort((a, b) => a - b)
        return {
          spec,
          qty,
          pkg,
          minPrice: sortedP[0] || 0,
          avgPrice: sortedP.length > 0 ? Math.round(sortedP.reduce((s, p) => s + p, 0) / sortedP.length) : 0,
          count: val.count,
        }
      })
      .filter(p => p.minPrice > 0)
      .sort((a, b) => a.spec.localeCompare(b.spec))

    // ATC3 코드
    const atcMap = new Map<string, number>()
    items.forEach(i => {
      if (i.atc3_name) atcMap.set(i.atc3_name, (atcMap.get(i.atc3_name) || 0) + 1)
    })
    const topAtc = Array.from(atcMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || ''

    // 단일/복합 구분
    const singleCount = items.filter(i => i.single_complex === '단일').length
    const complexCount = items.filter(i => i.single_complex === '복합').length

    return NextResponse.json({
      totalItems: items.length,
      annualMarket,
      medianPrice,
      minPrice,
      avgPrice,
      topSellers,
      topAtc,
      latestPeriod: '2026-01',
      packUnits,
      singleCount,
      complexCount,
    })

  } catch (error: any) {
    console.error('Market API 오류:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}