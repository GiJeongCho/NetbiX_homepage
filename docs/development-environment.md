# 개발환경 (Development Environment)

> NetbiX 홈페이지를 로컬에서 실행·개발하기 위한 환경 안내입니다.

마지막 업데이트: 2026-06-08

---

## 1. 요구 사항

| 항목 | 권장 | 비고 |
|---|---|---|
| OS | Windows 11 / macOS / Linux | 정적 사이트라 OS 무관 |
| 에디터 | VS Code / Cursor | Live Server 확장 권장 |
| 브라우저 | 최신 Chrome / Edge / Firefox | ES6+ 지원 필요 |
| 로컬 서버(선택) | Python 3 또는 Node.js | 파일 직접 열기도 가능 |
| Git | 최신 | 형상 관리 |

**빌드 도구·패키지 매니저(npm 등)는 필요 없습니다.** 의존성이 없는 순수 정적 사이트입니다.

---

## 2. 실행 방법

### 방법 A — 파일 직접 열기 (가장 간단)
`index.html`을 더블클릭해서 브라우저로 엽니다.
- 장점: 설치 불필요.
- 단점: 일부 브라우저에서 `file://` 보안 정책으로 일부 동작이 제한될 수 있음. 개발 중에는 방법 B 권장.

### 방법 B — 로컬 HTTP 서버 (권장)

Python 3:
```powershell
cd C:\project\NetbiX_homepage
python -m http.server 8000
# 브라우저에서 http://localhost:8000 접속
```

Node.js(설치돼 있다면):
```powershell
npx serve -l 8000
```

VS Code / Cursor:
- "Live Server" 확장 설치 후 `index.html`에서 우클릭 → "Open with Live Server" (자동 새로고침 지원).

---

## 3. 포트 규칙

- 로컬 개발 기본 포트: **8000** (`http://localhost:8000`).
- 포트가 사용 중이면 다른 포트로 실행:
  ```powershell
  python -m http.server 8080
  ```
- 현재 사용 중인 포트 확인(Windows):
  ```powershell
  netstat -ano | findstr :8000
  ```
- 서버 종료: 실행 중인 터미널에서 `Ctrl + C`.

---

## 4. 폴더/파일 빠른 참조

| 경로 | 무엇 |
|---|---|
| `index.html` | 메인 페이지 |
| `products.html` | 제품 목록 (URL `?cat=카테고리id`로 진입 필터 가능) |
| `about.html` / `contact.html` | 회사소개 / 문의 |
| `css/style.css` | 모든 스타일 (디자인 토큰은 파일 상단 `:root`) |
| `js/products-data.js` | **제품/카테고리 데이터** — 내용 수정은 여기 |
| `js/main.js` | 렌더링·필터·폼·모바일 네비 |
| `docs/` | 문서 (본 문서 포함) |

---

## 5. 수정-확인 워크플로우

1. `js/products-data.js`에서 데이터 수정 또는 `css/style.css`에서 스타일 수정.
2. 로컬 서버 실행 상태에서 브라우저 새로고침(Live Server면 자동).
3. 모바일 화면 확인: 브라우저 개발자도구(F12) → 디바이스 툴바(Ctrl+Shift+M).
4. 콘솔(F12 → Console)에 에러가 없는지 확인.
5. 커밋 (개발 표준 문서의 Git 규칙 참고).

---

## 6. 자주 발생하는 문제

| 증상 | 원인 / 해결 |
|---|---|
| 제품이 안 보임 | `products-data.js`가 `main.js`보다 **먼저** 로드돼야 함. HTML의 `<script>` 순서 확인 |
| 스타일이 안 먹음 | `css/style.css` 경로 확인, 브라우저 강력 새로고침(Ctrl+F5) |
| 한글이 깨짐 | 파일 인코딩 UTF-8 확인, `<meta charset="UTF-8">` 확인 |
| 포트 충돌 | 다른 포트로 실행하거나 기존 서버 종료 |
