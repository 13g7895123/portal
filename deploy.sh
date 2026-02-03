#!/bin/bash
#
# Portal 部署腳本
# 用法: ./deploy.sh [development|production|staging]
#
# 此腳本用於啟動 Docker Compose 環境
#
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DOCKER_DIR="$PROJECT_DIR/docker"
ENV_DIR="$DOCKER_DIR/envs"
ENV_FILE="$DOCKER_DIR/.env"

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 檢查環境參數
if [ -z "$1" ]; then
    log_error "請指定環境: development, production, 或 staging"
    echo ""
    echo "用法: $0 [development|production|staging]"
    echo ""
    echo "範例:"
    echo "  $0 development    # 啟動開發環境"
    echo "  $0 production     # 啟動正式環境"
    echo ""
    exit 1
fi

ENVIRONMENT=$1

# 驗證環境名稱
case "$ENVIRONMENT" in
    development|production|staging)
        ;;
    *)
        log_error "無效的環境: $ENVIRONMENT"
        echo "有效的環境: development, production, staging"
        exit 1
        ;;
esac

log_info "準備部署環境: $ENVIRONMENT"

# 檢查 .env 是否存在於 docker 資料夾中
if [ ! -f "$ENV_FILE" ]; then
    log_warn ".env 檔案不存在於 docker 資料夾中"
    
    # 檢查對應的環境檔案是否存在
    SOURCE_ENV="$ENV_DIR/.env.$ENVIRONMENT"
    
    if [ ! -f "$SOURCE_ENV" ]; then
        log_error "找不到環境設定檔: $SOURCE_ENV"
        log_info "請先建立環境設定檔或從範本複製:"
        echo "  cp $ENV_DIR/.env.example $SOURCE_ENV"
        exit 1
    fi
    
    log_info "從 $SOURCE_ENV 複製環境設定..."
    cp "$SOURCE_ENV" "$ENV_FILE"
    log_success "環境設定檔已複製到 $ENV_FILE"
else
    log_info "使用現有的 .env 檔案"
fi

# 切換到 docker 目錄
cd "$DOCKER_DIR"

# 檢查 Docker 和 Docker Compose 是否安裝
if ! command -v docker &> /dev/null; then
    log_error "Docker 未安裝，請先安裝 Docker"
    exit 1
fi

if ! docker compose version &> /dev/null; then
    log_error "Docker Compose (新版本) 未安裝"
    log_info "請更新 Docker 到支援 'docker compose' 指令的版本"
    exit 1
fi

# 顯示當前環境資訊
log_info "========================================="
log_info "環境: $ENVIRONMENT"
log_info "設定檔: $ENV_FILE"
log_info "Docker Compose: $(docker compose version --short)"
log_info "========================================="

# 拉取最新映像
log_info "拉取最新的 Docker 映像..."
docker compose pull

# 建置映像
log_info "建置 Docker 映像..."
docker compose build

# 啟動容器
log_info "啟動容器..."
docker compose --env-file .env up -d

# 檢查容器狀態
log_info "檢查容器狀態..."
sleep 3
docker compose ps

# 顯示日誌
log_success "========================================="
log_success "部署完成！環境: $ENVIRONMENT"
log_success "========================================="
echo ""
log_info "查看日誌: docker compose -f $DOCKER_DIR/docker-compose.yml logs -f"
log_info "停止服務: docker compose -f $DOCKER_DIR/docker-compose.yml down"
log_info "重啟服務: docker compose -f $DOCKER_DIR/docker-compose.yml restart"
echo ""

# 顯示服務 URL
source "$ENV_FILE"
echo ""
log_info "服務訪問地址:"
echo "  前端: http://localhost:${FRONTEND_PORT}"
echo "  後端: http://localhost:${BACKEND_PORT}"
echo "  資料庫: localhost:${DB_EXTERNAL_PORT}"
echo ""
