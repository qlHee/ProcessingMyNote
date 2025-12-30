/**
 * TagManager - Tag filtering and management
 */
import { useEffect, useState } from 'react'
import { Tag, Button, Modal, Form, Input, ColorPicker, message, Space } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, TagsOutlined } from '@ant-design/icons'
import { useTagsStore, useNotesStore, useFoldersStore } from '../../stores'
import './index.css'

const presetColors = [
  '#1677ff', '#52c41a', '#faad14', '#f5222d', '#722ed1',
  '#13c2c2', '#eb2f96', '#fa8c16', '#a0d911', '#2f54eb',
]

export default function TagManager({ collapsed }) {
  const {
    tags,
    selectedTagIds,
    fetchTags,
    createTag,
    updateTag,
    deleteTag,
    toggleTagSelection,
  } = useTagsStore()
  const { fetchNotes } = useNotesStore()
  const { selectedFolderId } = useFoldersStore()

  const [modalVisible, setModalVisible] = useState(false)
  const [editingTag, setEditingTag] = useState(null)
  const [actionMode, setActionMode] = useState(null) // 'edit' | 'delete' | null
  const [form] = Form.useForm()

  useEffect(() => {
    fetchTags()
  }, [fetchTags])

  useEffect(() => {
    if (selectedTagIds.length > 0) {
      fetchNotes({
        folder_id: selectedFolderId,
        tag_ids: selectedTagIds.join(','),
      })
    }
  }, [selectedTagIds, selectedFolderId, fetchNotes])

  const handleTagClick = (tag) => {
    if (actionMode === 'edit') {
      handleEdit(tag)
      setActionMode(null)
      message.info('已选择要编辑的标签')
      return
    }
    if (actionMode === 'delete') {
      handleDelete(tag)
      setActionMode(null)
      return
    }
    toggleTagSelection(tag.id)
  }

  const handleCreate = () => {
    setEditingTag(null)
    form.resetFields()
    form.setFieldsValue({ color: '#1677ff' })
    setModalVisible(true)
  }

  const handleEdit = (tag) => {
    setEditingTag(tag)
    form.setFieldsValue({ name: tag.name, color: tag.color })
    setModalVisible(true)
  }

  const handleDelete = (tag) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除标签 "${tag.name}" 吗？`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        const result = await deleteTag(tag.id)
        if (result.success) {
          message.success('删除成功')
        } else {
          message.error(result.error || '删除失败')
        }
      },
    })
  }

  const handleSubmit = async (values) => {
    const color = typeof values.color === 'string' 
      ? values.color 
      : values.color?.toHexString?.() || '#1677ff'
    
    const data = { name: values.name, color }
    
    let result
    if (editingTag) {
      result = await updateTag(editingTag.id, data)
    } else {
      result = await createTag(data)
    }

    if (result.success) {
      message.success(editingTag ? '更新成功' : '创建成功')
      setModalVisible(false)
    } else {
      message.error(result.error || '操作失败')
    }
  }

  if (collapsed) {
    return (
      <div className="tag-manager-collapsed">
        <Button type="text" icon={<PlusOutlined />} onClick={handleCreate} />
      </div>
    )
  }

  return (
    <div className="tag-manager">
      <div className="tag-manager-header">
        <span className="tag-header-title"><TagsOutlined /> 标签</span>
        <div className="tag-header-actions">
          <Button
            type="text"
            size="small"
            icon={<PlusOutlined />}
            onClick={handleCreate}
            style={{ fontSize: '12px', padding: '0 8px' }}
          />
        <Button
          type={actionMode === 'edit' ? 'primary' : 'text'}
          size="small"
          icon={<EditOutlined />}
          onClick={() => {
            setActionMode(actionMode === 'edit' ? null : 'edit')
            if (actionMode !== 'edit') message.info('选择要编辑的标签')
          }}
          style={{ fontSize: '12px', padding: '0 8px' }}
        />
        <Button
          type={actionMode === 'delete' ? 'primary' : 'text'}
          size="small"
          danger
          icon={<DeleteOutlined />}
          onClick={() => {
            setActionMode(actionMode === 'delete' ? null : 'delete')
            if (actionMode !== 'delete') message.info('选择要删除的标签')
          }}
          style={{ fontSize: '12px', padding: '0 8px' }}
        />
        </div>
      </div>

      {actionMode && (
        <div className="tag-mode-hint">
          {actionMode === 'edit' ? '选择要编辑的标签' : '选择要删除的标签'}
        </div>
      )}

      <div className="tag-list">
        {tags.map((tag) => (
          <div
            key={tag.id}
            className={`tag-item ${selectedTagIds.includes(tag.id) ? 'selected' : ''}`}
            onClick={() => handleTagClick(tag)}
          >
            <Tag color={tag.color} className="tag-label">
              {tag.name.length > 15 ? `${tag.name.slice(0, 15)}…` : tag.name}
            </Tag>
            {selectedTagIds.includes(tag.id) && (
              <span className="tag-selected-check">✔</span>
            )}
          </div>
        ))}
        {tags.length === 0 && (
          <div className="tag-empty">暂无标签</div>
        )}
      </div>

      <Modal
        title={editingTag ? '编辑标签' : '新建标签'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="name"
            label="标签名称"
            rules={[{ required: true, message: '请输入标签名称' }]}
          >
            <Input placeholder="请输入标签名称" />
          </Form.Item>
          <Form.Item name="color" label="标签颜色">
            <ColorPicker presets={[{ label: '推荐', colors: presetColors }]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
