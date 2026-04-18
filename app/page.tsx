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

type SearchType = 'ingredient' | 'ingredientKo' | 'name' | 'licensor'
type Filter = '전체' | '정상' | '그 외'
type TypeFilter = '전체' | '단일제' | '복합제'

const SEARCH_TABS: { value: SearchType; label: string; placeholder: string }[] = [
  { value: 'ingredient', label: '성분명(영문)', placeholder: 'acetaminophen' },
  { value: 'ingredientKo', label: '성분명(한글)', placeholder: '아세트아미노펜' },
  { value: 'name', label: '품목명(한글)', placeholder: '타이레놀' },
  { value: 'licensor', label: '업체명', placeholder: '한풍제약' },
]

export default function Home() {
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
  const [market, setMarket] = useState<any>(null)

  const fetchPage = async (page: number, rows?: number, cancelF?: Filter, typeF?: TypeFilter) => {
    if (!query.trim()) return
    setLoading(true)
    const rowCount = rows ?? numOfRows
    const cancelFilter = cancelF ?? filter
    const tf = typeF ?? typeFilter
    try {
      const param = `${searchType}=${encodeURIComponent(query)}`
      const cancelParam = cancelFilter !== '전체' ? `&cancel=${encodeURIComponent(cancelFilter)}` : ''
      const typeParam = tf === '단일제' ? '&type=single' : tf === '복합제' ? '&type=complex' : ''
      const res = await fetch(`/api/drug?${param}&page=${page}&rows=${rowCount}${cancelParam}${typeParam}`)
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

  const fetchMarket = async (q: string, type: SearchType) => {
    if (type !== 'ingredient' && type !== 'ingredientKo') return
    try {
      const param = type === 'ingredientKo'
        ? `ingredientKo=${encodeURIComponent(q)}`
        : `ingredientEng=${encodeURIComponent(q)}`
      const res = await fetch(`/api/market?${param}`)
      const data = await res.json()
      setMarket(data)
    } catch {
      setMarket(null)
    }
  }

  const search = async () => {
    setSearched(true)
    setPageNo(1)
    setFilter('전체')
    setTypeFilter('전체')
    setMarket(null)
    await fetchPage(1, numOfRows, '전체', '전체')
    await fetchMarket(query, searchType)
  }

  const handleRowsChange = (newRows: number) => {
    setNumOfRows(newRows)
    setPageNo(1)
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

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', minHeight: '100vh', fontFamily: 'sans-serif' }}>

      {/* 사이드바 */}
      <div style={{ background: '#f8f8f8', borderRight: '1px solid #e5e5e5', padding: '24px 16px' }}>
        <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 24 }}>PharmDash</div>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>메뉴</div>
        <a href="/" style={{ display: 'block', padding: '8px 12px', borderRadius: 8, background: '#fff', marginBottom: 4, cursor: 'pointer', fontSize: 14, textDecoration: 'none', color: '#111' }}>성분 검색</a>
        <a href="#" style={{ display: 'block', padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 14, textDecoration: 'none', color: '#888' }}>파트너 목록</a>
      </div>

      {/* 메인 */}
      <div style={{ padding: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>의약품 개발 자동화 대시보드</h1>
        <p style={{ color: '#888', fontSize: 14, marginBottom: 24 }}>성분명·품목명·업체명으로 허가 제품을 조회합니다</p>

        {/* 검색 탭 */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 12, borderBottom: '1px solid #e5e5e5' }}>
          {SEARCH_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => { setSearchType(tab.value); setQuery(''); setSearched(false); setMarket(null) }}
              style={{
                padding: '8px 18px', border: 'none',
                borderBottom: searchType === tab.value ? '2px solid #111' : '2px solid transparent',
                background: 'none', fontSize: 14,
                fontWeight: searchType === tab.value ? 600 : 400,
                color: searchType === tab.value ? '#111' : '#888',
                cursor: 'pointer', marginBottom: -1,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 검색창 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder={currentTab.placeholder}
            style={{ flex: 1, padding: '0 16px', height: 44, border: '1px solid #e5e5e5', borderRadius: 8, fontSize: 14 }}
          />
          <button
            onClick={search}
            style={{ padding: '0 24px', height: 44, background: '#111', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}
          >
            {loading ? '검색 중...' : '조회'}
          </button>
        </div>

        {/* 좌우 분리 레이아웃 */}
        {searched && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>

            {/* 왼쪽: 시장 분석 */}
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: '#111' }}>시장 분석</div>

              {market && market.totalItems > 0 ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                    {[
                      { label: '연간 시장규모', value: `${(market.annualMarket / 100000000).toFixed(1)}억원` },
                      { label: '경쟁 품목 수', value: `${market.totalItems}개` },
                      { label: '월평균 공급량', value: `${Math.round(market.totalMonthlyAvg).toLocaleString()}EA` },
                      { label: '공급가 중앙값', value: `${Math.round(market.medianPrice).toLocaleString()}원` },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ background: '#f0f7ff', borderRadius: 10, padding: '14px 16px', border: '1px solid #d0e4f7' }}>
                        <div style={{ fontSize: 11, color: '#666', marginBottom: 6 }}>{label}</div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: '#1a4a7a' }}>{value}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 10, padding: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 12 }}>판매사 TOP 5</div>
                    {market.topSellers.map((s: any, i: number) => {
                      const maxVal = market.topSellers[0]?.monthly_avg || 1
                      const pct = Math.round((s.monthly_avg / maxVal) * 100)
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
                    {market.latestPeriod && (
                      <div style={{ fontSize: 11, color: '#999', marginTop: 8 }}>기준: {market.latestPeriod}</div>
                    )}
                  </div>
                </>
              ) : (
                <div style={{ background: '#f8f8f8', borderRadius: 10, padding: 24, textAlign: 'center', color: '#888', fontSize: 14 }}>
                  {searchType === 'ingredient' || searchType === 'ingredientKo'
                    ? '시장 데이터가 없습니다'
                    : '성분명으로 검색하면 시장분석이 표시됩니다'}
                </div>
              )}
            </div>

            {/* 오른쪽: 파트너 매칭 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>파트너 매칭</div>
                <div style={{ fontSize: 12, color: '#888' }}>총 {total}건</div>
              </div>

              {/* 필터들 */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                {/* 단일/복합 필터 */}
                {(['전체', '단일제', '복합제'] as TypeFilter[]).map(f => (
                  <button
                    key={f}
                    onClick={() => { setTypeFilter(f); fetchPage(1, numOfRows, filter, f) }}
                    style={{
                      padding: '3px 10px', border: '1px solid #e5e5e5', borderRadius: 20,
                      background: typeFilter === f ? '#3b82f6' : '#fff',
                      color: typeFilter === f ? '#fff' : '#888',
                      fontSize: 12, cursor: 'pointer'
                    }}
                  >
                    {f}
                  </button>
                ))}

                <div style={{ width: 1, background: '#e5e5e5', margin: '0 2px' }} />

                {/* 정상/취소 필터 */}
                {(['전체', '정상', '그 외'] as Filter[]).map(f => (
                  <button
                    key={f}
                    onClick={() => { setFilter(f); fetchPage(1, numOfRows, f, typeFilter) }}
                    style={{
                      padding: '3px 10px', border: '1px solid #e5e5e5', borderRadius: 20,
                      background: filter === f ? '#111' : '#fff',
                      color: filter === f ? '#fff' : '#888',
                      fontSize: 12, cursor: 'pointer'
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* 정상/취소 요약 */}
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

              {/* 페이지당 건수 */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 12, justifyContent: 'flex-end' }}>
                {[10, 20, 50].map(n => (
                  <button
                    key={n}
                    onClick={() => handleRowsChange(n)}
                    style={{
                      padding: '3px 10px', border: '1px solid #e5e5e5', borderRadius: 20,
                      background: numOfRows === n ? '#111' : '#fff',
                      color: numOfRows === n ? '#fff' : '#888',
                      fontSize: 12, cursor: 'pointer'
                    }}
                  >
                    {n}개
                  </button>
                ))}
              </div>

              {/* 카드 목록 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {items.map(item => (
                  <div
                    key={item.ITEM_SEQ}
                    onClick={() => setSelected(item)}
                    style={{
                      border: '1px solid #e5e5e5', borderRadius: 10, padding: '12px 16px',
                      background: '#fff', cursor: 'pointer',
                      opacity: item.CANCEL_NAME !== '정상' ? 0.6 : 1
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{item.ITEM_NAME}</div>
                        <div style={{ fontSize: 12, color: '#888' }}>{item.ETC_OTC_CODE}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        {item.MAIN_INGR_ENG && item.MAIN_INGR_ENG.includes('/') && (
                          <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 10, background: '#f0f0f0', color: '#666' }}>복합제</span>
                        )}
                        <span style={{
                          fontSize: 11, padding: '2px 8px', borderRadius: 20,
                          background: item.CANCEL_NAME === '정상' ? '#EAF3DE' : '#FCEBEB',
                          color: item.CANCEL_NAME === '정상' ? '#27500A' : '#A32D2D'
                        }}>
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

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
                  <button
                    onClick={() => fetchPage(pageNo - 1)}
                    disabled={pageNo === 1 || loading}
                    style={{ padding: '4px 10px', border: '1px solid #e5e5e5', borderRadius: 6, background: '#fff', cursor: pageNo === 1 ? 'not-allowed' : 'pointer', color: pageNo === 1 ? '#ccc' : '#111', fontSize: 13 }}
                  >이전</button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const start = Math.max(1, pageNo - 2)
                    const p = start + i
                    if (p > totalPages) return null
                    return (
                      <button
                        key={p}
                        onClick={() => fetchPage(p)}
                        style={{ padding: '4px 10px', border: '1px solid #e5e5e5', borderRadius: 6, background: p === pageNo ? '#111' : '#fff', color: p === pageNo ? '#fff' : '#111', cursor: 'pointer', fontSize: 13 }}
                      >{p}</button>
                    )
                  })}
                  <button
                    onClick={() => fetchPage(pageNo + 1)}
                    disabled={pageNo === totalPages || loading}
                    style={{ padding: '4px 10px', border: '1px solid #e5e5e5', borderRadius: 6, background: '#fff', cursor: pageNo === totalPages ? 'not-allowed' : 'pointer', color: pageNo === totalPages ? '#ccc' : '#111', fontSize: 13 }}
                  >다음</button>
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
      </div>

      {/* 상세 모달 */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 16, padding: 32, width: 600, maxHeight: '80vh', overflowY: 'auto' }}
          >
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

            <button
              onClick={() => window.open(`https://nedrug.mfds.go.kr/pbp/CCBBB01/getItemDetail?itemSeq=${selected.ITEM_SEQ}`, '_blank')}
              style={{ width: '100%', padding: '12px', background: '#111', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}
            >
              의약품안전나라에서 전체 정보 보기
            </button>
          </div>
        </div>
      )}
    </div>
  )
}