/**
 * FolderTree - Hierarchical folder navigation
 */
import { useEffect, useState } from 'react'
import { Tree, Input, Button, Modal, Form, message, Dropdown } from 'antd'
import {
  FolderOutlined,
  FolderOpenOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
} from '@ant-design/icons'
import { useFoldersStore, useNotesStore } from '../../stores'
import DroppableFolder from '../DroppableFolder'
import './index.css'

export default function FolderTree({ collapsed }) {
  const {
    folderTree,
    selectedFolderId,
    fetchFolders,
    createFolder,
    updateFolder,
    deleteFolder,
    setSelectedFolder,
  } = useFoldersStore()
  const { fetchNotes, updateNote } = useNotesStore()

  const [modalVisible, setModalVisible] = useState(false)
  const [editingFolder, setEditingFolder] = useState(null)
  const [form] = Form.useForm()

  const handleNoteDrop = async (noteId, folderId) => {
    try {
      const result = await updateNote(noteId, { folder_id: folderId })
      if (result.success) {
        message.success('笔记已移动到文件夹')
        fetchNotes()
      } else {
        message.error(result.error || '移动失败')
      }
    } catch (error) {
      message.error('移动失败')
    }
  }

  useEffect(() => {
    fetchFolders()
  }, [fetchFolders])

  const handleSelect = (selectedKeys) => {
    const folderId = selectedKeys[0] ? parseInt(selectedKeys[0]) : null
    setSelectedFolder(folderId)
    fetchNotes({ folder_id: folderId })
  }

  const handleCreate = (parentId = null) => {
    setEditingFolder(null)
    form.resetFields()
    form.setFieldsValue({ parent_id: parentId })
    setModalVisible(true)
  }

  const handleEdit = (folder) => {
    setEditingFolder(folder)
    form.setFieldsValue({ name: folder.name, parent_id: folder.parent_id })
    setModalVisible(true)
  }

  const handleDelete = async (folder) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除文件夹 "${folder.name}" 吗？其中的笔记也会被删除。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        const result = await deleteFolder(folder.id)
        if (result.success) {
          message.success('删除成功')
          fetchFolders()
        } else {
          message.error(result.error || '删除失败')
        }
      },
    })
  }

  const handleSubmit = async (values) => {
    let result
    if (editingFolder) {
      result = await updateFolder(editingFolder.id, values)
    } else {
      result = await createFolder(values)
    }

    if (result.success) {
      message.success(editingFolder ? '更新成功' : '创建成功')
      setModalVisible(false)
      fetchFolders()
    } else {
      message.error(result.error || '操作失败')
    }
  }

  const buildTreeData = (folders) => {
    return folders.map((folder) => ({
      key: String(folder.id),
      title: (
        <DroppableFolder folder={folder} onDrop={handleNoteDrop}>
          <div className="folder-item">
            <span className="folder-name">{folder.name}</span>
            {!collapsed && (
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'add',
                      icon: <PlusOutlined />,
                      label: '新建子文件夹',
                      onClick: (e) => {
                        e.domEvent.stopPropagation()
                        handleCreate(folder.id)
                      },
                    },
                    {
                      key: 'edit',
                      icon: <EditOutlined />,
                      label: '重命名',
                      onClick: (e) => {
                        e.domEvent.stopPropagation()
                        handleEdit(folder)
                      },
                    },
                    {
                      key: 'delete',
                      icon: <DeleteOutlined />,
                      label: '删除',
                      danger: true,
                      onClick: (e) => {
                        e.domEvent.stopPropagation()
                        handleDelete(folder)
                      },
                    },
                  ],
                }}
                trigger={['click']}
              >
                <Button
                  type="text"
                  size="small"
                  icon={<MoreOutlined />}
                  className="folder-actions"
                  onClick={(e) => e.stopPropagation()}
                />
              </Dropdown>
            )}
          </div>
        </DroppableFolder>
      ),
      icon: ({ expanded }) =>
        expanded ? <FolderOpenOutlined /> : <FolderOutlined />,
      children: folder.children?.length ? buildTreeData(folder.children) : undefined,
    }))
  }

  if (collapsed) {
    return (
      <div className="folder-tree-collapsed">
        <Button
          type="text"
          icon={<FolderOutlined />}
          onClick={() => setSelectedFolder(null)}
        />
      </div>
    )
  }

  return (
    <div className="folder-tree">
      <div className="folder-tree-header">
        <Button
          type="text"
          size="small"
          icon={<PlusOutlined />}
          onClick={() => handleCreate()}
        >
          新建
        </Button>
      </div>

      <div
        className={`folder-all ${selectedFolderId === null ? 'selected' : ''}`}
        onClick={() => handleSelect([])}
      >
        <FolderOutlined /> 全部笔记
      </div>

      <Tree
        showIcon
        selectedKeys={selectedFolderId ? [String(selectedFolderId)] : []}
        onSelect={handleSelect}
        treeData={buildTreeData(folderTree)}
        className="folder-tree-list"
      />

      <Modal
        title={editingFolder ? '编辑文件夹' : '新建文件夹'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="name"
            label="文件夹名称"
            rules={[{ required: true, message: '请输入文件夹名称' }]}
          >
            <Input placeholder="请输入文件夹名称" />
          </Form.Item>
          <Form.Item name="parent_id" hidden>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
