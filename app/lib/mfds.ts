import axios from 'axios'

const API_KEY = process.env.DRUG_API_KEY
const BASE_URL = 'https://apis.data.go.kr/1471000'

export async function searchDrugByIngredient(
  ingredient: string,
  pageNo = 1,
  numOfRows = 10
) {
  const res = await axios.get(
    `${BASE_URL}/DrugPrdtPrmsnInfoService07/getDrugPrdtPrmsnDtlInq06`,
    {
      params: {
        serviceKey: API_KEY,
        type: 'json',
        numOfRows,
        pageNo,
        ingr_eng_name: ingredient,
      },
      timeout: 10000,
    }
  )
  const body = res.data?.body
  return {
    items: body?.items || [],
    totalCount: body?.totalCount || 0,
  }
}

export async function searchDrugByName(
  itemName: string,
  pageNo = 1,
  numOfRows = 10
) {
  const res = await axios.get(
    `${BASE_URL}/DrugPrdtPrmsnInfoService07/getDrugPrdtPrmsnDtlInq06`,
    {
      params: {
        serviceKey: API_KEY,
        type: 'json',
        numOfRows,
        pageNo,
        item_name: itemName,
      },
      timeout: 10000,
    }
  )
  const body = res.data?.body
  return {
    items: body?.items || [],
    totalCount: body?.totalCount || 0,
  }
}