# Processing My Note - 开发日志

## v0.1: 后端基础架构 ✅
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

## v0.2: 图像处理模块 ✅
**日期:** 2024-12-28

### 完成内容
- [x] ImageProcessor: OpenCV 图像处理管道
  - 对比度/亮度调整
  - 灰度转换 + 降噪
  - 自适应阈值二值化 (白纸黑字效果)
  - 形态学处理 + 锐化
- [x] ImageEnhancer: 增强功能
  - 阴影去除
  - 倾斜校正
  - 自动裁剪
- [x] OCRService: 文字识别服务
  - PaddleOCR 集成 (中英文)
  - 自动生成标题
  - Mock 模式 (无 OCR 时降级)
- [x] AIAgent: 自然语言参数调整
  - 规则匹配 (快速响应)
  - DeepSeek API 集成 (复杂指令)
  - 参数范围校验

### 核心处理流程
```
原图 → 对比度调整 → 灰度化 → 降噪 → 自适应阈值 → 形态学处理 → 锐化 → 输出
```

---

## v0.3: 后端核心 API ✅
**日期:** 2024-12-28

### 完成内容
- [x] Notes API: 完整 CRUD
  - `POST /api/notes/upload` - 上传笔记 (自动处理+OCR)
  - `GET /api/notes` - 列表 (支持文件夹/标签/关键词过滤)
  - `GET /api/notes/{id}` - 详情
  - `PUT /api/notes/{id}` - 更新元数据
  - `DELETE /api/notes/{id}` - 删除
  - `POST /api/notes/{id}/reprocess` - 重新处理图片
  - `GET /api/notes/{id}/image/{type}` - 获取图片
- [x] AI API: 自然语言调整
  - `POST /api/ai/adjust` - AI 驱动的参数调整
- [x] Annotations API: 标注 CRUD
  - `GET/POST/PUT/DELETE /api/notes/{id}/annotations`

### API 文档
启动后访问: `http://localhost:8000/docs`

---

## v0.4: 前端基础架构 ✅
**日期:** 2024-12-28

### 完成内容
- [x] Vite + React 项目配置
- [x] Ant Design 集成 (中文语言包)
- [x] React Router 路由配置
- [x] Zustand 状态管理
- [x] Axios API 封装
- [x] 主布局组件 (侧边栏 + 内容区)
- [x] 登录/注册页面
- [x] 首页笔记列表 (网格/列表视图)
- [x] 笔记详情页 (基础版)

### 前端结构
```
frontend/src/
├── api/           # API 请求封装
├── stores/        # Zustand 状态管理
├── components/    # 通用组件
│   ├── Layout/
│   ├── FolderTree/
│   ├── TagManager/
│   └── UploadModal/
└── pages/         # 页面
    ├── Login/
    ├── Home/
    └── NoteDetail/
```

---

## v0.5: 文件管理器界面 ✅
**日期:** 2024-12-28

### 完成内容
- [x] 面包屑导航 (支持文件夹层级跳转)
- [x] 排序功能 (最近修改/创建时间/标题)
- [x] 活动过滤器显示 (当前选中的标签)
- [x] 笔记计数徽章
- [x] 笔记详情页双栏布局
  - 左侧: 图片查看器 (原图/处理后切换)
  - 右侧: 信息面板 + AI 调整
- [x] 笔记编辑弹窗 (修改标题/文件夹/标签)
- [x] OCR 文本展示

---

## v0.6: AI 自然语言图像调整 ✅
**日期:** 2024-12-28

### 完成内容
- [x] AIAssistant 组件
  - 自然语言输入框
  - 示例指令快捷选择
  - 调用后端 AI Agent 接口
  - 调整结果反馈
- [x] 手动参数调整面板
  - 对比度、亮度、阈值偏移滑块
  - 块大小、降噪强度调节
  - 实时应用参数

### 支持的自然语言指令示例
- "字迹太淡了，加深一点"
- "背景不够白，处理一下"
- "太模糊了，锐化一下"
- "噪点太多，去噪"

---

## v0.7: 笔记标注功能 ✅
**日期:** 2024-12-28

### 完成内容
- [x] NoteAnnotator 组件
  - 点击图片添加标注位置
  - 标注气泡显示/编辑/删除
  - 标注列表展示
  - 标注数量统计
- [x] 标注 API 集成
  - 创建/读取/更新/删除标注
- [x] 集成到笔记详情页标签页

---

## v0.8: UI/UX 优化 ✅
**日期:** 2024-12-29

### 完成内容
- [x] 侧边栏优化
  - 调整标题字体大小
  - 完全隐藏侧边栏功能
  - 添加标签区域标题
