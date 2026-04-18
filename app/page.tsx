'use client'

import { useState } from 'react'

interface DrugItem {
  ITEM_SEQ: string
  ITEM_NAME: string
  ENTP_NAME: string
  CNSGN_MANUF: string | null
  ETC_OTC_CODE: string
  FORM_CODE_NAME: string
  PACK_UNIT: string
  CANCEL_NAME: string
}

export default function Home() {
  const [query, setQuery] = useState('')
  const [searchType, setSearchType] = useState<'ingredient' | 'name'>('ingredient')
  const [items, setItems] = useState<DrugItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const search = async () => {
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)
    try {
      const param = searchType === 'ingredient' ? `ingredient=${query}` : `name=${query}`
      const res = await fetch(`/api/drug?${param}`)
      const data = await res.json()
      setItems(data.items || [])
      setTotal(data.total || 0)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* 사이드바 */}
      <div style={{ background: '#f8f8f8', borderRight: '1px solid #e5e5e5', padding: '24px 16px' }}>
        <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 24 }}>PharmDash</div>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>메뉴</div>
        <div style={{ padding: '8px 12px', borderRadius: 8, background: '#fff', marginBottom: 4, cursor: 'pointer', fontSize: 14 }}>성분 검색</div>
        <div style={{ padding: '8px 12px', borderRadius: 8, marginBottom: 4, cursor: 'pointer', fontSize: 14, color: '#888' }}>엑셀 업로드</div>
        <div style={{ padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 14, color: '#888' }}>파트너 목록</div>
      </div>

      {/* 메인 */}
      <div style={{ padding: 32 }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>의약품 개발 자동화 대시보드</h1>
          <p style={{ color: '#888', fontSize: 14 }}>성분명 또는 품목명으로 허가사·제조사 정보를 조회합니다</p>
        </div>

        {/* 검색창 */}
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

        {/* 결과 */}
        {searched && (
          <>
            <div style={{ fontSize: 14, color: '#888', marginBottom: 16 }}>
              총 <strong style={{ color: '#111' }}>{total}건</strong> 조회됨
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              {items.map(item => (
                <div key={item.ITEM_SEQ} style={{ border: '1px solid #e5e5e5', borderRadius: 12, padding: '16px 20px', background: '#fff' }}>
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
          </>
        )}

        {searched && !loading && items.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>검색 결과가 없습니다</div>
        )}
      </div>
    </div>
  )
}