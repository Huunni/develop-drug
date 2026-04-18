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

export default function Home() {
  const [query, setQuery] = useState('')
  const [searchType, setSearchType] = useState<'ingredient' | 'name'>('ingredient')
  const [items, setItems] = useState<DrugItem[]>([])
  const [total, setTotal] = useState(0)
  const [pageNo, setPageNo] = useState(1)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [selected, setSelected] = useState<DrugItem | null>(null)
  const numOfRows = 10

  const fetchPage = async (page: number) => {
    if (!query.trim()) return
    setLoading(true)
    try {
      const param = searchType === 'ingredient' ? `ingredient=${query}` : `name=${query}`
      const res = await fetch(`/api/drug?${param}&page=${page}`)
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
    await fetchPage(1)
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

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', minHeight: '100vh', fontFamily: 'sans-serif' }}>

      <div style={{ background: '#f8f8f8', borderRight: '1px solid #e5e5e5', padding: '24px 16px' }}>
        <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 24 }}>PharmDash</div>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>메뉴</div>
        <div style={{ padding: '8px 12px', borderRadius: 8, background: '#fff', marginBottom: 4, cursor: 'pointer', fontSize: 14 }}>성분 검색</div>
        <div style={{ padding: '8px 12px', borderRadius: 8, marginBottom: 4, cursor: 'pointer', fontSize: 14, color: '#888' }}>엑셀 업로드</div>
        <div style={{ padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 14, color: '#888' }}>파트너 목록</div>
      </div>

      <div style={{ padding: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>의약품 개발 자동화 대시보드</h1>
        <p style={{ color: '#888', fontSize: 14, marginBottom: 24 }}>성분명 또는 품목명으로 허가사·제조사 정보를 조회합니다</p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
          <select
            value={searchType}
            onChange={e => setSearchType(e.target.value as 'ingredient' | 'name')}
            style={{ padding: '0 12px', height: 44, border: '1px solid #e5e5e5', borderRadius: 8, fontSize: 14, background: '#fff' }}
          >
            <option value="ingredient">성분명(영문)</option>
            <option value="name">품목명(한글)</option>
          </select>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder={searchType === 'ingredient' ? 'acetaminophen' : '타이레놀'}
            style={{ flex: 1, padding: '0 16px', height: 44, border: '1px solid #e5e5e5', borderRadius: 8, fontSize: 14 }}
          />
          <button
            onClick={search}
            style={{ padding: '0 24px', height: 44, background: '#111', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}
          >
            {loading ? '검색 중...' : '조회'}
          </button>
        </div>

        {searched && (
          <>
            <div style={{ fontSize: 14, color: '#888', marginBottom: 16 }}>
              총 <strong style={{ color: '#111' }}>{total}건</strong> 조회됨 · {pageNo}/{totalPages} 페이지 · 클릭하면 상세 정보를 볼 수 있습니다
            </div>

            <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
              {items.map(item => (
                <div
                  key={item.ITEM_SEQ}
                  onClick={() => setSelected(item)}
                  style={{ border: '1px solid #e5e5e5', borderRadius: 12, padding: '16px 20px', background: '#fff', cursor: 'pointer' }}
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

        {searched && !loading && items.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>검색 결과가 없습니다</div>
        )}
      </div>

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