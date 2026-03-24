#!/bin/bash
#
# pgAdmin servers.json 同步腳本
# 根據 .env 中的 POSTGRES_USER / POSTGRES_DB 自動更新 docker/pgadmin/servers.json
# 用法: ./scripts/sync_pgadmin.sh [env_file_path]
#   env_file_path: 選填，預設為 <project_root>/.env
#
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SERVERS_JSON="$PROJECT_DIR/docker/pgadmin/servers.json"

# 第一個引數可覆寫 env 檔案路徑，否則預設為 project root .env
if [ -n "$1" ]; then
    ENV_FILE="$1"
else
    ENV_FILE="$PROJECT_DIR/.env"
fi

# 顏色定義
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }

# ---- 讀取 .env 中的值 ----
if [ ! -f "$ENV_FILE" ]; then
    log_warn ".env 不存在，略過 pgAdmin servers.json 同步"
    exit 0
fi

# 只擷取需要的兩個變數（忽略其他），避免 source 全部 .env 造成副作用
ENV_PG_USER=$(grep -E '^POSTGRES_USER=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")
ENV_PG_DB=$(grep   -E '^POSTGRES_DB='   "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")

if [ -z "$ENV_PG_USER" ] || [ -z "$ENV_PG_DB" ]; then
    log_warn ".env 中未找到 POSTGRES_USER 或 POSTGRES_DB，略過同步"
    exit 0
fi

# ---- 讀取 servers.json 中的現有值 ----
if [ ! -f "$SERVERS_JSON" ]; then
    log_warn "servers.json 不存在：$SERVERS_JSON，略過同步"
    exit 0
fi

# 使用 Python3 讀寫 JSON（比 sed 可靠，且後端環境必然有 Python）
CURRENT=$(python3 - <<EOF
import json, sys
with open('$SERVERS_JSON') as f:
    d = json.load(f)
s = d['Servers']['1']
print(s.get('Username','') + '|' + s.get('MaintenanceDB',''))
EOF
)

CURRENT_USER="${CURRENT%%|*}"
CURRENT_DB="${CURRENT##*|}"

# ---- 比對 ----
if [ "$CURRENT_USER" = "$ENV_PG_USER" ] && [ "$CURRENT_DB" = "$ENV_PG_DB" ]; then
    log_info "pgAdmin servers.json 已是最新，無需同步"
    exit 0
fi

# ---- 更新 ----
log_info "偵測到差異，正在同步 servers.json ..."
log_info "  Username:      ${CURRENT_USER} → ${ENV_PG_USER}"
log_info "  MaintenanceDB: ${CURRENT_DB} → ${ENV_PG_DB}"

python3 - <<EOF
import json

with open('$SERVERS_JSON') as f:
    d = json.load(f)

s = d['Servers']['1']
s['Username']      = '$ENV_PG_USER'
s['MaintenanceDB'] = '$ENV_PG_DB'

with open('$SERVERS_JSON', 'w') as f:
    json.dump(d, f, indent=2, ensure_ascii=False)
    f.write('\n')
EOF

log_success "pgAdmin servers.json 已同步完成"
