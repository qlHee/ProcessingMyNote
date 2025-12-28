/**
 * NoteDetail Page - View, edit and annotate note
 */
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Button, Spin, Typography, Space, Tag, Dropdown, Modal, 
  Form, Input, Select, message, Tabs, Descriptions, Segmented
} from 'antd'
import { 
  ArrowLeftOutlined, EditOutlined, DeleteOutlined, MoreOutlined,
  FileImageOutlined, EyeOutlined, SettingOutlined, TagsOutlined,
  FolderOutlined, ClockCircleOutlined, FileTextOutlined
} from '@ant-design/icons'
import { useNotesStore, useFoldersStore, useTagsStore } from '../../stores'
import { notesAPI } from '../../api'
import AIAssistant from '../../components/AIAssistant'
import './index.css'

const { Title, Text, Paragraph } = Typography

export default function NoteDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [imageMode, setImageMode] = useState('processed')
  const [form] = Form.useForm()

  const { currentNote, loading, fetchNote, updateNote, deleteNote, clearCurrentNote } = useNotesStore()
  const { folders } = useFoldersStore()
  const { tags } = useTagsStore()

  useEffect(() => {
    fetchNote(id)
    return () => clearCurrentNote()
  }, [id, fetchNote, clearCurrentNote])

  const handleEdit = () => {
    form.setFieldsValue({
      title: currentNote.title,
      folder_id: currentNote.folder_id,
      tag_ids: currentNote.tags?.map(t => t.id) || [],
    })
    setEditModalVisible(true)
  }

  const handleEditSubmit = async (values) => {
    const result = await updateNote(currentNote.id, values)
    if (result.success) {
      message.success('更新成功')
      setEditModalVisible(false)
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

  const currentFolder = folders.find(f => f.id === currentNote.folder_id)

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
        </Space>
        
        <Title level={4} className="note-detail-title">
          {currentNote.title}
        </Title>

        <Space>
          <Button icon={<EditOutlined />} onClick={handleEdit}>
            编辑
          </Button>
          <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
            删除
          </Button>
        </Space>
      </div>

      {/* Main Content */}
      <div className="note-detail-body">
        {/* Left: Image Viewer */}
        <div className="note-viewer-section">
          <div className="viewer-toolbar">
            <Segmented
              value={imageMode}
              onChange={setImageMode}
              options={[
                { value: 'processed', label: '处理后' },
                { value: 'original', label: '原图' },
              ]}
            />
          </div>
          <div className="note-image-container">
            <img
              src={notesAPI.getImageUrl(currentNote.id, imageMode)}
              alt={currentNote.title}
              className="note-image"
            />
          </div>
        </div>

        {/* Right: Info Panel */}
        <div className="note-info-section">
          <Tabs
            defaultActiveKey="info"
            items={[
              {
                key: 'info',
                label: <><FileTextOutlined /> 信息</>,
                children: (
                  <div className="info-panel">
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label={<><FolderOutlined /> 文件夹</>}>
                        {currentFolder?.name || '未分类'}
                      </Descriptions.Item>
                      <Descriptions.Item label={<><ClockCircleOutlined /> 创建时间</>}>
                        {new Date(currentNote.created_at).toLocaleString()}
                      </Descriptions.Item>
                      <Descriptions.Item label={<><ClockCircleOutlined /> 修改时间</>}>
                        {new Date(currentNote.updated_at).toLocaleString()}
                      </Descriptions.Item>
                    </Descriptions>
                    
                    <div className="info-section">
                      <Text type="secondary"><TagsOutlined /> 标签</Text>
                      <div className="tags-display">
                        {currentNote.tags?.length > 0 ? (
                          currentNote.tags.map(tag => (
                            <Tag key={tag.id} color={tag.color}>{tag.name}</Tag>
                          ))
                        ) : (
                          <Text type="secondary">无标签</Text>
                        )}
                      </div>
                    </div>

                    {currentNote.ocr_text && (
                      <div className="info-section">
                        <Text type="secondary"><FileTextOutlined /> OCR 识别文本</Text>
                        <Paragraph 
                          className="ocr-text"
                          ellipsis={{ rows: 6, expandable: true, symbol: '展开' }}
                        >
                          {currentNote.ocr_text}
                        </Paragraph>
                      </div>
                    )}
                  </div>
                ),
              },
              {
                key: 'ai',
                label: <><SettingOutlined /> AI 调整</>,
                children: (
                  <AIAssistant 
                    noteId={currentNote.id} 
                    onAdjustSuccess={() => fetchNote(id)}
                  />
                ),
              },
            ]}
          />
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        title="编辑笔记"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={() => form.submit()}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} onFinish={handleEditSubmit} layout="vertical">
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
                  {folder.name}
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
      </Modal>
    </div>
  )
}
