#!/bin/bash
# 后端启动脚本 - 生产模式

cd "$(dirname "$0")/../backend"

# 激活虚拟环境
source venv/bin/activate

# 启动后端服务（生产模式，使用多个worker）
exec uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 2
