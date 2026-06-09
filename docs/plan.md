# 진행 로그 & 작업 플랜

> 전략은 [`strategy.md`](./strategy.md), 시스템 구성은 [`architecture.md`](./architecture.md).
> 본 문서는 **무엇이 끝났고 / 무엇이 다음인지** 만 추적한다.

마지막 업데이트: 2026-05-26

---

## 0. 사용자가 정한 진행 순서 (최상위)

```text
P0  빌드 도구 설치 + WebSocket 데이터 수신 검증 (examples/)        ← 지금 여기
       │
       ▼
P1  v0.3 마무리 — paper 트레이딩 + 거래로그 CSV 백테스팅
     · KRW-USDT 라이브 환율 워커
     · 시간 기반 강제 청산 (max_hold_secs, default 1d)         (코드 완료)
     · trade_log.csv append (ENTRY/EXIT, position_id 매칭)     (코드 완료)
     · 텔레그램 워커 본 구현 (grammers 0.9)
     · Streamlit UI 골격
       │
       ▼
P2  trade_log.csv → Excel 로 백테스팅 검증 (수익률/체결률 등)
     · 며칠 / 몇 종목 paper 운용
     · 1.5% TP / 80% SL / 1d TimeExpired 트리거 빈도·결과 분석
     · 만족스러우면 → 실주문 단계로
       │
       ▼
P3  v0.4 — 실주문 모듈 (paper 검증 통과 후 진입)
     · Upbit REST (JWT) 시장가 매수/매도
     · Binance UMFutures REST (HMAC) 격리마진 + 10x SHORT
     · 양쪽 거의-동시 진입, 한쪽만 체결됐을 때 즉시 헤지 복구
     · dry_run / 일일 손실 한도 / 킬 스위치
       │
       ▼
P4  v0.5 — 자동 청산 (실주문에서 TP/SL/TimeExpired 자동 발화)
P5  v0.6 — 영속화 (position_state.json, trade_log SQLite 후보)
P6  v1.0 — 운영 품질 (메트릭, 다종목, 백테스트 리플레이)
```

> **지금 당장 다음 한 발**: P0 — `winget install ... BuildTools` 후
> `cargo run --example test_binance` 로 데이터 수신 1차 검증.

---

## 0.1. 한눈에 보기 (구현 상태)

| 영역 | 상태 | 다음 한 발 |
|---|---|---|
| 프로젝트 골격 (Cargo, 모듈 분리, lib+bin) | 완료 | — |
| WebSocket 호가 수신 (Binance Futures + Upbit) | 완료 | — |
| 단계별 테스트 examples (`test_binance` / `test_upbit` / `test_both`) | 완료 | — |
| 업비트 공지 정규식 파서 | 완료 | — |
| 텔레그램 워처 (grammers 0.7) | **완료** | 신규상장 실거동 1건 이상 잡히는지 |
| 호가 통합 Hub + 5s 갭 ticker | 완료 | — |
| **Universe 모드 (Binance Futures ∩ Upbit KRW 교집합 자동 구독)** | **신규 완료** | — |
| **1000-prefix 가격 스케일링 (1000PEPE → PEPE)** | **신규 완료** | — |
| **Telegram listing 필터 (Binance 선물 존재 검증)** | **신규 완료** | — |
| **NDJSON event logger (핫패스와 분리, append-only + BufWriter)** | **신규 완료** | — |
| **Strategy 엔진 (델타 중립)** | 완료 (paper) | trade_log 검증 |
| **시간 기반 강제 청산 (`max_hold_secs`, 기본 1d)** | 완료 | 실거동 확인 |
| **trade_log.csv append (ENTRY/EXIT, position_id 매칭)** | 완료 | Excel 검증 |
| stdin 수동 조작 | 완료 | — |
| KRW-USDT 환율 워커 (업비트 REST 5분 폴링) | 완료 | — |
| Streamlit UI | 미구현 | P1 |
| 실주문 실행 (Upbit + Binance Futures) | 미구현 | P3 (v0.4) |
| 영속화 (`position_state.json` 등) | 미구현 | P5 (v0.6) |

