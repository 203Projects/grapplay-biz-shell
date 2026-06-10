# R7 — 전자책 보호 (요청 ⑫ 다운로드 방지 + 워터마크)

## 목표
전자책 본문을 **다운로드 못 하게** 하고, 각 페이지에 **구매자 이메일 워터마크**를 표시.

## 현재 상태
- `src/pages/AcademyEbookRead.tsx`: `<iframe src="{pdfUrl}#toolbar=1...">` — 브라우저 PDF 뷰어 = **다운로드/인쇄 버튼 노출**.
- `src/components/PdfPreview.tsx`: `pdfjs-dist`로 canvas 렌더(미리보기). 이 방식이 워터마크에 적합.
- 사용자 이메일: `useAuth().user?.email`.

## 변경
### 다운로드 차단
- iframe 제거 → **canvas 렌더**(pdfjs-dist)로 본문 표시. 브라우저 PDF 툴바(다운로드/인쇄) 자체가 사라짐.
- 공통 컴포넌트화: `PdfPreview`를 확장하거나 `PdfReader`(전 페이지 렌더 + 워터마크) 신설.
- canvas에 우클릭/드래그 방지(`onContextMenu`, `select-none`) 부가(완전 차단은 아니나 캐주얼 저장 방지).
- 주의: 원본 PDF의 public URL은 여전히 직접 접근 가능 → **근본 차단은 서버사이드(서명 URL/프록시)**.
  본 작업 범위는 UI 다운로드 버튼 제거 + 워터마크. 서명 URL은 후속(별도 노트로 남김).

### 워터마크
- 각 페이지 canvas 렌더 후, 같은 ctx에 사용자 이메일 + 일시를 반투명·반복·회전 텍스트로 오버레이.
- 헬퍼 `drawWatermark(ctx, w, h, text)`: `ctx.globalAlpha=0.12`, 45° 회전, 타일 반복.
- 비로그인/이메일 없으면 일반 마스킹 텍스트.

## 검증
- 읽기 화면에 PDF 다운로드/인쇄 버튼 없음(브라우저 기본 툴바 미노출).
- 모든 페이지에 본인 이메일 워터마크 반복 표시.
- 미리보기(`PdfPreview`)도 동일 워터마크 적용 옵션.
</content>
