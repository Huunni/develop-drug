'use client'

import { useState } from 'react'

interface DrugItem {
  ITEM_SEQ: string
  ITEM_NAME: string
  ITEM_ENG_NAME: string
  ENTP_NAME: string
  ENTP_ENG_NAME: string
  CNSGN_MANUF: string | null
  ETC_OTC_CODE: string
  FORM_CODE_NAME: string
  PACK_UNIT: string
  CANCEL_NAME: string
  ITEM_PERMIT_DATE: string
  MATERIAL_NAME: string
  ATC_CODE: string
  MAIN_INGR_ENG: string
  STORAGE_METHOD: string
  VALID_TERM: string
}

interface TopProduct {
  name: string
  annual: number
  avgPrice: number
  minPrice: number
  sharePct: number
}

interface PackUnit {
  spec: string
  qty: string
  pkg: string
  minPrice: number
  avgPrice: number
  count: number
  packAnnual: number
  topProducts: TopProduct[]
}

interface MarketData {
  totalItems: number
  annualMarket: number
  medianPrice: number
  minPrice: number
  avgPrice: number
  topSellers: { name: string; annual: number; avgPrice: number; minPrice: number }[]
  topAtc: string
  latestPeriod: string
  packUnits: PackUnit[]
  singleCount: number
  complexCount: number
}

interface Candidate {
  ingredient: string
  market: MarketData
  addedAt: string
}

type SearchType = 'ingredient' | 'ingredientKo' | 'name' | 'licensor'
type Filter = '전체' | '정상' | '그 외'
type TypeFilter = '전체' | '단일제' | '복합제'
type OtcFilter = '전체' | '전문' | '일반'
type MenuType = 'search' | 'candidates'

const SEARCH_TABS: { value: SearchType; label: string; placeholder: string }[] = [
  { value: 'ingredient', label: '성분명(영문)', placeholder: 'acetaminophen' },
  { value: 'ingredientKo', label: '성분명(한글)', placeholder: '아세트아미노펜' },
  { value: 'name', label: '품목명(한글)', placeholder: '타이레놀' },
  { value: 'licensor', label: '업체명', placeholder: '한풍제약' },
]

