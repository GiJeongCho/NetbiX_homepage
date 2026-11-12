# NetbiX_homepage — Docker 로 띄우기 (단일 컨테이너)

정적 홈페이지(빌드 과정 없음)를 nginx **단일 컨테이너**로 실행한다. 컴포즈 불필요.
NIT_train 과는 별개 컨테이너라 포트만 안 겹치면 같은 PC 에서 함께 떠도 된다.

| 항목 | 값 |
|---|---|
| 이미지 | `netbix-homepage:latest` |
| 포트 | 호스트 **8080** → 컨테이너 80 |
| 접속 | http://localhost:8080 |
| 도메인 | netbitex.com (`CNAME`) |
| DB | 없음 (정적 사이트) |

## 구성

- 루트 정적 페이지: `index.html` / `products.html` / `about.html` / `contact.html` (+ `css`·`js`·`image`).
- `option/`: 미리 빌드된 Vite(React) SPA. nginx 가 없는 경로를 `option/index.html` 로 폴백한다.
- `nginx.conf`: SPA 폴백 + 해시 자산 장기 캐시 + HTML no-cache.
- `docs/` 와 개발 보조 스크립트는 `.dockerignore` 로 이미지에서 제외(서빙 불필요).

## 빌드 & 실행 (PowerShell)

```powershell
cd C:\project\NetbiX_homepage
docker build -t netbix-homepage:latest .
docker run -d --name netbix-homepage --restart unless-stopped -p 8080:80 netbix-homepage:latest
```

- 화면: http://localhost:8080
- 상태: `docker ps`
- 로그: `docker logs -f netbix-homepage`

컨테이너 없이 로컬 확인만 할 거면 빌드 없이:
```powershell
python -m http.server 8000      # http://localhost:8000
```

## 중지 / 삭제 / 갱신

```powershell
docker stop netbix-homepage                 # 멈춤
docker rm netbix-homepage                    # 컨테이너 제거

# 코드 바꾼 뒤 다시: 재빌드 → 기존 컨테이너 교체
docker build -t netbix-homepage:latest .
docker rm -f netbix-homepage
docker run -d --name netbix-homepage --restart unless-stopped -p 8080:80 netbix-homepage:latest
```

> 정적 사이트라 상태(볼륨·DB)가 없다. 내용을 바꾸면 재빌드 후 컨테이너만 갈아끼우면 된다.

## 포트 바꾸기

8080 이 이미 쓰이면 `-p` 의 호스트 쪽만 바꾼다. 예: `-p 9090:80` → http://localhost:9090

## 윈도우 함정

- **포트 충돌**: `docker: Error ... port is already allocated` → 위 "포트 바꾸기".
- **옛 화면이 보임**: 브라우저 강력 새로고침(Ctrl+F5). nginx 는 HTML 을 no-cache 로 주지만 브라우저 캐시가 남을 수 있다.
- **`option/` 새로고침 시 404**: nginx 폴백이 처리하므로 컨테이너로 접속할 때는 정상. `python -m http.server` 로 열면 SPA 라우트 새로고침이 404 날 수 있다(컨테이너로 확인 권장).
