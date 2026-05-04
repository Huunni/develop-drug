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

    const getAnnual = (item: any) =>
      monthCols.reduce((s, col) => s + (Number(item[col]) || 0), 0)

    // 전체 연간 시장규모
    const annualMarket = items.reduce((sum, item) => sum + getAnnual(item), 0)

    // 공급가 처리
    const parsePrice = (v: any) => Number(String(v || '0').replace(/,/g, ''))

    const prices = items.map(i => parsePrice(i.supply_price_median)).filter(p => p > 0).sort((a, b) => a - b)
    const medianPrice = prices.length > 0 ? prices[Math.floor(prices.length / 2)] : 0
    const minPrice = prices.length > 0 ? prices[0] : 0
    const avgPrice = prices.length > 0 ? Math.round(prices.reduce((s, p) => s + p, 0) / prices.length) : 0

    // 전체 제품명 TOP5
    const productMap = new Map<string, { annual: number; prices: number[] }>()
    items.forEach(item => {
      const name = item.item_name || item.seller_name || '기타'
      const annual = getAnnual(item)
      const price = parsePrice(item.supply_price_median)
      if (!productMap.has(name)) productMap.set(name, { annual: 0, prices: [] })
      const entry = productMap.get(name)!
      entry.annual += annual
      if (price > 0) entry.prices.push(price)
    })
    const topSellers = Array.from(productMap.entries())
      .sort((a, b) => b[1].annual - a[1].annual)
      .slice(0, 5)
      .map(([name, val]) => ({
        name,
        annual: val.annual,
        avgPrice: val.prices.length > 0 ? Math.round(val.prices.reduce((s, p) => s + p, 0) / val.prices.length) : 0,
        minPrice: val.prices.length > 0 ? Math.min(...val.prices) : 0,
      }))

    // 포장단위별 데이터 (규격별 제품 점유율 포함)
    const packMap = new Map<string, {
      prices: number[]
      count: number
      products: Map<string, { annual: number; prices: number[] }>
    }>()

    items.forEach(item => {
      const spec = item.item_standard || '-'
      const qty = String(item.total_quantity || '')
      const pkg = item.package_type || ''
      const key = `${spec}||${qty}||${pkg}`
      const price = parsePrice(item.supply_price_median)
      const annual = getAnnual(item)
      const productName = item.item_name || item.seller_name || '기타'

      if (!packMap.has(key)) packMap.set(key, { prices: [], count: 0, products: new Map() })
      const entry = packMap.get(key)!
      if (price > 0) entry.prices.push(price)
      entry.count++

      if (!entry.products.has(productName)) entry.products.set(productName, { annual: 0, prices: [] })
      const prod = entry.products.get(productName)!
      prod.annual += annual
      if (price > 0) prod.prices.push(price)
    })

    const packUnits = Array.from(packMap.entries())
      .map(([key, val]) => {
        const [spec, qty, pkg] = key.split('||')
        const sortedP = val.prices.sort((a, b) => a - b)
        const packAnnual = Array.from(val.products.values()).reduce((s, p) => s + p.annual, 0)

        const topProducts = Array.from(val.products.entries())
          .sort((a, b) => b[1].annual - a[1].annual)
          .slice(0, 5)
          .map(([name, pval]) => ({
            name,
            annual: pval.annual,
            avgPrice: pval.prices.length > 0 ? Math.round(pval.prices.reduce((s, p) => s + p, 0) / pval.prices.length) : 0,
            minPrice: pval.prices.length > 0 ? Math.min(...pval.prices) : 0,
            sharePct: packAnnual > 0 ? pval.annual / packAnnual * 100 : 0,
          }))

        return {
          spec,
          qty,
          pkg,
          minPrice: sortedP[0] || 0,
          avgPrice: sortedP.length > 0 ? Math.round(sortedP.reduce((s, p) => s + p, 0) / sortedP.length) : 0,
          count: val.count,
          packAnnual,
          topProducts,
        }
      })
      .filter(p => p.minPrice > 0)
      .sort((a, b) => b.packAnnual - a.packAnnual)

    // 단일/복합
    const singleCount = items.filter(i => i.single_complex === '단일').length
    const complexCount = items.filter(i => i.single_complex === '복합').length

    // ATC3
    const atcMap = new Map<string, number>()
    items.forEach(i => { if (i.atc3_name) atcMap.set(i.atc3_name, (atcMap.get(i.atc3_name) || 0) + 1) })
    const topAtc = Array.from(atcMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || ''

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