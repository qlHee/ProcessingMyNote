# Processing My Note - 开发日志

## v0.1: 后端基础架构
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

## v0.2: 图像处理模块
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

## v0.3: 后端核心 API
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

## v0.4: 前端基础架构
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

## v0.5: 文件管理器界面 
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

## v0.6: AI 自然语言图像调整 
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

## v0.7: 笔记标注功能 
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

## v0.8: UI/UX 优化 
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

## v1.0: 完整功能版本 
**日期:** 2024-12-30

### 核心功能
1.  **用户认证系统**: 注册/登录/JWT
2.  **文件夹管理**: 无限层级树形结构
3.  **标签系统**: 多维标签过滤
4.  **笔记上传**: 自动图像处理 + OCR
5.  **图像处理**: 白纸黑字扫描效果
6.  **AI 调整**: 自然语言参数调整
7.  **笔记标注**: 图片上添加注释

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
-  修复 greenlet 异步错误（使用直接插入关联表方式）
-  修复未分类笔记保存问题（folder_id=0 转换为 NULL）
-  修复子文件夹显示逻辑（后端支持 folder_ids 参数）
-  修复 renderNoteCard 函数语法错误

---

## v1.1: 标注系统重构与UI优化 
**日期:** 2024-12-30

### 核心改进
1.  **标注系统彻底重构**
   - 重构横线、波浪线、箭头、涂鸦绘制逻辑
   - 新增 `isDrawing` 状态控制绘制流程
   - 修复事件监听器，改为全局 document 监听
   - 优化 SVG 渲染性能

2. **字体大小保存修复**
   - 修复后端 Schema 字段映射（`font_size` → `fontSize`）
   - 添加 Pydantic 别名配置 `populate_by_name=True`
   - 前端兼容 `font_size` 和 `fontSize` 双字段读取
   - 确保编辑后字体大小正确持久化

3. **标注工具UI美化**
   - 5列网格布局工具按钮
   - 图标+文字垂直排列，更直观
   - 圆形色块颜色选择器，支持6种颜色
   - 渐变背景提示文字，仅在选择工具时显示
   - 简洁卡片式标注列表

4. **波浪线功能实现**
   - 使用二次贝塞尔曲线绘制平滑波浪
   - 自动计算波浪数量和振幅
   - 支持任意角度和长度

5. **标注编辑优化**
   - 列表内联编辑表单
   - 拖动位置保存修复
   - 编辑按钮事件冒泡阻止

### Bug 修复
- 修复文字标注拖动后编辑保存位置回退问题
- 修复列表编辑按钮点击无响应（事件冒泡）
- 修复字体大小编辑后变回默认值
- 修复图形标注（横线/箭头/涂鸦）无法绘制
- 修复 `font_size` 字段映射导致的保存失败

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

## v1.2: 标注功能完善与Bug修复 🔧
**日期:** 2024-12-31

### 核心改进
1. **标注颜色功能重构**
   - 将 `color` 状态从组件内部提升到父组件
   - 通过 props 传递颜色状态，避免组件刷新时重置
   - 确保颜色选择在所有场景下正确保持
   - 修复后端 Schema 中 `color` 字段的默认值设置

2. **文字标注列表编辑修复**
   - 修复列表编辑保存后内容无法更新的问题
   - 实现列表编辑的内联更新逻辑
   - 添加完整字号选项（0.8-3.0）
   - 修复编辑按钮事件冒泡问题

3. **标注同步机制**
   - 添加 `annotationRefreshKey` 状态
   - 实现图片区域和面板区域标注双向同步
   - 确保列表编辑后图片标注实时更新
   - 使用 `key` 属性强制组件刷新

4. **全屏查看优化**
   - 修复全屏模式下标注位置错乱问题
   - 调整容器和图片尺寸策略
   - 使用 `inline-block` 让标注层适应图片实际尺寸
   - 确保标注在全屏时显示在正确位置

5. **清空标注功能**
   - 添加"清空所有标注"按钮
   - 批量删除所有标注
   - 带确认对话框防止误操作
   - 显示标注数量提示

