# NetbiX Homepage

분석·계측기기(시마즈 종합 카탈로그 기반)를 **카테고리별로 소개·판매**하는 정적 홈페이지입니다.
HTML + CSS + 순수 JavaScript(바닐라)로 제작했으며, 데이터와 화면을 분리해 유지보수가 쉽도록 구성했습니다.

## 페이지 구성

| 파일 | 설명 |
|------|------|
| `index.html` | 메인 — 히어로, 9개 카테고리, 대표 제품, 회사 강점, CTA |
| `products.html` | 전체 제품 목록 — 카테고리 필터(전체/분야별) |
| `about.html` | 회사소개 — 미션/비전/가치 |
| `contact.html` | 문의 — 연락처 + 문의 폼 |

## 폴더 구조

```
NetbiX_homepage/
├── index.html
├── products.html
├── about.html
├── contact.html
├── css/
│   └── style.css          # 디자인 시스템(변수) + 컴포넌트 + 반응형
├── js/
│   ├── products-data.js   # 제품/카테고리 데이터 (이 파일만 고치면 제품 추가/수정)
│   └── main.js            # 렌더링 + 필터 + 네비 + 폼 동작
└── docs/                  # 원본 카탈로그 자료
```

## 제품 카테고리 (9)

1. 크로마토그래프 · 질량분석기 (HPLC, LC/MS, GC, GC/MS)
2. 광분석장치 (UV, FTIR, 형광, AAS, ICP/ICP-MS)
3. 라이프사이언스 연구장비 (전기영동, MALDI-TOF, 서열분석, fNIRS)
4. 환경측정장치 (TOC, 온라인 모니터링, 휴대용 가스)
5. 재료시험기 · 피로/내구시험 (만능시험기, 피로, 경도)
6. 입도분석기 · 전자저울 (입도, 저울, 수분)
7. X선 형광분석기 (EDX)
8. 비파괴분석기 · 주사탐침현미경 (X선 CT, SPM, 초음파)
9. 분석소모품 · 이화학장비 (컬럼, 용매, 가스 발생기 등)

## 실행 방법

별도 빌드 과정이 없습니다. `index.html`을 브라우저로 열면 됩니다.
로컬 서버로 실행하려면(권장):

```bash
# Python 3 기준
python -m http.server 8000
# 브라우저에서 http://localhost:8000 접속
```

## 제품 추가/수정 방법

`js/products-data.js`의 `PRODUCTS` 배열에 항목을 추가하면 메인/목록 페이지에 자동 반영됩니다.

```js
{
  category: "chromatography",   // 카테고리 id
  name: "제품명",
  model: "모델/유형",
  tagline: "한 줄 소개",
  desc: "상세 설명",
  specs: ["주요 사양 1", "주요 사양 2"],
  featured: true                // 메인 '대표 제품'에 노출 여부
}
```