function BatchCalculator({ medianPrice, marketShare, annualMarket }: {
  medianPrice: number
  marketShare: number
  annualMarket: number
}) {
  const [batchSize, setBatchSize] = useState(500000)
  const [packUnit, setPackUnit] = useState(10)
  const [costRate, setCostRate] = useState(80)
  const [customPrice, setCustomPrice] = useState(medianPrice)

  const packsPerBatch = batchSize / packUnit
  const revenuePerBatch = packsPerBatch * customPrice
  const costPerBatch = revenuePerBatch * (costRate / 100)
  const myAnnualRevenue = annualMarket * (marketShare / 100)
  const batchesPerYear = costPerBatch > 0 ? Math.round(myAnnualRevenue / costPerBatch) : 0

  return (
    <div style={{ background: '#f8f8f8', borderRadius: 10, padding: 16, marginTop: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>⚙️ 배치 생산 계산기</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
        {[
          { label: '배치 생산량 (정)', value: batchSize, setter: setBatchSize },
          { label: '포장 단위 (정/개)', value: packUnit, setter: setPackUnit },
          { label: '공급가 (원)', value: customPrice, setter: setCustomPrice },
          { label: '생산원가율 (%)', value: costRate, setter: setCostRate },
        ].map(({ label, value, setter }) => (
          <div key={label}>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>{label}</div>
            <input type="number" value={value} onChange={e => setter(Number(e.target.value))}
              style={{ width: '100%', padding: '6px 8px', border: '1px solid #e5e5e5', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
        {[
          { label: '배치당 생산 개수', value: `${Math.round(packsPerBatch).toLocaleString()}개` },
          { label: '배치당 매출', value: `${Math.round(revenuePerBatch / 10000).toLocaleString()}만원` },
          { label: '배치당 원가', value: `${Math.round(costPerBatch / 10000).toLocaleString()}만원` },
          { label: '연간 예상 매출', value: `${(myAnnualRevenue / 100000000).toFixed(1)}억원` },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: '#fff', borderRadius: 8, padding: '10px 12px', border: '1px solid #e5e5e5' }}>
            <div style={{ fontSize: 10, color: '#888', marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{value}</div>
          </div>
        ))}
      </div>
      <div style={{ background: '#1a4a7a', borderRadius: 8, padding: '12px 16px', marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 12, color: '#93c5fd' }}>점유율 {marketShare.toFixed(1)}% 기준 연간 배치수</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>{batchesPerYear} 배치/년</div>
      </div>
    </div>
  )
}

function PackMarketPanel({ pack, annualMarket }: { pack: PackUnit; annualMarket: number }) {
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null)
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  return (
    <div style={{ background: '#f0f7ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: 16, marginTop: 8 }}>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, color: '#1a4a7a' }}>
        📦 {pack.spec} / {pack.qty}개 {pack.pkg} 시장
      </div>
      <div style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>
        규격 시장규모: {(pack.packAnnual / 100000000).toFixed(1)}억원 · 전체 시장의 {annualMarket > 0 ? (pack.packAnnual / annualMarket * 100).toFixed(1) : 0}%
      </div>

      {pack.topProducts.map((p, i) => (
        <div key={p.name} style={{ marginBottom: 8 }}>
          <div
            onClick={() => setExpandedProduct(expandedProduct === p.name ? null : p.name)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#fff', borderRadius: 8, cursor: 'pointer', border: expandedProduct === p.name ? `1px solid ${colors[i]}` : '1px solid #e5e5e5' }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: colors[i], display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
              {i + 1}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</span>
                <span style={{ fontSize: 12, color: '#888' }}>
                  {(p.annual / 100000000).toFixed(1)}억/년 · {p.sharePct.toFixed(1)}%
                </span>
              </div>
              <div style={{ background: '#e5e5e5', borderRadius: 4, height: 5 }}>
                <div style={{ background: colors[i], borderRadius: 4, height: 5, width: `${p.sharePct}%` }} />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                <span style={{ fontSize: 11, color: '#ef4444' }}>최저 {p.minPrice.toLocaleString()}원</span>
                <span style={{ fontSize: 11, color: '#3b82f6' }}>평균 {p.avgPrice.toLocaleString()}원</span>
              </div>
            </div>
            <span style={{ fontSize: 11, color: '#888' }}>{expandedProduct === p.name ? '▲' : '계산기 ▼'}</span>
          </div>
          {expandedProduct === p.name && (
            <BatchCalculator
              medianPrice={p.avgPrice}
              marketShare={p.sharePct}
              annualMarket={pack.packAnnual}
            />
          )}
        </div>
      ))}

      {/* 내가 진입한다면 */}
      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: 16, marginTop: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, color: '#92400e' }}>💡 이 규격으로 5% 점유한다면?</div>
        <BatchCalculator
          medianPrice={pack.avgPrice}
          marketShare={5}
          annualMarket={pack.packAnnual}
        />
      </div>
    </div>
  )
}

export default function Home() {
  const [menu, setMenu] = useState<MenuType>('search')
  const [query, setQuery] = useState('')
  const [searchType, setSearchType] = useState<SearchType>('ingredient')
  const [items, setItems] = useState<DrugItem[]>([])
  const [total, setTotal] = useState(0)
  const [pageNo, setPageNo] = useState(1)
  const [numOfRows, setNumOfRows] = useState(10)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [selected, setSelected] = useState<DrugItem | null>(null)
  const [filter, setFilter] = useState<Filter>('전체')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('전체')
  const [otcFilter, setOtcFilter] = useState<OtcFilter>('전체')
  const [market, setMarket] = useState<MarketData | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [currentIngredient, setCurrentIngredient] = useState('')
  const [toast, setToast] = useState('')
  const [expandedCandidate, setExpandedCandidate] = useState<string | null>(null)
  const [expandedSeller, setExpandedSeller] = useState<string | null>(null)
  const [expandedPack, setExpandedPack] = useState<string | null>(null)
  const [candQuery, setCandQuery] = useState('')
  const [candLoading, setCandLoading] = useState(false)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const fetchPage = async (page: number, rows?: number, cancelF?: Filter, typeF?: TypeFilter, otcF?: OtcFilter) => {
    if (!query.trim()) return
    setLoading(true)
    const rowCount = rows ?? numOfRows
    const cancelFilter = cancelF ?? filter
    const tf = typeF ?? typeFilter
    const otc = otcF ?? otcFilter
    try {
      const param = `${searchType}=${encodeURIComponent(query)}`
      const cancelParam = cancelFilter !== '전체' ? `&cancel=${encodeURIComponent(cancelFilter)}` : ''
      const typeParam = tf === '단일제' ? '&type=single' : tf === '복합제' ? '&type=complex' : ''
      const otcParam = otc === '전문' ? '&otc=전문의약품' : otc === '일반' ? '&otc=일반의약품' : ''
      const res = await fetch(`/api/drug?${param}&page=${page}&rows=${rowCount}${cancelParam}${typeParam}${otcParam}`)
      const data = await res.json()
      setItems(data.items || [])
      setTotal(data.total || 0)
      setPageNo(page)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  const fetchMarket = async (q: string, type: SearchType): Promise<MarketData | null> => {
    if (type !== 'ingredient' && type !== 'ingredientKo') return null
    try {
      const param = type === 'ingredientKo'
        ? `ingredientKo=${encodeURIComponent(q)}`
        : `ingredientEng=${encodeURIComponent(q)}`
      const res = await fetch(`/api/market?${param}`)
      return await res.json()
    } catch {
      return null
    }
  }

  const search = async () => {
    setSearched(true)
    setPageNo(1)
    setFilter('전체')
    setTypeFilter('전체')
    setOtcFilter('전체')
    setMarket(null)
    setCurrentIngredient(query)
    await fetchPage(1, numOfRows, '전체', '전체', '전체')
    const m = await fetchMarket(query, searchType)
    setMarket(m)
  }

  const addCandidate = async (ingredientName: string, marketData: MarketData | null) => {
    if (!marketData || marketData.totalItems === 0) {
      showToast('시장 데이터가 없는 성분은 추가할 수 없어요')
      return
    }
    if (candidates.find(c => c.ingredient === ingredientName)) {
      showToast('이미 추가된 성분입니다')
      return
    }
    setCandidates(prev => [...prev, {
      ingredient: ingredientName,
      market: marketData,
      addedAt: new Date().toLocaleDateString('ko-KR'),
    }])
    showToast(`✅ "${ingredientName}" 개발 후보에 추가됐어요!`)
  }

  const removeCandidate = (ingredient: string) => {
    setCandidates(prev => prev.filter(c => c.ingredient !== ingredient))
  }

  const searchAndAddCandidate = async () => {
    if (!candQuery.trim()) return
    setCandLoading(true)
    try {
      const res = await fetch(`/api/market?ingredientKo=${encodeURIComponent(candQuery)}`)
      const data: MarketData = await res.json()
      await addCandidate(candQuery, data)
    } catch {
      showToast('검색 중 오류가 발생했어요')
    } finally {
      setCandLoading(false)
      setCandQuery('')
    }
  }

  const handleRowsChange = (newRows: number) => {
    setNumOfRows(newRows)
    fetchPage(1, newRows)
  }

  const totalPages = Math.ceil(total / numOfRows)

  const formatDate = (d: string) => {
    if (!d || d.length !== 8) return d
    return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`
  }

  const Row = ({ label, value }: { label: string; value: string }) => (
    <div style={{ background: '#f8f8f8', borderRadius: 8, padding: '10px 14px' }}>
      <div style={{ fontSize: 11, color: '#888', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 500 }}>{value || '-'}</div>
    </div>
  )

  const currentTab = SEARCH_TABS.find(t => t.value === searchType)!
  const normalCount = items.filter(i => i.CANCEL_NAME === '정상').length
  const cancelCount = items.filter(i => i.CANCEL_NAME !== '정상').length

  const FilterBtn = ({ label, active, color, onClick }: { label: string; active: boolean; color?: string; onClick: () => void }) => (
    <button onClick={onClick} style={{
      padding: '3px 10px', border: '1px solid #e5e5e5', borderRadius: 20,
      background: active ? (color || '#111') : '#fff',
      color: active ? '#fff' : '#888', fontSize: 12, cursor: 'pointer'
    }}>{label}</button>
  )

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', minHeight: '100vh', fontFamily: 'sans-serif' }}>

      {/* 사이드바 */}
      <div style={{ background: '#f8f8f8', borderRight: '1px solid #e5e5e5', padding: '24px 16px' }}>
        <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 24 }}>PharmDash</div>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>메뉴</div>
        <button onClick={() => setMenu('search')} style={{
          display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: 8, border: 'none',
          background: menu === 'search' ? '#fff' : 'transparent', marginBottom: 4, cursor: 'pointer', fontSize: 14,
          color: menu === 'search' ? '#111' : '#888', fontWeight: menu === 'search' ? 600 : 400,
        }}>성분 검색</button>
        <button onClick={() => setMenu('candidates')} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
          padding: '8px 12px', borderRadius: 8, border: 'none',
          background: menu === 'candidates' ? '#fff' : 'transparent', marginBottom: 4, cursor: 'pointer', fontSize: 14,
          color: menu === 'candidates' ? '#111' : '#888', fontWeight: menu === 'candidates' ? 600 : 400,
        }}>
          <span>개발 후보</span>
          {candidates.length > 0 && (
            <span style={{ background: '#3b82f6', color: '#fff', borderRadius: 10, fontSize: 11, padding: '1px 7px', fontWeight: 700 }}>
              {candidates.length}
            </span>
          )}
        </button>
      </div>

      {/* 메인 */}
      <div style={{ padding: 32 }}>

        {/* ───── 성분 검색 ───── */}
        {menu === 'search' && (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>의약품 개발 자동화 대시보드</h1>
            <p style={{ color: '#888', fontSize: 14, marginBottom: 24 }}>성분명·품목명·업체명으로 허가 제품을 조회합니다</p>

            <div style={{ display: 'flex', gap: 0, marginBottom: 12, borderBottom: '1px solid #e5e5e5' }}>
              {SEARCH_TABS.map(tab => (
                <button key={tab.value} onClick={() => { setSearchType(tab.value); setQuery(''); setSearched(false); setMarket(null) }}
                  style={{ padding: '8px 18px', border: 'none', borderBottom: searchType === tab.value ? '2px solid #111' : '2px solid transparent', background: 'none', fontSize: 14, fontWeight: searchType === tab.value ? 600 : 400, color: searchType === tab.value ? '#111' : '#888', cursor: 'pointer', marginBottom: -1 }}>
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()}
                placeholder={currentTab.placeholder}
                style={{ flex: 1, padding: '0 16px', height: 44, border: '1px solid #e5e5e5', borderRadius: 8, fontSize: 14 }} />
              <button onClick={search}
                style={{ padding: '0 24px', height: 44, background: '#111', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>
                {loading ? '검색 중...' : '조회'}
              </button>
            </div>

            {searched && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>

                {/* 시장 분석 */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>시장 분석</div>
                    {market && market.totalItems > 0 && (
                      <button onClick={() => addCandidate(currentIngredient, market)}
                        style={{ padding: '6px 14px', background: candidates.find(c => c.ingredient === currentIngredient) ? '#e5e5e5' : '#111', color: candidates.find(c => c.ingredient === currentIngredient) ? '#888' : '#fff', border: 'none', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                        {candidates.find(c => c.ingredient === currentIngredient) ? '✅ 후보 추가됨' : '＋ 개발 후보로 추가'}
                      </button>
                    )}
                  </div>

                  {market && market.totalItems > 0 ? (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                        {[
                          { label: '연간 시장규모', value: `${(market.annualMarket / 100000000).toFixed(1)}억원` },
                          { label: '전체 품목 수', value: `${market.totalItems}개` },
                          { label: '최저 공급가', value: `${market.minPrice.toLocaleString()}원` },
                          { label: '평균 공급가', value: `${market.avgPrice.toLocaleString()}원` },
                        ].map(({ label, value }) => (
                          <div key={label} style={{ background: '#f0f7ff', borderRadius: 10, padding: '14px 16px', border: '1px solid #d0e4f7' }}>
                            <div style={{ fontSize: 11, color: '#666', marginBottom: 6 }}>{label}</div>
                            <div style={{ fontSize: 20, fontWeight: 700, color: '#1a4a7a' }}>{value}</div>
                          </div>
                        ))}
                      </div>

                      <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 10, padding: 16, marginBottom: 16 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 10 }}>판매사 TOP 5</div>
                        {market.topSellers.map((s, i) => {
                          const maxVal = market.topSellers[0]?.annual || 1
                          const pct = Math.round((s.annual / maxVal) * 100)
                          return (
                            <div key={s.name} style={{ marginBottom: 10 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ fontSize: 13 }}>{i + 1}. {s.name}</span>
                                <span style={{ fontSize: 12, color: '#888' }}>{(s.annual / 100000000).toFixed(1)}억/년</span>
                              </div>
                              <div style={{ background: '#f0f0f0', borderRadius: 4, height: 6 }}>
                                <div style={{ background: '#3b82f6', borderRadius: 4, height: 6, width: `${pct}%` }} />
                              </div>
                            </div>
                          )
                        })}
                        <div style={{ fontSize: 11, color: '#999', marginTop: 8 }}>기준: {market.latestPeriod}</div>
                      </div>
                    </>
                  ) : (
                    <div style={{ background: '#f8f8f8', borderRadius: 10, padding: 24, textAlign: 'center', color: '#888', fontSize: 14 }}>
                      {searchType === 'ingredient' || searchType === 'ingredientKo' ? '시장 데이터가 없습니다' : '성분명으로 검색하면 시장분석이 표시됩니다'}
                    </div>
                  )}
                </div>

                {/* 파트너 매칭 */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>파트너 매칭</div>
                    <div style={{ fontSize: 12, color: '#888' }}>총 {total}건</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: '#888', width: 36 }}>제형</span>
                      {(['전체', '단일제', '복합제'] as TypeFilter[]).map(f => (
                        <FilterBtn key={f} label={f} active={typeFilter === f} color="#3b82f6"
                          onClick={() => { setTypeFilter(f); fetchPage(1, numOfRows, filter, f, otcFilter) }} />
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: '#888', width: 36 }}>구분</span>
                      {(['전체', '전문', '일반'] as OtcFilter[]).map(f => (
                        <FilterBtn key={f} label={f} active={otcFilter === f} color="#8b5cf6"
                          onClick={() => { setOtcFilter(f); fetchPage(1, numOfRows, filter, typeFilter, f) }} />
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: '#888', width: 36 }}>상태</span>
                      {(['전체', '정상', '그 외'] as Filter[]).map(f => (
                        <FilterBtn key={f} label={f} active={filter === f}
                          onClick={() => { setFilter(f); fetchPage(1, numOfRows, f, typeFilter, otcFilter) }} />
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <div style={{ flex: 1, background: '#EAF3DE', borderRadius: 8, padding: '8px 12px', textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: '#27500A' }}>정상</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#27500A' }}>{normalCount}개</div>
                    </div>
                    <div style={{ flex: 1, background: '#FCEBEB', borderRadius: 8, padding: '8px 12px', textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: '#A32D2D' }}>취소/취하</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#A32D2D' }}>{cancelCount}개</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 12, justifyContent: 'flex-end' }}>
                    {[10, 20, 50].map(n => (
                      <button key={n} onClick={() => handleRowsChange(n)}
                        style={{ padding: '3px 10px', border: '1px solid #e5e5e5', borderRadius: 20, background: numOfRows === n ? '#111' : '#fff', color: numOfRows === n ? '#fff' : '#888', fontSize: 12, cursor: 'pointer' }}>
                        {n}개
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                    {items.map(item => (
                      <div key={item.ITEM_SEQ} onClick={() => setSelected(item)}
                        style={{ border: '1px solid #e5e5e5', borderRadius: 10, padding: '12px 16px', background: '#fff', cursor: 'pointer', opacity: item.CANCEL_NAME !== '정상' ? 0.6 : 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{item.ITEM_NAME}</div>
                            <div style={{ fontSize: 12, color: '#888' }}>{item.ETC_OTC_CODE}</div>
                          </div>
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            {item.MAIN_INGR_ENG && item.MAIN_INGR_ENG.includes('/') && (
                              <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 10, background: '#ede9fe', color: '#6d28d9' }}>복합제</span>
                            )}
                            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: item.CANCEL_NAME === '정상' ? '#EAF3DE' : '#FCEBEB', color: item.CANCEL_NAME === '정상' ? '#27500A' : '#A32D2D' }}>
                              {item.CANCEL_NAME}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                          <div style={{ background: '#f8f8f8', borderRadius: 6, padding: '6px 10px' }}>
                            <div style={{ fontSize: 10, color: '#888', marginBottom: 1 }}>허가권자</div>
                            <div style={{ fontSize: 12, fontWeight: 500 }}>{item.ENTP_NAME}</div>
                          </div>
                          <div style={{ background: '#f8f8f8', borderRadius: 6, padding: '6px 10px' }}>
                            <div style={{ fontSize: 10, color: '#888', marginBottom: 1 }}>제조원</div>
                            <div style={{ fontSize: 12, fontWeight: 500 }}>{item.CNSGN_MANUF || '자체생산'}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
                      <button onClick={() => fetchPage(pageNo - 1)} disabled={pageNo === 1 || loading}
                        style={{ padding: '4px 10px', border: '1px solid #e5e5e5', borderRadius: 6, background: '#fff', cursor: pageNo === 1 ? 'not-allowed' : 'pointer', color: pageNo === 1 ? '#ccc' : '#111', fontSize: 13 }}>이전</button>
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        const start = Math.max(1, pageNo - 2)
                        const p = start + i
                        if (p > totalPages) return null
                        return (
                          <button key={p} onClick={() => fetchPage(p)}
                            style={{ padding: '4px 10px', border: '1px solid #e5e5e5', borderRadius: 6, background: p === pageNo ? '#111' : '#fff', color: p === pageNo ? '#fff' : '#111', cursor: 'pointer', fontSize: 13 }}>
                            {p}
                          </button>
                        )
                      })}
                      <button onClick={() => fetchPage(pageNo + 1)} disabled={pageNo === totalPages || loading}
                        style={{ padding: '4px 10px', border: '1px solid #e5e5e5', borderRadius: 6, background: '#fff', cursor: pageNo === totalPages ? 'not-allowed' : 'pointer', color: pageNo === totalPages ? '#ccc' : '#111', fontSize: 13 }}>다음</button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!searched && (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#888' }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>💊</div>
                <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>성분명을 검색해보세요</div>
                <div style={{ fontSize: 14 }}>시장분석과 파트너 매칭 정보를 한눈에 확인할 수 있습니다</div>
              </div>
            )}
          </>
        )}

        {/* ───── 개발 후보 ───── */}
        {menu === 'candidates' && (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>개발 후보 목록</h1>
            <p style={{ color: '#888', fontSize: 14, marginBottom: 20 }}>성분 단위로 시장성을 분석하고 배치 생산 계획을 수립합니다</p>

            <div style={{ display: 'flex', gap: 8, marginBottom: 24, padding: 16, background: '#f8f8f8', borderRadius: 10 }}>
              <input value={candQuery} onChange={e => setCandQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchAndAddCandidate()}
                placeholder="성분명 입력 후 후보 추가 (예: 나프록센)"
                style={{ flex: 1, padding: '0 16px', height: 40, border: '1px solid #e5e5e5', borderRadius: 8, fontSize: 14 }} />
              <button onClick={searchAndAddCandidate} disabled={candLoading}
                style={{ padding: '0 20px', height: 40, background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontWeight: 600 }}>
                {candLoading ? '검색 중...' : '＋ 추가'}
              </button>
            </div>

            {candidates.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#888' }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
                <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>아직 후보가 없어요</div>
                <div style={{ fontSize: 14 }}>위 검색창에서 성분명을 검색하거나, 성분 검색 페이지에서 추가해주세요</div>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1.5fr 0.8fr 40px', gap: 8, padding: '8px 16px', background: '#f0f0f0', borderRadius: 8, fontSize: 11, color: '#888', fontWeight: 600, marginBottom: 8 }}>
                  <span>성분명</span><span>시장규모</span><span>단일/복합</span><span>최저/평균가</span><span>시장 1위</span><span>추가일</span><span></span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {candidates.map((c) => {
                    const isExpanded = expandedCandidate === c.ingredient
                    const topSeller = c.market?.topSellers?.[0]

                    return (
                      <div key={c.ingredient} style={{ border: '1px solid #e5e5e5', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>

                        {/* 목차 행 */}
                        <div onClick={() => setExpandedCandidate(isExpanded ? null : c.ingredient)}
                          style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1.5fr 0.8fr 40px', gap: 8, padding: '14px 16px', cursor: 'pointer', alignItems: 'center', background: isExpanded ? '#f8faff' : '#fff' }}>
                          <div style={{ fontWeight: 700, fontSize: 15 }}>{c.ingredient}</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#1a4a7a' }}>
                            {(c.market.annualMarket / 100000000).toFixed(1)}억
                          </div>
                          <div style={{ fontSize: 12 }}>
                            <span style={{ background: '#dbeafe', color: '#1e40af', borderRadius: 4, padding: '2px 6px', marginRight: 4 }}>단일 {c.market.singleCount}</span>
                            <span style={{ background: '#ede9fe', color: '#6d28d9', borderRadius: 4, padding: '2px 6px' }}>복합 {c.market.complexCount}</span>
                          </div>
                          <div style={{ fontSize: 12 }}>
                            <div style={{ color: '#ef4444', fontWeight: 600 }}>{c.market.minPrice.toLocaleString()}원</div>
                            <div style={{ color: '#3b82f6' }}>{c.market.avgPrice.toLocaleString()}원</div>
                          </div>
                          <div style={{ fontSize: 12 }}>
                            {topSeller ? (
                              <>
                                <div style={{ fontWeight: 600 }}>{topSeller.name}</div>
                                <div style={{ color: '#888' }}>{(topSeller.annual / 100000000).toFixed(1)}억/년</div>
                              </>
                            ) : '-'}
                          </div>
                          <div style={{ fontSize: 11, color: '#888' }}>{c.addedAt}</div>
                          <span style={{ fontSize: 14, color: '#888' }}>{isExpanded ? '▲' : '▼'}</span>
                        </div>

                        {/* 펼침 */}
                        {isExpanded && (
                          <div style={{ padding: '0 16px 16px', borderTop: '1px solid #e5e5e5' }}>

                            {/* 포장단위별 — 클릭하면 해당 규격 시장 펼침 */}
                            {c.market.packUnits && c.market.packUnits.length > 0 && (
                              <div style={{ marginTop: 16, marginBottom: 8 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>📦 포장단위별 시장 (클릭하면 상세 분석)</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr', gap: 6, fontSize: 11, color: '#888', padding: '0 4px', marginBottom: 4 }}>
                                  <span>규격</span><span>수량</span><span>포장</span><span>최저가</span><span>평균가</span><span>규격시장</span>
                                </div>
                                {c.market.packUnits.map((p, i) => {
                                  const packKey = `${c.ingredient}-${p.spec}-${p.qty}-${p.pkg}`
                                  const isPackExpanded = expandedPack === packKey
                                  return (
                                    <div key={i}>
                                      <div
                                        onClick={() => setExpandedPack(isPackExpanded ? null : packKey)}
                                        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr', gap: 6, padding: '8px 4px', borderTop: '1px solid #f0f0f0', fontSize: 13, alignItems: 'center', cursor: 'pointer', background: isPackExpanded ? '#f0f7ff' : 'transparent', borderRadius: 6 }}>
                                        <span style={{ fontWeight: 600, color: isPackExpanded ? '#1a4a7a' : '#111' }}>{p.spec}</span>
                                        <span style={{ color: '#666' }}>{p.qty}개</span>
                                        <span style={{ color: '#666' }}>{p.pkg}</span>
                                        <span style={{ color: '#ef4444', fontWeight: 600 }}>{p.minPrice.toLocaleString()}원</span>
                                        <span style={{ color: '#3b82f6', fontWeight: 600 }}>{p.avgPrice.toLocaleString()}원</span>
                                        <span style={{ color: '#888', fontSize: 12 }}>{(p.packAnnual / 100000000).toFixed(1)}억 {isPackExpanded ? '▲' : '▼'}</span>
                                      </div>
                                      {isPackExpanded && (
                                        <PackMarketPanel pack={p} annualMarket={c.market.annualMarket} />
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            )}

                            {/* 전체 성분 시장 점유율 */}
                            {c.market.topSellers.length > 0 && (
                              <div style={{ marginTop: 16, marginBottom: 16 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>📊 전체 성분 시장 점유율</div>
                                {c.market.topSellers.map((s, i) => {
                                  const totalSales = c.market.topSellers.reduce((sum, t) => sum + t.annual, 0)
                                  const sharePct = totalSales > 0 ? s.annual / totalSales * 100 : 0
                                  const key = `${c.ingredient}-overall-${s.name}`
                                  const isSellerExpanded = expandedSeller === key
                                  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
                                  return (
                                    <div key={s.name} style={{ marginBottom: 8 }}>
                                      <div onClick={() => setExpandedSeller(isSellerExpanded ? null : key)}
                                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#f8f8f8', borderRadius: 8, cursor: 'pointer', border: isSellerExpanded ? `1px solid ${colors[i]}` : '1px solid transparent' }}>
                                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: colors[i], display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                                          {i + 1}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <span style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</span>
                                            <span style={{ fontSize: 12, color: '#888' }}>{(s.annual / 100000000).toFixed(1)}억/년 · {sharePct.toFixed(1)}%</span>
                                          </div>
                                          <div style={{ background: '#e5e5e5', borderRadius: 4, height: 5 }}>
                                            <div style={{ background: colors[i], borderRadius: 4, height: 5, width: `${sharePct}%` }} />
                                          </div>
                                          <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                                            <span style={{ fontSize: 11, color: '#ef4444' }}>최저 {s.minPrice.toLocaleString()}원</span>
                                            <span style={{ fontSize: 11, color: '#3b82f6' }}>평균 {s.avgPrice.toLocaleString()}원</span>
                                          </div>
                                        </div>
                                        <span style={{ fontSize: 11, color: '#888' }}>{isSellerExpanded ? '▲' : '계산기 ▼'}</span>
                                      </div>
                                      {isSellerExpanded && (
                                        <BatchCalculator
                                          medianPrice={s.avgPrice}
                                          marketShare={sharePct}
                                          annualMarket={c.market.annualMarket}
                                        />
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            )}

                            {/* 내가 5% 진입 */}
                            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: 16 }}>
                              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, color: '#92400e' }}>💡 전체 시장에서 5% 점유한다면?</div>
                              <BatchCalculator
                                medianPrice={c.market.medianPrice}
                                marketShare={5}
                                annualMarket={c.market.annualMarket}
                              />
                            </div>

                            <button onClick={() => removeCandidate(c.ingredient)}
                              style={{ marginTop: 12, padding: '6px 16px', background: 'none', border: '1px solid #e5e5e5', borderRadius: 6, fontSize: 12, color: '#888', cursor: 'pointer' }}>
                              후보에서 제거
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* 토스트 */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', background: '#111', color: '#fff', padding: '12px 24px', borderRadius: 24, fontSize: 14, zIndex: 200, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
          {toast}
        </div>
      )}

      {/* 상세 모달 */}
      {selected && (
        <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: 32, width: 600, maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{selected.ITEM_NAME}</div>
                <div style={{ fontSize: 13, color: '#888' }}>{selected.ITEM_ENG_NAME}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#888' }}>✕</button>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 10 }}>허가 정보</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
              <Row label="허가권자" value={selected.ENTP_NAME} />
              <Row label="허가권자(영문)" value={selected.ENTP_ENG_NAME} />
              <Row label="제조원" value={selected.CNSGN_MANUF || '자체생산'} />
              <Row label="허가일" value={formatDate(selected.ITEM_PERMIT_DATE)} />
              <Row label="품목구분" value={selected.ETC_OTC_CODE} />
              <Row label="취소여부" value={selected.CANCEL_NAME} />
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 10 }}>제품 정보</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
              <Row label="포장단위" value={selected.PACK_UNIT} />
              <Row label="ATC 코드" value={selected.ATC_CODE} />
              <Row label="주성분(영문)" value={selected.MAIN_INGR_ENG} />
              <Row label="저장방법" value={selected.STORAGE_METHOD} />
              <Row label="유효기간" value={selected.VALID_TERM} />
              <Row label="품목일련번호" value={selected.ITEM_SEQ} />
            </div>
            {selected.MATERIAL_NAME && (
              <>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 10 }}>성분 정보</div>
                <div style={{ background: '#f8f8f8', borderRadius: 8, padding: '12px 14px', fontSize: 13, lineHeight: 1.7, color: '#444', marginBottom: 20 }}>
                  {selected.MATERIAL_NAME}
                </div>
              </>
            )}
            <button onClick={() => window.open(`https://nedrug.mfds.go.kr/pbp/CCBBB01/getItemDetail?itemSeq=${selected.ITEM_SEQ}`, '_blank')}
              style={{ width: '100%', padding: '12px', background: '#111', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>
              의약품안전나라에서 전체 정보 보기
            </button>
          </div>
        </div>
      )}
    </div>
  )
}