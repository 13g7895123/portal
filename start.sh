#!/bin/bash

# 檢查 Docker 服務狀態
if systemctl is-active --quiet docker; then
    echo "Docker 服務已經在運行中。"
else
    echo "Docker 服務未運行，正在嘗試啟動..."
    
    # 嘗試使用 systemctl 啟動
    if command -v sudo &> /dev/null; then
        sudo systemctl start docker
    else
        systemctl start docker
    fi

    # 再次檢查狀態
    if systemctl is-active --quiet docker; then
        echo "Docker 服務已成功啟動！"
    else
        echo "Docker 服務啟動失敗，請檢查權限或日誌。"
        
        # 嘗試使用 service 命令作為備案 (適用於某些非 systemd 環境或 WSL)
        if command -v service &> /dev/null; then
             echo "嘗試使用 service 命令啟動..."
             if command -v sudo &> /dev/null; then
                sudo service docker start
             else
                service docker start
             fi
             
             if systemctl is-active --quiet docker; then
                echo "Docker 服務已成功啟動！"
                exit 0
             fi
        fi

        exit 1
    fi
fi

# 啟動專案
echo "----------------------------------------"
echo "正在啟動專案容器..."

if docker compose version &> /dev/null; then
    docker compose up -d
elif command -v docker-compose &> /dev/null; then
    docker-compose up -d
else
    echo "錯誤：找不到 docker compose 或 docker-compose 指令。請確保已安裝 Docker Compose。"
    exit 1
fi

if [ $? -eq 0 ]; then
    echo "專案已成功啟動！"
    echo "----------------------------------------"
    # 嘗試讀取 .env 檔案中的埠號 (如果存在)
    if [ -f .env ]; then
        source .env
        echo "Frontend: http://localhost:${FRONTEND_PORT:-9106}"
        echo "Backend:  http://localhost:${BACKEND_PORT:-9206}"
    else
        echo "Frontend: http://localhost:9106 (預設)"
        echo "Backend:  http://localhost:9206 (預設)"
    fi
    echo "----------------------------------------"
else
    echo "專案啟動失敗，請檢查 docker-compose logs。"
    exit 1
fi
