import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const ingredient = searchParams.get('ingredient')
  const ingredientKo = searchParams.get('ingredientKo')
  const name = searchParams.get('name')
  const licensor = searchParams.get('licensor')
  const pageNo = Number(searchParams.get('page') || '1')
  const numOfRows = Number(searchParams.get('rows') || '10')
  const cancelFilter = searchParams.get('cancel') // '정상' | '그 외' | null

  if (!ingredient && !ingredientKo && !name && !licensor) {
    return NextResponse.json({ error: '검색어를 입력해주세요' }, { status: 400 })
  }

  try {
    let query = supabase
      .from('drug_products')
      .select('*', { count: 'exact' })

    if (ingredient) {
      query = query.ilike('main_ingr_eng', `%${ingredient}%`)
    } else if (ingredientKo) {
      query = query.ilike('main_item_ingr', `%${ingredientKo}%`)
    } else if (name) {
      query = query.ilike('item_name', `%${name}%`)
    } else if (licensor) {
      query = query.ilike('entp_name', `%${licensor}%`)
    }

    if (cancelFilter === '정상') {
      query = query.eq('cancel_name', '정상')
    } else if (cancelFilter === '그 외') {
      query = query.neq('cancel_name', '정상')
    }

    const from = (pageNo - 1) * numOfRows
    const to = from + numOfRows - 1

    const { data, count, error } = await query
      .range(from, to)
      .order('item_name')

    if (error) throw error

    const items = (data || []).map((item: any) => ({
      ITEM_SEQ: item.item_seq,
      ITEM_NAME: item.item_name,
      ITEM_ENG_NAME: item.item_eng_name,
      ENTP_NAME: item.entp_name,
      ENTP_ENG_NAME: item.entp_eng_name,
      CNSGN_MANUF: item.cnsgn_manuf,
      ETC_OTC_CODE: item.etc_otc_code,
      ITEM_PERMIT_DATE: item.item_permit_date,
      CANCEL_DATE: item.cancel_date,
      CANCEL_NAME: item.cancel_name,
      PACK_UNIT: item.pack_unit,
      MATERIAL_NAME: item.material_name,
      ATC_CODE: item.atc_code,
      MAIN_INGR_ENG: item.main_ingr_eng,
      STORAGE_METHOD: item.storage_method,
      VALID_TERM: item.valid_term,
    }))

    await supabase.from('drug_search_history').insert({
      ingredient: ingredient || ingredientKo || name || licensor,
      ingredient_ko: ingredientKo || name || null,
    })

    return NextResponse.json({
      items,
      total: count || 0,
      pageNo,
      numOfRows,
    })

  } catch (error: any) {
    console.error('Supabase 검색 오류:', error.message)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}