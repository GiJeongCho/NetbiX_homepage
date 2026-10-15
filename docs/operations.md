# 운영 · 배포 가이드 (Operations)

> Netbitex 홈페이지의 배포 구조, 수정/반영 방법, 도메인·문의 폼·QR 등 운영에 필요한 핵심만 정리합니다.

마지막 업데이트: 2026-10-15

---

## 1. 한눈에 보는 구조

```
[방문자] → netbitex.com → (hosting.kr DNS: A레코드 4개) → GitHub Pages 서버
        → GitHub Pages 가 저장소(main)의 사이트 파일을 응답
```

- **사이트 파일 위치**: GitHub 저장소 `GiJeongCho/NetbiX_homepage` 의 `main` 브랜치
- **호스팅**: GitHub Pages (무료, HTTPS 자동, 전 세계 CDN)
- **도메인**: `netbitex.com` (hosting.kr 에서 구매, 연 단위 갱신)
- **네임서버**: hosting.kr 기본 네임서버(`ns1~4.hosting.co.kr`)
- **내 PC는 서버가 아님** — PC/공유기/방화벽/포트포워딩과 무관하게 동작

---

## 2. 배포(연결) 설정 요약

이미 완료된 설정이며, 재구성 시 참고용.

### GitHub Pages
- Settings → Pages → Source: **Deploy from a branch** / Branch: `main` / `/(root)`
- Custom domain: `netbitex.com` (저장소 루트의 `CNAME` 파일이 이 값을 보유 → push 시 자동 반영)
- 인증서 발급 후 **Enforce HTTPS** 체크 (http로 들어와도 https로 자동 전환)

### hosting.kr DNS (netbitex.com 은 최상위=apex 도메인)
apex 도메인은 CNAME을 걸 수 없어 **A레코드**로 GitHub Pages IP를 직접 지정합니다.

| 타입 | 호스트 | 값 | TTL |
|------|--------|-----|-----|
| A | `@` | `185.199.108.153` | 180~3600 |
| A | `@` | `185.199.109.153` | 180~3600 |
| A | `@` | `185.199.110.153` | 180~3600 |
| A | `@` | `185.199.111.153` | 180~3600 |
| CNAME | `www` | `gijeongcho.github.io` | 180~3600 |

- A레코드 4개는 GitHub Pages 공식 IP(이중화용). 전부 등록 권장.
- `www`는 CNAME으로 걸어두면 `www.netbitex.com` 으로 들어와도 자동 연결.
- hosting.kr 화면의 별도 **"호스트 등록"**(네임서버 글루 레코드)은 사용하지 않음 — 비워둠.

### 저장소 루트 파일
- `CNAME` — 내용: `netbitex.com` (GitHub에 담당 도메인 알림)
- `.nojekyll` — Jekyll 처리 비활성화(정적 사이트 그대로 서빙)

### (선택) 기존 netbitex.kro.kr
- kro.kr 쪽 CNAME(→ `gijeongcho.github.io`)을 그대로 두면, GitHub가 `netbitex.com` 으로 자동 301 리다이렉트.
- 과거 kro.kr 주소를 뿌려둔 자료가 있어도 끊기지 않음(원하면 완전 폐기해도 무방).

---

## 3. 사이트 수정 후 반영 방법 (가장 중요)

파일을 고친 뒤 **git push** 하면 GitHub Pages가 자동으로 새 버전을 배포합니다(보통 1~2분).

```powershell
cd C:\project\NetbiX_homepage
git add -A
git commit -m "수정 내용 요약"
git push
```

- 반영이 안 보이면 브라우저 강력 새로고침(Ctrl+F5).
- 제품 정보 수정은 `js/products-data.js` 한 곳만 고치면 됨.

---

## 4. 로컬 미리보기 (배포 전 확인)

```powershell
cd C:\project\NetbiX_homepage
python -m http.server 8000
# http://localhost:8000
```

> 외부 공개는 GitHub Pages가 담당하므로, 로컬 서버는 **개발 중 확인용**으로만 사용.

---

## 5. 문의 폼 (자동 메일)

- 방식: **Web3Forms** (정적 사이트용, 백엔드 불필요, 클라이언트에서 전송)
- 받는 메일: `a01095895690@gmail.com`
- 설정 위치: `js/main.js` 상단 `WEB3FORMS_ACCESS_KEY`
- 전송 형식: **JSON(UTF-8)** — 한글 필드명이 깨지지 않도록 multipart 대신 JSON 사용
- 키 교체가 필요하면 https://web3forms.com 에서 동일 메일로 재발급 후 상수만 교체
- 수신 까다로운 도메인(kakao/daum/nate 등)은 폼에서 입력 경고·차단 (`BLOCKED_EMAIL_DOMAINS`)

---

## 6. 카탈로그 PDF 다운로드

- 파일: `docs/SSK종합카탈로그.pdf`
- 링크: 메인 히어로 버튼 + 전 페이지 푸터 "카탈로그 다운로드 (PDF)"
- 교체 시 같은 경로에 PDF를 덮어쓰고 push

---

## 7. QR 코드

- 파일: `image/qr-netbitex.png` (→ `https://netbitex.com` 연결)
  - `image/qr-netbitex-com.png` 도 동일 주소 QR(동일 내용 사본)
- 재생성(주소 변경 시):
  ```python
  import qrcode
  qrcode.make("https://netbitex.com").save("image/qr-netbitex.png")
  ```
- 대안: 온라인 QR 생성기(qr-code-generator.com 등)에 주소 입력해도 됨
- 활용: 명함/카탈로그/포스터에 삽입 → 스캔 시 사이트로 이동

---

## 8. 도메인 (netbitex.com) 운영

- **구매처**: hosting.kr (https://app.hosting.kr)
- **갱신**: `.com` 은 **연 단위 갱신**. 만료 전 hosting.kr에서 연장(자동 갱신 설정 권장).
  - 만료되면 도메인이 해제되어 접속 불가 → 갱신 알림(캘린더 등) 권장.
- **다른 도메인으로 교체 시 절차**:
  1. 새 도메인 DNS에 레코드 추가
     - apex(최상위) 도메인: **A레코드** `185.199.108.153 / .109.153 / .110.153 / .111.153`
     - 서브도메인 형태: **CNAME → `gijeongcho.github.io`**
  2. 저장소 `CNAME` 파일 내용을 새 도메인으로 변경 후 push
  3. GitHub Pages → Custom domain 을 새 도메인으로 설정 + Enforce HTTPS

---

## 9. 비용 정리

| 항목 | 비용 |
|---|---|
| GitHub Pages 호스팅 | 무료 |
| HTTPS 인증서 | 무료 (Let's Encrypt 자동) |
| netbitex.com 도메인 | 유료 (hosting.kr, 연 단위) |
| Web3Forms 문의 메일 | 무료 |

---

## 10. 자주 쓰는 점검

```powershell
# 도메인이 GitHub IP로 잘 향하는지(A레코드) 확인
Resolve-DnsName netbitex.com -Type A

# 사이트 응답 확인
Invoke-WebRequest https://netbitex.com -UseBasicParsing
```
