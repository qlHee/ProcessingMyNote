# Processing My Note 📝

> 智能笔记管理系统 - 让手写笔记焕发新生

## 项目简介

Processing My Note 是一个面向大学生的智能笔记管理系统，支持：
- 📸 **智能扫描**: 上传手写笔记，自动处理成清晰的"白纸黑字"效果
- 🔍 **OCR 识别**: 自动识别文字并生成标题
- 📁 **文件管理**: 类似资源管理器的文件夹 + 标签管理
- 🤖 **AI 调整**: 用自然语言微调图像效果（如"字迹太淡，加深一点"）
- ✏️ **笔记标注**: 在笔记上添加注释

## 技术栈

| 层级 | 技术 |
|------|------|
| Frontend | React + Vite + Ant Design |
| Backend | Python FastAPI |
| Database | SQLite |
| Image Processing | OpenCV + NumPy |
| AI | DeepSeek API |

## 快速开始

### 后端
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 前端
```bash
cd frontend
npm install
npm run dev
```

## 项目结构
```
ProcessingMyNote/
├── backend/          # FastAPI 后端
├── frontend/         # React 前端
├── DEV_LOG.md        # 开发日志
└── README.md
```

## License
MIT
