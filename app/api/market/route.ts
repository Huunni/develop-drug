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
    let query = supabase.from('drug_supply').select('*')

    if (ingredientKo) {
      query = query.ilike('ingredient_ko', `%${ingredientKo}%`)
    } else if (ingredientEng) {
      query = query.ilike('ingredient_eng', `%${ingredientEng}%`)
    }

    const { data, error } = await query
    if (error) throw error

    const items = data || []

    // 연간 시장규모 (월평균 × 12 합산)
    const totalMonthlyAvg = items.reduce((sum, i) => sum + (i.monthly_avg || 0), 0)
    const annualMarket = totalMonthlyAvg * 12

    // 공급가 중앙값 (0 제외)
    const prices = items.map(i => i.supply_price || 0).filter(p => p > 0).sort((a, b) => a - b)
    const medianPrice = prices.length > 0 ? prices[Math.floor(prices.length / 2)] : 0

    // 상위 판매사 TOP5
    const sellerMap = new Map<string, number>()
    items.forEach(i => {
      const seller = i.seller_name || '기타'
      sellerMap.set(seller, (sellerMap.get(seller) || 0) + (i.monthly_avg || 0))
    })
    const topSellers = Array.from(sellerMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, monthly_avg]) => ({ name, monthly_avg, annual: monthly_avg * 12 }))

    // ATC 코드 (가장 많은 것)
    const atcMap = new Map<string, number>()
    items.forEach(i => {
      if (i.atc3_code) atcMap.set(i.atc3_code, (atcMap.get(i.atc3_code) || 0) + 1)
    })
    const topAtc = Array.from(atcMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || ''

    // 데이터 기간
    const periods = items.map(i => i.data_end).filter(Boolean).sort()
    const latestPeriod = periods[periods.length - 1] || ''

    return NextResponse.json({
      totalItems: items.length,
      annualMarket,
      totalMonthlyAvg,
      medianPrice,
      topSellers,
      topAtc,
      latestPeriod,
    })

  } catch (error: any) {
    console.error('Market API 오류:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}