/**
 * AIAssistant - Natural language image adjustment
 */
import { useState } from 'react'
import { Input, Button, Card, Typography, Space, Alert, Slider, Collapse, message } from 'antd'
import { SendOutlined, RobotOutlined, SettingOutlined, ReloadOutlined } from '@ant-design/icons'
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

  const { reprocessNote } = useNotesStore()

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

  const handleManualAdjust = async () => {
    setLoading(true)
    try {
      const result = await reprocessNote(noteId, manualParams)
      if (result.success) {
        message.success('参数调整成功')
        onAdjustSuccess?.()
      } else {
        message.error(result.error || '调整失败')
      }
    } catch (error) {
      message.error('调整失败')
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

      {/* Manual Parameter Adjustment */}
      <Collapse
        ghost
        items={[
          {
            key: 'manual',
            label: <><SettingOutlined /> 手动参数调整</>,
            children: (
              <div className="manual-params">
                <div className="param-item">
                  <Text>对比度: {manualParams.contrast.toFixed(1)}</Text>
                  <Slider
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    value={manualParams.contrast}
                    onChange={(v) => setManualParams({ ...manualParams, contrast: v })}
                  />
                </div>
                <div className="param-item">
                  <Text>亮度: {manualParams.brightness}</Text>
                  <Slider
                    min={-50}
                    max={50}
                    value={manualParams.brightness}
                    onChange={(v) => setManualParams({ ...manualParams, brightness: v })}
                  />
                </div>
                <div className="param-item">
                  <Text>阈值偏移 (C): {manualParams.c}</Text>
                  <Slider
                    min={-20}
                    max={20}
                    value={manualParams.c}
                    onChange={(v) => setManualParams({ ...manualParams, c: v })}
                  />
                </div>
                <div className="param-item">
                  <Text>块大小: {manualParams.block_size}</Text>
                  <Slider
                    min={3}
                    max={31}
                    step={2}
                    value={manualParams.block_size}
                    onChange={(v) => setManualParams({ ...manualParams, block_size: v })}
                  />
                </div>
                <div className="param-item">
                  <Text>降噪强度: {manualParams.denoise_strength}</Text>
                  <Slider
                    min={0}
                    max={20}
                    value={manualParams.denoise_strength}
                    onChange={(v) => setManualParams({ ...manualParams, denoise_strength: v })}
                  />
                </div>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleManualAdjust}
                  loading={loading}
                  block
                >
                  应用参数
                </Button>
              </div>
            ),
          },
        ]}
      />
    </div>
  )
}