---

## 1. 지금까지 완료된 작업

### 1.1 환경 / 인프라

- [x] Rust 1.95.0 설치 (`C:\Users\pps\.cargo\bin\cargo.exe`)
- [x] Cargo workspace 구조 (`rust/` 단일 crate)
- [x] `.gitignore` (target, Cargo.lock, .env, config.toml, 세션 파일, 거래 로그, CSV 등 제외)
- [x] `.gitattributes` (LF eol 정책)
- [x] git remote 정정 (`listing_short.git` → `listing_arbitrage.git`)
- [x] 문서 구조 정리 (`docs/` 하위로 분할)
- [ ] **MSVC Build Tools 또는 GNU 툴체인 설치** ← 빌드/실행 위해 필수

### 1.2 코어 모듈 (`rust/src/`)

| 파일 | 줄수 | 핵심 책임 |
|---|---|---|
| `main.rs` | ~130 | 채널/태스크 오케스트레이션, Ctrl-C 핸들 |
| `config.rs` | ~75 | `config.toml` 로드 (`[strategy]` 포함) |
| `types.rs` | ~130 | `Quote`, `SymbolCommand`, `EntrySignal`, `PositionState`, `PnlSnapshot`, `ExitSignal`, `TradeCommand` |
| `exchange/binance.rs` | ~210 | spot bookTicker WS, 동적 SUBSCRIBE/UNSUBSCRIBE |
| `exchange/upbit.rs` | ~180 | orderbook WS, ticket 재발급으로 재구독 |
| `listing/parser.rs` | ~130 | 업비트 공지 정규식 (`(?ix)` extended mode), Python 의미 그대로 포팅 |
| `listing/telegram.rs` | **stub** | grammers 0.9 API drift 때문에 미구현 |
| `hub.rs` | ~170 | DashMap 호가 통합, 5s 디버그 ticker, `price_data.csv` 스냅샷 |
| **`strategy.rs`** | ~340 | **진입/청산 메인.** `handle_quote` → 갭 임계치 / PnL 평가 / TakeProfit·StopLoss |
| `stdin_input.rs` | ~115 | `add`/`remove`/`list`/`enter`/`exit`/`auto_entry`/`auto_exit`/`quit` |

### 1.3 검증

- [x] `ReadLints` — 정적 분석 통과 (linter 에러 없음)
- [x] `cargo` 의존성 해결 (272 패키지 lock 성공)
- [ ] `cargo check` — MSVC `link.exe` 부재로 build script 단계에서 실패 (코드 자체 문제 아님)
- [ ] `cargo run` — 미시도

### 1.4 문서

- [x] `README.md` — 짧은 개요 + 빌드/실행 + docs 링크
- [x] `docs/strategy.md` — 전략·시나리오·PnL 공식
- [x] `docs/architecture.md` — 시스템 구성·모듈·실행 흐름
- [x] `docs/reference_python.md` — Python 참고용 코드 설명
- [x] `docs/plan.md` — 본 문서
- [x] `rust/README.md` — Rust 빌드/모듈

---

## 2. 다음 작업 (우선순위 순)

### P0. 빌드 도구 설치 + 실거동 검증 (최우선)

- [ ] MSVC Build Tools (winget) **또는** GNU 툴체인 (rustup) 설치
- [ ] **단계별 테스트 먼저** (config.toml 없이 굴러감)
  - [ ] `cargo run --example test_binance` — 바이낸스 bookTicker 콘솔 출력 확인
  - [ ] `cargo run --example test_upbit` — 업비트 orderbook 콘솔 출력 확인
  - [ ] `cargo run --example test_both` — 둘 다 + 5s 마다 갭% 출력 확인
- [ ] 그 다음 본 봇 (`cargo run --release`) 으로 strategy 까지 포함한 풀 사이클
  - [ ] `add BTC` / `add XRP` 로 호가 들어오는지
  - [ ] 5초마다 `snapshot (...): bin_ask=..., upb_bid=..., gap=...%` 출력
  - [ ] `enter BTC` → `exit BTC` paper 사이클

