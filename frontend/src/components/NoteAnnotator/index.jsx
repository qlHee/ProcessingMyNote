/**
 * NoteAnnotator - Add annotations on note images
 */
import { useState, useRef, useEffect } from 'react'
import { Input, Button, Popover, Typography, message, Popconfirm, Select } from 'antd'
import { 
  DeleteOutlined, EditOutlined,
  MinusOutlined, ArrowRightOutlined, EditFilled, BgColorsOutlined
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
  const [dragStartPos, setDragStartPos] = useState(null)
  const [hasDragged, setHasDragged] = useState(false)
  const [color, setColor] = useState('#1890ff')
  const [annotationType, setAnnotationType] = useState('text')
  const imageRef = useRef(null)
  const containerRef = useRef(null)

  // Fetch annotations
  useEffect(() => {
    if (noteId) {
      fetchAnnotations()
    }
  }, [noteId])

  const fetchAnnotations = async () => {
    try {
      console.log('Fetching annotations for note:', noteId)
      const res = await annotationsAPI.getAll(noteId)
      console.log('Fetched annotations:', res.data)
      setAnnotations(res.data)
    } catch (error) {
      console.error('Failed to fetch annotations:', error)
    }
  }

  // State for drawing
  const [isDrawing, setIsDrawing] = useState(false)

  // Handle mouse down on image to add annotation
  const handleImageMouseDown = (e) => {
    if (!annotationMode) return
    if (e.target !== imageRef.current) return
    e.preventDefault()

    const rect = imageRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    if (annotationMode === 'text') {
      setNewAnnotation({ x, y, content: '', type: 'text' })
    } else if (annotationMode === 'line' || annotationMode === 'arrow' || annotationMode === 'wave') {
      // Start drawing line/arrow/wave
      setIsDrawing(true)
      setNewAnnotation({ x, y, x2: x, y2: y, type: annotationMode })
    } else if (annotationMode === 'draw') {
      // Start free drawing
      setIsDrawing(true)
      setNewAnnotation({ points: [{ x, y }], type: 'draw' })
    }
  }

  // Handle mouse move for drawing
  const handleDrawMove = (e) => {
    if (!isDrawing || !newAnnotation || !imageRef.current) return
    e.preventDefault()
    
    const rect = imageRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    
    if (newAnnotation.type === 'draw') {
      setNewAnnotation(prev => ({
        ...prev,
        points: [...prev.points, { x, y }]
      }))
    } else if (newAnnotation.type === 'line' || newAnnotation.type === 'arrow' || newAnnotation.type === 'wave') {
      setNewAnnotation(prev => ({ ...prev, x2: x, y2: y }))
    }
  }

  // Handle mouse up for drawing
  const handleDrawEnd = async () => {
    if (!isDrawing || !newAnnotation) {
      setIsDrawing(false)
      return
    }
    
    setIsDrawing(false)
    
    if (newAnnotation.type === 'draw' && newAnnotation.points && newAnnotation.points.length > 1) {
      // Save drawing
      try {
        const createData = {
          x: newAnnotation.points[0].x,
          y: newAnnotation.points[0].y,
          content: JSON.stringify(newAnnotation.points),
          fontSize: fontSize,
          color: color,
        }
        console.log('Creating drawing with color:', createData)
        const res = await annotationsAPI.create(noteId, createData)
        console.log('Created drawing response:', res.data)
        setAnnotations(prev => [...prev, res.data])
        setNewAnnotation(null)
        setAnnotationMode(null)
        message.success('涂鸦已添加')
        onAnnotationChange?.()
      } catch (error) {
        console.error('Create drawing error:', error)
        message.error('添加失败')
        setNewAnnotation(null)
      }
    } else if ((newAnnotation.type === 'line' || newAnnotation.type === 'arrow' || newAnnotation.type === 'wave') && 
               (Math.abs(newAnnotation.x2 - newAnnotation.x) > 1 || Math.abs(newAnnotation.y2 - newAnnotation.y) > 1)) {
      // Save line/arrow/wave
      try {
        const createData = {
          x: newAnnotation.x,
          y: newAnnotation.y,
          content: JSON.stringify({ x2: newAnnotation.x2, y2: newAnnotation.y2, type: newAnnotation.type }),
          fontSize: fontSize,
          color: color,
        }
        console.log('Creating line/arrow/wave with color:', createData)
        const res = await annotationsAPI.create(noteId, createData)
        console.log('Created line/arrow/wave response:', res.data)
        setAnnotations(prev => [...prev, res.data])
        setNewAnnotation(null)
        setAnnotationMode(null)
        const typeNames = { line: '横线', arrow: '箭头', wave: '波浪线' }
        message.success(`${typeNames[newAnnotation.type]}已添加`)
        onAnnotationChange?.()
      } catch (error) {
        console.error('Create annotation error:', error)
        message.error('添加失败')
        setNewAnnotation(null)
      }
    } else {
      setNewAnnotation(null)
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
      const createData = {
        x: newAnnotation.x,
        y: newAnnotation.y,
        content: content,
        fontSize: fontSize,
        color: color,
      }
      console.log('Creating annotation with color:', createData)
      const res = await annotationsAPI.create(noteId, createData)
      console.log('Created annotation response:', res.data)
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
      const annotation = annotations.find(a => a.id === id)
      if (!annotation) {
        message.error('标注不存在')
        setLoading(false)
        return
      }
      
      // 使用最新的本地状态值
      const updateData = {
        content: editContent,
        fontSize: annotation.fontSize || annotation.font_size || fontSize,
        color: annotation.color || color,
        x: annotation.x,
        y: annotation.y
      }
      
      console.log('Updating annotation:', id, 'with data:', updateData)
      const response = await annotationsAPI.update(noteId, id, updateData)
      console.log('Update response:', response.data)
      
      setEditingId(null)
      setEditContent('')
      message.success('更新成功')
      
      // 刷新数据
      await fetchAnnotations()
    } catch (error) {
      console.error('Update error:', error)
      message.error('更新失败: ' + (error.response?.data?.detail || error.message))
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

  // Clear all annotations
  const handleClearAllAnnotations = async () => {
    if (annotations.length === 0) {
      message.info('暂无标注')
      return
    }
    
    try {
      setLoading(true)
      await Promise.all(annotations.map(a => annotationsAPI.delete(noteId, a.id)))
      setAnnotations([])
      message.success(`已清空 ${annotations.length} 个标注`)
      onAnnotationChange?.()
    } catch (error) {
      message.error('清空失败')
    } finally {
      setLoading(false)
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
    setDragStartPos({ x: annotation.x, y: annotation.y })
    setHasDragged(false)
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
    
    // Check if actually moved (threshold of 2%)
    if (dragStartPos && (Math.abs(x - dragStartPos.x) > 2 || Math.abs(y - dragStartPos.y) > 2)) {
      setHasDragged(true)
    }
    
    setAnnotations(annotations.map(a => 
      a.id === draggingId ? { ...a, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) } : a
    ))
  }

  const handleDragEnd = async () => {
    if (!draggingId) return
    
    const annotation = annotations.find(a => a.id === draggingId)
    if (!annotation) {
      setDraggingId(null)
      setDragStartPos(null)
      setHasDragged(false)
      return
    }
    
    // Only update if actually dragged
    if (hasDragged) {
      try {
        const parsed = parseAnnotation(annotation)
        await annotationsAPI.update(noteId, draggingId, {
          x: annotation.x,
          y: annotation.y,
          content: parsed.type === 'text' ? parsed.data : annotation.content
        })
        message.success('位置已更新')
        onAnnotationChange?.()
      } catch (error) {
        console.error('Update position error:', error)
        message.error('更新位置失败: ' + (error.response?.data?.detail || error.message))
        fetchAnnotations()
      }
    }
    
    setDraggingId(null)
    setDragStartPos(null)
    setHasDragged(false)
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
  }, [draggingId])

  // Add drawing event listeners
  useEffect(() => {
    if (isDrawing) {
      const moveHandler = (e) => handleDrawMove(e)
      const upHandler = () => handleDrawEnd()
      
      document.addEventListener('mousemove', moveHandler)
      document.addEventListener('mouseup', upHandler)
      return () => {
        document.removeEventListener('mousemove', moveHandler)
        document.removeEventListener('mouseup', upHandler)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDrawing, newAnnotation])

  // Parse annotation content to determine type
  const parseAnnotation = (annotation) => {
    try {
      const parsed = JSON.parse(annotation.content)
      if (Array.isArray(parsed)) {
        return { type: 'draw', data: parsed }
      } else if (parsed.x2 !== undefined && parsed.y2 !== undefined) {
        return { type: parsed.type || 'line', data: parsed }
      } else if (parsed.type === 'wave') {
        return { type: 'wave', data: parsed }
      }
    } catch (e) {
      return { type: 'text', data: annotation.content }
    }
    return { type: 'text', data: annotation.content }
  }

  // Color options
  const colorOptions = [
    { value: '#1890ff', label: '蓝' },
    { value: '#ff4d4f', label: '红' },
    { value: '#52c41a', label: '绿' },
    { value: '#faad14', label: '橙' },
    { value: '#722ed1', label: '紫' },
    { value: '#000000', label: '黑' },
  ]

  // Panel mode: render toolbar and list
  if (panelMode) {
    return (
      <div className="annotation-panel">
        {/* Tool buttons in a grid */}
        <div className="annotation-tools">
          <div 
            className={`tool-btn ${annotationMode === 'text' ? 'active' : ''}`}
            onClick={() => setAnnotationMode(annotationMode === 'text' ? null : 'text')}
          >
            <EditFilled />
            <span>文字</span>
          </div>
          <div 
            className={`tool-btn ${annotationMode === 'line' ? 'active' : ''}`}
            onClick={() => setAnnotationMode(annotationMode === 'line' ? null : 'line')}
          >
            <MinusOutlined />
            <span>直线</span>
          </div>
          <div 
            className={`tool-btn ${annotationMode === 'wave' ? 'active' : ''}`}
            onClick={() => setAnnotationMode(annotationMode === 'wave' ? null : 'wave')}
          >
            <span style={{ fontSize: '16px' }}>〰</span>
            <span>波浪</span>
          </div>
          <div 
            className={`tool-btn ${annotationMode === 'arrow' ? 'active' : ''}`}
            onClick={() => setAnnotationMode(annotationMode === 'arrow' ? null : 'arrow')}
          >
            <ArrowRightOutlined />
            <span>箭头</span>
          </div>
          <div 
            className={`tool-btn ${annotationMode === 'draw' ? 'active' : ''}`}
            onClick={() => setAnnotationMode(annotationMode === 'draw' ? null : 'draw')}
          >
            <BgColorsOutlined />
            <span>涂鸦</span>
          </div>
        </div>

        {/* Hint text */}
        {annotationMode && (
          <div className="annotation-hint">
            {annotationMode === 'text' && '💡 点击图片添加文字'}
            {annotationMode === 'line' && '💡 拖动绘制直线'}
            {annotationMode === 'wave' && '💡 拖动绘制波浪线'}
            {annotationMode === 'arrow' && '💡 拖动绘制箭头'}
            {annotationMode === 'draw' && '💡 自由绘制涂鸦'}
          </div>
        )}

        {/* Color palette */}
        <div className="color-palette">
          {colorOptions.map(c => (
            <div
              key={c.value}
              className={`color-dot ${color === c.value ? 'active' : ''}`}
              style={{ backgroundColor: c.value }}
              onClick={() => setColor(c.value)}
              title={c.label}
            />
          ))}
        </div>

        {/* Clear all button */}
        {annotations.length > 0 && (
          <Popconfirm
            title={`确定清空所有 ${annotations.length} 个标注？`}
            onConfirm={handleClearAllAnnotations}
            okText="清空"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button 
              danger 
              size="small" 
              block
              style={{ marginBottom: '12px' }}
              loading={loading}
            >
              清空所有标注
            </Button>
          </Popconfirm>
        )}

        {/* Annotations List */}
        <div className="annotation-list-section">
          <div className="section-title">文字标注</div>
          {annotations.filter(a => parseAnnotation(a).type === 'text').length === 0 ? (
            <div className="empty-hint">暂无文字标注</div>
          ) : (
            <div className="annotation-list">
              {annotations.filter(a => parseAnnotation(a).type === 'text').map(annotation => {
                const parsed = parseAnnotation(annotation)
                // 从原始数组获取最新的annotation对象
                const currentAnnotation = annotations.find(a => a.id === annotation.id) || annotation
                
                if (editingId === annotation.id) {
                  const currentFontSize = currentAnnotation.font_size || currentAnnotation.fontSize || fontSize
                  return (
                    <div key={annotation.id} className="annotation-edit-form">
                      <TextArea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        autoSize={{ minRows: 2, maxRows: 4 }}
                        autoFocus
                        placeholder="输入标注内容"
                      />
                      <div className="edit-actions">
                        <Select
                          value={currentFontSize}
                          onChange={(val) => {
                            setAnnotations(annotations.map(a => 
                              a.id === annotation.id ? { ...a, fontSize: val, font_size: val } : a
                            ))
                          }}
                          size="small"
                          style={{ width: '70px' }}
                        >
                          <Select.Option value={0.8}>0.8</Select.Option>
                          <Select.Option value={1.0}>1.0</Select.Option>
                          <Select.Option value={1.2}>1.2</Select.Option>
                          <Select.Option value={1.5}>1.5</Select.Option>
                          <Select.Option value={1.8}>1.8</Select.Option>
                          <Select.Option value={2.0}>2.0</Select.Option>
                          <Select.Option value={2.5}>2.5</Select.Option>
                          <Select.Option value={3.0}>3.0</Select.Option>
                        </Select>
                        <Button size="small" onClick={() => setEditingId(null)}>取消</Button>
                        <Button type="primary" size="small" loading={loading} onClick={() => handleUpdateAnnotation(annotation.id)}>保存</Button>
                      </div>
                    </div>
                  )
                }
                
                return (
                  <div key={annotation.id} className="annotation-item">
                    <span className="annotation-text">{parsed.data}</span>
                    <div className="annotation-actions">
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => {
                          setEditingId(annotation.id)
                          setEditContent(currentAnnotation.content)
                        }}
                      />
                      <Popconfirm
                        title="确定删除？"
                        onConfirm={() => handleDeleteAnnotation(annotation.id)}
                        okText="删除"
                        cancelText="取消"
                      >
                        <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
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
        onClick={(e) => {
          if (annotationMode === 'text') handleImageMouseDown(e)
        }}
        onMouseDown={handleImageMouseDown}
        style={{ cursor: annotationMode ? 'crosshair' : 'default' }}
        draggable={false}
      />
      
      {/* SVG overlay for lines, arrows, and drawings */}
      <svg className="annotation-svg-overlay" viewBox="0 0 100 100" preserveAspectRatio="none" style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none'
      }}>
        {/* Render line/arrow/wave/draw annotations */}
        {annotations.map((annotation) => {
          const parsed = parseAnnotation(annotation)
          const strokeWidth = (annotation.font_size || annotation.fontSize || fontSize) * 0.15
          const annotationColor = annotation.color || color
          
          if (parsed.type === 'line') {
            return (
              <line
                key={annotation.id}
                x1={annotation.x}
                y1={annotation.y}
                x2={parsed.data.x2}
                y2={parsed.data.y2}
                stroke={annotationColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation()
                  if (window.confirm('确定删除此标注？')) {
                    handleDeleteAnnotation(annotation.id)
                  }
                }}
              />
            )
          } else if (parsed.type === 'wave') {
            // Generate wave path
            const x1 = annotation.x
            const y1 = annotation.y
            const x2 = parsed.data.x2
            const y2 = parsed.data.y2
            const dx = x2 - x1
            const dy = y2 - y1
            const length = Math.sqrt(dx * dx + dy * dy)
            const waveCount = Math.max(3, Math.floor(length / 3))
            const amplitude = strokeWidth * 3
            
            let pathD = `M ${x1} ${y1}`
            for (let i = 0; i < waveCount; i++) {
              const t1 = (i + 0.5) / waveCount
              const t2 = (i + 1) / waveCount
              const cx = x1 + dx * t1
              const cy = y1 + dy * t1 + (i % 2 === 0 ? amplitude : -amplitude)
              const ex = x1 + dx * t2
              const ey = y1 + dy * t2
              pathD += ` Q ${cx} ${cy} ${ex} ${ey}`
            }
            
            return (
              <path
                key={annotation.id}
                d={pathD}
                stroke={annotationColor}
                strokeWidth={strokeWidth}
                fill="none"
                strokeLinecap="round"
                style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation()
                  if (window.confirm('确定删除此标注？')) {
                    handleDeleteAnnotation(annotation.id)
                  }
                }}
              />
            )
          } else if (parsed.type === 'arrow') {
            const x1 = annotation.x
            const y1 = annotation.y
            const x2 = parsed.data.x2
            const y2 = parsed.data.y2
            const angle = Math.atan2(y2 - y1, x2 - x1)
            const arrowSize = strokeWidth * 4
            
            return (
              <g key={annotation.id}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={annotationColor}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (window.confirm('确定删除此标注？')) {
                      handleDeleteAnnotation(annotation.id)
                    }
                  }}
                />
                <polygon
                  points={`0,0 ${-arrowSize},${-arrowSize/2} ${-arrowSize},${arrowSize/2}`}
                  fill={annotationColor}
                  transform={`translate(${x2},${y2}) rotate(${angle * 180 / Math.PI})`}
                  style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (window.confirm('确定删除此标注？')) {
                      handleDeleteAnnotation(annotation.id)
                    }
                  }}
                />
              </g>
            )
          } else if (parsed.type === 'draw') {
            const points = parsed.data.map(p => `${p.x},${p.y}`).join(' ')
            return (
              <polyline
                key={annotation.id}
                points={points}
                stroke={annotationColor}
                strokeWidth={strokeWidth * 0.7}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation()
                  if (window.confirm('确定删除此标注？')) {
                    handleDeleteAnnotation(annotation.id)
                  }
                }}
              />
            )
          }
          return null
        })}
        
        {/* Render preview for new line/arrow/wave/draw */}
        {newAnnotation && newAnnotation.type === 'line' && (
          <line
            x1={newAnnotation.x}
            y1={newAnnotation.y}
            x2={newAnnotation.x2}
            y2={newAnnotation.y2}
            stroke={color}
            strokeWidth={fontSize * 0.15}
            strokeLinecap="round"
            opacity={0.7}
          />
        )}
        {newAnnotation && newAnnotation.type === 'wave' && (() => {
          const x1 = newAnnotation.x
          const y1 = newAnnotation.y
          const x2 = newAnnotation.x2
          const y2 = newAnnotation.y2
          const dx = x2 - x1
          const dy = y2 - y1
          const length = Math.sqrt(dx * dx + dy * dy)
          const waveCount = Math.max(3, Math.floor(length / 3))
          const amplitude = fontSize * 0.15 * 3
          
          let pathD = `M ${x1} ${y1}`
          for (let i = 0; i < waveCount; i++) {
            const t1 = (i + 0.5) / waveCount
            const t2 = (i + 1) / waveCount
            const cx = x1 + dx * t1
            const cy = y1 + dy * t1 + (i % 2 === 0 ? amplitude : -amplitude)
            const ex = x1 + dx * t2
            const ey = y1 + dy * t2
            pathD += ` Q ${cx} ${cy} ${ex} ${ey}`
          }
          
          return (
            <path
              d={pathD}
              stroke={color}
              strokeWidth={fontSize * 0.15}
              fill="none"
              strokeLinecap="round"
              opacity={0.7}
            />
          )
        })()}
        {newAnnotation && newAnnotation.type === 'arrow' && (() => {
          const x1 = newAnnotation.x
          const y1 = newAnnotation.y
          const x2 = newAnnotation.x2
          const y2 = newAnnotation.y2
          const angle = Math.atan2(y2 - y1, x2 - x1)
          const arrowSize = fontSize * 0.15 * 4
          
          return (
            <g opacity={0.7}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={color}
                strokeWidth={fontSize * 0.15}
                strokeLinecap="round"
              />
              <polygon
                points={`0,0 ${-arrowSize},${-arrowSize/2} ${-arrowSize},${arrowSize/2}`}
                fill={color}
                transform={`translate(${x2},${y2}) rotate(${angle * 180 / Math.PI})`}
              />
            </g>
          )
        })()}
        {newAnnotation && newAnnotation.type === 'draw' && newAnnotation.points && (
          <polyline
            points={newAnnotation.points.map(p => `${p.x},${p.y}`).join(' ')}
            stroke={color}
            strokeWidth={fontSize * 0.15 * 0.7}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.7}
          />
        )}
      </svg>

      {/* Existing text annotations */}
      {annotations.map((annotation) => {
        const parsed = parseAnnotation(annotation)
        if (parsed.type !== 'text') return null
        return (
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
                  <div className="popover-actions" style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <Text style={{ fontSize: '12px', marginRight: '4px' }}>字号:</Text>
                      <Select
                        value={annotation.font_size || annotation.fontSize || fontSize}
                        onChange={(val) => {
                          setAnnotations(annotations.map(a => 
                            a.id === annotation.id ? { ...a, fontSize: val, font_size: val } : a
                          ))
                        }}
                        size="small"
                        style={{ width: '60px' }}
                      >
                        <Select.Option value={0.8}>0.8</Select.Option>
                        <Select.Option value={1.0}>1.0</Select.Option>
                        <Select.Option value={1.2}>1.2</Select.Option>
                        <Select.Option value={1.5}>1.5</Select.Option>
                        <Select.Option value={1.8}>1.8</Select.Option>
                        <Select.Option value={2.0}>2.0</Select.Option>
                        <Select.Option value={2.5}>2.5</Select.Option>
                        <Select.Option value={3.0}>3.0</Select.Option>
                      </Select>
                    </div>
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
              fontSize: `${annotation.font_size || annotation.fontSize || fontSize}vw`,
              color: annotation.color || color,
              cursor: 'move'
            }}
            onMouseDown={(e) => {
              e.stopPropagation()
              handleDragStart(e, annotation.id)
            }}
          >
            {parsed.data}
          </div>
        </Popover>
        )
      })}

      {/* New text annotation input */}
      {newAnnotation && newAnnotation.type === 'text' && (
        <Popover
          content={
            <div className="annotation-popover">
              <TextArea
                placeholder="输入标注内容..."
                rows={3}
                autoFocus
                onChange={(e) => setNewAnnotation({ ...newAnnotation, content: e.target.value })}
              />
              <div style={{ marginTop: '8px', marginBottom: '8px' }}>
                <Text strong style={{ fontSize: '12px' }}>字体大小: </Text>
                <Select
                  value={fontSize}
                  onChange={setFontSize}
                  size="small"
                  style={{ width: '80px', marginLeft: '8px' }}
                >
                  <Select.Option value={0.8}>0.8</Select.Option>
                  <Select.Option value={1.0}>1.0</Select.Option>
                  <Select.Option value={1.2}>1.2</Select.Option>
                  <Select.Option value={1.5}>1.5</Select.Option>
                  <Select.Option value={1.8}>1.8</Select.Option>
                  <Select.Option value={2.0}>2.0</Select.Option>
                  <Select.Option value={2.5}>2.5</Select.Option>
                  <Select.Option value={3.0}>3.0</Select.Option>
                </Select>
              </div>
              <div className="popover-actions">
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
