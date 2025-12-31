# Processing My Note - 项目上下文

## 项目概述
这是一个笔记处理和标注系统，支持图片上传、OCR识别、图像处理、AI调整和笔记标注功能。

## 当前版本：v1.2
**分支**: v1.2  
**最新提交**: de46ac1 - docs: Reorganize DEV_LOG

## 项目结构
```
ProcessingMyNote/
├── backend/          # FastAPI后端
│   ├── app/
│   │   ├── main.py
│   │   ├── models/   # SQLAlchemy模型
│   │   ├── schemas/  # Pydantic schemas
│   │   ├── routers/  # API路由
│   │   └── services/ # 业务逻辑
│   └── requirements.txt
└── frontend/         # React前端
    ├── src/
    │   ├── components/
    │   │   └── NoteAnnotator/  # 标注组件
    │   ├── pages/
    │   │   ├── Home/
    │   │   ├── NoteDetail/
    │   │   └── Login/
    │   ├── stores/    # Zustand状态管理
    │   └── api/       # API调用
    └── package.json
```

## 启动方式
```bash
# 后端
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000

# 前端
cd frontend
npm run dev
```

访问: http://localhost:5173

## 技术栈
**后端**: FastAPI + SQLAlchemy (异步) + SQLite + OpenCV + PaddleOCR + DeepSeek API  
**前端**: React + Vite + Ant Design + Zustand + React Router

## v1.2 核心功能

### 1. 标注系统
- **工具**: 文字、直线、波浪线、箭头、涂鸦
- **功能**: 拖动、编辑、删除、清空所有
- **颜色**: 6种颜色选择（蓝、红、绿、橙、紫、黑）
- **字号**: 0.8-3.0倍可调
- **全屏**: 支持全屏查看，左右键切换，ESC退出

### 2. 关键组件
**NoteAnnotator** (`frontend/src/components/NoteAnnotator/index.jsx`)
- Props: `noteId`, `imageSrc`, `annotationMode`, `fontSize`, `color`, `onAnnotationChange`, `panelMode`
- 两种模式：
  - `panelMode=false`: 图片上显示标注（overlay模式）
  - `panelMode=true`: 右侧面板显示工具和列表

**NoteDetail** (`frontend/src/pages/NoteDetail/index.jsx`)
- 管理两个NoteAnnotator实例（图片区域 + 面板区域）
- 使用 `annotationRefreshKey` 实现双向同步
- 颜色和字号状态在父组件管理，通过props传递

### 3. 重要状态管理
```jsx
// NoteDetail中的关键状态
const [color, setColor] = useState('#1890ff')
const [fontSize, setFontSize] = useState(1.5)
const [annotationRefreshKey, setAnnotationRefreshKey] = useState(0)

// 刷新机制
onAnnotationChange={() => {
  fetchNote(id)
  setAnnotationRefreshKey(k => k + 1)  // 触发两个组件刷新
}}
```

### 4. 后端Schema映射
```python
# backend/app/schemas/annotation.py
class AnnotationResponse(BaseModel):
    fontSize: float | None = Field(default=1.5, alias="font_size")
    color: str | None = Field(default="#1890ff")
    
    class Config:
        from_attributes = True
        populate_by_name = True
```

## 已知问题和注意事项

### ✅ 已修复的问题
1. ✅ 标注颜色无法保存 - 通过props传递color状态
2. ✅ 列表编辑无法保存 - 实现内联更新逻辑
3. ✅ 图片和列表标注不同步 - 使用refreshKey机制
4. ✅ 全屏标注位置错乱 - 调整容器尺寸策略
5. ✅ 字号显示不正确 - 兼容font_size和fontSize双字段

### 🔧 开发规范
1. **开发日志** - 每次把最新版本保存到新分支并提交的时候都要在开发日志补充新分支的内容。
2. **状态提升** - 共享状态（color, fontSize）在父组件管理
3. **组件刷新** - 使用key属性强制刷新，配合refreshKey
4. **字段映射** - 后端font_size，前端fontSize，Schema需要alias
5. **调试日志** - 已添加console.log追踪颜色和更新流程

## 常见开发任务

### 添加新的标注工具
1. 在 `annotationMode` 中添加新类型
2. 在 `handleImageMouseDown` 中处理鼠标事件
3. 在 `handleDrawEnd` 中保存标注
4. 在SVG渲染中添加显示逻辑

### 修改标注样式
- CSS文件: `frontend/src/components/NoteAnnotator/index.css`
- 面板样式: `.annotation-panel`, `.annotation-tools`, `.color-palette`
- 全屏样式: `frontend/src/pages/NoteDetail/index.css` 中的 `.fullscreen-*`

### 调试标注问题
1. 检查浏览器控制台的日志（已添加详细日志）
2. 确认color和fontSize是否通过props正确传递
3. 检查annotationRefreshKey是否在更新后递增
4. 验证后端Schema的alias配置

## 数据库
- 位置: `backend/note_app.db`
- 主要表: users, folders, notes, tags, annotations, note_tags
- 标注字段: id, note_id, content, x, y, font_size, color, created_at

## API端点
- 标注: `/api/notes/{note_id}/annotations/`
  - GET: 获取所有标注
  - POST: 创建标注
  - PUT: 更新标注
  - DELETE: 删除标注