### Bug 修复
- 修复标注颜色无论选择什么都变成蓝色的问题
- 修复文字标注列表编辑后无法保存的问题
- 修复列表更新后图片标注不同步的问题
- 修复全屏模式下标注位置错位到图片外的问题
- 修复编辑时字号显示不正确的问题
- 修复后端 `color` 字段 Schema 映射问题

### 技术细节
**状态管理优化**
```jsx
// 父组件管理颜色状态
const [color, setColor] = useState('#1890ff')
const [annotationRefreshKey, setAnnotationRefreshKey] = useState(0)

// 传递给子组件
<NoteAnnotator
  color={color}
  setColor={setColor}
  onAnnotationChange={() => {
    fetchNote(id)
    setAnnotationRefreshKey(k => k + 1)  // 触发刷新
  }}
/>
```

**全屏定位修复**
```css
.fullscreen-annotator-container .note-annotator-overlay {
  position: relative;
  display: inline-block;  /* 适应图片尺寸 */
}
```

### 提交记录
- `5ced293` - 修复颜色 props 传递
- `b94eca2` - 实现标注同步机制
- `4b72ac2` - 修复列表编辑保存
- `1014bb2` - 修复全屏标注定位
- `8c092a2` - 添加调试日志
- `410df95` - 详细更新日志

---

## v1.3: 导出功能与标注渲染优化 📤
**日期:** 2024-12-31

### 核心功能
1. **笔记导出功能**
   - 单个笔记导出（带标注）
   - 文件夹导出（ZIP打包，保持文件夹结构）
   - 批量导出（多选模式）
   - 支持UTF-8文件名（RFC 5987编码）
   - 优先导出带标注的图片，无标注则导出处理后图片

2. **标注图片渲染重构**
   - 使用PIL替代OpenCV，支持中文文字渲染
   - 支持所有标注类型：文字、直线、箭头、波浪线、涂鸦
   - 标注颜色和大小与网页显示完全一致
   - 文字标注简洁显示（无圆点、无背景框）

3. **导出接口实现**
   - `GET /api/export/note/{note_id}` - 导出单个笔记
   - `GET /api/export/folder/{folder_id}` - 导出文件夹（ZIP）
   - 自动查找并使用 `_annotated` 后缀的标注图片
   - 文件名正确编码，支持中文和特殊字符

### Bug 修复
- 修复标注拖拽后位置不保存的问题（useEffect依赖数组）
- 修复导出图片中标注显示不正确的问题
  - 线条粗细计算错误
  - 波浪线算法不匹配前端
  - 箭头过大
  - 文字颜色显示为黑色
- 修复文件名乱码问题（RFC 5987编码）

### 技术细节
**后端导出逻辑**
```python
# 优先使用标注图片
annotated_path = processed_path.parent / f"{processed_path.stem}_annotated{suffix}"
export_path = annotated_path if annotated_path.exists() else processed_path

# RFC 5987文件名编码
encoded_filename = quote(f"{note.title}{export_path.suffix}")
headers = {"Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}"}
```

**标注渲染优化**
```python
# 使用PIL支持中文
from PIL import Image, ImageDraw, ImageFont

# 线条粗细与前端一致
stroke_width = max(1, int(font_size * 0.15 * scale_factor))

# 波浪线使用贝塞尔曲线模拟
wave_offset = amplitude_pct * math.sin(wave_t * math.pi) * (1 if wave_index % 2 == 0 else -1)
```

**前端导出实现**
```javascript
// 使用fetch + Authorization header
const response = await fetch(`/api/export/note/${noteId}`, {
  method: 'GET',
  headers: { 'Authorization': `Bearer ${token}` }
});

// 解析RFC 5987编码的文件名
const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;\s]+)/i);
const filename = decodeURIComponent(utf8Match[1]);
```

### UI改进
- 在笔记三点菜单添加"导出"选项
- 在文件夹三点菜单添加"导出"选项
- 在多选工具栏添加"导出"按钮
- 导出成功/失败消息提示

### 提交记录
- `27f367c` - 改进导出功能错误处理
- `d227fd0` - 重写标注渲染逻辑，支持所有标注类型
- `f580091` - 修复标注渲染问题（线条粗细、波浪线、箭头、文字颜色）
- `f216d7a` - 修复标注拖拽后位置不保存的问题
- `c8f62bb` - 去掉导出图片中文字标注前的圆点
- `bb75da7` - 去掉导出图片中文字标注外面的背景框

