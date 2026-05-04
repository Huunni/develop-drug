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
      query = query.ilike('성분명', `%${ingredientKo}%`)
    } else if (ingredientEng) {
      query = query.ilike('성분명(영문)', `%${ingredientEng}%`)
    }

    const { data, error } = await query
    if (error) throw error

    const items = data || []

    // 월별 컬럼 목록
    const monthCols = [
      '2025-01','2025-02','2025-03','2025-04','2025-05','2025-06',
      '2025-07','2025-08','2025-09','2025-10','2025-11','2025-12','2026-01'
    ]

    // 각 품목의 월 합산 → 전체 연간 시장규모
    const annualMarket = items.reduce((sum, item) => {
      const itemTotal = monthCols.reduce((s, col) => s + (Number(item[col]) || 0), 0)
      return sum + itemTotal
    }, 0)

    // 공급가 중앙값
    const prices = items
      .map(i => {
        const raw = String(i['공급가(중앙값)'] || '').replace(/,/g, '')
        return Number(raw)
      })
      .filter(p => p > 0)
      .sort((a, b) => a - b)
    const medianPrice = prices.length > 0 ? prices[Math.floor(prices.length / 2)] : 0

    // 판매사 TOP5 (월별 합산 기준)
    const sellerMap = new Map<string, number>()
    items.forEach(item => {
      const seller = item['판매사명'] || '기타'
      const itemTotal = monthCols.reduce((s, col) => s + (Number(item[col]) || 0), 0)
      sellerMap.set(seller, (sellerMap.get(seller) || 0) + itemTotal)
    })
    const topSellers = Array.from(sellerMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, annual]) => ({ name, annual }))

    // ATC3 코드 (가장 많은 것)
    const atcMap = new Map<string, number>()
    items.forEach(i => {
      const atc = i['ATC3_코드명']
      if (atc) atcMap.set(atc, (atcMap.get(atc) || 0) + 1)
    })
    const topAtc = Array.from(atcMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || ''

    return NextResponse.json({
      totalItems: items.length,
      annualMarket,
      medianPrice,
      topSellers,
      topAtc,
      latestPeriod: '2026-01',
    })

  } catch (error: any) {
    console.error('Market API 오류:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}