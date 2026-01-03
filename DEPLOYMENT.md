# Processing My Note - 生产环境部署指南

> 本文档用于指导 AI 助手（Cursor/Windsurf）自动部署项目到本地 MacBook 生产环境

## 部署目标

将 Processing My Note 项目部署到本地 MacBook（M2芯片），使用 Nginx + Uvicorn 生产模式运行。

**部署后访问地址：** http://localhost:8080

---

## 前置条件检查

在开始部署前，确认以下条件：

### 1. 系统环境
- 操作系统：macOS（M2芯片）
- 已安装 Homebrew
- 已安装 Node.js 和 npm
- Python 3.x 已安装

### 2. 项目位置
```
/Users/tuxol/Documents/DataVault/CST/Web_dev_labs/WebFinal/ProcessingMyNote
```

### 3. 检查命令
```bash
# 检查 Homebrew
which brew

# 检查 Node.js
node --version
npm --version

# 检查 Python
python3 --version

# 检查项目目录
ls -la /Users/tuxol/Documents/DataVault/CST/Web_dev_labs/WebFinal/ProcessingMyNote
```

---

## 部署步骤

### 步骤 1：停止所有开发服务

**目的：** 确保没有开发模式的服务占用端口

```bash
cd /Users/tuxol/Documents/DataVault/CST/Web_dev_labs/WebFinal/ProcessingMyNote

# 停止所有相关进程
pkill -f "uvicorn app.main:app" 2>/dev/null
pkill -f "vite" 2>/dev/null
pkill -f "npm run dev" 2>/dev/null

# 验证端口未被占用
lsof -i :5173 -i :5174 -i :8000 -i :8080
# 应该没有输出，表示端口空闲
```

---

### 步骤 2：构建前端生产版本

**目的：** 将前端代码打包成优化的静态文件

```bash
cd /Users/tuxol/Documents/DataVault/CST/Web_dev_labs/WebFinal/ProcessingMyNote/frontend

# 安装依赖（如果需要）
npm install

# 构建生产版本
npm run build

# 验证构建结果
ls -la dist/
# 应该看到 index.html 和 assets/ 目录
```

**预期输出：**
- `dist/index.html` - 入口文件
- `dist/assets/` - 包含打包后的 JS/CSS 文件（文件名带哈希值）

---

### 步骤 3：检查后端配置

**目的：** 确保后端配置正确，API密钥已设置

```bash
cd /Users/tuxol/Documents/DataVault/CST/Web_dev_labs/WebFinal/ProcessingMyNote/backend

# 检查虚拟环境
ls -la venv/

# 检查配置文件
ls -la app/config/

# 验证 API 密钥配置
cat app/config/api_keys.py | grep DEEPSEEK_API_KEY
```

**重要：** 确保 `backend/app/config/` 目录下**没有** `__init__.py` 文件，否则会导致导入错误。

```bash
# 如果存在，删除它
rm -f backend/app/config/__init__.py
```

---

### 步骤 4：安装并配置 Nginx

**目的：** 安装 Nginx 作为 Web 服务器和反向代理

#### 4.1 安装 Nginx

```bash
# 检查是否已安装
which nginx

# 如果未安装，使用 Homebrew 安装
brew install nginx
```

#### 4.2 配置 Nginx

```bash
cd /Users/tuxol/Documents/DataVault/CST/Web_dev_labs/WebFinal/ProcessingMyNote

# 复制项目配置到 Nginx
cp deploy/nginx.conf /opt/homebrew/etc/nginx/servers/processingmynote.conf

# 修改默认配置端口（避免冲突）
sed -i.bak 's/listen       8080;/listen       8081;/' /opt/homebrew/etc/nginx/nginx.conf

# 测试配置
nginx -t
# 应该输出: syntax is ok, test is successful
```

**配置说明：**
- 项目配置文件：`/opt/homebrew/etc/nginx/servers/processingmynote.conf`
- 监听端口：8080
- 前端静态文件：`frontend/dist/`
- API 反向代理：`/api/` → `http://127.0.0.1:8000/api/`

---

### 步骤 5：启动后端服务（生产模式）

**目的：** 使用 Uvicorn 多进程模式运行后端

```bash
cd /Users/tuxol/Documents/DataVault/CST/Web_dev_labs/WebFinal/ProcessingMyNote

# 使用启动脚本
./deploy/start_all.sh
```