---

## v1.4: 图像调整UI优化与撤销重做功能 🎨
**日期:** 2024-12-31

### 核心功能
1. **AI智能调整界面优化**
   - 压缩示例语言显示（5条占2行）
   - 调整字体和按钮大小，提升视觉效果
   - 更新示例文本为更实用的描述

2. **撤销/重做功能**
   - 实现历史记录栈管理
   - 支持手动参数调整的撤销/重做
   - 支持旋转操作的撤销/重做
   - 支持AI智能调整的撤销/重做
   - 撤销/重做按钮状态智能禁用

3. **手动参数调整优化**
   - 删除"应用参数"按钮，拖动滑块后立即应用
   - 使用 `onChangeComplete` 事件替代 `onAfterChange`（Ant Design 6.x）
   - 添加左旋转、右旋转、裁剪按钮
   - 旋转按钮只显示图标，节省空间
   - 添加"恢复默认值"按钮
   - 手动参数调整面板默认打开

4. **参数顺序调整**
   - 新顺序：降噪强度 → 块大小 → 阈值偏移 → 亮度 → 对比度
   - 更符合用户调整习惯

### Bug 修复
- 修复手动参数调整后滑块回到原位的问题
  - 根本原因：`fetchNote` 导致组件重新渲染，状态重置
  - 解决方案：`onAdjustSuccess` 只刷新图片缓存，不重新获取笔记数据
- 修复参数调整不生效的问题
  - 使用 `initialParams` prop 初始化组件状态
  - 使用 `useEffect` 确保只初始化一次
- 修复旋转功能不生效的问题
  - 确保旋转API正确调用并更新数据库

### 技术细节
**前端状态管理重构**
```javascript
// 使用 initialParams 初始化
const [contrast, setContrast] = useState(initialParams?.contrast ?? DEFAULT_PARAMS.contrast)

// 只初始化一次
useEffect(() => {
  if (initialParams && !initialized) {
    // 初始化所有参数
    setInitialized(true)
  }
}, [initialParams, initialized])

// 历史记录管理
const [history, setHistory] = useState([])
const [historyIndex, setHistoryIndex] = useState(-1)

const saveToHistory = (params) => {
  const newHistory = history.slice(0, historyIndex + 1)
  newHistory.push(params)
  setHistory(newHistory)
  setHistoryIndex(newHistory.length - 1)
}
```

**参数应用优化**
```javascript
// 直接调用API，避免通过store导致状态重置
const applyParams = async (params, saveHistory = true) => {
  const response = await notesAPI.reprocess(noteId, params)
  if (saveHistory) {
    saveToHistory(params)
  }
  onAdjustSuccess?.() // 只刷新图片
}
```

### UI改进
- 撤销/重做按钮放在手动参数调整上方
- 旋转按钮和恢复默认按钮在同一行
- 旋转按钮宽度缩短，恢复默认按钮宽度加长
- 所有按钮大小统一为 `small`

### 提交记录
- `37a0f42` - feat: 添加撤销/重做功能、旋转按钮只显示图标、恢复默认值按钮
- `16ad6d5` - style: 调整旋转按钮和恢复默认按钮的宽度比例
- `05c7eb0` - feat: 调整参数顺序，旋转功能支持撤销重做

---

## v1.5: DeepSeek AI集成与智能调整优化 🤖
**日期:** 2024-12-31

### 核心功能
1. **DeepSeek API集成**
   - 集成DeepSeek Chat API实现真正的AI智能调整
   - 优先使用AI理解用户需求，失败后回退到规则匹配
   - 从 `api_keys.py` 安全导入API密钥
   - 支持复杂的自然语言描述

2. **AI调整规则大幅扩展**
   - 从12条规则扩展到40+条规则
   - 支持更多自然语言变体
   - 规则按优先级排序（更具体的规则优先）
   - 覆盖字迹深浅、对比度、亮度、清晰度、噪点、背景等所有场景

3. **AI提示词优化**
   - 详细的参数说明和调整建议
   - 强调 `c` 参数是调整字迹深浅的核心参数
   - 明确 `contrast` 参数慎用，避免整体变暗
   - 提供具体的调整示例

