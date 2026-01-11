/**
 * AIAssistant - Natural language image adjustment
 */
import { useState, useEffect } from 'react'
import { Input, Button, Card, Typography, Space, Alert, Slider, Collapse, message } from 'antd'
import { SendOutlined, RobotOutlined, SettingOutlined, RotateLeftOutlined, RotateRightOutlined, UndoOutlined, RedoOutlined, ReloadOutlined } from '@ant-design/icons'
import { aiAPI, notesAPI } from '../../api'
import './index.css'

const { Text, Paragraph } = Typography
const { TextArea } = Input

const exampleInstructions = [
  '太模糊了',
  '噪点太多',
  '对比度太低',
  '背景不够白',
  '字迹太淡，加深一点',
]

// 默认参数值
const DEFAULT_PARAMS = {
  contrast: 1.0,
  brightness: 0,
  c: 2,
  block_size: 11,
  denoise_strength: 10,
}

export default function AIAssistant({ noteId, onAdjustSuccess, onRotate, initialParams }) {
  const [instruction, setInstruction] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [contrast, setContrast] = useState(initialParams?.contrast ?? DEFAULT_PARAMS.contrast)
  const [brightness, setBrightness] = useState(initialParams?.brightness ?? DEFAULT_PARAMS.brightness)
  const [c, setC] = useState(initialParams?.c ?? DEFAULT_PARAMS.c)
  const [blockSize, setBlockSize] = useState(initialParams?.block_size ?? DEFAULT_PARAMS.block_size)
  const [denoiseStrength, setDenoiseStrength] = useState(initialParams?.denoise_strength ?? DEFAULT_PARAMS.denoise_strength)
  
  // 撤销/重做历史记录
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  
  // 当initialParams变化时更新本地状态（但只在组件初始化时）
  const [initialized, setInitialized] = useState(false)
  useEffect(() => {
    if (initialParams && !initialized) {
      const params = {
        contrast: initialParams.contrast ?? DEFAULT_PARAMS.contrast,
        brightness: initialParams.brightness ?? DEFAULT_PARAMS.brightness,
        c: initialParams.c ?? DEFAULT_PARAMS.c,
        block_size: initialParams.block_size ?? DEFAULT_PARAMS.block_size,
        denoise_strength: initialParams.denoise_strength ?? DEFAULT_PARAMS.denoise_strength,
      }
      setContrast(params.contrast)
      setBrightness(params.brightness)
      setC(params.c)
      setBlockSize(params.block_size)
      setDenoiseStrength(params.denoise_strength)
      // 初始化历史记录
      setHistory([params])
      setHistoryIndex(0)
      setInitialized(true)
    }
  }, [initialParams, initialized])
  
  // 保存到历史记录
  const saveToHistory = (params) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(params)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }
  
  // 撤销
  const handleUndo = async () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1
      const prevParams = history[prevIndex]
      setHistoryIndex(prevIndex)
      setContrast(prevParams.contrast)
      setBrightness(prevParams.brightness)
      setC(prevParams.c)
      setBlockSize(prevParams.block_size)
      setDenoiseStrength(prevParams.denoise_strength)
      await applyParams(prevParams, false) // 不保存到历史
    }
  }
  
  // 重做
  const handleRedo = async () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1
      const nextParams = history[nextIndex]
      setHistoryIndex(nextIndex)
      setContrast(nextParams.contrast)
      setBrightness(nextParams.brightness)
      setC(nextParams.c)
      setBlockSize(nextParams.block_size)
      setDenoiseStrength(nextParams.denoise_strength)
      await applyParams(nextParams, false) // 不保存到历史
    }
  }
  
  // 恢复默认值
  const handleResetDefault = async () => {
    setContrast(DEFAULT_PARAMS.contrast)
    setBrightness(DEFAULT_PARAMS.brightness)
    setC(DEFAULT_PARAMS.c)
    setBlockSize(DEFAULT_PARAMS.block_size)
    setDenoiseStrength(DEFAULT_PARAMS.denoise_strength)
    await applyParams(DEFAULT_PARAMS, true)
  }
  
  // 左旋转
  const handleRotateLeft = async () => {
    await onRotate?.(-90)
    // 获取当前参数并保存到历史
    const currentParams = {
      contrast,
      brightness,
      c,
      block_size: blockSize,
      denoise_strength: denoiseStrength,
    }
    saveToHistory(currentParams)
  }
  
  // 右旋转
  const handleRotateRight = async () => {
    await onRotate?.(90)
    // 获取当前参数并保存到历史
    const currentParams = {
      contrast,
      brightness,
      c,
      block_size: blockSize,
      denoise_strength: denoiseStrength,
    }
    saveToHistory(currentParams)
  }

  // 应用参数 - 直接调用API
  const applyParams = async (params, saveHistory = true) => {
    setLoading(true)
    try {
      console.log('Calling reprocess API with params:', params)
      const response = await notesAPI.reprocess(noteId, params)
      console.log('Reprocess API response:', response)
      message.success('参数应用成功')
      // 保存到历史记录
      if (saveHistory) {
        saveToHistory(params)
      }
      // 调用回调刷新图片
      onAdjustSuccess?.()
    } catch (error) {
      console.error('Reprocess API error:', error)
      message.error('调整失败: ' + (error.response?.data?.detail || error.message))
    } finally {
      setLoading(false)
    }
  }

  // 参数变化后应用
  const handleSliderComplete = (key, value) => {
    // 更新本地状态
    if (key === 'contrast') setContrast(value)
    if (key === 'brightness') setBrightness(value)
    if (key === 'c') setC(value)
    if (key === 'block_size') setBlockSize(value)
    if (key === 'denoise_strength') setDenoiseStrength(value)
    
    const params = {
      contrast: key === 'contrast' ? value : contrast,
      brightness: key === 'brightness' ? value : brightness,
      c: key === 'c' ? value : c,
      block_size: key === 'block_size' ? value : blockSize,
      denoise_strength: key === 'denoise_strength' ? value : denoiseStrength,
    }
    
    console.log('Slider complete, applying params:', params)
    applyParams(params, true)
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
          const newParams = {
            contrast: res.data.new_params.contrast || DEFAULT_PARAMS.contrast,
            brightness: res.data.new_params.brightness || DEFAULT_PARAMS.brightness,
            c: res.data.new_params.c || DEFAULT_PARAMS.c,
            block_size: res.data.new_params.block_size || DEFAULT_PARAMS.block_size,
            denoise_strength: res.data.new_params.denoise_strength || DEFAULT_PARAMS.denoise_strength,
          }
          setContrast(newParams.contrast)
          setBrightness(newParams.brightness)
          setC(newParams.c)
          setBlockSize(newParams.block_size)
          setDenoiseStrength(newParams.denoise_strength)
          // 保存到历史记录
          saveToHistory(newParams)
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

      {/* 撤销/重做按钮 */}
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
        defaultActiveKey={['manual']}
        items={[
          {
            key: 'manual',
            label: <><SettingOutlined /> 手动参数调整</>,
            children: (
              <div className="manual-params">
                {/* 旋转和恢复默认值按钮 */}
                <div className="transform-buttons">
                  <Button
                    icon={<RotateLeftOutlined />}
                    size="small"
                    onClick={handleRotateLeft}
                    disabled={loading}
                    title="左旋转90°"
                  />
                  <Button
                    icon={<RotateRightOutlined />}
                    size="small"
                    onClick={handleRotateRight}
                    disabled={loading}
                    title="右旋转90°"
                  />
                  <Button
                    icon={<ReloadOutlined />}
                    size="small"
                    onClick={handleResetDefault}
                    disabled={loading}
                  >
                    恢复默认
                  </Button>
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
              </div>
            ),
          },
        ]}
      />
    </div>
  )
}
