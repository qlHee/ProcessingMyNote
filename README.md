# Processing My Note 📝

> 笔记管理系统 - 让手写笔记焕发新生

## 项目简介

Processing My Note 是一个专为学生和知识工作者设计的智能笔记管理系统，旨在解决纸质笔记查找困难、携带不便、照片笔记体验差等痛点。

### 核心功能

- 📸 **智能图像处理**：自动将拍摄的笔记照片处理成清晰的白纸黑字扫描效果，消除阴影、模糊等问题
- 📁 **笔记管理**: 类似资源管理器的文件夹 + 标签管理笔记
- 🤖 **AI 智能调整**：用自然语言描述想要的效果（如"字迹太淡，加深一点"），系统自动理解并调整参数，也可手动调整
- ✏️ **笔记标注**：在图片上直接添加文字标注、横线、波浪线、箭头、涂鸦，支持拖动和编辑
- 🔍 **搜索与筛选**：支持按标题、文件夹、标签组合筛选，多种排序方式
- 📤 **便捷导出**：导出单个笔记或整个文件夹为 ZIP 压缩包


## 技术栈

### 后端
- **框架**：FastAPI + SQLAlchemy 2.0（异步）
- **数据库**：SQLite
- **图像处理**：OpenCV
- **AI 服务**：DeepSeek API
- **认证**：JWT + bcrypt
- **服务器**：Uvicorn

### 前端
- **框架**：React 19 + Vite
- **UI 组件**：Ant Design
- **状态管理**：Zustand
- **路由**：React Router
- **HTTP 客户端**：Axios

## 环境要求

- **后端**：Python 3.12+、pip
- **前端**：Node.js 18+、npm
- **可选**：DeepSeek API Key（用于 AI 智能调整功能）

## 快速开始

### 1. 后端部署

```bash
# 进入后端目录
cd backend

# 创建并激活虚拟环境
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
# venv\Scripts\activate   # Windows

# 安装依赖
pip install -r requirements.txt

# 如果出现 greenlet 缺失错误
pip install greenlet

# 配置环境变量（可选）
cp .env.example .env
# 编辑 .env 文件，配置 SECRET_KEY 和 DEEPSEEK_API_KEY

# 启动后端服务
uvicorn app.main:app --reload --port 8000
```

后端 API 文档：http://localhost:8000/docs

### 2. 前端部署

```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问系统：http://localhost:5173

## 主要功能说明

### 图像处理技术

系统采用 OpenCV 实现完整的图像处理管道：

```
原图 → 对比度调整 → 灰度化 → 降噪 → 自适应阈值二值化 → 形态学处理 → 锐化 → 输出
```

核心技术包括：
- 对比度和亮度调整
- 双边滤波降噪
- 自适应阈值二值化（处理光照不均）
- 形态学处理去除噪点
- 锐化增强字迹边缘

### AI 智能调整

采用 **AI + 规则** 的双重策略：
- **规则匹配**：40+ 条规则库，覆盖常见调整需求，响应速度快（毫秒级）
- **DeepSeek API**：处理复杂指令，智能理解自然语言描述
- **参数校验**：确保参数在合理范围内，避免异常效果

### 笔记标注

- 前端使用 SVG 覆盖层实现标注绘制
- 坐标以百分比形式存储，适应不同尺寸图片
- 后端使用 PIL 渲染标注，支持中文
- 支持文字、直线、箭头、波浪线、自由绘制等类型

## 项目结构

```
ProcessingMyNote/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI 应用入口
│   │   ├── config.py        # 配置管理
│   │   ├── database.py      # 数据库连接
│   │   ├── models/          # SQLAlchemy 数据模型
│   │   ├── schemas/         # Pydantic 数据验证
│   │   ├── routers/         # API 路由
│   │   ├── services/        # 业务逻辑
│   │   └── utils/           # 工具函数
│   ├── uploads/             # 文件存储
│   └── requirements.txt     # Python 依赖
├── frontend/
│   ├── src/
│   │   ├── main.jsx         # 应用入口
│   │   ├── App.jsx          # 根组件
│   │   ├── api/             # API 调用封装
│   │   ├── stores/          # Zustand 状态管理
│   │   ├── components/      # 通用组件
│   │   └── pages/           # 页面组件
│   └── package.json         # npm 依赖
└── README.md
```

## 常见问题

### 后端启动失败

**问题**：greenlet 模块缺失  
**解决**：`pip install greenlet`

**问题**：端口被占用  
**解决**：
```bash
lsof -i :8000
kill -9 <PID>
```

### 前端启动失败

**问题**：依赖安装失败  
**解决**：
```bash
npm cache clean --force
rm -rf node_modules
npm install
```

### 图片上传失败

- 确保上传的是 JPG、PNG 或 JPEG 格式
- 建议文件大小不超过 10MB

## 项目意义

- **提升学习效率**：高效的笔记管理和快速检索，节省查找时间
- **保护学习成果**：数字化管理永久保存，避免纸质笔记丢失损坏
- **促进知识整合**：通过标签和文件夹灵活组织，构建个人知识网络
- **适用场景广泛**：学习笔记、账单管理、案件资料、病历记录、实验记录等

## License

MIT
