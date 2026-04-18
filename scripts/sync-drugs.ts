import axios from 'axios'
import { createClient } from '@supabase/supabase-js'

const API_KEY = 'eae705fe01ae4c144873fd6900d1732c37b62d328d666ea5b25963ddf95dc9ad'
const SUPABASE_URL = 'https://ttcfssyrrmepeggeaeqq.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0Y2Zzc3lycm1lcGVnZ2VhZXFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTk1OTY0MCwiZXhwIjoyMDkxNTM1NjQwfQ.teN9v34f-VhAofmbnjJXcJuKbpN8gEI6s-JLKW2LFTA'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const BASE_URL = 'https://apis.data.go.kr/1471000'

async function fetchPage(pageNo: number, numOfRows = 100) {
  const res = await axios.get(
    `${BASE_URL}/DrugPrdtPrmsnInfoService07/getDrugPrdtPrmsnDtlInq06`,
    {
      params: {
        serviceKey: API_KEY,
        type: 'json',
        numOfRows,
        pageNo,
      },
      timeout: 30000,
    }
  )
  const body = res.data?.body
  return {
    items: body?.items || [],
    totalCount: body?.totalCount || 0,
  }
}

async function syncAll() {
  console.log('전체 데이터 수집 시작...')

  const first = await fetchPage(1, 100)
  const totalCount = first.totalCount
  const totalPages = Math.ceil(totalCount / 100)

  console.log(`총 ${totalCount}건 / ${totalPages}페이지`)

  for (let page = 1; page <= totalPages; page++) {
    try {
      const { items } = page === 1 ? first : await fetchPage(page, 100)

      const rows = items.map((item: any) => ({
        item_seq: item.ITEM_SEQ,
        item_name: item.ITEM_NAME,
        item_eng_name: item.ITEM_ENG_NAME,
        entp_name: item.ENTP_NAME,
        entp_eng_name: item.ENTP_ENG_NAME,
        cnsgn_manuf: item.CNSGN_MANUF,
        etc_otc_code: item.ETC_OTC_CODE,
        item_permit_date: item.ITEM_PERMIT_DATE,
        cancel_date: item.CANCEL_DATE,
        cancel_name: item.CANCEL_NAME,
        pack_unit: item.PACK_UNIT,
        material_name: item.MATERIAL_NAME,
        atc_code: item.ATC_CODE,
        main_ingr_eng: item.MAIN_INGR_ENG,
        storage_method: item.STORAGE_METHOD,
        valid_term: item.VALID_TERM,
        main_item_ingr: item.MAIN_ITEM_INGR,
        ingr_name: item.INGR_NAME,
        raw_data: item,
      }))

      await supabase.from('drug_products').upsert(rows, { onConflict: 'item_seq' })

      console.log(`${page}/${totalPages} 완료 (${page * 100}건)`)

      await new Promise(r => setTimeout(r, 300))

    } catch (err) {
      console.error(`${page}페이지 오류:`, err)
      await new Promise(r => setTimeout(r, 2000))
    }
  }

  console.log('완료!')
}

syncAll()