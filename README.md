# Portal

企業應用入口網站系統，包含前端展示、後端 API 與資料庫管理。

## 專案結構

```
portal/
├── backend/              # 後端 FastAPI 應用
├── frontend/             # 前端 Vue.js 應用
├── nginx/                # Nginx 反向代理設定
├── docker/               # Docker 相關檔案
│   ├── docker-compose.yml    # Docker Compose 設定
│   ├── .env                  # 當前環境變數
│   └── envs/                 # 環境設定檔
│       ├── .env.development  # 開發環境
│       ├── .env.production   # 正式環境
│       └── .env.example      # 範本
├── scripts/              # 部署與管理腳本
└── deploy.sh             # 主要部署腳本
```

## 快速開始

### 1. 環境需求

- Docker (with Docker Compose v2+)
- Git

### 2. 部署專案

#### 開發環境

```bash
./deploy.sh development
```

#### 正式環境

```bash
./deploy.sh production
```

部署腳本會：
1. 檢查 `docker/.env` 是否存在
2. 如不存在，自動從 `docker/envs/.env.[environment]` 複製
3. 使用新版 `docker compose` 指令啟動服務

### 3. 存取服務

開發環境預設埠號：
- 前端: http://localhost:9102
- 後端 API: http://localhost:9202
- 資料庫: localhost:9302

正式環境預設埠號：
- 前端: http://localhost:80
- 後端 API: http://localhost:8001
- 資料庫: localhost:5432

## 管理指令

### 啟動服務

```bash
# 使用現有環境設定啟動
cd docker
docker compose up -d

# 或使用 scripts
./scripts/start.sh

# 重新建置並啟動
./scripts/start.sh --build
```

### 停止服務

```bash
# 停止服務
./scripts/stop.sh

# 停止並清除容器與映像
./scripts/stop.sh --clean
```

### 查看日誌

```bash
# 所有服務
./scripts/logs.sh

# 特定服務
./scripts/logs.sh backend

# 持續追蹤
./scripts/logs.sh --follow
```

### 健康檢查

```bash
./scripts/health.sh
```

### 藍綠部署切換

```bash
# 切換到藍色環境
./scripts/deploy.sh blue

# 切換到綠色環境
./scripts/deploy.sh green

# 自動部署到非活躍環境並切換
./scripts/deploy.sh auto

# 快速回滾
./scripts/deploy.sh rollback

# 查看狀態
./scripts/deploy.sh status
```

## 環境設定

### 設定檔位置

- 當前使用: `docker/.env`
- 環境範本: `docker/envs/`

### 主要環境變數

```bash
# Compose 專案名稱（取代 container_name）
COMPOSE_PROJECT_NAME=portal

# 服務埠號
FRONTEND_PORT=9102
BACKEND_PORT=9202
DB_EXTERNAL_PORT=9302

# 前端 API URL
VITE_API_URL=http://localhost:9202

# 資料庫設定
POSTGRES_USER=portal_admin
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=portal_db
```

### 切換環境

```bash
# 手動切換
cp docker/envs/.env.production docker/.env

# 或使用部署腳本自動處理
./deploy.sh production
```

## Docker Compose 規範

本專案使用 Docker Compose v2+ 規範：

✅ **採用**
- 移除 `version` 欄位
- 使用 `COMPOSE_PROJECT_NAME` 環境變數
- 使用 `docker compose` 指令（非 `docker-compose`）
- 容器名稱由 Compose 自動管理（格式：`{project}-{service}-{index}`）

❌ **避免**
- 不使用 `container_name` 欄位
- 不使用舊版 `docker-compose` 指令

## 開發指南

### 建立管理員帳號

```bash
./scripts/create_admin.sh
# 或指定帳號密碼
./scripts/create_admin.sh admin mypassword
```

### 資料庫遷移

```bash
./scripts/migrate.sh
```

### 建置特定服務

```bash
# 建置所有服務
./scripts/build.sh

# 建置特定服務
./scripts/build.sh backend
./scripts/build.sh frontend-blue
```

## 容器名稱參考

當 `COMPOSE_PROJECT_NAME=portal` 時，容器名稱為：

- `portal-db-1`
- `portal-backend-1`
- `portal-nginx-1`
- `portal-frontend-blue-1`
- `portal-frontend-green-1`

## 故障排除

### 檢查容器狀態

```bash
cd docker
docker compose ps
```

### 查看完整日誌

```bash
cd docker
docker compose logs
```

### 重新啟動服務

```bash
cd docker
docker compose restart
```

### 完全重置

```bash
./scripts/stop.sh --clean
./deploy.sh development
```

## 授權

(請根據專案實際情況添加授權資訊)