- [x] 笔记卡片布局优化
  - 三点菜单移至标题右侧
  - 标签横向显示
  - 移除时间显示
- [x] 拖拽功能
  - 笔记拖拽到文件夹
  - 移动到/复制到功能
- [x] 顶部工具栏移至Home页面
- [x] 标签管理优化
  - 标签自动换行
  - 缩小间距

---

## v1.0: 完整功能版本 🎉
**日期:** 2024-12-30

### 核心功能
1. ✅ **用户认证系统**: 注册/登录/JWT
2. ✅ **文件夹管理**: 无限层级树形结构
3. ✅ **标签系统**: 多维标签过滤
4. ✅ **笔记上传**: 自动图像处理 + OCR
5. ✅ **图像处理**: 白纸黑字扫描效果
6. ✅ **AI 调整**: 自然语言参数调整
7. ✅ **笔记标注**: 图片上添加注释

### v1.0 新增功能
- [x] **笔记多选功能**
  - 批量移动笔记到文件夹
  - 批量复制笔记
  - 批量删除笔记
  - 多选工具栏显示已选数量
- [x] **子文件夹显示**
  - 显示文件夹及所有子文件夹中的笔记
  - 下拉选择器切换显示模式
  - 递归获取子文件夹ID
- [x] **上传优化**
  - 修复勾选标签上传失败问题（greenlet异步错误）
  - 默认保存到"未分类"文件夹
  - 批量上传自动编号（数学-1、数学-2...）

### Bug 修复
- ✅ 修复 greenlet 异步错误（使用直接插入关联表方式）
- ✅ 修复未分类笔记保存问题（folder_id=0 转换为 NULL）
- ✅ 修复子文件夹显示逻辑（后端支持 folder_ids 参数）
- ✅ 修复 renderNoteCard 函数语法错误

---

## v1.1: 标注系统重构与UI优化 🎨
**日期:** 2024-12-30

### 核心改进
1. ✅ **标注系统彻底重构**
   - 重构横线、波浪线、箭头、涂鸦绘制逻辑
   - 新增 `isDrawing` 状态控制绘制流程
   - 修复事件监听器，改为全局 document 监听
   - 优化 SVG 渲染性能

2. ✅ **字体大小保存修复**
   - 修复后端 Schema 字段映射（`font_size` → `fontSize`）
   - 添加 Pydantic 别名配置 `populate_by_name=True`
   - 前端兼容 `font_size` 和 `fontSize` 双字段读取
   - 确保编辑后字体大小正确持久化

3. ✅ **标注工具UI美化**
   - 5列网格布局工具按钮
   - 图标+文字垂直排列，更直观
   - 圆形色块颜色选择器，支持6种颜色
   - 渐变背景提示文字，仅在选择工具时显示
   - 简洁卡片式标注列表

4. ✅ **波浪线功能实现**
   - 使用二次贝塞尔曲线绘制平滑波浪
   - 自动计算波浪数量和振幅
   - 支持任意角度和长度

5. ✅ **标注编辑优化**
   - 列表内联编辑表单
   - 拖动位置保存修复
   - 编辑按钮事件冒泡阻止

### Bug 修复
- ✅ 修复文字标注拖动后编辑保存位置回退问题
- ✅ 修复列表编辑按钮点击无响应（事件冒泡）
- ✅ 修复字体大小编辑后变回默认值
- ✅ 修复图形标注（横线/箭头/涂鸦）无法绘制
- ✅ 修复 `font_size` 字段映射导致的保存失败

### 技术细节
**后端改进**
```python
# Schema 字段别名映射
fontSize: float | None = Field(default=1.5, alias="font_size")
class Config:
    from_attributes = True
    populate_by_name = True
```

**前端改进**
- 统一使用 `isDrawing` 状态管理绘制
- SVG 波浪线路径算法优化
- 颜色选择器简化为圆点式
- 移除 Ant Design List/Space 组件，使用自定义样式

### UI 对比
**旧版**: 横向按钮 + 下拉颜色选择 + Ant Design List  
**新版**: 网格工具按钮 + 圆点颜色选择 + 卡片列表

---

### 启动方式
```bash
# 后端
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 前端
cd frontend
npm install
npm run dev
```

访问: http://localhost:5173

### 技术栈
**后端**
- FastAPI + SQLAlchemy (异步)
- SQLite 数据库
- OpenCV 图像处理
- PaddleOCR 文字识别
- DeepSeek API (AI 调整)

**前端**
- React + Vite
- Ant Design UI 组件库
- Zustand 状态管理
- React Router 路由
- Axios HTTP 客户端


