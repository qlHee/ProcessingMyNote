#!/bin/bash
# 停止所有服务

echo "🛑 停止 Processing My Note 服务..."

# 停止后端
if lsof -i :8000 > /dev/null 2>&1; then
    echo "停止后端服务..."
    pkill -f "uvicorn app.main:app"
    echo "✅ 后端服务已停止"
else
    echo "⚠️  后端服务未运行"
fi

# 停止Nginx（如果需要）
if lsof -i :8080 > /dev/null 2>&1; then
    echo "停止Nginx..."
    sudo nginx -s stop 2>/dev/null || true
    echo "✅ Nginx已停止"
fi

echo ""
echo "🎉 所有服务已停止"
