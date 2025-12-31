/**
 * AIAssistant - Natural language image adjustment
 */
import { useState } from 'react'
import { Input, Button, Card, Typography, Space, Alert, Slider, Collapse, message } from 'antd'
import { SendOutlined, RobotOutlined, SettingOutlined, RotateLeftOutlined, RotateRightOutlined } from '@ant-design/icons'
import { aiAPI } from '../../api'
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

export default function AIAssistant({ noteId, onAdjustSuccess, onRotate }) {
  const [instruction, setInstruction] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [contrast, setContrast] = useState(1.0)
  const [brightness, setBrightness] = useState(0)
  const [c, setC] = useState(2)
  const [blockSize, setBlockSize] = useState(11)
  const [denoiseStrength, setDenoiseStrength] = useState(10)

  const { reprocessNote } = useNotesStore()

  // 应用参数（延迟执行，避免频繁调用）
  const applyParams = async (params) => {
    setLoading(true)
    try {
      const result = await reprocessNote(noteId, params)
      if (result.success) {
        onAdjustSuccess?.()
      } else {
        message.error(result.error || '调整失败')
      }
    } catch (error) {
      console.error('Apply params error:', error)
      message.error('调整失败')
    } finally {
      setLoading(false)
    }
  }

  // 参数变化后应用
  const handleSliderComplete = (key, value) => {
    const params = {
      contrast: key === 'contrast' ? value : contrast,
      brightness: key === 'brightness' ? value : brightness,
      c: key === 'c' ? value : c,
      block_size: key === 'block_size' ? value : blockSize,
      denoise_strength: key === 'denoise_strength' ? value : denoiseStrength,
    }
    
    console.log('Applying params:', params)
    applyParams(params)
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
        // 更新本地参数状态
        if (res.data.new_params) {
          setContrast(res.data.new_params.contrast || 1.0)
          setBrightness(res.data.new_params.brightness || 0)
          setC(res.data.new_params.c || 2)
          setBlockSize(res.data.new_params.block_size || 11)
          setDenoiseStrength(res.data.new_params.denoise_strength || 10)
        }
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

      {/* Manual Parameter Adjustment */}
      <Collapse
        ghost
        defaultActiveKey={['manual']}
        items={[
          {
            key: 'manual',
            label: <><SettingOutlined /> 手动参数调整</>,
            children: (
              <div className="manual-params">
                {/* 旋转按钮 */}
                <div className="transform-buttons">
                  <Button
                    icon={<RotateLeftOutlined />}
                    size="small"
                    onClick={() => onRotate?.(-90)}
                    disabled={loading}
                    title="左旋转90°"
                  >
                    左旋转
                  </Button>
                  <Button
                    icon={<RotateRightOutlined />}
                    size="small"
                    onClick={() => onRotate?.(90)}
                    disabled={loading}
                    title="右旋转90°"
                  >
                    右旋转
                  </Button>
                </div>

                <div className="param-item">
                  <Text>对比度: {contrast.toFixed(1)}</Text>
                  <Slider
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    value={contrast}
                    onChange={setContrast}
                    onChangeComplete={(v) => handleSliderComplete('contrast', v)}
                    disabled={loading}
                  />
                </div>
                <div className="param-item">
                  <Text>亮度: {brightness}</Text>
                  <Slider
                    min={-50}
                    max={50}
                    value={brightness}
                    onChange={setBrightness}
                    onChangeComplete={(v) => handleSliderComplete('brightness', v)}
                    disabled={loading}
                  />
                </div>
                <div className="param-item">
                  <Text>阈值偏移 (C): {c}</Text>
                  <Slider
                    min={-20}
                    max={20}
                    value={c}
                    onChange={setC}
                    onChangeComplete={(v) => handleSliderComplete('c', v)}
                    disabled={loading}
                  />
                </div>
                <div className="param-item">
                  <Text>块大小: {blockSize}</Text>
                  <Slider
                    min={3}
                    max={31}
                    step={2}
                    value={blockSize}
                    onChange={setBlockSize}
                    onChangeComplete={(v) => handleSliderComplete('block_size', v)}
                    disabled={loading}
                  />
                </div>
                <div className="param-item">
                  <Text>降噪强度: {denoiseStrength}</Text>
                  <Slider
                    min={0}
                    max={20}
                    value={denoiseStrength}
                    onChange={setDenoiseStrength}
                    onChangeComplete={(v) => handleSliderComplete('denoise_strength', v)}
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
