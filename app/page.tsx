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

type SearchType = 'ingredient' | 'name' | 'licensor'
type Filter = '전체' | '정상' | '그 외'

const SEARCH_TABS: { value: SearchType; label: string; placeholder: string }[] = [
  { value: 'ingredient', label: '성분명(영문)', placeholder: 'acetaminophen' },
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

  const fetchPage = async (page: number, rows?: number) => {
    if (!query.trim()) return
    setLoading(true)
    const rowCount = rows ?? numOfRows
    try {
      const param = `${searchType}=${encodeURIComponent(query)}`
      const res = await fetch(`/api/drug?${param}&page=${page}&rows=${rowCount}`)
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

  const search = async () => {
    setSearched(true)
    setPageNo(1)
    setFilter('전체')
    await fetchPage(1)
  }

  const handleRowsChange = (newRows: number) => {
    setNumOfRows(newRows)
    setPageNo(1)
    fetchPage(1, newRows)
  }

  const filteredItems = items.filter(item => {
    if (filter === '전체') return true
    if (filter === '정상') return item.CANCEL_NAME === '정상'
    return item.CANCEL_NAME !== '정상'
  })

  const cancelCount = items.filter(i => i.CANCEL_NAME !== '정상').length
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

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', minHeight: '100vh', fontFamily: 'sans-serif' }}>

      {/* 사이드바 */}
      <div style={{ background: '#f8f8f8', borderRight: '1px solid #e5e5e5', padding: '24px 16px' }}>
        <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 24 }}>PharmDash</div>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>메뉴</div>
        <div style={{ padding: '8px 12px', borderRadius: 8, background: '#fff', marginBottom: 4, cursor: 'pointer', fontSize: 14 }}>성분 검색</div>
        <div style={{ padding: '8px 12px', borderRadius: 8, marginBottom: 4, cursor: 'pointer', fontSize: 14, color: '#888' }}>엑셀 업로드</div>
        <div style={{ padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 14, color: '#888' }}>파트너 목록</div>
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
              onClick={() => { setSearchType(tab.value); setQuery(''); setSearched(false) }}
              style={{
                padding: '8px 18px',
                border: 'none',
                borderBottom: searchType === tab.value ? '2px solid #111' : '2px solid transparent',
                background: 'none',
                fontSize: 14,
                fontWeight: searchType === tab.value ? 600 : 400,
                color: searchType === tab.value ? '#111' : '#888',
                cursor: 'pointer',
                marginBottom: -1,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 검색창 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
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

        {/* 필터 + 페이지당 건수 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#888' }}>필터:</span>
            {(['전체', '정상', '그 외'] as Filter[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '4px 14px', border: '1px solid #e5e5e5', borderRadius: 20,
                  background: filter === f ? '#111' : '#fff',
                  color: filter === f ? '#fff' : '#888',
                  fontSize: 13, cursor: 'pointer'
                }}
              >
                {f}{f === '그 외' && cancelCount > 0 ? ` (${cancelCount})` : ''}
              </button>
            ))}
            {searched && (
              <span style={{ fontSize: 13, color: '#888', marginLeft: 4 }}>
                총 <strong style={{ color: '#111' }}>{total}건</strong> 중 <strong style={{ color: '#111' }}>{filteredItems.length}건</strong> 표시
              </span>
            )}
          </div>

          {/* 페이지당 건수 */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#888' }}>페이지당:</span>
            {[10, 20, 50, 100].map(n => (
              <button
                key={n}
                onClick={() => handleRowsChange(n)}
                style={{
                  padding: '4px 10px', border: '1px solid #e5e5e5', borderRadius: 20,
                  background: numOfRows === n ? '#111' : '#fff',
                  color: numOfRows === n ? '#fff' : '#888',
                  fontSize: 13, cursor: 'pointer'
                }}
              >
                {n}개
              </button>
            ))}
          </div>
        </div>

        {/* 결과 */}
        {searched && (
          <>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>
              {pageNo}/{totalPages || 1} 페이지 · 클릭하면 상세 정보를 볼 수 있습니다
            </div>

            <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
              {filteredItems.map(item => (
                <div
                  key={item.ITEM_SEQ}
                  onClick={() => setSelected(item)}
                  style={{
                    border: '1px solid #e5e5e5', borderRadius: 12, padding: '16px 20px',
                    background: '#fff', cursor: 'pointer',
                    opacity: item.CANCEL_NAME !== '정상' ? 0.6 : 1
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{item.ITEM_NAME}</div>
                      <div style={{ fontSize: 13, color: '#888' }}>{item.ETC_OTC_CODE} · {item.PACK_UNIT}</div>
                    </div>
                    <span style={{
                      fontSize: 12, padding: '3px 10px', borderRadius: 20,
                      background: item.CANCEL_NAME === '정상' ? '#EAF3DE' : '#FCEBEB',
                      color: item.CANCEL_NAME === '정상' ? '#27500A' : '#A32D2D'
                    }}>
                      {item.CANCEL_NAME}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div style={{ background: '#f8f8f8', borderRadius: 8, padding: '8px 12px' }}>
                      <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>허가권자</div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{item.ENTP_NAME}</div>
                    </div>
                    <div style={{ background: '#f8f8f8', borderRadius: 8, padding: '8px 12px' }}>
                      <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>제조원 (GMP)</div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{item.CNSGN_MANUF || '자체생산'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6, alignItems: 'center' }}>
                <button
                  onClick={() => fetchPage(pageNo - 1)}
                  disabled={pageNo === 1 || loading}
                  style={{ padding: '6px 14px', border: '1px solid #e5e5e5', borderRadius: 8, background: '#fff', cursor: pageNo === 1 ? 'not-allowed' : 'pointer', color: pageNo === 1 ? '#ccc' : '#111', fontSize: 14 }}
                >
                  이전
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const start = Math.max(1, pageNo - 2)
                  const p = start + i
                  if (p > totalPages) return null
                  return (
                    <button
                      key={p}
                      onClick={() => fetchPage(p)}
                      disabled={loading}
                      style={{ padding: '6px 12px', border: '1px solid #e5e5e5', borderRadius: 8, background: p === pageNo ? '#111' : '#fff', color: p === pageNo ? '#fff' : '#111', cursor: 'pointer', fontSize: 14 }}
                    >
                      {p}
                    </button>
                  )
                })}
                <button
                  onClick={() => fetchPage(pageNo + 1)}
                  disabled={pageNo === totalPages || loading}
                  style={{ padding: '6px 14px', border: '1px solid #e5e5e5', borderRadius: 8, background: '#fff', cursor: pageNo === totalPages ? 'not-allowed' : 'pointer', color: pageNo === totalPages ? '#ccc' : '#111', fontSize: 14 }}
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}

        {searched && !loading && filteredItems.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>검색 결과가 없습니다</div>
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