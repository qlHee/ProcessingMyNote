# Processing My Note - 开发日志

## Phase 1: 后端基础架构 ✅
**日期:** 2024-12-28

### 完成内容
- [x] 创建项目目录结构
- [x] 配置 .gitignore
- [x] 搭建 FastAPI 基础框架
- [x] 配置 SQLite 数据库连接 (异步)
- [x] 创建数据库模型 (User, Folder, Note, Tag, Annotation)
- [x] 创建 Pydantic Schemas
- [x] 实现认证路由 (注册/登录/JWT)
- [x] 实现文件夹 CRUD API
- [x] 实现标签 CRUD API

### 项目结构
```
backend/
├── app/
│   ├── main.py          # FastAPI 入口
│   ├── config.py        # 配置
│   ├── database.py      # 数据库连接
│   ├── models/          # SQLAlchemy 模型
│   ├── schemas/         # Pydantic 验证
│   ├── routers/         # API 路由
│   ├── services/        # 业务逻辑 (待实现)
│   └── utils/           # 工具函数 (待实现)
├── uploads/             # 文件存储目录
└── requirements.txt
```

---
