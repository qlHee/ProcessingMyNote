/**
 * AIAssistant - Natural language image adjustment
 */
import { useState } from 'react'
import { Input, Button, Card, Typography, Space, Alert, Slider, Collapse, message } from 'antd'
import { SendOutlined, RobotOutlined, SettingOutlined, UndoOutlined, RedoOutlined, RotateLeftOutlined, RotateRightOutlined, ScissorOutlined } from '@ant-design/icons'
import { aiAPI, notesAPI } from '../../api'
import { useNotesStore } from '../../stores'
import './index.css'

const { Text, Paragraph } = Typography
const { TextArea } = Input

const exampleInstructions = [
  '字迹太淡，加深一点',
  '背景不够白',
  '太模糊了',
  '噪点太多',
  '对比度太低',
]

export default function AIAssistant({ noteId, onAdjustSuccess, onRotate, onCrop }) {
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

  // 保存参数到历史记录
  const saveToHistory = (params) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push({ ...params })
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  // 撤销
  const handleUndo = async () => {
    if (historyIndex > 0) {
      const prevParams = history[historyIndex - 1]
      setHistoryIndex(historyIndex - 1)
      setManualParams(prevParams)
      await applyParams(prevParams)
    }
  }

  // 重做
  const handleRedo = async () => {
    if (historyIndex < history.length - 1) {
      const nextParams = history[historyIndex + 1]
      setHistoryIndex(historyIndex + 1)
      setManualParams(nextParams)
      await applyParams(nextParams)
    }
  }

  // 应用参数
  const applyParams = async (params) => {
    setLoading(true)
    try {
      const result = await reprocessNote(noteId, params)
      if (result.success) {
        onAdjustSuccess?.()
      }
    } catch (error) {
      console.error('Apply params error:', error)
    } finally {
      setLoading(false)
    }
  }

  // 参数变化后立即应用
  const handleParamChange = async (key, value) => {
    const newParams = { ...manualParams, [key]: value }
    setManualParams(newParams)
    saveToHistory(newParams)
    await applyParams(newParams)
  }

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


  const handleExampleClick = (example) => {
    setInstruction(example)
  }

  return (
    <div className="ai-assistant">
      {/* AI Natural Language Input */}
      <Card size="small" className="ai-card">
        <div className="ai-header">
          <RobotOutlined /> AI 智能调整
        </div>
        <Paragraph type="secondary" className="ai-hint">
          用自然语言描述你想要的效果，AI 会自动调整图片参数
        </Paragraph>
        
        <div className="example-tags">
          {exampleInstructions.map((example, index) => (
            <span
              key={index}
              className="example-tag"
              onClick={() => handleExampleClick(example)}
            >
              {example}
            </span>
          ))}
        </div>

        <Space.Compact style={{ width: '100%', marginTop: 12 }}>
          <TextArea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="例如：字迹太淡了，加深一点"
            autoSize={{ minRows: 2, maxRows: 4 }}
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault()
                handleAIAdjust()
              }
            }}
          />
        </Space.Compact>
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleAIAdjust}
          loading={loading}
          style={{ marginTop: 8, width: '100%' }}
        >
          应用调整
        </Button>

        {result && (
          <Alert
            type={result.success ? 'success' : 'warning'}
            message={result.message}
            showIcon
            style={{ marginTop: 12 }}
          />
        )}
      </Card>

      {/* Undo/Redo Buttons */}
      <div className="undo-redo-bar">
        <Button
          icon={<UndoOutlined />}
          size="small"
          onClick={handleUndo}
          disabled={historyIndex <= 0 || loading}
        >
          撤销
        </Button>
        <Button
          icon={<RedoOutlined />}
          size="small"
          onClick={handleRedo}
          disabled={historyIndex >= history.length - 1 || loading}
        >
          重做
        </Button>
      </div>

      {/* Manual Parameter Adjustment */}
      <Collapse
        ghost
        items={[
          {
            key: 'manual',
            label: <><SettingOutlined /> 手动参数调整</>,
            children: (
              <div className="manual-params">
                {/* 旋转和裁剪按钮 */}
                <div className="transform-buttons">
                  <Button
                    icon={<RotateLeftOutlined />}
                    size="small"
                    onClick={() => onRotate?.(-90)}
                    disabled={loading}
                  >
                    左旋转
                  </Button>
                  <Button
                    icon={<RotateRightOutlined />}
                    size="small"
                    onClick={() => onRotate?.(90)}
                    disabled={loading}
                  >
                    右旋转
                  </Button>
                  <Button
                    icon={<ScissorOutlined />}
                    size="small"
                    onClick={() => onCrop?.()}
                    disabled={loading}
                  >
                    裁剪
                  </Button>
                </div>

                <div className="param-item">
                  <Text>对比度: {manualParams.contrast.toFixed(1)}</Text>
                  <Slider
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    value={manualParams.contrast}
                    onChangeComplete={(v) => handleParamChange('contrast', v)}
                  />
                </div>
                <div className="param-item">
                  <Text>亮度: {manualParams.brightness}</Text>
                  <Slider
                    min={-50}
                    max={50}
                    value={manualParams.brightness}
                    onChangeComplete={(v) => handleParamChange('brightness', v)}
                  />
                </div>
                <div className="param-item">
                  <Text>阈值偏移 (C): {manualParams.c}</Text>
                  <Slider
                    min={-20}
                    max={20}
                    value={manualParams.c}
                    onChangeComplete={(v) => handleParamChange('c', v)}
                  />
                </div>
                <div className="param-item">
                  <Text>块大小: {manualParams.block_size}</Text>
                  <Slider
                    min={3}
                    max={31}
                    step={2}
                    value={manualParams.block_size}
                    onChangeComplete={(v) => handleParamChange('block_size', v)}
                  />
                </div>
                <div className="param-item">
                  <Text>降噪强度: {manualParams.denoise_strength}</Text>
                  <Slider
                    min={0}
                    max={20}
                    value={manualParams.denoise_strength}
                    onChangeComplete={(v) => handleParamChange('denoise_strength', v)}
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
