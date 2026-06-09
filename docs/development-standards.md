# 개발 표준 (Development Standards)

> NetbiX 홈페이지 프로젝트의 코드 작성·관리 규칙입니다.
> 새 코드를 추가하거나 기존 코드를 수정할 때 본 문서를 기준으로 합니다.

마지막 업데이트: 2026-06-08

---

## 1. 기술 스택

| 구분 | 채택 | 비고 |
|---|---|---|
| 마크업 | HTML5 (시맨틱 태그) | `header`, `main`, `section`, `article`, `footer` 사용 |
| 스타일 | CSS3 (순수 CSS) | 프레임워크 없음. CSS 변수로 디자인 토큰 관리 |
| 스크립트 | Vanilla JavaScript (ES6+) | 빌드/번들러 없이 브라우저에서 직접 실행 |
| 빌드 | 없음 | 정적 파일. 별도 컴파일 과정 불필요 |

**원칙**: 의존성을 최소화한다. 정적 사이트의 단순함과 이식성을 유지하기 위해 프레임워크/번들러를 도입하지 않는다.

---

## 2. 디렉터리 구조

```
NetbiX_homepage/
├── index.html            # 메인
├── products.html         # 제품 목록 (카테고리 필터)
├── about.html            # 회사소개
├── contact.html          # 문의
├── css/
│   └── style.css         # 디자인 시스템 + 컴포넌트 + 반응형 (단일 파일)
├── js/
│   ├── products-data.js  # 데이터 계층 (제품/카테고리)
│   └── main.js           # 동작 계층 (렌더링·필터·폼·네비)
└── docs/                 # 프로젝트 문서
```

**역할 분리 규칙**
- HTML = 구조, CSS = 표현, JS = 동작. 한 파일에 섞지 않는다.
- 인라인 스타일/스크립트는 지양한다. (불가피한 1회성 레이아웃 보정만 예외)
- **데이터와 화면을 분리한다.** 제품 정보는 `js/products-data.js`에만 둔다.

---

## 3. HTML 규칙

- `<!DOCTYPE html>` + `<html lang="ko">` 필수.
- 모든 페이지에 `<meta charset="UTF-8">`, `<meta name="viewport">`, `<title>`, `<meta name="description">` 포함.
- 시맨틱 태그 우선 사용. 의미 없는 `div` 남발 금지.
- 접근성:
  - 의미 있는 이미지에는 `alt`, 장식용에는 `aria-hidden="true"` 또는 빈 `alt`.
  - 버튼에는 `aria-label`(아이콘 버튼) 제공.
  - 폼 요소는 `<label for>`로 연결.
- 들여쓰기: 스페이스 2칸.
- 헤더/푸터/네비게이션 마크업은 모든 페이지에서 **동일하게 유지**한다. (현재 활성 메뉴만 `class="active"`)

---

## 4. CSS 규칙

- **디자인 토큰은 `:root` 변수로만 정의한다.** 색상/간격/그림자/반경을 하드코딩하지 않는다.
  ```css
  /* 좋음 */ color: var(--color-primary);
  /* 나쁨 */ color: #d6001c;
  ```
- 클래스 네이밍: 소문자 + 하이픈(kebab-case). 컴포넌트는 BEM 유사 변형 표기.
  - 블록: `.card`, `.btn`
  - 변형(modifier): `.btn--primary`, `.section--soft`
  - 요소: `.product-card .product-top`
- `id` 셀렉터로 스타일링하지 않는다. `id`는 JS 훅(렌더 타깃)·앵커 용도로만 사용.
- `style.css` 상단 목차 주석의 섹션 순서를 유지한다.
- 반응형: 모바일 분기점은 `960px`(태블릿), `720px`(모바일). 미디어쿼리는 파일 하단에 모은다.
- `!important` 사용 금지(특수 상황은 주석으로 사유 명시).

---

## 5. JavaScript 규칙

- 파일 최상단 `"use strict";`, 전역 오염을 막기 위해 IIFE로 감싼다.
- **데이터 계층(`products-data.js`)과 동작 계층(`main.js`)을 분리**한다.
  - 데이터는 `window.NETBIX_DATA`로만 노출한다.
- 함수는 단일 책임. `init*()`는 "해당 요소가 페이지에 있을 때만" 동작하도록 가드한다.
  ```js
  function initProductsPage() {
    const grid = document.getElementById("products-grid");
    if (!grid) return;   // 다른 페이지에서는 조용히 종료
    ...
  }
  ```
- DOM 조회는 `getElementById` / `querySelector`. 이벤트는 가능한 한 위임(delegation) 사용.
- 네이밍: 변수/함수 `camelCase`, 상수 데이터 `UPPER_SNAKE_CASE`.
- 문자열은 큰따옴표, 문장 끝 세미콜론, 들여쓰기 2칸.
- `console.log` 등 디버그 출력은 커밋 전에 제거한다.

---

## 6. 제품 데이터 추가/수정

화면(HTML/JS)을 건드리지 않고 `js/products-data.js`만 수정한다.

- 카테고리 추가: `CATEGORIES` 배열에 `{ id, name, short, desc, icon }` 추가.
- 제품 추가: `PRODUCTS` 배열에 추가.
  ```js
  {
    category: "chromatography", // 반드시 CATEGORIES의 id와 일치
    name: "제품명",
    model: "모델/유형",
    tagline: "한 줄 소개",
    desc: "상세 설명",
    specs: ["주요 사양 1", "주요 사양 2", "주요 사양 3"],
    featured: false             // true면 메인 '대표 제품'에 노출
  }
  ```
- `category` 값은 **존재하는 카테고리 id**여야 한다. (불일치 시 분류 표기가 깨짐)

---

## 7. Git / 커밋 규칙

- 커밋 메시지: `타입: 요약` (한국어 가능). 무엇을 왜 바꿨는지 1줄로.
  - 타입 예: `feat`(기능), `fix`(버그), `style`(스타일), `docs`(문서), `refactor`(리팩터)
  - 예) `feat: 제품 목록 카테고리 필터 추가`
- 한 커밋 = 하나의 논리적 변경. 문서/기능/스타일 변경을 한 커밋에 섞지 않는다.
- 비밀정보(.env, 키, 토큰)는 절대 커밋하지 않는다.
- `docs/` 안의 대용량 원본 자료(카탈로그 PDF/PPTX 등)는 용량을 고려해 LFS 또는 별도 보관을 검토한다.

---

## 8. 코드 리뷰 체크리스트

- [ ] HTML/CSS/JS 역할이 섞이지 않았는가
- [ ] 새 색상/간격을 하드코딩하지 않고 CSS 변수를 썼는가
- [ ] 제품 데이터를 `products-data.js`에만 두었는가
- [ ] 새 페이지에 메타 태그·헤더·푸터가 일관되게 들어갔는가
- [ ] 모바일(720px 이하)에서 레이아웃이 깨지지 않는가
- [ ] 접근성(label/alt/aria) 누락이 없는가
- [ ] 린터 에러가 없는가