**或手动启动：**

```bash
cd backend
source venv/bin/activate
nohup uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 2 > ../deploy/backend.log 2>&1 &

# 记录进程 PID
echo $! > ../deploy/backend.pid
```

**验证后端启动：**

```bash
# 检查进程
ps aux | grep "uvicorn app.main:app" | grep -v grep

# 测试 API
curl http://localhost:8000/docs
# 应该返回 Swagger UI 的 HTML
```

---

### 步骤 6：启动 Nginx

**目的：** 启动 Nginx 服务托管前端并代理后端

```bash
# 启动 Nginx（开机自启动）
brew services start nginx

# 或临时启动（不开机自启）
nginx
```

**验证 Nginx 启动：**

```bash
# 检查进程
ps aux | grep nginx | grep -v grep

# 检查端口
lsof -i :8080
# 应该看到 nginx 进程
```

---

### 步骤 7：验证部署

**目的：** 确认所有服务正常运行

#### 7.1 检查服务状态

```bash
# 检查所有端口
lsof -i :8080 -i :8000

# 应该看到：
# - nginx 监听 8080
# - Python (uvicorn) 监听 8000
```

#### 7.2 测试前端访问

```bash
# 测试前端页面
curl -s http://localhost:8080 | grep "<title>"
# 应该输出: <title>frontend</title>

# 检查响应头
curl -I http://localhost:8080
# 应该看到: Server: nginx/1.29.4
```

#### 7.3 测试后端 API

```bash
# 测试 API 代理
curl -I http://localhost:8080/api/folders
# 应该返回 401 Unauthorized（正常，因为未登录）

# 测试后端直连
curl http://localhost:8000/docs
# 应该返回 Swagger UI
```

#### 7.4 浏览器验证

打开浏览器访问：**http://localhost:8080**

**验证要点：**
1. 能看到登录页面
2. 按 F12 打开开发者工具 → Network 标签
3. 刷新页面，查看请求：
   - JS 文件名带哈希值（如 `index-DKBxZU6M.js`）✅
   - Response Headers 中 `Server: nginx` ✅
   - 静态资源有 `Cache-Control` 缓存头 ✅

---

## 日常使用命令

### 启动服务

```bash
cd /Users/tuxol/Documents/DataVault/CST/Web_dev_labs/WebFinal/ProcessingMyNote

# 启动后端
./deploy/start_all.sh

# 启动 Nginx
brew services start nginx
```

### 停止服务

```bash
cd /Users/tuxol/Documents/DataVault/CST/Web_dev_labs/WebFinal/ProcessingMyNote

# 停止所有服务
./deploy/stop_all.sh

# 停止 Nginx
brew services stop nginx
```

### 查看日志

```bash
# 查看后端日志
tail -f /Users/tuxol/Documents/DataVault/CST/Web_dev_labs/WebFinal/ProcessingMyNote/deploy/backend.log

# 查看 Nginx 日志
tail -f /opt/homebrew/var/log/nginx/error.log
tail -f /opt/homebrew/var/log/nginx/access.log
```

### 重启服务

```bash
# 重启后端
./deploy/stop_all.sh
./deploy/start_all.sh

# 重启 Nginx
brew services restart nginx
```

---

## 故障排除

### 问题 1：端口被占用

**症状：** `Address already in use`

**解决方案：**

```bash
# 查找占用端口的进程
lsof -i :8000
lsof -i :8080

# 杀死进程
kill -9 <PID>

# 或使用脚本停止
./deploy/stop_all.sh
```

### 问题 2：Nginx 显示默认欢迎页

**症状：** 访问 8080 看到 "Welcome to nginx!"

**原因：** 默认配置优先级高于项目配置

**解决方案：**

```bash
# 修改默认配置端口
sed -i.bak 's/listen       8080;/listen       8081;/' /opt/homebrew/etc/nginx/nginx.conf

# 重启 Nginx
brew services restart nginx
```

### 问题 3：后端导入错误

**症状：** `ImportError: cannot import name 'settings' from 'app.config'`

**原因：** `app/config/__init__.py` 文件存在

**解决方案：**

