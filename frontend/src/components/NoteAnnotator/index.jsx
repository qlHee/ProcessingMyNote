/**
 * NoteAnnotator - Add annotations on note images
 */
import { useState, useRef, useEffect } from 'react'
import { Input, Button, Popover, List, Typography, Empty, message, Popconfirm } from 'antd'
import { PlusOutlined, DeleteOutlined, EditOutlined, MessageOutlined } from '@ant-design/icons'
import { annotationsAPI } from '../../api'
import './index.css'

const { Text, Paragraph } = Typography
const { TextArea } = Input

export default function NoteAnnotator({ noteId, imageSrc, onAnnotationChange }) {
  const [annotations, setAnnotations] = useState([])
  const [isAdding, setIsAdding] = useState(false)
  const [newAnnotation, setNewAnnotation] = useState({ x: 0, y: 0, content: '' })
  const [editingId, setEditingId] = useState(null)
  const [editContent, setEditContent] = useState('')
  const [loading, setLoading] = useState(false)
  const containerRef = useRef(null)

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
    if (!isAdding) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    setNewAnnotation({ x, y, content: '' })
  }

  // Save new annotation
  const handleSaveAnnotation = async () => {
    if (!newAnnotation.content.trim()) {
      message.warning('请输入标注内容')
      return
    }

    setLoading(true)
    try {
      const res = await annotationsAPI.create(noteId, {
        x: newAnnotation.x,
        y: newAnnotation.y,
        content: newAnnotation.content,
      })
      setAnnotations([...annotations, res.data])
      setNewAnnotation({ x: 0, y: 0, content: '' })
      setIsAdding(false)
      message.success('标注添加成功')
      onAnnotationChange?.()
    } catch (error) {
      message.error('添加失败')
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

  // Cancel adding
  const handleCancelAdd = () => {
    setIsAdding(false)
    setNewAnnotation({ x: 0, y: 0, content: '' })
  }

  return (
    <div className="note-annotator">
      {/* Toolbar */}
      <div className="annotator-toolbar">
        {isAdding ? (
          <>
            <Text type="secondary">点击图片添加标注位置</Text>
            <Button size="small" onClick={handleCancelAdd}>取消</Button>
          </>
        ) : (
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            size="small"
            onClick={() => setIsAdding(true)}
          >
            添加标注
          </Button>
        )}
        <Text type="secondary" className="annotation-count">
          <MessageOutlined /> {annotations.length} 条标注
        </Text>
      </div>

      {/* Image with annotations */}
      <div 
        ref={containerRef}
        className={`annotator-container ${isAdding ? 'adding' : ''}`}
        onClick={handleImageClick}
      >
        <img src={imageSrc} alt="Note" className="annotator-image" />
        
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
              className="annotation-marker"
              style={{ left: `${annotation.x}%`, top: `${annotation.y}%` }}
            >
              <span className="marker-number">
                {annotations.indexOf(annotation) + 1}
              </span>
            </div>
          </Popover>
        ))}

        {/* New annotation marker */}
        {isAdding && newAnnotation.content !== undefined && newAnnotation.x > 0 && (
          <Popover
            open={true}
            placement="right"
            content={
              <div className="annotation-popover">
                <TextArea
                  value={newAnnotation.content}
                  onChange={(e) => setNewAnnotation({ ...newAnnotation, content: e.target.value })}
                  placeholder="输入标注内容..."
                  autoSize={{ minRows: 2, maxRows: 4 }}
                  autoFocus
                />
                <div className="popover-actions">
                  <Button size="small" onClick={handleCancelAdd}>
                    取消
                  </Button>
                  <Button 
                    type="primary" 
                    size="small"
                    loading={loading}
                    onClick={handleSaveAnnotation}
                  >
                    保存
                  </Button>
                </div>
              </div>
            }
          >
            <div
              className="annotation-marker new"
              style={{ left: `${newAnnotation.x}%`, top: `${newAnnotation.y}%` }}
            >
              <PlusOutlined />
            </div>
          </Popover>
        )}
      </div>

      {/* Annotations List */}
      {annotations.length > 0 && (
        <div className="annotations-list">
          <Text strong>标注列表</Text>
          <List
            size="small"
            dataSource={annotations}
            renderItem={(item, index) => (
              <List.Item
                actions={[
                  <Button 
                    type="text" 
                    size="small" 
                    icon={<DeleteOutlined />}
                    danger
                    onClick={() => handleDeleteAnnotation(item.id)}
                  />,
                ]}
              >
                <List.Item.Meta
                  avatar={<span className="list-marker">{index + 1}</span>}
                  description={item.content}
                />
              </List.Item>
            )}
          />
        </div>
      )}
    </div>
  )
}
