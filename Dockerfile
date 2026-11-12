# NetbiX_homepage — 정적 사이트(빌드 과정 없음)를 nginx 로 서빙한다.
# 루트의 HTML/CSS/JS/이미지 + 미리 빌드된 option/ SPA 를 그대로 올린다.
FROM nginx:alpine

# ── 버전/빌드 정보(선택) ────────────────────────────────────────────────
ARG VERSION=1.0.0
ARG GIT_SHA=""
ARG BUILD_DATE=""
LABEL org.opencontainers.image.title="netbix-homepage" \
      org.opencontainers.image.description="NetbiX 정적 홈페이지(netbitex.com)" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.revision="${GIT_SHA}" \
      org.opencontainers.image.created="${BUILD_DATE}"

# 사이트 파일 복사(.dockerignore 로 docs/개발보조물 제외).
COPY . /usr/share/nginx/html

# nginx 설정 교체(SPA 폴백 + 캐시 정책). 웹 루트에 섞여 들어온 설정 파일은 서빙되지 않게 제거.
COPY nginx.conf /etc/nginx/conf.d/default.conf
RUN rm -f /usr/share/nginx/html/nginx.conf

EXPOSE 80
# 베이스 이미지 기본 CMD(nginx -g 'daemon off;') 를 그대로 사용한다.
