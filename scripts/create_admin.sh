#!/bin/bash
#
# 建立 Admin 帳號腳本
# 用法: ./scripts/create_admin.sh [username] [password]
#
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

CONTAINER_NAME="portal-backend-1"

# 檢查容器是否運行
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    log_error "容器 ${CONTAINER_NAME} 未運行"
    log_info "請先執行 './scripts/start.sh'"
    exit 1
fi

# 取得參數
USERNAME=${1:-"admin"}
PASSWORD=${2:-""}

# 如果沒有提供密碼，提示輸入
if [ -z "$PASSWORD" ]; then
    echo -n "請輸入 admin 密碼: "
    read -s PASSWORD
    echo ""
    
    if [ -z "$PASSWORD" ]; then
        log_error "密碼不能為空"
        exit 1
    fi
    
    echo -n "請再次輸入密碼確認: "
    read -s PASSWORD_CONFIRM
    echo ""
    
    if [ "$PASSWORD" != "$PASSWORD_CONFIRM" ]; then
        log_error "兩次密碼不一致"
        exit 1
    fi
fi

log_info "正在建立帳號: ${USERNAME}"

# 執行 Python 腳本建立帳號
docker exec -i ${CONTAINER_NAME} python3 << EOF
import sys
sys.path.insert(0, '/app')

from app.core.database import SessionLocal, engine
from app.models import Base, User
from app.services.auth import get_password_hash

# 確保資料表存在
Base.metadata.create_all(bind=engine)

db = SessionLocal()
try:
    # 檢查用戶是否已存在
    existing_user = db.query(User).filter(User.username == "${USERNAME}").first()
    
    if existing_user:
        # 更新密碼
        existing_user.hashed_password = get_password_hash("${PASSWORD}")
        db.commit()
        print("UPDATED")
    else:
        # 建立新用戶
        hashed_password = get_password_hash("${PASSWORD}")
        new_user = User(username="${USERNAME}", hashed_password=hashed_password)
        db.add(new_user)
        db.commit()
        print("CREATED")
except Exception as e:
    print(f"ERROR: {e}")
    db.rollback()
    sys.exit(1)
finally:
    db.close()
EOF

RESULT=$?

if [ $RESULT -eq 0 ]; then
    log_success "帳號 '${USERNAME}' 建立/更新成功！"
    echo ""
    echo "========================================="
    echo -e "  帳號: ${GREEN}${USERNAME}${NC}"
    echo -e "  密碼: ${GREEN}(已設定)${NC}"
    echo "========================================="
    echo ""
    log_info "請使用此帳號登入 /login 頁面"
else
    log_error "建立帳號失敗"
    exit 1
fi
