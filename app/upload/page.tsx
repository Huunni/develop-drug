'use client'

import { useState } from 'react'

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: number; error: number } | null>(null)
  const [preview, setPreview] = useState<string[][]>([])

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setResult(null)

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const lines = text.split('\n').slice(0, 6)
      const rows = lines.map(l => l.split('\t'))
      setPreview(rows)
    }
    reader.readAsText(f, 'utf-8')
  }

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    setResult(null)

    const reader = new FileReader()
    reader.onload = async (ev) => {
      const text = ev.target?.result as string
      const res = await fetch('/api/upload-supply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: text }),
      })
      const data = await res.json()
      setResult(data)
      setLoading(false)
    }
    reader.readAsText(file, 'utf-8')
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', minHeight: '100vh', fontFamily: 'sans-serif' }}>

      {/* 사이드바 */}
      <div style={{ background: '#f8f8f8', borderRight: '1px solid #e5e5e5', padding: '24px 16px' }}>
        <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 24 }}>PharmDash</div>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>메뉴</div>
        <a href="/" style={{ display: 'block', padding: '8px 12px', borderRadius: 8, marginBottom: 4, cursor: 'pointer', fontSize: 14, color: '#888', textDecoration: 'none' }}>성분 검색</a>
        <div style={{ padding: '8px 12px', borderRadius: 8, background: '#fff', marginBottom: 4, cursor: 'pointer', fontSize: 14 }}>엑셀 업로드</div>
        <div style={{ padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 14, color: '#888' }}>파트너 목록</div>
      </div>

      {/* 메인 */}
      <div style={{ padding: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>약국 공급 데이터 업로드</h1>
        <p style={{ color: '#888', fontSize: 14, marginBottom: 32 }}>CSV 파일을 업로드하면 품목별 월평균 공급수량을 자동 계산하여 저장합니다</p>

        {/* 업로드 영역 */}
        <div style={{ border: '2px dashed #e5e5e5', borderRadius: 12, padding: 40, textAlign: 'center', marginBottom: 24, background: '#f8f8f8' }}>
          <input
            type="file"
            accept=".csv,.txt"
            onChange={handleFile}
            style={{ display: 'none' }}
            id="file-input"
          />
          <label htmlFor="file-input" style={{ cursor: 'pointer' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📂</div>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>
              {file ? file.name : 'CSV 파일을 선택해주세요'}
            </div>
            <div style={{ fontSize: 13, color: '#888' }}>
              {file ? `${(file.size / 1024 / 1024).toFixed(1)}MB` : '클릭하여 파일 선택'}
            </div>
          </label>
        </div>

        {/* 미리보기 */}
        {preview.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>미리보기 (상위 5행)</div>
            <div style={{ overflowX: 'auto', border: '1px solid #e5e5e5', borderRadius: 8 }}>
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                {preview.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #e5e5e5', background: i === 0 ? '#f8f8f8' : '#fff' }}>
                    {row.slice(0, 8).map((cell, j) => (
                      <td key={j} style={{ padding: '6px 10px', whiteSpace: 'nowrap', fontWeight: i === 0 ? 600 : 400 }}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </table>
            </div>
          </div>
        )}

        {/* 업로드 버튼 */}
        {file && (
          <button
            onClick={handleUpload}
            disabled={loading}
            style={{ padding: '12px 32px', background: '#111', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? '업로드 중...' : '업로드 시작'}
          </button>
        )}

        {/* 결과 */}
        {result && (
          <div style={{ marginTop: 24, padding: '16px 20px', background: '#EAF3DE', borderRadius: 8 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#27500A', marginBottom: 4 }}>업로드 완료!</div>
            <div style={{ fontSize: 14, color: '#3B6D11' }}>
              성공: {result.success}건 / 오류: {result.error}건
            </div>
          </div>
        )}

        {/* 컬럼 안내 */}
        <div style={{ marginTop: 32, padding: '16px 20px', background: '#f8f8f8', borderRadius: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>CSV 컬럼 형식</div>
          <div style={{ fontSize: 12, color: '#888', lineHeight: 1.8 }}>
            브랜드명 · 품목명 · 제품총수량 · 문전약국구분 · 포장형태 · 공급가(중앙값) · 판매사명 · 제조사명 · ATC3_코드명 · ATC5 코드명 · 복지부분류 코드명 · 성분명 · 성분명(영문) · 측정값 이름 · 기간(월/주) · 측정값
          </div>
        </div>
      </div>
    </div>
  )
}