**왜 P0?** 이후의 모든 작업이 "Rust 봇이 일단 돈다"는 전제 위에 쌓인다. 테스트 examples 는
자가-격리되어 (`Hub`/`Strategy`/config 의존 없음) WebSocket 연결만 빠르게 검증할 수 있다.

### P1. v0.3 마무리 — paper + 거래로그 (실주문 직전 단계)

#### P1-1. 업비트 KRW-USDT 환율 라이브 워커 (완료)
- [x] `src/exchange/upbit_rate.rs` 신규 — 업비트 REST `/v1/ticker?markets=KRW-USDT` 폴링
- [x] 5분(기본) 주기로 `Hub::usd_krw_handle()` 라이브 갱신. `config.toml` 의 `usd_krw_refresh_sec` 로 조절
- [x] `main.rs` 의 1350 은 워커 첫 fetch 까지의 초기값으로만 사용

#### P1-2. 시간 기반 강제 청산 (코드 완료, 검증 남음)
- [x] `[strategy].max_hold_secs` (기본 86400)
- [x] `ExitReason::TimeExpired`
- [x] `strategy.rs` 1초 ticker 가 보유 포지션 만료 검사
- [ ] 실거동: 하루짜리 paper 포지션 들어가서 익일 같은 시각에 자동 청산되는지 확인

#### P1-3. trade_log.csv (코드 완료, Excel 검증 남음)
- [x] `[general].trade_log_path` (기본 `trade_log.csv`)
- [x] 진입/청산마다 한 행 append. ENTRY/EXIT 두 행이 `position_id` 로 매칭됨
- [x] 칼럼: `ts_ms,ts_iso,action,reason,position_id,symbol,direction,qty,upbit_price,binance_price,usd_krw,capital_krw,leverage,upbit_pnl_krw,binance_pnl_krw,total_pnl_krw,total_pnl_pct,margin_loss_pct,hold_secs`
- [ ] **Excel 백테스팅** (P2 에서 다룸)

#### P1-4. 텔레그램 워커 본 구현 (완료)
- [x] **grammers 0.7** 로 다운그레이드 (0.8/0.9 는 SenderPool 기반 신 API 라 비호환)
- [x] `src/listing/telegram.rs` 본 구현: connect → poll_loop → 신규상장 → ListingNotice
- [x] 1회 로그인 전용 바이너리 `src/bin/tg_login.rs` (메인 봇 stdin 워커와 충돌 방지)
- [x] `last_id.txt`, `processed_symbols.txt` 영속화 (Python 원본과 동일)
- [ ] 실거동 검증: 실제 api_id/api_hash + 1회 `cargo run --bin tg_login` 후 메인 봇 가동

#### P1-5. Streamlit UI 골격 (`ui/streamlit_app.py`)
- [ ] Rust 코어에 HTTP 서버 (`axum`):
  - `GET /book` → 현재 호가 스냅샷
  - `GET /positions` → 보유 포지션 + PnL
  - `GET /signals` → 최근 EntrySignal/ExitSignal (SSE)
  - `POST /enter/{sym}`, `POST /exit/{sym}`, `POST /auto?on=true`
- [ ] Streamlit 페이지: 갭% 차트 / 포지션 카드 / 진입·청산 버튼 / auto 토글

### P2. Excel 백테스팅 — 실주문 진입 결정 게이트

P1-1, P1-4 가 끝나면 텔레그램 알림 받아 자동 paper 진입 가능. 며칠 / 몇 종목 굴린 뒤
`trade_log.csv` 를 Excel 로 열어 다음 항목을 확인:

- [ ] **체결률**: ENTRY 가 났을 때 EXIT 까지 정상적으로 도달하는 비율
- [ ] **사유 분포**: TakeProfit / StopLoss / TimeExpired / Manual 비율
- [ ] **수익 분포**: TP 사이클의 평균 `total_pnl_pct`, SL 사이클의 평균 `margin_loss_pct`
- [ ] **보유 시간 분포**: TP 까지 걸린 평균 시간, TimeExpired 비율
- [ ] **누적 PnL**: `SUM(total_pnl_krw)` 가 우상향 곡선인지
- [ ] **꼬리 손실**: 최대 단일 손실, 최대 연속 손실
- [ ] **임계치 튜닝**: TP 1.5%, SL 80%, max_hold 1d 가 결과적으로 잘 맞는지

