# 배포 · 외부 접속 · 방화벽 (Deployment & Firewall)

> 로컬에서 띄운 사이트(기본 포트 **8000**)를 외부에서 접속 가능하게 만드는 방법과
> 방화벽 설정을 정리합니다. **OS에 따라 방법이 다르므로** 본인 환경에 맞는 절을 따르세요.

마지막 업데이트: 2026-06-08

---

## 0. 먼저 이해할 것 — 서버가 "어디서" 도는가?

외부 접속을 막는 방화벽은 **서버 프로세스가 실제로 떠 있는 OS의 방화벽**입니다.

| 서버 실행 위치 | 외부 접속을 여는 방화벽 | 추가로 필요한 것 |
|---|---|---|
| **Windows에서** `python -m http.server` | **Windows Defender 방화벽** | (없음) |
| **WSL(Ubuntu) 안에서** 실행 | WSL 내부 **UFW** | + Windows 호스트 포트포워딩(netsh) |
| 리눅스 서버/VPS | 그 서버의 **UFW** (또는 firewalld) | 클라우드 보안그룹도 함께 |

> ⚠️ **핵심 주의**: 서버를 **Windows의 Python**으로 띄웠다면, **WSL의 UFW를 열어도 외부 접속이 되지 않습니다.**
> UFW는 WSL 리눅스 VM 내부 트래픽만 제어하기 때문입니다. 이 경우는 아래 **1번(Windows 방화벽)**을 사용하세요.

---

## 1. Windows에서 띄운 경우 — Windows Defender 방화벽

현재 이 프로젝트의 서버(`python -m http.server 8000`)는 Windows에서 실행 중이므로 이 방법이 맞습니다.

### 1-1. 인바운드 규칙 추가 (관리자 PowerShell)

```powershell
New-NetFirewallRule -DisplayName "NetbiX 8000" -Direction Inbound -Protocol TCP -LocalPort 8000 -Action Allow
```

### 1-2. 규칙 확인 / 삭제

```powershell
# 확인
Get-NetFirewallRule -DisplayName "NetbiX 8000"
# 삭제 (외부 공개 종료 후)
Remove-NetFirewallRule -DisplayName "NetbiX 8000"
```

### 1-3. 서버를 모든 인터페이스에 바인딩

`localhost`만 듣고 있으면 외부에서 못 들어옵니다. 0.0.0.0으로 띄웁니다.
```powershell
python -m http.server 8000 --bind 0.0.0.0
```

### 1-4. 접속 주소
- 같은 네트워크(LAN): `http://<PC의 사설 IP>:8000` (사설 IP는 `ipconfig`로 확인)
- 인터넷(WAN): 공유기에서 **8000번 포트포워딩** 설정 필요 + 공인 IP로 접속

---

## 2. WSL(Ubuntu) 안에서 띄운 경우 — UFW + 포트포워딩

서버를 WSL 리눅스 안에서 실행할 때만 해당합니다. (WSL2는 NAT 뒤에 있어 두 단계가 필요)

### 2-1. WSL 내부에서 UFW 열기
```bash
# WSL 터미널(Ubuntu)에서
sudo apt update && sudo apt install -y ufw     # 미설치 시
sudo ufw allow 8000/tcp
sudo ufw enable
sudo ufw status verbose
```

### 2-2. Windows → WSL 포트포워딩 (관리자 PowerShell)
WSL2의 IP는 재부팅마다 바뀔 수 있으므로 매번 확인합니다.
```powershell
# WSL IP 확인
$wslIp = (wsl hostname -I).Trim().Split(" ")[0]
# 포트포워딩 등록
netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=8000 connectaddress=$wslIp connectport=8000
# Windows 방화벽도 함께 허용
New-NetFirewallRule -DisplayName "NetbiX 8000 (WSL)" -Direction Inbound -Protocol TCP -LocalPort 8000 -Action Allow
```

### 2-3. 포트포워딩 확인 / 삭제
```powershell
netsh interface portproxy show v4tov4
netsh interface portproxy delete v4tov4 listenaddress=0.0.0.0 listenport=8000
```

---

## 3. 리눅스 서버 / VPS 에 배포한 경우 — UFW

```bash
sudo ufw allow 8000/tcp     # 또는 'sudo ufw allow http' (80포트)
sudo ufw reload
sudo ufw status
```
- 클라우드(AWS/GCP/Azure 등)는 OS의 UFW와 **별개로** 보안그룹/방화벽 인바운드도 열어야 합니다.
- 운영 환경에서는 `http.server` 대신 Nginx 등 정식 웹서버 + 80/443 포트 사용을 권장합니다.

---

## 4. 보안 주의사항 (꼭 읽기)

- `python -m http.server`는 **개발/테스트용**입니다. 인증·HTTPS·접근제어가 없으므로 인터넷에 장시간 노출하지 마세요.
- 외부 공개가 끝나면 **방화벽 규칙과 포트포워딩을 반드시 삭제**하세요.
- 공유기 포트포워딩으로 인터넷에 열면 누구나 접근 가능합니다. 임시 공유는 `ngrok`, `cloudflared` 같은 터널링 도구가 더 안전합니다.
  ```powershell
  # 예: ngrok (설치돼 있다면) — 방화벽/포트포워딩 없이 임시 공개 URL 발급
  ngrok http 8000
  ```
- 운영 배포는 정식 웹서버(Nginx) + HTTPS(Let's Encrypt) 구성을 권장합니다.

---

## 5. 빠른 결정 표

| 상황 | 사용할 절 |
|---|---|
| 내 Windows PC에서 띄우고 같은 사무실/집 와이파이에서 본다 | 1번 |
| 내 Windows PC에서 띄우고 외부 인터넷에서 본다 | 1번 + 공유기 포트포워딩 (또는 ngrok) |
| WSL Ubuntu 안에서 서버를 돌린다 | 2번 |
| 클라우드/리눅스 서버에 올린다 | 3번 |
| 잠깐만 외부에 보여주면 된다 | 4번의 ngrok/cloudflared |
