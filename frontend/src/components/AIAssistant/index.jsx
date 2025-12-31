/**
 * AIAssistant - Natural language image adjustment
 */
import { useState, useEffect } from 'react'
import { Input, Button, Card, Typography, Space, Alert, Slider, Collapse, message, Divider } from 'antd'
import { SendOutlined, RobotOutlined, SettingOutlined, UndoOutlined, RedoOutlined, RotateLeftOutlined, RotateRightOutlined, ScissorOutlined } from '@ant-design/icons'
import { aiAPI, notesAPI } from '../../api'
import { useNotesStore } from '../../stores'
import './index.css'

const { Text, Paragraph } = Typography
const { TextArea } = Input

const exampleInstructions = [
  '字迹太淡了，加深一点',
  '背景不够白，处理一下',
  '太模糊了，锐化一下',
  '噪点太多，去噪',
  '对比度不够，增强一下',
]

export default function AIAssistant({ noteId, onAdjustSuccess }) {
  const [instruction, setInstruction] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [manualParams, setManualParams] = useState({
    block_size: 11,
    c: 2,
    contrast: 1.0,
    brightness: 0,
    denoise_strength: 10,
  })
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  const { reprocessNote } = useNotesStore()

  // 保存初始参数到历史记录
  useEffect(() => {
    if (history.length === 0) {
      setHistory([manualParams])
      setHistoryIndex(0)
    }
  }, [])

  const handleAIAdjust = async () => {
    if (!instruction.trim()) {
      message.warning('请输入调整指令')
      return
    }

    setLoading(true)
    try {
      const res = await aiAPI.adjust(noteId, instruction)
      setResult(res.data)
      
      if (res.data.success) {
        message.success(res.data.message)
        setManualParams(res.data.new_params)
        onAdjustSuccess?.()
      } else {
        message.warning(res.data.message)
      }
    } catch (error) {
      message.error('调整失败: ' + (error.response?.data?.detail || error.message))
    } finally {
      setLoading(false)
    }
  }

  const handleManualAdjust = async (params) => {
    setLoading(true)
    try {
      const result = await reprocessNote(noteId, params)
      if (result.success) {
        onAdjustSuccess?.()
        // 添加到历史记录
        const newHistory = history.slice(0, historyIndex + 1)
        newHistory.push(params)
        setHistory(newHistory)
        setHistoryIndex(newHistory.length - 1)
      } else {
        message.error(result.error || '调整失败')
      }
    } catch (error) {
      message.error('调整失败')
    } finally {
      setLoading(false)
    }
  }

  // 实时调整参数
  const handleParamChange = (key, value) => {
    const newParams = { ...manualParams, [key]: value }
    setManualParams(newParams)
    handleManualAdjust(newParams)
  }

  // 撤销
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      const params = history[newIndex]
      setHistoryIndex(newIndex)
      setManualParams(params)
      reprocessNote(noteId, params).then(() => onAdjustSuccess?.())
    }
  }

  // 重做
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      const params = history[newIndex]
      setHistoryIndex(newIndex)
      setManualParams(params)
      reprocessNote(noteId, params).then(() => onAdjustSuccess?.())
    }
  }

  // 旋转
  const handleRotate = async (direction) => {
    setLoading(true)
    try {
      // TODO: 实现旋转API调用
      message.info(`${direction === 'left' ? '向左' : '向右'}旋转功能开发中`)
    } catch (error) {
      message.error('旋转失败')
    } finally {
      setLoading(false)
    }
  }

  // 裁剪
  const handleCrop = () => {
    message.info('裁剪功能开发中')
  }

  const handleExampleClick = (example) => {
    setInstruction(example)
  }

  return (
    <div className="ai-assistant">
      {/* 撤销/重做按钮 */}
      <div className="history-controls">
        <Button
          icon={<UndoOutlined />}
          onClick={handleUndo}
          disabled={historyIndex <= 0 || loading}
          size="small"
        >
          撤销
        </Button>
        <Button
          icon={<RedoOutlined />}
          onClick={handleRedo}
          disabled={historyIndex >= history.length - 1 || loading}
          size="small"
        >
          重做
        </Button>
      </div>

      {/* AI Natural Language Input */}
      <Card className="ai-card" bordered={false}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div className="ai-header">
            <RobotOutlined className="ai-icon" />
            <span>AI 智能调整</span>
          </div>
          
          <div className="example-chips">
            {exampleInstructions.map((example, index) => (
              <div
                key={index}
                className="example-chip"
                onClick={() => handleExampleClick(example)}
              >
                {example}
              </div>
            ))}
          </div>

          <TextArea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="例如：字迹太淡了，加深一点"
            autoSize={{ minRows: 2, maxRows: 3 }}
            className="ai-input"
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault()
                handleAIAdjust()
              }
            }}
          />

          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleAIAdjust}
            loading={loading}
            block
            size="large"
            className="ai-submit-btn"
          >
            应用调整
          </Button>

          {result && (
            <Alert
              type={result.success ? 'success' : 'warning'}
              message={result.message}
              showIcon
              closable
            />
          )}
        </Space>
      </Card>

      {/* Manual Parameter Adjustment */}
      <Collapse
        className="manual-collapse"
        items={[
          {
            key: 'manual',
            label: (
              <div className="collapse-header">
                <SettingOutlined /> 手动参数调整
              </div>
            ),
            children: (
              <div className="manual-params">
                {/* 图像操作按钮 */}
                <div className="image-operations">
                  <Button
                    icon={<RotateLeftOutlined />}
                    onClick={() => handleRotate('left')}
                    disabled={loading}
                  >
                    向左旋转
                  </Button>
                  <Button
                    icon={<RotateRightOutlined />}
                    onClick={() => handleRotate('right')}
                    disabled={loading}
                  >
                    向右旋转
                  </Button>
                  <Button
                    icon={<ScissorOutlined />}
                    onClick={handleCrop}
                    disabled={loading}
                  >
                    裁剪
                  </Button>
                </div>

                <Divider style={{ margin: '16px 0' }} />

                {/* 参数滑块 */}
                <div className="param-item">
                  <div className="param-label">
                    <Text>对比度</Text>
                    <Text type="secondary">{manualParams.contrast.toFixed(1)}</Text>
                  </div>
                  <Slider
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    value={manualParams.contrast}
                    onChange={(v) => handleParamChange('contrast', v)}
                    disabled={loading}
                  />
                </div>
                <div className="param-item">
                  <div className="param-label">
                    <Text>亮度</Text>
                    <Text type="secondary">{manualParams.brightness}</Text>
                  </div>
                  <Slider
                    min={-50}
                    max={50}
                    value={manualParams.brightness}
                    onChange={(v) => handleParamChange('brightness', v)}
                    disabled={loading}
                  />
                </div>
                <div className="param-item">
                  <div className="param-label">
                    <Text>阈值偏移</Text>
                    <Text type="secondary">{manualParams.c}</Text>
                  </div>
                  <Slider
                    min={-20}
                    max={20}
                    value={manualParams.c}
                    onChange={(v) => handleParamChange('c', v)}
                    disabled={loading}
                  />
                </div>
                <div className="param-item">
                  <div className="param-label">
                    <Text>块大小</Text>
                    <Text type="secondary">{manualParams.block_size}</Text>
                  </div>
                  <Slider
                    min={3}
                    max={31}
                    step={2}
                    value={manualParams.block_size}
                    onChange={(v) => handleParamChange('block_size', v)}
                    disabled={loading}
                  />
                </div>
                <div className="param-item">
                  <div className="param-label">
                    <Text>降噪强度</Text>
                    <Text type="secondary">{manualParams.denoise_strength}</Text>
                  </div>
                  <Slider
                    min={0}
                    max={20}
                    value={manualParams.denoise_strength}
                    onChange={(v) => handleParamChange('denoise_strength', v)}
                    disabled={loading}
                  />
                </div>
              </div>
            ),
          },
        ]}
      />
    </div>
  )
}