**판정 기준 (제안)**: 누적 PnL > 0 AND TP/SL 비 ≥ 1.5 AND TimeExpired 비율 < 30%
→ 충족 시 P3 진입(실주문). 미충족 시 임계치 재튜닝 또는 전략 수정.

### P3. v0.4 — 실주문 모듈 (Excel 검증 통과 후)

#### P3-1. 거래소 REST 클라이언트
- [ ] `src/order/upbit.rs` — JWT (`jsonwebtoken` crate) 서명
  - `GET /v1/accounts` 잔고
  - `POST /v1/orders` 시장가 매수 (`ord_type=price`)
  - `POST /v1/orders` 시장가 매도 (`ord_type=market`)
- [ ] `src/order/binance.rs` — HMAC-SHA256 (`hmac` + `sha2`)
  - `GET /fapi/v2/balance`
  - `POST /fapi/v1/leverage` (10x)
  - `POST /fapi/v1/marginType` (ISOLATED)
  - `POST /fapi/v1/order` 시장가 SHORT/청산
  - `GET /fapi/v2/positionRisk` 평단/PnL 검증

#### P3-2. Order Executor
- [ ] `src/executor.rs` — `EntrySignal` 받아 양쪽 거의-동시 시장가 주문
  - `tokio::join!` 으로 두 거래소 동시 호출
  - 한쪽만 체결 / 한쪽만 실패 → 즉시 반대편 시장가 재시도 (헤지 복구)
  - 슬리피지 가드: 신호 가격 대비 ±X% 이내일 때만 체결
- [ ] `ExitSignal` 받아 양쪽 동시 청산 (TP/SL/TimeExpired 모두 동일 경로)
- [ ] `strategy.rs` 의 paper 진입/청산을 executor 호출로 치환 (paper 와 모드 분기)

#### P3-3. 안전장치
- [ ] **드라이런 모드** — `[order].dry_run = true` 일 때 실주문 안 보냄
- [ ] **최대 일일 손실 한도** — 누적 손실이 한도 넘으면 자동 정지
- [ ] **킬 스위치** — `.kill` 파일 감지 시 모든 포지션 강제 청산 후 종료

### P4. v0.5 — 자동 청산 + 부분 청산 (실주문)

- [ ] 실주문 모드에서 TP 1.5% / SL 80% / TimeExpired 1d 자동 트리거
- [ ] 부분 청산 (50%/50% 사다리, 옵션)
- [ ] 수동 청산 트리거 — Streamlit 버튼 / `close_position.txt` 시그널

### P5. v0.6 — 영속화

- [ ] `position_state.json` 으로 보유 포지션 저장 (매 진입/청산마다)
- [ ] 재시작 시 자동 복원 + 진입 시점 기준으로 PnL 계산 이어감
- [ ] `trade_log.csv` → SQLite 마이그레이션 (검색/집계 용이)
- [ ] 텔레그램 봇 알림 (체결/실패/리스크 이벤트)

### P6. v1.0 — 운영 품질

- [ ] Prometheus `/metrics` 엔드포인트 + Grafana 대시보드
- [ ] 동시 다종목 운영 (자본 분배 정책 — 균등/비율/우선순위)
- [ ] 백테스트/리플레이 모드 (저장된 호가 + 알림 로그로 동일 결과 재현)
- [ ] Windows 서비스 / systemd 등록 스크립트

---

## 3. 알려진 이슈 / 결정 보류 항목

