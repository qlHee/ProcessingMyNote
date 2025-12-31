/**
 * NoteDetail Page - View, edit and annotate note
 */
import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Button, Spin, Typography, Space, Tag, Modal, 
  Form, Input, Select, message, Tabs, Descriptions, Segmented
} from 'antd'
import { 
  ArrowLeftOutlined, DeleteOutlined, LeftOutlined, RightOutlined,
  FileImageOutlined, EyeOutlined, SettingOutlined, TagsOutlined,
  FolderOutlined, ClockCircleOutlined, FileTextOutlined, HighlightOutlined, SaveOutlined, MenuFoldOutlined, MenuUnfoldOutlined, FullscreenOutlined, FullscreenExitOutlined
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
  const [annotationMode, setAnnotationMode] = useState(null)
  const [fontSize, setFontSize] = useState(1.5)
  const [color, setColor] = useState('#1890ff')
  const [form] = Form.useForm()
  const { collapsed, setCollapsed } = useOutletContext()
  const imageRef = useRef(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [fullscreenIndex, setFullscreenIndex] = useState(0)

  const { currentNote, notes, loading, fetchNote, updateNote, deleteNote, clearCurrentNote } = useNotesStore()
  const { folders } = useFoldersStore()
  const { tags } = useTagsStore()

  // When switching away from annotate tab, disable annotation mode
  useEffect(() => {
    if (activeTab !== 'annotate') {
      setAnnotationMode(null)
    }
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

  // Fullscreen handlers
  const handleEnterFullscreen = () => {
    setIsFullscreen(true)
    setFullscreenIndex(currentIndex)
  }

  const handleExitFullscreen = () => {
    setIsFullscreen(false)
  }

  const handleFullscreenPrev = () => {
    if (fullscreenIndex > 0) {
      setFullscreenIndex(fullscreenIndex - 1)
    }
  }

  const handleFullscreenNext = () => {
    if (fullscreenIndex < notes.length - 1) {
      setFullscreenIndex(fullscreenIndex + 1)
    }
  }

  // Keyboard navigation in fullscreen
  useEffect(() => {
    if (!isFullscreen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleExitFullscreen()
      } else if (e.key === 'ArrowLeft') {
        handleFullscreenPrev()
      } else if (e.key === 'ArrowRight') {
        handleFullscreenNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen, fullscreenIndex, notes.length])

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
          <Button 
            icon={<FullscreenOutlined />} 
            onClick={handleEnterFullscreen}
          >
            全屏
          </Button>
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
            {/* Image with Annotation Overlay - only show annotations on processed image */}
            {imageMode === 'processed' ? (
              <NoteAnnotator
                noteId={currentNote.id}
                imageSrc={notesAPI.getImageUrl(currentNote.id, imageMode)}
                annotationMode={annotationMode}
                setAnnotationMode={setAnnotationMode}
                fontSize={fontSize}
                setFontSize={setFontSize}
                onAnnotationChange={() => fetchNote(id)}
              />
            ) : (
              <img
                ref={imageRef}
                src={notesAPI.getImageUrl(currentNote.id, imageMode)}
                alt={currentNote.title}
                className="note-image"
                draggable={false}
              />
            )}
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
                  <NoteAnnotator
                    noteId={currentNote.id}
                    imageSrc={notesAPI.getImageUrl(currentNote.id, imageMode)}
                    annotationMode={annotationMode}
                    setAnnotationMode={setAnnotationMode}
                    fontSize={fontSize}
                    setFontSize={setFontSize}
                    onAnnotationChange={() => fetchNote(id)}
                    panelMode={true}
                  />
                ),
              },
            ]}
          />
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && notes[fullscreenIndex] && (
        <div className="fullscreen-viewer" onClick={handleExitFullscreen}>
          <div className="fullscreen-content" onClick={(e) => e.stopPropagation()}>
            <Button
              className="fullscreen-close"
              type="text"
              icon={<FullscreenExitOutlined />}
              onClick={handleExitFullscreen}
              size="large"
            />
            
            <Button
              className="fullscreen-nav fullscreen-nav-prev"
              icon={<LeftOutlined />}
              onClick={handleFullscreenPrev}
              disabled={fullscreenIndex === 0}
              size="large"
            />
            
            <img
              src={notesAPI.getImageUrl(notes[fullscreenIndex].id, imageMode)}
              alt={notes[fullscreenIndex].title}
              className="fullscreen-image"
            />
            
            <Button
              className="fullscreen-nav fullscreen-nav-next"
              icon={<RightOutlined />}
              onClick={handleFullscreenNext}
              disabled={fullscreenIndex === notes.length - 1}
              size="large"
            />
            
            <div className="fullscreen-info">
              <Text strong style={{ color: '#fff', fontSize: '16px' }}>
                {notes[fullscreenIndex].title}
              </Text>
              <Text style={{ color: '#fff', opacity: 0.8, marginLeft: '16px' }}>
                {fullscreenIndex + 1} / {notes.length}
              </Text>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
