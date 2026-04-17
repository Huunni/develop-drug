import axios from 'axios'

const API_KEY = process.env.DRUG_API_KEY
const BASE_URL = 'https://apis.data.go.kr/1471000'

export async function searchDrugByIngredient(ingredient: string) {
  const res = await axios.get(
    `${BASE_URL}/DrugPrdtPrmsnInfoService07/getDrugPrdtPrmsnDtlInq06`,
    {
      params: {
        serviceKey: API_KEY,
        type: 'json',
        numOfRows: 20,
        pageNo: 1,
        ingr_eng_name: ingredient,
      },
      timeout: 10000,
    }
  )
  console.log('식약처 응답:', JSON.stringify(res.data).slice(0, 300))
  return res.data?.body?.items || []
}

export async function searchDrugByName(itemName: string) {
  const res = await axios.get(
    `${BASE_URL}/DrugPrdtPrmsnInfoService07/getDrugPrdtPrmsnDtlInq06`,
    {
      params: {
        serviceKey: API_KEY,
        type: 'json',
        numOfRows: 20,
        pageNo: 1,
        item_name: itemName,
      },
      timeout: 10000,
    }
  )
  console.log('식약처 응답:', JSON.stringify(res.data).slice(0, 300))
  return res.data?.body?.items || []
}