| 항목 | 메모 |
|---|---|
| grammers crate 버전 픽스 | 0.6 ↔ 0.9 사이 API drift. 0.9 로 픽스해두긴 했지만 본 구현은 사용자가 직접 채워야 함. 대안: Telegram Bot API (간단) — 단 채널 메시지를 읽으려면 봇이 채널에 admin 으로 들어가야 함. |
| `usd_krw` 환율 소스 | 기본은 업비트 `KRW-USDT` ticker. 다른 후보: `pyupbit.get_current_price`, 한국은행 환율, 바이낸스 P2P. **결정**: 업비트 `KRW-USDT` 로 통일 (가장 빠르고 일관). |
| 진입 방향 | 현재는 `BinanceOverUpbit` (= 업비트가 싸서 업비트 LONG + 바이낸스 SHORT) 만 진입. `UpbitOverBinance` 방향은 업비트 현물 SHORT 불가라 진입 안 함. 알림만 띄움. |
| 다종목 동시 진입 | 현재 코드는 가능하지만 자본 분배 정책 미정. v1.0 에서 다룸. 그 전까진 한 번에 한 심볼만 권장. |
| 송금 단계 | 본 전략은 **송금 없음**. 한쪽 거래소 자본이 마르면 진입 불가. 추후 자본 리밸런싱 워커는 별도 모듈로 (v1.x). |
| Linux/Mac 지원 | 코드 자체는 OS 무관이지만 본 노트는 Windows 기준. `.gitattributes` 로 LF 통일했으니 협업 시 무리 없음. |

---

## 4. 변경 로그

### 2026-05-26 — Universe 모드 + 가격 스케일링 + 디스크 IO 격리 (`all_info` 브랜치)

대규모 변경. 사용자 요청: "업비트 현물 ∩ 바이낸스 선물에 일치하는 모든 코인을 WS 로 듣고,
텔레그램 신규상장(바이낸스 선물에 존재하는 코인)만 push" + "데이터 가져오는 부분은 절대 늦추지 마라".

#### 4-A. 거래소 모드: 현물 → **선물(USDT-M)** 로 전환

- `config.toml` 의 `[binance].ws_url` 을 `wss://fstream.binance.com/ws` 로 변경.
  bookTicker 메시지 포맷이 spot/futures 동일이라 클라이언트 코드는 그대로 호환.

#### 4-B. Universe 모드 (`src/exchange/universe.rs` 신규)

- 시작 시 1회 `https://fapi.binance.com/fapi/v1/exchangeInfo` +
  `https://api.upbit.com/v1/market/all` 을 **병렬** REST 호출.
- 교집합 (`PERPETUAL` × `TRADING` × `USDT` quote 와 Upbit `KRW-*` 의 base) 을 만들어
  양쪽 WS 에 일괄 자동 구독. `initial_symbols` 와는 합집합.
- `[general].universe_mode` (기본 true), `universe_limit` (0=무제한),
  `listing_require_binance_futures` (기본 true) 추가.

#### 4-C. 1000-prefix 가격 스케일링

- Binance Futures 가 저가 코인을 `1000PEPE`, `1000SHIB`, `1MBABYDOGE` 처럼 prefix 로
  표시하고 호가도 그 배수로 보낸다. Upbit 와 단위가 맞지 않아 그대로 비교하면 갭이 -99% 로 찍힘.
- `universe::normalize_binance_base()` 로 `1000PEPE → ("PEPE", 1000)` 분해.
- `BinanceClient` 에 `symbol_map: HashMap<normalized, BinanceFutSpec>` 주입.
  - 구독: `SymbolCommand::Add("PEPE")` → 실제로는 `1000pepeusdt@bookTicker` 구독.
  - 수신: `1000PEPEUSDT` 메시지 → `Quote.symbol = "PEPE"`, 가격은 `/multiplier` 로 환산.
- Hub/Strategy 는 항상 normalized base 와 환산된 가격을 보므로 갭/PnL 단위 정합.
- `normalize_binance_base` 단위 테스트 5건 포함.

#### 4-D. Telegram listing 필터

- `hub.rs::spawn_listing_router` 에 `binance_fut_filter: Option<Arc<HashSet<String>>>`
  파라미터 추가. universe 가 fetch 한 캐시를 그대로 재사용.
- 업비트 신규상장 공지의 base 가 Binance Futures 에 없으면 SKIP 로그 후 무시.
- universe_mode=false 라도 `listing_require_binance_futures=true` 면 시작 시 1회만 fetch.

