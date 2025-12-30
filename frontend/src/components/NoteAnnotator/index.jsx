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

export default function NoteAnnotator({ noteId, imageSrc, isAnnotating = false, onAnnotationChange }) {
  const [annotations, setAnnotations] = useState([])
  const [newAnnotation, setNewAnnotation] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editContent, setEditContent] = useState('')
  const [loading, setLoading] = useState(false)
  const containerRef = useRef(null)
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
    if (!isAnnotating) return

    const rect = imageRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    setNewAnnotation({ x, y, content: '' })
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
      })
      setAnnotations([...annotations, res.data])
      setNewAnnotation(null)
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
    <div className="note-annotator-overlay">
      <img
        ref={imageRef}
        src={imageSrc}
        alt="Note"
        className="note-image"
        onClick={handleImageClick}
        style={{ cursor: isAnnotating ? 'crosshair' : 'default' }}
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
            style={{ left: `${annotation.x}%`, top: `${annotation.y}%` }}
          >
            {annotation.content}
          </div>
        </Popover>
      ))}

      {/* New annotation marker */}
      {newAnnotation && (
        <Popover
          content={
            <div className="annotation-popover">
              <TextArea
                placeholder="输入标注内容..."
                rows={3}
                autoFocus
                onPressEnter={(e) => {
                  if (!e.shiftKey) {
                    e.preventDefault()
                    handleSaveAnnotation(e.target.value)
                  }
                }}
              />
              <div className="popover-actions" style={{ marginTop: '8px' }}>
                <Button size="small" onClick={() => setNewAnnotation(null)}>
                  取消
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
