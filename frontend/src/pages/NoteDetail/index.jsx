/**
 * NoteDetail Page - View, edit and annotate note
 */
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Button, Spin, Typography, Space, Tag, Modal, 
  Form, Input, Select, message, Tabs, Descriptions, Segmented
} from 'antd'
import { 
  ArrowLeftOutlined, DeleteOutlined, LeftOutlined, RightOutlined,
  FileImageOutlined, EyeOutlined, SettingOutlined, TagsOutlined,
  FolderOutlined, ClockCircleOutlined, FileTextOutlined, HighlightOutlined, SaveOutlined, MenuFoldOutlined, MenuUnfoldOutlined
} from '@ant-design/icons'
import { useNotesStore, useFoldersStore, useTagsStore } from '../../stores'
import { useOutletContext } from 'react-router-dom'
import { notesAPI } from '../../api'
import AIAssistant from '../../components/AIAssistant'
import NoteAnnotator from '../../components/NoteAnnotator'
import './index.css'

const { Title, Text, Paragraph } = Typography

export default function NoteDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [imageMode, setImageMode] = useState('processed')
  const [activeTab, setActiveTab] = useState('info')
  const [isAnnotating, setIsAnnotating] = useState(false)
  const [form] = Form.useForm()
  const { collapsed, setCollapsed } = useOutletContext()

  const { currentNote, notes, loading, fetchNote, updateNote, deleteNote, clearCurrentNote } = useNotesStore()
  const { folders } = useFoldersStore()
  const { tags } = useTagsStore()

  // When switching to annotate tab, enable annotation mode
  useEffect(() => {
    setIsAnnotating(activeTab === 'annotate')
  }, [activeTab])

  // Get current note index in the notes list
  const currentIndex = notes.findIndex(note => note.id === parseInt(id))
  const hasPrevious = currentIndex > 0
  const hasNext = currentIndex < notes.length - 1

  const handlePrevious = () => {
    if (hasPrevious) {
      navigate(`/note/${notes[currentIndex - 1].id}`)
    }
  }

  const handleNext = () => {
    if (hasNext) {
      navigate(`/note/${notes[currentIndex + 1].id}`)
    }
  }

  useEffect(() => {
    fetchNote(id)
    return () => clearCurrentNote()
  }, [id, fetchNote, clearCurrentNote])

  useEffect(() => {
    if (currentNote) {
      form.setFieldsValue({
        title: currentNote.title,
        folder_id: currentNote.folder_id,
        tag_ids: currentNote.tags?.map(t => t.id) || [],
      })
    }
  }, [currentNote, form])

  const handleEditSubmit = async (values) => {
    const result = await updateNote(currentNote.id, values)
    if (result.success) {
      message.success('更新成功')
      fetchNote(id)
    } else {
      message.error(result.error || '更新失败')
    }
  }

  const handleDelete = () => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除笔记 "${currentNote.title}" 吗？`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        const result = await deleteNote(currentNote.id)
        if (result.success) {
          message.success('删除成功')
          navigate('/')
        } else {
          message.error(result.error || '删除失败')
        }
      },
    })
  }

  if (loading || !currentNote) {
    return (
      <div className="note-detail-loading">
        <Spin size="large" />
      </div>
    )
  }

  // Build folder path
  const getFolderPath = (folderId) => {
    if (!folderId) return '未分类'
    const path = []
    let currentId = folderId
    const folderMap = {}
    folders.forEach(f => folderMap[f.id] = f)
    
    while (currentId) {
      const folder = folderMap[currentId]
      if (!folder) break
      path.unshift(folder.name)
      currentId = folder.parent_id
    }
    return path.join(' / ')
  }

  const currentFolder = folders.find(f => f.id === currentNote.folder_id)
  const folderPath = getFolderPath(currentNote.folder_id)

  return (
    <div className="note-detail">
      {/* Header */}
      <div className="note-detail-header">
        <Space>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/')}
          >
            返回
          </Button>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />
        </Space>
        
        <Title level={4} className="note-detail-title">
          {currentNote.title}
        </Title>

        <Space>
          <Segmented
            value={imageMode}
            onChange={setImageMode}
            options={[
              { value: 'processed', label: '处理后' },
              { value: 'original', label: '原图' },
            ]}
          />
          <Button type="primary" icon={<SaveOutlined />} onClick={() => form.submit()}>
            保存
          </Button>
          <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
            删除
          </Button>
        </Space>
      </div>

      {/* Main Content */}
      <div className="note-detail-body">
        {/* Left: Image Viewer with Annotation */}
        <div className="note-viewer-section">
          <div className="note-image-container">
            {/* Navigation Buttons */}
            <Button
              className="nav-button nav-button-prev"
              icon={<LeftOutlined />}
              onClick={handlePrevious}
              disabled={!hasPrevious}
              size="large"
            />
            {/* Image with Annotation Overlay */}
            <NoteAnnotator
              noteId={currentNote.id}
              imageSrc={notesAPI.getImageUrl(currentNote.id, imageMode)}
              isAnnotating={isAnnotating}
              onAnnotationChange={() => fetchNote(id)}
            />
            <Button
              className="nav-button nav-button-next"
              icon={<RightOutlined />}
              onClick={handleNext}
              disabled={!hasNext}
              size="large"
            />
          </div>
        </div>

        {/* Right: Info Panel */}
        <div className="note-info-section">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: 'info',
                label: <><FileTextOutlined /> 信息</>,
                children: (
                  <div className="info-panel">
                    <Form form={form} onFinish={handleEditSubmit} layout="vertical" className="note-inline-form">
                      <Form.Item
                        name="title"
                        label="标题"
                        rules={[{ required: true, message: '请输入标题' }]}
                      >
                        <Input />
                      </Form.Item>
                      <Form.Item name="folder_id" label="文件夹">
                        <Select placeholder="选择文件夹" allowClear>
                          {folders.map(folder => (
                            <Select.Option key={folder.id} value={folder.id}>
                              {getFolderPath(folder.id)}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                      <Form.Item name="tag_ids" label="标签">
                        <Select mode="multiple" placeholder="选择标签" allowClear>
                          {tags.map(tag => (
                            <Select.Option key={tag.id} value={tag.id}>
                              <span style={{ color: tag.color }}>● </span>{tag.name}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Form>

                    <div className="info-section">
                      <div><Text type="secondary"><ClockCircleOutlined /> 创建时间</Text></div>
                      <div>{new Date(currentNote.created_at).toLocaleString()}</div>
                      <div style={{ marginTop: '8px' }}><Text type="secondary"><ClockCircleOutlined /> 修改时间</Text></div>
                      <div>{new Date(currentNote.updated_at).toLocaleString()}</div>
                    </div>
                  </div>
                ),
              },
              {
                key: 'ai',
                label: <><SettingOutlined /> 调整</>,
                children: (
                  <AIAssistant 
                    noteId={currentNote.id} 
                    onAdjustSuccess={() => fetchNote(id)}
                  />
                ),
              },
              {
                key: 'annotate',
                label: <><HighlightOutlined /> 标注</>,
                children: (
                  <div style={{ padding: '16px 0', textAlign: 'center', color: '#999' }}>
                    点击左侧图片添加标注
                  </div>
                ),
              },
            ]}
          />
        </div>
      </div>
    </div>
  )
}
