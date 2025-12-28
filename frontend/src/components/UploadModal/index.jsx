/**
 * UploadModal - Upload note images
 */
import { useState } from 'react'
import { Modal, Upload, Form, Input, Select, message } from 'antd'
import { InboxOutlined } from '@ant-design/icons'
import { useFoldersStore, useTagsStore, useNotesStore } from '../../stores'
import axios from 'axios'
import './index.css'

const { Dragger } = Upload

export default function UploadModal({ open, onClose }) {
  const [uploading, setUploading] = useState(false)
  const [fileList, setFileList] = useState([])
  const { fetchNotes } = useNotesStore()
  const { folders } = useFoldersStore()
  const { tags } = useTagsStore()
  const [form] = Form.useForm()

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.warning('请选择要上传的图片')
      return
    }

    // 检查token
    const token = localStorage.getItem('token')
    if (!token) {
      message.error('请先登录')
      return
    }

    const values = form.getFieldsValue()
    setUploading(true)

    try {
      for (const file of fileList) {
        // 确保文件大小合理
        if (file.size > 10 * 1024 * 1024) {
          message.error(`文件 ${file.name} 太大，请上传小于10MB的图片`)
          setUploading(false)
          return
        }
        
        // 直接使用axios发送请求
        const formData = new FormData()
        formData.append('file', file.originFileObj)
        if (values.title) formData.append('title', values.title)
        if (values.folder_id) formData.append('folder_id', values.folder_id)
        if (values.tag_ids?.length) formData.append('tag_ids', values.tag_ids.join(','))

        await axios.post('/api/notes/upload', formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          timeout: 60000
        })
      }

      message.success('上传成功！笔记已自动处理')
      setFileList([])
      form.resetFields()
      fetchNotes()
      onClose()
    } catch (error) {
      console.error('上传笔记错误:', error)
      message.error(`上传失败: ${error.response?.data?.detail || error.message || '请检查网络连接'}`)
    } finally {
      setUploading(false)
    }
  }

  const uploadProps = {
    multiple: true,
    accept: 'image/*',
    fileList,
    beforeUpload: () => false,
    onChange: ({ fileList }) => setFileList(fileList),
    onRemove: (file) => {
      setFileList(fileList.filter((f) => f.uid !== file.uid))
    },
  }

  return (
    <Modal
      title="上传笔记"
      open={open}
      onCancel={onClose}
      onOk={handleUpload}
      okText="上传"
      cancelText="取消"
      confirmLoading={uploading}
      width={600}
    >
      <Form form={form} layout="vertical" className="upload-form">
        <Form.Item label="选择图片" required>
          <Dragger {...uploadProps}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽图片到此处上传</p>
            <p className="ant-upload-hint">
              支持 JPG、PNG、GIF 等格式，上传后将自动处理成清晰的扫描效果
            </p>
          </Dragger>
        </Form.Item>

        <Form.Item name="title" label="标题（可选）">
          <Input placeholder="留空将自动从 OCR 识别结果生成" />
        </Form.Item>

        <Form.Item name="folder_id" label="保存到文件夹">
          <Select placeholder="选择文件夹（可选）" allowClear>
            {folders.map((folder) => (
              <Select.Option key={folder.id} value={folder.id}>
                {folder.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="tag_ids" label="添加标签">
          <Select
            mode="multiple"
            placeholder="选择标签（可选）"
            allowClear
          >
            {tags.map((tag) => (
              <Select.Option key={tag.id} value={tag.id}>
                <span style={{ color: tag.color }}>● </span>
                {tag.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  )
}
