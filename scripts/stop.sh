#!/bin/bash
#
# 停止專案腳本
# 用法: ./scripts/stop.sh [--clean]
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
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

main() {
    echo "========================================"
    log_info "正在停止專案容器..."
    echo "========================================"
    
    if [[ "$1" == "--clean" ]]; then
        log_warn "將清除所有容器和未使用的映像檔..."
        docker compose down --rmi local --remove-orphans
    else
        docker compose down
    fi
    
    echo ""
    log_success "專案已停止"
    echo "========================================"
}

main "$@"
