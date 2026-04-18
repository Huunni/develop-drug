import axios from 'axios'

const API_KEY = process.env.DRUG_API_KEY
const BASE_URL = 'https://apis.data.go.kr/1471000'

const baseParams = (pageNo: number, numOfRows: number) => ({
  serviceKey: API_KEY,
  type: 'json',
  numOfRows,
  pageNo,
})

async function fetchDrug(params: Record<string, unknown>) {
  const res = await axios.get(
    `${BASE_URL}/DrugPrdtPrmsnInfoService07/getDrugPrdtPrmsnDtlInq06`,
    { params, timeout: 10000 }
  )
  const body = res.data?.body
  return {
    items: body?.items || [],
    totalCount: body?.totalCount || 0,
  }
}

export async function searchDrugByIngredient(ingredient: string, pageNo = 1, numOfRows = 10) {
  return fetchDrug({ ...baseParams(pageNo, numOfRows), ingr_eng_name: ingredient })
}

export async function searchDrugByIngredientKo(ingredient: string, pageNo = 1, numOfRows = 10) {
  return fetchDrug({ ...baseParams(pageNo, numOfRows), ingr_name_kor: ingredient })
}

export async function searchDrugByName(itemName: string, pageNo = 1, numOfRows = 10) {
  return fetchDrug({ ...baseParams(pageNo, numOfRows), item_name: itemName })
}

export async function searchDrugByLicensor(entpName: string, pageNo = 1, numOfRows = 10) {
  return fetchDrug({ ...baseParams(pageNo, numOfRows), entp_name: entpName })
}