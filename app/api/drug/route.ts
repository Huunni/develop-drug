import { NextRequest, NextResponse } from 'next/server'
import {
  searchDrugByIngredient,
  searchDrugByIngredientKo,
  searchDrugByName,
  searchDrugByLicensor,
} from '@/app/lib/mfds'
import { supabase } from '@/app/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const ingredient = searchParams.get('ingredient')
  const ingredientKo = searchParams.get('ingredientKo')
  const name = searchParams.get('name')
  const licensor = searchParams.get('licensor')
  const pageNo = Number(searchParams.get('page') || '1')
  const numOfRows = Number(searchParams.get('rows') || '10')

  if (!ingredient && !ingredientKo && !name && !licensor) {
    return NextResponse.json({ error: '검색어를 입력해주세요' }, { status: 400 })
  }

  try {
    let result
    if (ingredient) result = await searchDrugByIngredient(ingredient, pageNo, numOfRows)
    else if (ingredientKo) result = await searchDrugByIngredientKo(ingredientKo, pageNo, numOfRows)
    else if (name) result = await searchDrugByName(name, pageNo, numOfRows)
    else result = await searchDrugByLicensor(licensor!, pageNo, numOfRows)

    const { items, totalCount } = result

    await supabase.from('drug_search_history').insert({
      ingredient: ingredient || ingredientKo || name || licensor,
      ingredient_ko: ingredientKo || name || null,
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