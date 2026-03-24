# Portal - CI/CD 完整部署指南

> 本文件說明如何從零開始在全新 VPS 上設定本專案的完整 CI/CD 流程。

## 目錄

- [一、架構總覽](#一架構總覽)
- [二、VPS 環境準備](#二vps-環境準備)
- [三、SSH 金鑰設定](#三ssh-金鑰設定)
- [四、專案初始化](#四專案初始化)
- [五、環境變數設定](#五環境變數設定)
- [六、首次手動啟動](#六首次手動啟動)
- [七、GitHub Actions 設定](#七github-actions-設定)
- [八、藍綠部署說明](#八藍綠部署說明)
- [九、腳本速查表](#九腳本速查表)
- [十、日常維運指令](#十日常維運指令)
- [十一、故障排除](#十一故障排除)

---

## 一、架構總覽

```
┌─────────────────────────────────────────────┐
│                    VPS                       │
│                                              │
│  ┌──────────┐     ┌──────────────────────┐   │
│  │  Nginx   │────▶│ frontend-blue  (:80) │   │
│  │  (:80)   │     └──────────────────────┘   │
│  │  (:443)  │     ┌──────────────────────┐   │
│  │  Reverse │────▶│ frontend-green (:80) │   │
│  │  Proxy   │     └──────────────────────┘   │
│  └────┬─────┘     ┌──────────────────────┐   │
│       └──────────▶│ backend      (:8001) │   │
│                   └──────────┬───────────┘   │
│                              │               │
│                   ┌──────────▼───────────┐   │
│                   │ PostgreSQL   (:5432)  │   │
│                   └──────────────────────┘   │
└─────────────────────────────────────────────┘
```

### 服務說明

| 服務 | 說明 | 技術 |
|------|------|------|
| `nginx` | 反向代理、藍綠流量切換 | Nginx Alpine |
| `frontend-blue/green` | 前端靜態資源 | Vue 3 + Vite + Bun |
| `backend` | REST API | FastAPI (Python) |
| `db` | 關聯式資料庫 | PostgreSQL 15 |

### CI/CD 流程

```
git push → GitHub Actions CI → 建置測試
                ↓
          推送到 master → 建置 Docker 映像 → 推送到 GHCR
                ↓
          SSH 進 VPS → 拉取映像 → 藍綠部署 → 健康檢查
```

---

## 二、VPS 環境準備

### 2.1 系統需求

| 項目 | 最低需求 | 建議 |
|------|---------|------|
| OS | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |
| CPU | 1 vCPU | 2 vCPU |
| RAM | 1 GB | 2 GB |
| 磁碟 | 20 GB | 40 GB |

### 2.2 更新系統套件

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw
```

### 2.3 安裝 Docker

```bash
# 安裝 Docker Engine
curl -fsSL https://get.docker.com | sh

# 將目前使用者加入 docker 群組（免 sudo）
sudo usermod -aG docker $USER

# 登出再重新登入後生效，或執行：
newgrp docker

# 確認安裝
docker --version
docker compose version
```

### 2.4 建立部署使用者（建議）

建議使用專屬的低權限帳號執行部署（非 root）：

```bash
# 建立 deploy 使用者
sudo adduser deploy

# 加入 docker 群組
sudo usermod -aG docker deploy

# 切換到 deploy 使用者
sudo su - deploy
```

### 2.5 設定防火牆

```bash
# 允許 SSH
sudo ufw allow OpenSSH

# 允許 HTTP / HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 啟用防火牆
sudo ufw enable

# 確認狀態
sudo ufw status
```

> ⚠️ 確保開啟防火牆前已允許 SSH，否則會被鎖在外面。

---

## 三、SSH 金鑰設定

GitHub Actions 需要透過 SSH 連線到 VPS 執行部署。

### 3.1 在本機（或 VPS）產生金鑰對

```bash
# 在本機執行，產生專用於部署的金鑰（不設密碼）
ssh-keygen -t ed25519 -C "github-deploy" -f ~/.ssh/portal_deploy_key -N ""
```

執行後會產生：
- `~/.ssh/portal_deploy_key`（私鑰，給 GitHub Actions 用）
- `~/.ssh/portal_deploy_key.pub`（公鑰，放到 VPS）

### 3.2 將公鑰加到 VPS

```bash
# 在 VPS 上執行（以 deploy 使用者登入）
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# 將公鑰內容貼入（替換為實際內容）
echo "ssh-ed25519 AAAA...你的公鑰內容..." >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 3.3 測試 SSH 連線

```bash
# 在本機測試
ssh -i ~/.ssh/portal_deploy_key deploy@你的VPS_IP
```

### 3.4 查看私鑰內容（待會要複製到 GitHub）

```bash
cat ~/.ssh/portal_deploy_key
```

---

## 四、專案初始化

### 4.1 在 VPS 上 Clone 專案

```bash
# 切換到 deploy 使用者
sudo su - deploy

# 建立專案目錄
mkdir -p ~/projects
cd ~/projects

# Clone 專案
git clone https://github.com/你的組織/portal.git
cd portal
```

### 4.2 設定腳本執行權限

```bash
chmod +x scripts/*.sh
```

---

## 五、環境變數設定

### 5.1 建立 .env 檔案

```bash
# 複製範本
cp docker/envs/.env.example .env

# 編輯填入實際值
nano .env
```

### 5.2 必填項目說明

```bash
# 外部埠號（依需求調整，避免與系統其他服務衝突）
NGINX_PORT=80
BACKEND_PORT=8001
DB_EXTERNAL_PORT=5432

# 前端 API URL（瀏覽器呼叫的後端位址，需填入實際域名或 IP）
VITE_API_URL=https://api.yourdomain.com

# 資料庫（請務必設定強密碼）
POSTGRES_USER=portal_user
POSTGRES_PASSWORD=請替換為強密碼至少16字元
POSTGRES_DB=portal_db

# 藍綠部署初始環境
ACTIVE_FRONTEND=blue
```

> ⚠️ `.env` 檔案含有機密資訊，**絕對不可提交到 Git**。

---

## 六、首次手動啟動

### 6.1 建置並啟動所有服務

```bash
cd ~/projects/portal

# 首次啟動（含建置映像）
./scripts/start.sh --build
```

### 6.2 執行資料庫遷移

```bash
./scripts/migrate.sh
```

### 6.3 建立管理員帳號

```bash
./scripts/create_admin.sh
```

### 6.4 確認服務狀態

```bash
# 健康檢查
./scripts/health.sh

# 查看所有容器狀態
docker compose -f docker/docker-compose.yml ps
```

### 6.5 確認可以連線

```bash
# 測試後端 API
curl http://localhost:8001/docs

# 測試前端
curl http://localhost:80
```

---

## 七、GitHub Actions 設定

### 7.1 設定 Repository Secrets

至 GitHub → Repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**，依序新增以下 Secrets：

| Secret 名稱 | 說明 | 範例 |
|------------|------|------|
| `VPS_HOST` | VPS IP 位址或域名 | `203.0.113.10` |
| `VPS_USER` | SSH 登入使用者 | `deploy` |
| `VPS_SSH_KEY` | SSH 私鑰完整內容（含首尾行） | `-----BEGIN OPENSSH PRIVATE KEY-----`... |
| `PROJECT_PATH` | VPS 上的專案絕對路徑 | `/home/deploy/projects/portal` |
| `PROD_API_URL` | 後端根網址（**不含 `/api`**，前端會自動補上） | `https://yourdomain.com` |

> **VPS_SSH_KEY** 貼入時需包含完整內容：
> ```
> -----BEGIN OPENSSH PRIVATE KEY-----
> b3BlbnNzaC1rZXktdjEAAAAA...
> -----END OPENSSH PRIVATE KEY-----
> ```

### 7.2 多專案共用同一台 VPS 的建議

如果同一台 VPS 跑多個專案，可將 `VPS_HOST`、`VPS_USER`、`VPS_SSH_KEY` 設定在 **Organization Secrets**（不需每個 Repo 重複設定），只有 `PROJECT_PATH` 和 `PROD_API_URL` 需要在各 Repo 中個別設定。

**Organization Secrets 路徑：**  
Organization → **Settings** → **Secrets and variables** → **Actions**

### 7.3 設定 GitHub Container Registry 權限

確認 Repository 的 **Settings** → **Actions** → **General** 中：  
「Workflow permissions」設為 **Read and write permissions**，讓 Actions 可以推送映像到 GHCR。

### 7.4 工作流程說明

| 工作流程 | 觸發條件 | 執行內容 |
|---------|---------|---------|
| `ci.yml` | push 到任何分支 | 後端語法檢查、前端建置測試、Docker 建置測試 |
| `deploy-prod.yml` | push 到 `master` | 建置映像 → 推送 GHCR → SSH 部署 → 健康檢查 |
| `deploy-prod.yml`（手動） | workflow_dispatch | 支援手動觸發回滾（切換藍綠環境） |

### 7.5 首次部署驗證

Push 到 master 後，至 GitHub → **Actions** 查看工作流程執行狀態：

1. `build-and-push` job：建置並推送 Docker 映像到 GHCR
2. `deploy` job：SSH 連線 VPS，拉取映像，執行藍綠部署

---

## 八、藍綠部署說明

### 8.1 架構

Nginx 反向代理同時代理兩個前端容器（blue / green），透過修改 Nginx 設定切換流量至目標環境，實現**零停機部署**。

```
             ┌──────────────────┐
 用戶請求 ──▶│      Nginx       │
             │  (流量路由控制)  │
             └───────┬──────────┘
                     │  active
          ┌──────────┴──────────┐
          ▼                     ▼
   [frontend-blue]       [frontend-green]
   (目前活躍)             (備用/下次部署)
```

### 8.2 部署流程

```bash
# 查看目前活躍環境
./scripts/deploy.sh status

# 自動部署：更新非活躍環境，健康確認後切換流量
./scripts/deploy.sh auto

# 手動切換至指定環境
./scripts/deploy.sh blue
./scripts/deploy.sh green

# 立即回滾（切換回另一個環境）
./scripts/deploy.sh rollback
```

### 8.3 回滾操作

若新版本有問題，可透過 GitHub Actions 手動觸發回滾：

1. 至 GitHub → **Actions** → **Deploy to Production**
2. 點選 **Run workflow**
3. 將 `rollback` 選項改為 `true`，然後執行

或直接在 VPS 上執行：

```bash
./scripts/deploy.sh rollback
```

---

## 九、腳本速查表

| 腳本 | 用途 | 常用參數 |
|------|------|---------|
| `scripts/start.sh` | 啟動所有服務 | `--build` 重新建置後啟動 |
| `scripts/stop.sh` | 停止所有服務 | `--clean` 同時清理映像 |
| `scripts/build.sh` | 建置 Docker 映像 | `[service]` 只建置指定服務 |
| `scripts/deploy.sh` | 藍綠部署控制 | `blue \| green \| status \| auto \| rollback` |
| `scripts/migrate.sh` | 執行資料庫遷移 | — |
| `scripts/create_admin.sh` | 建立管理員帳號 | — |
| `scripts/logs.sh` | 查看服務日誌 | `[service]`、`--follow` 持續追蹤 |
| `scripts/health.sh` | 服務健康狀態檢查 | — |

---

## 十、日常維運指令

### 查看狀態

```bash
# 所有容器狀態
docker compose -f docker/docker-compose.yml ps

# 健康檢查（含詳細資訊）
./scripts/health.sh

# 藍綠部署狀態
./scripts/deploy.sh status
```

### 查看日誌

```bash
# 查看後端日誌（持續追蹤）
./scripts/logs.sh backend --follow

# 查看 Nginx 日誌
./scripts/logs.sh nginx --follow

# 查看所有服務日誌
./scripts/logs.sh
```

### 更新程式碼（不經 CI/CD 的緊急手動部署）

```bash
cd ~/projects/portal
git pull origin master
./scripts/start.sh --build
./scripts/migrate.sh
./scripts/deploy.sh auto
./scripts/health.sh
```

### 進入容器

```bash
# 後端容器
docker exec -it portal-backend bash

# 資料庫（互動式 psql）
docker exec -it portal-db psql -U portal_user -d portal_db
```

### 備份資料庫

```bash
# 備份
docker exec portal-db pg_dump -U portal_user portal_db > backup_$(date +%Y%m%d_%H%M%S).sql

# 還原
docker exec -i portal-db psql -U portal_user -d portal_db < backup_20260101_120000.sql
```

---

## 十一、故障排除

### CI/CD 常見問題

**Q: GitHub Actions 顯示 SSH 連線失敗**

```
Error: dial tcp: connection refused
```

檢查項目：
1. `VPS_HOST` 是否正確（IP 或域名）
2. VPS 防火牆是否開放 SSH（port 22）
3. `VPS_SSH_KEY` 是否完整貼入（含首尾行）
4. VPS 上 `~/.ssh/authorized_keys` 是否包含對應公鑰
5. `~/.ssh/authorized_keys` 權限是否為 `600`

```bash
# 在 VPS 上確認
ls -la ~/.ssh/
cat ~/.ssh/authorized_keys
```

---

**Q: Docker 映像推送失敗（GHCR 權限）**

```
Error: denied: permission_denied
```

至 GitHub → Repository → **Settings** → **Actions** → **General**，確認「Workflow permissions」為 **Read and write permissions**。

---

**Q: 前端建置失敗（bun 安裝錯誤）**

確認 `frontend/package.json` 中沒有與 bun 不相容的套件。本地可先執行：

```bash
cd frontend
bun install
bun run build
```

若有 `bun.lockb` 產生，請記得 commit 到 Git 以確保 CI 環境一致。

---

**Q: 資料庫連線失敗**

```bash
# 確認資料庫容器正在運行
docker compose -f docker/docker-compose.yml ps db

# 查看資料庫日誌
./scripts/logs.sh db

# 確認 .env 中的資料庫設定正確
cat .env | grep POSTGRES
```

---

**Q: 服務啟動後健康檢查失敗**

```bash
# 查看各服務詳細狀態
docker compose -f docker/docker-compose.yml ps

# 查看問題服務的日誌
./scripts/logs.sh backend
./scripts/logs.sh nginx

# 手動觸發健康檢查
./scripts/health.sh
```

---

**Q: 藍綠部署後流量未切換**

```bash
# 確認當前活躍環境
./scripts/deploy.sh status

# 手動切換
./scripts/deploy.sh blue   # 或 green

# 重新載入 Nginx 設定
docker exec portal-nginx nginx -s reload
```

---

## ⚠️ 安全注意事項

1. **`.env` 絕對不可提交到 Git**，含有資料庫密碼等機密資訊
2. 定期更換資料庫密碼（更換後需同步更新 VPS 的 `.env` 及 GitHub Secrets）
3. SSH 金鑰使用 `ed25519` 算法，比 `rsa` 更安全
4. VPS 建議關閉密碼登入，只允許金鑰認證：
   ```bash
   # /etc/ssh/sshd_config
   PasswordAuthentication no
   PubkeyAuthentication yes
   ```
5. 定期備份資料庫到異地
6. 正式環境請勿開放 `DB_EXTERNAL_PORT`（或設定 VPS 防火牆只允許內部存取）
