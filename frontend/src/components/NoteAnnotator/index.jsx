/**
 * NoteAnnotator - Add annotations on note images
 */
import { useState, useRef, useEffect } from 'react'
import { Input, Button, Popover, List, Typography, message, Popconfirm, Space, Select, Divider } from 'antd'
import { 
  PlusOutlined, DeleteOutlined, EditOutlined, MessageOutlined,
  MinusOutlined, LineOutlined, ArrowRightOutlined, EditFilled, BgColorsOutlined
} from '@ant-design/icons'
import { annotationsAPI } from '../../api'
import './index.css'

const { Text, Paragraph } = Typography
const { TextArea } = Input

export default function NoteAnnotator({ 
  noteId, 
  imageSrc, 
  annotationMode, 
  setAnnotationMode, 
  fontSize, 
  setFontSize, 
  onAnnotationChange,
  panelMode = false
}) {
  const [annotations, setAnnotations] = useState([])
  const [newAnnotation, setNewAnnotation] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editContent, setEditContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [draggingId, setDraggingId] = useState(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [color, setColor] = useState('#ff4d4f')
  const imageRef = useRef(null)

  // Fetch annotations
  useEffect(() => {
    fetchAnnotations()
  }, [noteId])

  const fetchAnnotations = async () => {
    try {
      const res = await annotationsAPI.getAll(noteId)
      setAnnotations(res.data)
    } catch (error) {
      console.error('Failed to fetch annotations:', error)
    }
  }

  // Handle click on image to add annotation
  const handleImageClick = (e) => {
    if (!annotationMode || annotationMode === 'none') return
    if (e.target !== imageRef.current) return

    const rect = imageRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    if (annotationMode === 'text') {
      setNewAnnotation({ x, y, content: '', type: 'text' })
    }
  }

  // Save new annotation
  const handleSaveAnnotation = async (content) => {
    if (!content.trim()) {
      message.warning('请输入标注内容')
      return
    }

    setLoading(true)
    try {
      const res = await annotationsAPI.create(noteId, {
        x: newAnnotation.x,
        y: newAnnotation.y,
        content: content,
        fontSize: fontSize,
        color: color,
      })
      setAnnotations([...annotations, res.data])
      setNewAnnotation(null)
      setAnnotationMode(null)
      message.success('标注添加成功')
      onAnnotationChange?.()
    } catch (error) {
      console.error('Create annotation error:', error)
      message.error('添加失败: ' + (error.response?.data?.detail || error.message))
    } finally {
      setLoading(false)
    }
  }

  // Update annotation
  const handleUpdateAnnotation = async (id) => {
    if (!editContent.trim()) {
      message.warning('请输入标注内容')
      return
    }

    setLoading(true)
    try {
      await annotationsAPI.update(noteId, id, { content: editContent })
      setAnnotations(annotations.map(a => 
        a.id === id ? { ...a, content: editContent } : a
      ))
      setEditingId(null)
      setEditContent('')
      message.success('更新成功')
      onAnnotationChange?.()
    } catch (error) {
      message.error('更新失败')
    } finally {
      setLoading(false)
    }
  }

  // Delete annotation
  const handleDeleteAnnotation = async (id) => {
    try {
      await annotationsAPI.delete(noteId, id)
      setAnnotations(annotations.filter(a => a.id !== id))
      message.success('删除成功')
      onAnnotationChange?.()
    } catch (error) {
      message.error('删除失败')
    }
  }

  // Handle drag start
  const handleDragStart = (e, id) => {
    e.stopPropagation()
    const annotation = annotations.find(a => a.id === id)
    const rect = imageRef.current.getBoundingClientRect()
    const markerX = (annotation.x / 100) * rect.width + rect.left
    const markerY = (annotation.y / 100) * rect.height + rect.top
    
    setDraggingId(id)
    setDragOffset({
      x: e.clientX - markerX,
      y: e.clientY - markerY
    })
  }

  const handleDragMove = (e) => {
    if (!draggingId) return
    e.preventDefault()
    
    const rect = imageRef.current.getBoundingClientRect()
    const x = ((e.clientX - dragOffset.x - rect.left) / rect.width) * 100
    const y = ((e.clientY - dragOffset.y - rect.top) / rect.height) * 100
    
    setAnnotations(annotations.map(a => 
      a.id === draggingId ? { ...a, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) } : a
    ))
  }

  const handleDragEnd = async () => {
    if (!draggingId) return
    
    const annotation = annotations.find(a => a.id === draggingId)
    try {
      await annotationsAPI.update(noteId, draggingId, {
        x: annotation.x,
        y: annotation.y
      })
      message.success('位置已更新')
    } catch (error) {
      console.error('Update position error:', error)
      message.error('更新位置失败: ' + (error.response?.data?.detail || error.message))
    }
    setDraggingId(null)
  }

  useEffect(() => {
    if (draggingId) {
      document.addEventListener('mousemove', handleDragMove)
      document.addEventListener('mouseup', handleDragEnd)
      return () => {
        document.removeEventListener('mousemove', handleDragMove)
        document.removeEventListener('mouseup', handleDragEnd)
      }
    }
  }, [draggingId, dragOffset])

  // Panel mode: render toolbar and list
  if (panelMode) {
    return (
      <div className="annotation-panel">
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {/* Toolbar */}
          <div>
            <Text strong>标注工具</Text>
            <div style={{ marginTop: 8 }}>
              <Space wrap>
                <Button 
                  type={annotationMode === 'text' ? 'primary' : 'default'}
                  icon={<EditFilled />}
                  onClick={() => setAnnotationMode(annotationMode === 'text' ? null : 'text')}
                  size="small"
                >
                  文字
                </Button>
                <Button 
                  icon={<MinusOutlined />}
                  size="small"
                  disabled
                >
                  横线
                </Button>
                <Button 
                  icon={<LineOutlined rotate={-30} />}
                  size="small"
                  disabled
                >
                  波浪线
                </Button>
                <Button 
                  icon={<ArrowRightOutlined />}
                  size="small"
                  disabled
                >
                  箭头
                </Button>
                <Button 
                  icon={<BgColorsOutlined />}
                  size="small"
                  disabled
                >
                  涂鸦
                </Button>
              </Space>
            </div>
          </div>

          {/* Font Size Selector */}
          <div>
            <Text strong>字体大小</Text>
            <Select
              value={fontSize}
              onChange={setFontSize}
              style={{ width: '100%', marginTop: 8 }}
              size="small"
            >
              <Select.Option value={10}>极小 (10px)</Select.Option>
              <Select.Option value={12}>小 (12px)</Select.Option>
              <Select.Option value={14}>中 (14px)</Select.Option>
              <Select.Option value={16}>大 (16px)</Select.Option>
              <Select.Option value={18}>特大 (18px)</Select.Option>
              <Select.Option value={20}>超大 (20px)</Select.Option>
              <Select.Option value={24}>巨大 (24px)</Select.Option>
            </Select>
          </div>

          {/* Color Selector */}
          <div>
            <Text strong>文字颜色</Text>
            <Select
              value={color}
              onChange={setColor}
              style={{ width: '100%', marginTop: 8 }}
              size="small"
            >
              <Select.Option value="#ff4d4f">
                <span style={{ color: '#ff4d4f' }}>●</span> 红色
              </Select.Option>
              <Select.Option value="#1890ff">
                <span style={{ color: '#1890ff' }}>●</span> 蓝色
              </Select.Option>
              <Select.Option value="#52c41a">
                <span style={{ color: '#52c41a' }}>●</span> 绿色
              </Select.Option>
              <Select.Option value="#faad14">
                <span style={{ color: '#faad14' }}>●</span> 黄色
              </Select.Option>
              <Select.Option value="#722ed1">
                <span style={{ color: '#722ed1' }}>●</span> 紫色
              </Select.Option>
              <Select.Option value="#000000">
                <span style={{ color: '#000000' }}>●</span> 黑色
              </Select.Option>
              <Select.Option value="#ffffff">
                <span style={{ color: '#ffffff', textShadow: '0 0 1px #000' }}>●</span> 白色
              </Select.Option>
            </Select>
          </div>

          <Divider style={{ margin: '8px 0' }} />

          {/* Annotations List */}
          <div>
            <Text strong>文字标注列表</Text>
            <List
              size="small"
              style={{ marginTop: 8 }}
              dataSource={annotations.filter(a => a.content)}
              locale={{ emptyText: '暂无标注' }}
              renderItem={(annotation) => (
                <List.Item
                  actions={[
                    <Button
                      key="edit"
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => {
                        setEditingId(annotation.id)
                        setEditContent(annotation.content)
                      }}
                    />,
                    <Popconfirm
                      key="delete"
                      title="确定删除？"
                      onConfirm={() => handleDeleteAnnotation(annotation.id)}
                      okText="删除"
                      cancelText="取消"
                    >
                      <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>,
                  ]}
                >
                  <Text ellipsis style={{ maxWidth: 150 }}>{annotation.content}</Text>
                </List.Item>
              )}
            />
          </div>
        </Space>
      </div>
    )
  }

  // Overlay mode: render on image
  return (
    <div className="note-annotator-overlay">
      <img
        ref={imageRef}
        src={imageSrc}
        alt="Note"
        className="note-image"
        onClick={handleImageClick}
        style={{ cursor: annotationMode === 'text' ? 'crosshair' : 'default' }}
        draggable={false}
      />
      {/* Existing annotations */}
      {annotations.map((annotation) => (
        <Popover
          key={annotation.id}
          trigger="click"
          placement="right"
          content={
            <div className="annotation-popover">
              {editingId === annotation.id ? (
                <>
                  <TextArea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    autoSize={{ minRows: 2, maxRows: 4 }}
                    autoFocus
                  />
                  <div className="popover-actions">
                    <Button 
                      size="small" 
                      onClick={() => setEditingId(null)}
                    >
                      取消
                    </Button>
                    <Button 
                      type="primary" 
                      size="small"
                      loading={loading}
                      onClick={() => handleUpdateAnnotation(annotation.id)}
                    >
                      保存
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Paragraph className="annotation-content">
                    {annotation.content}
                  </Paragraph>
                  <div className="popover-actions">
                    <Button 
                      type="text" 
                      size="small" 
                      icon={<EditOutlined />}
                      onClick={() => {
                        setEditingId(annotation.id)
                        setEditContent(annotation.content)
                      }}
                    >
                      编辑
                    </Button>
                    <Popconfirm
                      title="确定删除此标注？"
                      onConfirm={() => handleDeleteAnnotation(annotation.id)}
                      okText="删除"
                      cancelText="取消"
                    >
                      <Button 
                        type="text" 
                        size="small" 
                        danger
                        icon={<DeleteOutlined />}
                      >
                        删除
                      </Button>
                    </Popconfirm>
                  </div>
                </>
              )}
            </div>
          }
        >
          <div
            className="annotation-text-marker"
            style={{ 
              left: `${annotation.x}%`, 
              top: `${annotation.y}%`,
              fontSize: `${annotation.fontSize || fontSize}px`,
              color: annotation.color || color,
              cursor: 'move'
            }}
            onMouseDown={(e) => handleDragStart(e, annotation.id)}
          >
            {annotation.content}
          </div>
        </Popover>
      ))}

      {/* New annotation input */}
      {newAnnotation && (
        <Popover
          content={
            <div className="annotation-popover">
              <TextArea
                placeholder="输入标注内容..."
                rows={3}
                autoFocus
                onChange={(e) => setNewAnnotation({ ...newAnnotation, content: e.target.value })}
              />
              <div className="popover-actions" style={{ marginTop: '8px' }}>
                <Button size="small" onClick={() => {
                  setNewAnnotation(null)
                  setAnnotationMode(null)
                }}>
                  取消
                </Button>
                <Button 
                  type="primary" 
                  size="small" 
                  onClick={() => handleSaveAnnotation(newAnnotation.content)}
                  loading={loading}
                >
                  确定
                </Button>
              </div>
            </div>
          }
          open={true}
          trigger="click"
          placement="top"
        >
          <div
            className="annotation-text-marker new"
            style={{
              left: `${newAnnotation.x}%`,
              top: `${newAnnotation.y}%`,
            }}
          >
            +
          </div>
        </Popover>
      )}
    </div>
  )
}