#### 4-E. 텔레그램 폴링 로직 보완 (Python 원본과 동일)

- `last_id == 0` (첫 기동) 이면 채널 최신 메시지 id 만 기록하고 과거 공지는 처리 안 함.
- `is_today_kst()` 로 메시지 날짜(KST) 가 오늘이 아니면 파싱 스킵.
- 백테스팅용 `backtest::scan_history()` 를 `#[ignore]` 테스트로 별도 보관
  (`cargo test --features tg -- backtest_scan_history --nocapture --ignored`).

#### 4-F. ★ 디스크 IO 와 핫패스 완전 분리

**문제**: `Hub::spawn_quote_consumer` 가 매 quote 마다 95행 CSV 를 **truncate + 재작성**
하고 있었음. universe_mode 로 95페어 동시 모니터링 시 초당 수백 quote 가 와서 IO 가
broadcast 를 추월하지 못해 `broadcast lag: N msgs dropped` 가 폭증, DRIFT 경고도 도배.

**해결** (사용자 지시: "데이터 가져오는 부분은 절대 늦추지 마라"):

- **핫패스에서 디스크 IO 완전 제거**. `spawn_quote_consumer` 는 DashMap 한 줄 업데이트만.
- **NDJSON event logger** (`spawn_event_logger`) 를 별도 task 로 분리:
  - 양쪽 broadcast 를 또 한 번 subscribe.
  - `BufWriter` 64KB + 1초 flush. `writeln!` 매크로로 임시 String alloc 없이 직출력.
  - **append-only** — CSV 처럼 truncate 안 함.
  - 느려져도 핫패스 영향 0 (broadcast 채널의 핵심 이점).
- `config.toml`: `csv_path` → **`event_log_path = "events.jsonl"`**. 빈 문자열이면 비활성.
  (호환성 위해 `csv_path` alias 유지.)
- 백테스팅 후처리: `pd.read_json("events.jsonl", lines=True)`.
- **확장자(.csv/.txt/.jsonl)는 속도와 무관**. 핵심은 append-only + buffered + 핫패스 분리.

#### 4-G. 로그 throttle + broadcast 버퍼 증대

- broadcast 버퍼 4096 → **16384** (universe burst 흡수).
- `broadcast::error::RecvError::Lagged(n)` 경고는 5초마다 누적량 1줄로 묶음.
- `strategy.rs` 의 DRIFT (UpbitOverBinance) 경고는 심볼별 **60초 throttle**.
  `last_drift_log_ms: HashMap<String, i64>` 추가.
- `grammers_session` 모듈 로그 레벨을 `error` 로 낮춤 ("unknown peer" 잡음 제거).

#### 4-H. 신규 모듈/파일

| 파일 | 역할 |
|---|---|
| `src/exchange/universe.rs` | REST 교집합 fetch + base normalization + multiplier 테이블 |

### 2026-05-20 — 텔레그램 워커 본 구현 + 환율 라이브 워커

- **텔레그램 (grammers 0.7) 본 구현**.
  - `src/listing/telegram.rs` — `connect` → 인증 체크 → `poll_loop` → 신규상장 발견 시 `ListingNotice` mpsc 전송.
  - `last_id.txt` / `processed_symbols.txt` 로 중복 방지 + 재시작 안정성.
  - `src/bin/tg_login.rs` 추가: stdin 점유 충돌 회피용 1회 로그인 바이너리.
  - Cargo.toml 의 grammers 를 **0.7 로 고정** (0.8/0.9 는 SenderPool 기반 신 API 라 비호환).
  - `[features] default = ["tg"]` — 기본 빌드에 포함. `config.toml` 의 `enabled = true` 일 때만 실제 동작.
- **USD/KRW 환율 라이브 워커** (`src/exchange/upbit_rate.rs`).
  - 업비트 REST `/v1/ticker?markets=KRW-USDT` 를 기본 5분 간격으로 폴링.
  - `Hub::usd_krw_handle()` 의 `RwLock<f64>` 를 라이브 갱신 → strategy 의 PnL 계산이 실환율 사용.
  - `[general].usd_krw_refresh_sec` 로 주기 조절. `0` 이면 워커 비활성.
