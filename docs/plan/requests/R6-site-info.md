# R6 — 사이트 정보 (요청 ⑩ 이메일, ⑪ 통신판매업)

## 목표
- 이메일 `coach0179@naver.com` → **`grapplay.com@gmail.com`**
- 통신판매업 신고번호 `진행 중` → **`2026-서울동작-0405`**

## 변경 파일 (전수 교체)
| 파일 | 위치 | 변경 |
|---|---|---|
| `src/components/AcademyLayout.tsx` | 푸터 사업자 정보 | 이메일·통신판매업 번호 |
| `src/pages/Contact.tsx` | mailto + 표시 + 사업자 박스 | 이메일 4곳, 번호 1곳 |
| `src/pages/legal/Privacy.tsx` | 개인정보 보호책임자 | 이메일 1곳 |

## 검증
- `grep -rn "coach0179@naver.com"` → 0건
- `grep -rn "진행 중"` (통신판매업 맥락) → 0건
</content>
