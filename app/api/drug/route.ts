import { NextRequest, NextResponse } from 'next/server'
import {
  searchDrugByIngredient,
  searchDrugByName,
  searchDrugByLicensor,
  searchDrugByMaker,
} from '@/app/lib/mfds'
import { supabase } from '@/app/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const ingredient = searchParams.get('ingredient')
  const name = searchParams.get('name')
  const licensor = searchParams.get('licensor')
  const maker = searchParams.get('maker')
  const pageNo = Number(searchParams.get('page') || '1')
  const numOfRows = 10

  if (!ingredient && !name && !licensor && !maker) {
    return NextResponse.json({ error: '검색어를 입력해주세요' }, { status: 400 })
  }

  try {
    let result
    if (ingredient) result = await searchDrugByIngredient(ingredient, pageNo, numOfRows)
    else if (name) result = await searchDrugByName(name, pageNo, numOfRows)
    else if (licensor) result = await searchDrugByLicensor(licensor, pageNo, numOfRows)
    else result = await searchDrugByMaker(maker!, pageNo, numOfRows)

    const { items, totalCount } = result

    await supabase.from('drug_search_history').insert({
      ingredient: ingredient || name || licensor || maker,
      ingredient_ko: name || null,
    })

    return NextResponse.json({ items, total: totalCount, pageNo, numOfRows })

  } catch (error: any) {
    console.error('API 에러:', error.message, error.response?.data)
    return NextResponse.json(
      { error: error.message, detail: error.response?.data },
      { status: 500 }
    )
  }
}