- 의존성 추가: `reqwest 0.12 (native-tls)`.
- `cargo check` + `cargo check --examples --bins` 전부 통과 확인됨.

### 2026-05-19 — 시간 기반 청산 + 거래 로그 + 단계별 examples

- 사용자가 실주문 진입 전에 **paper + Excel 백테스팅** 단계를 명시 → P2 게이트 추가.
- `[strategy].max_hold_secs` (기본 86400) 추가, `ExitReason::TimeExpired` 신설.
  - `strategy.rs` 가 1초 ticker 로 만료 포지션을 `evaluate_pnl` → `ExitSignal` 발사 후 즉시 정리.
  - 매 quote 가 아닌 별도 ticker 라 핫패스에 영향 없음.
- `[general].trade_log_path` (기본 `trade_log.csv`) 추가, 진입/청산마다 1행 append.
  - `position_id` (UUID v4) 로 ENTRY ↔ EXIT 매칭 가능. Excel 에서 피벗으로 한 사이클 분석.
  - 콜드패스에서만 sync IO. 핫패스 영향 없음.
- `PositionState.position_id`, `GapDirection::as_str()`, `ExitReason::as_str()`, `TradeLogEntry` 추가.
- `src/lib.rs` 신규 + `src/main.rs` 의 `mod xxx;` 제거 → lib + bin 일원화.
  - 덕분에 `examples/test_binance.rs`, `test_upbit.rs`, `test_both.rs` 가 메인 모듈을 그대로 재사용.
- 속도 가이드라인을 `strategy.rs` 머리말 doc-comment 에 명시 (핫패스 / 콜드패스 분리).

### 2026-05-18 — 문서 분할

- 문서 구조 정리: 루트의 `PLAN.md` 와 비대해진 `README.md` 를 `docs/` 하위로 분할.
  - `docs/strategy.md` — 전략·시나리오·PnL 공식
  - `docs/architecture.md` — 시스템 구성·모듈·실행 흐름
  - `docs/reference_python.md` — Python 참고용 코드 설명
  - `docs/plan.md` — 본 문서 (구 PLAN.md)
- `README.md` 경량화 — 짧은 개요 + 빌드/실행 + docs 링크만.
- `PLAN.md` 삭제 (내용은 `docs/plan.md` 로 이동).

### 2026-05-18 — 전략 재정의

- 메인 전략을 **델타 중립 1:10 헤지** 로 재정의 (이전: 단방향 SHORT).
  - 1:10 자본 비율 + 10배 레버리지 → 동일 수량 매수/공매도 → 델타 중립.
  - 송금 없음 (V29 대비 단순화).
  - 진입 갭 ≥ 3%, 익절 합산 1.5%, 손절 증거금 80%.
- `src/strategy.rs` 신규 — 진입/청산 신호 머신.
- `src/types.rs` 확장 — `EntrySignal`, `PositionState`, `PnlSnapshot`, `ExitSignal`, `TradeCommand`, `GapDirection`.
- `src/hub.rs` 개정 — 김치 프리미엄 단일 출력 → 갭% 디버그 ticker. 신호 로직은 모두 strategy 로 이관.
- `src/stdin_input.rs` 확장 — `enter`/`exit`/`auto_entry`/`auto_exit` 추가.
- `src/config.rs` + `config.example.toml` — `[strategy]` 섹션 추가, 미사용 `arbitrage_log_path` 제거.
- `.gitattributes` — LF eol 정책 박음 (CRLF 워닝 종료).
- git remote 정정 (`listing_short.git` → `listing_arbitrage.git`).

### 2026-05-18 이전

- 초기 Cargo 프로젝트 골격 생성.
- `binance.rs` / `upbit.rs` WebSocket 클라이언트 작성.
- 업비트 공지 정규식 파서.
- 텔레그램 grammers stub.
- Hub + DashMap 호가 통합.
- Cargo.toml 의존성 호환성 (grammers 0.9, tokio-tungstenite 0.24 등) 정리.
