#!/bin/bash
# 一键启动脚本 - 启动后端服务

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🚀 启动 Processing My Note..."
echo "项目目录: $PROJECT_DIR"

# 检查后端是否已运行
if lsof -i :8000 > /dev/null 2>&1; then
    echo "⚠️  后端服务已在运行 (端口 8000)"
else
    echo "📦 启动后端服务..."
    cd "$PROJECT_DIR/backend"
    source venv/bin/activate
    nohup uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 2 > "$PROJECT_DIR/deploy/backend.log" 2>&1 &
    echo "✅ 后端服务已启动 (PID: $!)"
fi

echo ""
echo "=========================================="
echo "🎉 服务启动完成！"
echo "=========================================="
echo ""
echo "访问地址: http://localhost:8080"
echo "后端API: http://localhost:8000"
echo ""
echo "停止服务: $SCRIPT_DIR/stop_all.sh"
echo "查看日志: tail -f $SCRIPT_DIR/backend.log"
