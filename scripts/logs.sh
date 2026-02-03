#!/bin/bash
#
# 查看服務日誌
# 用法: ./scripts/logs.sh [service] [--follow]
#
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DOCKER_DIR="$PROJECT_DIR/docker"

cd "$DOCKER_DIR"


SERVICE=""
FOLLOW=""

for arg in "$@"; do
    case $arg in
        --follow|-f)
            FOLLOW="-f"
            ;;
        *)
            SERVICE="$arg"
            ;;
    esac
done

if [ -z "$SERVICE" ]; then
    docker compose logs --tail=100 $FOLLOW
else
    docker compose logs --tail=100 $FOLLOW "$SERVICE"
fi