4. **参数调整逻辑修复**
   - 修复"加深字迹"导致背景变黑的问题
   - 加深字迹只调整 `c` 参数（-3到-5），不调整 `contrast`
   - 背景变白调整 `c` 参数（+3到+5）
   - 对比度调整只在用户明确提到时才调整

5. **示例语言顺序调整**
   - 新顺序：太模糊了 → 噪点太多 → 对比度太低 → 背景不够白 → 字迹太淡，加深一点
   - 最常用的功能放在最后，方便点击

### Bug 修复
- 修复登录失败问题
  - 原因：`config.py` 被误删
  - 解决：恢复 `config.py` 并正确导入 `api_keys.py`
- 修复AI调整无法理解常见指令的问题
  - 扩展规则库，支持"背景不够白"、"对比度太低"等常见描述
- 修复"字迹太淡，加深一点"导致图片变成黑底的问题
  - 修改规则和AI提示词，只调整 `c` 参数

### 技术细节
**API密钥配置**
```python
# backend/app/config.py
try:
    from app.config.api_keys import DEEPSEEK_API_KEY as _DEEPSEEK_API_KEY
except ImportError:
    _DEEPSEEK_API_KEY = ""

class Settings(BaseSettings):
    DEEPSEEK_API_KEY: str = _DEEPSEEK_API_KEY
    DEEPSEEK_API_URL: str = "https://api.deepseek.com/v1/chat/completions"
```

**AI调整优先级**
```python
async def interpret_instruction(self, instruction: str, current_params: dict) -> dict:
    # 1. 优先使用 DeepSeek API
    if self.api_key:
        try:
            ai_result = await self._ai_adjust(instruction, current)
            if ai_result != current:
                return ai_result
        except Exception as e:
            print(f"AI API error: {e}, falling back to rule-based")
    
    # 2. 回退到规则匹配
    rule_result = self._rule_based_adjust(instruction, current)
    if rule_result:
        return rule_result
    
    # 3. 无法理解，返回原参数
    return current
```

**优化的AI提示词**
```python
system_prompt = """你是一个专业的图像处理参数调整助手。用户正在处理手写笔记的扫描图片（白纸黑字）...

**参数详细说明：**
1. **c** (-50 to 50，默认2): 阈值偏移 - 这是最重要的参数！
   - 负值：字迹变深/变黑，同时保持背景白色
   - 正值：背景变白，字迹可能变浅
   - 注意：调整字迹深浅主要用c参数，不要用contrast！

2. **contrast** (0.1-3.0，默认1.0): 对比度
   - 只在用户明确提到"对比度"时才调整
   - 增加对比度会让整体变暗，慎用！
...

**示例：**
用户说"字迹太淡了，加深一点" → {"c": -4}
用户说"背景不够白" → {"c": 4}
用户说"对比度太低" → {"contrast": 0.3}
"""
```

**扩展的规则库**
```python
ADJUSTMENT_RULES = [
    # 字迹深浅 - 只调整c参数
    (["字迹太淡", "字太淡", "太淡了", ...], {"c": -4}),
    (["加深", "深一点", "更深", ...], {"c": -3}),
    
    # 对比度 - 明确提到才调整
    (["对比度太低", "对比度低", ...], {"contrast": 0.4}),
    
    # 背景 - 调整c和brightness
    (["背景不够白", "背景不白", ...], {"c": 4, "brightness": 10}),
    ...
]
```

### AI功能特性
- **智能理解**：支持各种自然语言变体
- **精准调整**：根据用户描述严重程度调整参数幅度
- **安全回退**：API失败时自动使用规则匹配
- **参数优化**：temperature=0.1，获得更稳定的输出

### UI改进
- AI智能调整支持撤销/重做
- 示例语言顺序优化
- 后端控制台显示调整方式（AI或规则）

### 提交记录
- `a280270` - feat: AI智能调整支持撤销重做
- `c88a69e` - feat: 大幅扩展AI智能调整规则，支持更多自然语言描述
- `4d7dfdd` - feat: 集成DeepSeek API实现AI智能调整，修复登录问题
- `e141255` - fix: 修复加深字迹导致背景变黑的问题，调整示例语言顺序

---

