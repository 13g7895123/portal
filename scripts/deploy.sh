#!/bin/bash
#
# 藍綠部署切換腳本
# 用法: ./scripts/deploy.sh [blue|green|auto|production|development|staging]
#
# 此腳本用於在藍綠環境之間切換流量
# 當使用環境參數（production/development/staging）時，會自動執行藍綠部署
#
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DOCKER_DIR="$PROJECT_DIR/docker"

cd "$DOCKER_DIR"

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

NGINX_CONF="$PROJECT_DIR/nginx/conf.d/default.conf"
NGINX_CONTAINER="portal-nginx-1"

# 取得當前活躍的環境
get_active_env() {
    if grep -q 'set $frontend_host "frontend-blue"' "$NGINX_CONF"; then
        echo "blue"
    else
        echo "green"
    fi
}

# 健康檢查
health_check() {
    local service=$1
    local max_retries=30
    local retry=0
    
    log_info "等待 $service 健康檢查..."
    
    while [ $retry -lt $max_retries ]; do
        if docker compose exec -T "$service" curl -sf http://localhost:80 > /dev/null 2>&1; then
            log_success "$service 健康檢查通過"
            return 0
        fi
        retry=$((retry + 1))
        sleep 2
    done
    
    log_error "$service 健康檢查失敗"
    return 1
}

# 切換到指定環境
switch_to() {
    local target=$1
    local backup=$2
    
    log_info "切換流量到 ${target} 環境..."
    
    # 更新 nginx 變數設定
    if [ "$target" == "blue" ]; then
        sed -i 's/set $frontend_host "frontend-green"/set $frontend_host "frontend-blue"/' "$NGINX_CONF"
    else
        sed -i 's/set $frontend_host "frontend-blue"/set $frontend_host "frontend-green"/' "$NGINX_CONF"
    fi
    
    # 檢查 nginx 容器是否運行
    if docker compose ps nginx | grep -q "Up"; then
        # 重載 nginx
        docker compose exec nginx nginx -s reload
        log_success "已切換到 ${target} 環境"
    else
        log_warn "Nginx 容器未運行，配置已更新但未重載"
        log_info "請執行 'docker compose restart nginx' 套用變更"
    fi
}

# 部署新版本
deploy() {
    local target=$1
    
    log_info "正在部署新版本到 ${target} 環境..."
    
    # 確保所有基礎服務都在運行
    log_info "確保基礎服務運行中..."
    docker compose up -d db backend
    
    # 先啟動兩個前端環境（nginx 依賴它們）
    log_info "啟動前端環境..."
    docker compose up -d frontend-blue frontend-green
    
    # 等待前端容器啟動
    sleep 3
    
    # 最後啟動 nginx
    log_info "啟動 Nginx..."
    docker compose up -d nginx
    
    # 建置並啟動目標容器（如果需要）
    docker compose build "frontend-${target}"
    docker compose up -d "frontend-${target}"
    
    # 健康檢查
    if ! health_check "frontend-${target}"; then
        log_error "新版本部署失敗，保持原環境"
        return 1
    fi
    
    return 0
}

# 顯示狀態
show_status() {
    local active=$(get_active_env)
    
    echo ""
    echo "========================================"
    echo -e "${CYAN}藍綠部署狀態${NC}"
    echo "========================================"
    
    if [ "$active" == "blue" ]; then
        echo -e "  Blue:  ${GREEN}●${NC} 活躍中"
        echo -e "  Green: ${YELLOW}○${NC} 備用"
    else
        echo -e "  Blue:  ${YELLOW}○${NC} 備用"
        echo -e "  Green: ${GREEN}●${NC} 活躍中"
    fi
    
    echo "========================================"
    echo ""
}

# 主程式
main() {
    local action=$1
    local current_env=$(get_active_env)
    
    case "$action" in
        # 環境部署模式 - 自動執行藍綠部署
        production|development|staging)
            log_info "檢測到環境參數: $action"
            log_info "將執行自動藍綠部署..."
            
            # 設置環境變數檔案
            ENV_FILE="$DOCKER_DIR/.env"
            SOURCE_ENV="$DOCKER_DIR/envs/.env.$action"
            
            # 只有在 .env 不存在時才複製
            if [ ! -f "$ENV_FILE" ]; then
                if [ -f "$SOURCE_ENV" ]; then
                    log_info "使用環境設定: $SOURCE_ENV"
                    cp "$SOURCE_ENV" "$ENV_FILE"
                    log_success "環境設定已建立"
                else
                    log_error "找不到環境設定檔: $SOURCE_ENV"
                    exit 1
                fi
            else
                log_info "使用現有的 .env 設定（如需重置，請手動刪除 $ENV_FILE）"
            fi
            
            # 執行自動部署
            if [ "$current_env" == "blue" ]; then
                target="green"
            else
                target="blue"
            fi
            
            log_info "自動部署: 當前=${current_env}, 目標=${target}, 環境=${action}"
            
            if deploy "$target"; then
                switch_to "$target" "$current_env"
                show_status
            fi
            ;;
        blue)
            if [ "$current_env" == "blue" ]; then
                log_warn "當前已經在 blue 環境"
                exit 0
            fi
            switch_to "blue" "green"
            ;;
        green)
            if [ "$current_env" == "green" ]; then
                log_warn "當前已經在 green 環境"
                exit 0
            fi
            switch_to "green" "blue"
            ;;
        status)
            show_status
            ;;
        auto)
            # 自動部署到非活躍環境
            if [ "$current_env" == "blue" ]; then
                target="green"
            else
                target="blue"
            fi
            
            log_info "自動部署: 當前=${current_env}, 目標=${target}"
            
            if deploy "$target"; then
                switch_to "$target" "$current_env"
                show_status
            fi
            ;;
        rollback)
            # 快速回滾到另一個環境
            if [ "$current_env" == "blue" ]; then
                switch_to "green" "blue"
            else
                switch_to "blue" "green"
            fi
            show_status
            ;;
        *)
            echo ""
            echo "用法: $0 {blue|green|status|auto|rollback|production|development|staging}"
            echo ""
            echo "Commands:"
            echo "  production   使用 production 環境配置並執行藍綠部署"
            echo "  development  使用 development 環境配置並執行藍綠部署"
            echo "  staging      使用 staging 環境配置並執行藍綠部署"
            echo "  blue         切換到藍色環境"
            echo "  green        切換到綠色環境"
            echo "  status       顯示當前狀態"
            echo "  auto         自動部署到非活躍環境並切換"
            echo "  rollback     快速回滾到備用環境"
            echo ""
            show_status
            exit 1
            ;;
    esac
}

main "$@"
