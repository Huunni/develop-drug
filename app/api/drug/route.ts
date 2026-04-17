import { NextRequest, NextResponse } from 'next/server'
import { searchDrugByIngredient, searchDrugByName } from '@/app/lib/mfds'
import { supabase } from '@/app/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const ingredient = searchParams.get('ingredient')
  const name = searchParams.get('name')

  if (!ingredient && !name) {
    return NextResponse.json({ error: '검색어를 입력해주세요' }, { status: 400 })
  }

  try {
    const items = ingredient
      ? await searchDrugByIngredient(ingredient)
      : await searchDrugByName(name!)

    await supabase.from('drug_search_history').insert({
      ingredient: ingredient || name,
      ingredient_ko: name || null,
    })

    if (items.length > 0) {
      const cacheRows = items.map((item: any) => ({
        ingredient: ingredient || name,
        item_seq: item.ITEM_SEQ,
        item_name: item.ITEM_NAME,
        entp_name: item.ENTP_NAME,
        make_entp_name: item.MAKE_ENTP_NAME,
        form_code_name: item.FORM_CODE_NAME,
        pack_unit: item.PACK_UNIT,
        permit_date: item.PERMIT_DATE,
        cancel_name: item.CANCEL_NAME,
        raw_data: item,
      }))

      await supabase.from('drug_permit_cache').upsert(cacheRows, {
        onConflict: 'item_seq',
      })
    }

    return NextResponse.json({ items, total: items.length })

  } catch (error: any) {
    console.error('API 에러 상세:', error.message, error.response?.data)
    return NextResponse.json(
      { error: error.message, detail: error.response?.data },
      { status: 500 }
    )
  }
}