```bash
cd /Users/tuxol/Documents/DataVault/CST/Web_dev_labs/WebFinal/ProcessingMyNote/backend

# 删除 __init__.py
rm -f app/config/__init__.py

# 重启后端
cd ..
./deploy/stop_all.sh
./deploy/start_all.sh
```

### 问题 4：前端 404 错误

**症状：** 访问页面显示 404

**原因：** 前端未构建或路径错误

**解决方案：**

```bash
cd /Users/tuxol/Documents/DataVault/CST/Web_dev_labs/WebFinal/ProcessingMyNote/frontend

# 重新构建
npm run build

# 检查 dist 目录
ls -la dist/

# 重启 Nginx
brew services restart nginx
```

### 问题 5：API 请求失败

**症状：** 前端无法调用后端 API

**检查步骤：**

```bash
# 1. 检查后端是否运行
curl http://localhost:8000/docs

# 2. 检查 Nginx 代理配置
cat /opt/homebrew/etc/nginx/servers/processingmynote.conf | grep -A 5 "location /api/"

# 3. 测试代理
curl -I http://localhost:8080/api/folders

# 4. 查看 Nginx 错误日志
tail -f /opt/homebrew/var/log/nginx/error.log
```

---

## 生产环境 vs 开发环境对比

| 特征 | 开发环境 | 生产环境 |
|------|---------|---------|
| **前端服务器** | Vite (5173) | Nginx (8080) |
| **后端服务器** | Uvicorn --reload | Uvicorn --workers 2 |
| **前端代码** | 源码，未压缩 | 构建版，已压缩 |
| **API 访问** | 直连 8000 | Nginx 反向代理 |
| **静态资源缓存** | 无 | 30天缓存 |
| **热重载** | 是 | 否 |
| **性能** | 一般 | 优化 |
| **启动命令** | `npm run dev` | `./deploy/start_all.sh` |

---

## 验证清单

部署完成后，使用此清单验证：

- [ ] 后端进程运行中（`ps aux | grep uvicorn`）
- [ ] Nginx 进程运行中（`ps aux | grep nginx`）
- [ ] 8080 端口被 Nginx 占用（`lsof -i :8080`）
- [ ] 8000 端口被 Uvicorn 占用（`lsof -i :8000`）
- [ ] 开发端口空闲（`lsof -i :5173 -i :5174` 无输出）
- [ ] 浏览器能访问 http://localhost:8080
- [ ] 响应头显示 `Server: nginx`
- [ ] JS 文件名带哈希值
- [ ] 登录功能正常
- [ ] 图片上传功能正常
- [ ] AI 调整功能正常

---

## AI 助手部署指令

**当用户要求部署项目时，AI 助手应该：**

1. 阅读本文档 `DEPLOYMENT.md`
2. 按照"部署步骤"章节依次执行
3. 在每个步骤后验证结果
4. 如遇问题，参考"故障排除"章节
5. 完成后使用"验证清单"确认

**一键部署命令（适用于已完成初次部署）：**

```bash
cd /Users/tuxol/Documents/DataVault/CST/Web_dev_labs/WebFinal/ProcessingMyNote

# 停止旧服务
./deploy/stop_all.sh
brew services stop nginx

# 重新构建前端
cd frontend && npm run build && cd ..

# 启动服务
./deploy/start_all.sh
brew services start nginx

# 验证
curl -I http://localhost:8080
```

---

## 附录：文件结构

```
ProcessingMyNote/
├── backend/
│   ├── app/
│   │   ├── config/
│   │   │   ├── config.py          # 主配置文件
│   │   │   └── api_keys.py        # API 密钥（不要提交到 Git）
│   │   ├── main.py                # FastAPI 入口
│   │   └── ...
│   ├── venv/                      # Python 虚拟环境
│   └── requirements.txt
├── frontend/
│   ├── dist/                      # 构建输出目录（生产版）
│   ├── src/                       # 源代码
│   ├── package.json
│   └── vite.config.js
├── deploy/
│   ├── nginx.conf                 # Nginx 配置
│   ├── start_all.sh              # 启动脚本
│   ├── stop_all.sh               # 停止脚本
│   ├── backend.log               # 后端日志
│   └── backend.pid               # 后端进程 PID
├── DEPLOYMENT.md                  # 本文档
└── README.md                      # 项目说明
```

---

## 更新日志

- **2026-01-03**: 创建部署文档，支持本地 MacBook M2 部署
