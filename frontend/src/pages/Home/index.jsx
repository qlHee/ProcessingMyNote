/**
 * Home Page - File Manager style note list/grid view
 */
import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import {
  Input, Segmented, Empty, Spin, Card, Tag, Dropdown, Modal, message,
  Select, Space, Badge, Radio, Button, Avatar
} from 'antd'
import {
  AppstoreOutlined,
  BarsOutlined,
  SearchOutlined,
  MoreOutlined,
  DeleteOutlined,
  SortAscendingOutlined,
  FolderOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  UploadOutlined,
  CheckSquareOutlined,
  CheckOutlined,
  DownloadOutlined,
} from '@ant-design/icons'
import { useNotesStore, useFoldersStore, useTagsStore, useAuthStore } from '../../stores'
import UploadModal from '../../components/UploadModal'
import { notesAPI, exportAPI } from '../../api'
import './index.css'

export default function Home() {
  const [viewMode, setViewMode] = useState('grid')
  const [searchValue, setSearchValue] = useState('')
  const [sortBy, setSortBy] = useState('updated_at')
  const navigate = useNavigate()
  const { collapsed, setCollapsed } = useOutletContext()

  const { notes, loading, fetchNotes, deleteNote, updateNote, setSearchKeyword } = useNotesStore()
  const { folders, selectedFolderId, setSelectedFolder } = useFoldersStore()
  const { tags, selectedTagIds, clearTagSelection } = useTagsStore()
  const { user, logout } = useAuthStore()

  const [moveModalVisible, setMoveModalVisible] = useState(false)
  const [copyModalVisible, setCopyModalVisible] = useState(false)
  const [selectedNote, setSelectedNote] = useState(null)
  const [uploadVisible, setUploadVisible] = useState(false)
  const [multiSelectMode, setMultiSelectMode] = useState(false)
  const [selectedNotes, setSelectedNotes] = useState([])
  const [includeSubfolders, setIncludeSubfolders] = useState(false)

  // Build breadcrumb path
  const getBreadcrumbPath = () => {
    if (!selectedFolderId) return []
    const path = []
    let current = folders.find(f => f.id === selectedFolderId)
    while (current) {
      path.unshift(current)
      current = folders.find(f => f.id === current.parent_id)
    }
    return path
  }

  // Get all subfolder IDs recursively
  const getAllSubfolderIds = (folderId) => {
    const subfolderIds = [folderId]
    const getChildren = (parentId) => {
      const children = folders.filter(f => f.parent_id === parentId)
      children.forEach(child => {
        subfolderIds.push(child.id)
        getChildren(child.id)
      })
    }
    getChildren(folderId)
    return subfolderIds
  }

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        logout()
        navigate('/login')
      },
    },
  ]

  // Reset includeSubfolders when folder changes
  useEffect(() => {
    setIncludeSubfolders(false)
  }, [selectedFolderId])

  useEffect(() => {
    const params = {}
    if (selectedFolderId !== null && selectedFolderId !== undefined) {
      if (selectedFolderId === 0) {
        params.folder_id = 0
      } else if (selectedFolderId > 0) {
        if (includeSubfolders) {
          const folderIds = getAllSubfolderIds(selectedFolderId)
          params.folder_ids = folderIds.join(',')
        } else {
          params.folder_id = selectedFolderId
        }
      }
    }
    if (selectedTagIds.length) params.tag_ids = selectedTagIds.join(',')
    if (searchValue) params.keyword = searchValue
    fetchNotes(params)
  }, [selectedFolderId, selectedTagIds, includeSubfolders, fetchNotes, searchValue])

  const handleSearch = (value) => {
    setSearchValue(value)
    setSearchKeyword(value)
    const params = { keyword: value }
    if (selectedFolderId !== null && selectedFolderId !== undefined) {
      if (selectedFolderId === 0) {
        params.folder_id = 0
      } else if (selectedFolderId > 0) {
        if (includeSubfolders) {
          const folderIds = getAllSubfolderIds(selectedFolderId)
          params.folder_ids = folderIds.join(',')
        } else {
          params.folder_id = selectedFolderId
        }
      }
    }
    if (selectedTagIds.length) params.tag_ids = selectedTagIds.join(',')
    fetchNotes(params)
  }

  const handleNoteClick = (note) => {
    navigate(`/note/${note.id}`)
  }

  const handleDragStart = (e, noteId) => {
    e.dataTransfer.setData('noteId', String(noteId))
  }

  const handleDelete = (note, e) => {
    e.stopPropagation()
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除笔记 "${note.title}" 吗？`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        const result = await deleteNote(note.id)
        if (result.success) {
          message.success('删除成功')
        } else {
          message.error(result.error || '删除失败')
        }
      },
    })
  }

  const handleMoveNote = async (folderId) => {
    if (!selectedNote) return
    const result = await updateNote(selectedNote.id, { folder_id: folderId })
    if (result.success) {
      message.success('移动成功')
      setMoveModalVisible(false)
      fetchNotes({ folder_id: selectedFolderId })
    } else {
      message.error(result.error || '移动失败')
    }
  }

  const handleCopyNote = async (folderId) => {
    if (!selectedNote) return
    // 复制功能需要后端支持，这里先用移动代替
    message.info('复制功能开发中')
    setCopyModalVisible(false)
  }

  const handleEnterMultiSelect = () => {
    setMultiSelectMode(true)
    setSelectedNotes([])
  }

  const handleExitMultiSelect = () => {
    setMultiSelectMode(false)
    setSelectedNotes([])
  }

  const handleToggleNoteSelection = (noteId) => {
    setSelectedNotes(prev => 
      prev.includes(noteId) 
        ? prev.filter(id => id !== noteId)
        : [...prev, noteId]
    )
  }

  const handleBatchMove = async (folderId) => {
    if (selectedNotes.length === 0) return
    let successCount = 0
    for (const noteId of selectedNotes) {
      const result = await updateNote(noteId, { folder_id: folderId })
      if (result.success) successCount++
    }
    message.success(`成功移动 ${successCount} 个笔记`)
    setMoveModalVisible(false)
    handleExitMultiSelect()
    fetchNotes({ folder_id: selectedFolderId })
  }

  const handleBatchCopy = async (folderId) => {
    message.info('批量复制功能开发中')
    setCopyModalVisible(false)
  }

  const handleBatchDelete = () => {
    if (selectedNotes.length === 0) return
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除选中的 ${selectedNotes.length} 个笔记吗？`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        let successCount = 0
        for (const noteId of selectedNotes) {
          const result = await deleteNote(noteId)
          if (result.success) successCount++
        }
        message.success(`成功删除 ${successCount} 个笔记`)
        handleExitMultiSelect()
      },
    })
  }

  const getMenuItems = (note) => [
    {
      key: 'multiselect',
      icon: <CheckSquareOutlined />,
      label: '多选',
      onClick: (e) => {
        e.domEvent.stopPropagation()
        handleEnterMultiSelect()
      },
    },
    {
      key: 'move',
      icon: <FolderOutlined />,
      label: '移动到',
      onClick: (e) => {
        e.domEvent.stopPropagation()
        setSelectedNote(note)
        setMoveModalVisible(true)
      },
    },
    {
      key: 'copy',
      icon: <FolderOutlined />,
      label: '复制到',
      onClick: (e) => {
        e.domEvent.stopPropagation()
        setSelectedNote(note)
        setCopyModalVisible(true)
      },
    },
    {
      key: 'export',
      icon: <DownloadOutlined />,
      label: '导出',
      onClick: async (e) => {
        e.domEvent.stopPropagation()
        try {
          await exportAPI.exportNote(note.id)
          message.success('导出成功')
        } catch (error) {
          message.error('导出失败')
        }
      },
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: '删除',
      danger: true,
      onClick: (e) => handleDelete(note, e.domEvent),
    },
  ]

  const renderNoteCard = (note) => {
    const isSelected = selectedNotes.includes(note.id)
    
    return (
      <Card
        key={note.id}
        className={`note-card ${multiSelectMode ? 'multi-select-mode' : ''} ${isSelected ? 'selected' : ''}`}
        hoverable
        onClick={() => multiSelectMode ? handleToggleNoteSelection(note.id) : handleNoteClick(note)}
        draggable={!multiSelectMode}
        onDragStart={(e) => !multiSelectMode && handleDragStart(e, note.id)}
        cover={
          <div className="note-cover">
            {multiSelectMode && (
              <div className="note-checkbox">
                {isSelected ? <CheckOutlined /> : null}
              </div>
            )}
            <img
              src={notesAPI.getImageUrl(note.id, 'processed')}
              alt={note.title}
              onError={(e) => {
                e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23f0f0f0" width="100" height="100"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23999">No Image</text></svg>'
              }}
            />
          </div>
        }
      >
      <Card.Meta
        title={note.title}
        description={
          <div className="note-meta">
            <div className="note-tags">
              {note.tags?.slice(0, 3).map((tag) => (
                <Tag key={tag.id} color={tag.color} className="note-tag">
                  {tag.name}
                </Tag>
              ))}
              {note.tags?.length > 3 && (
                <Tag className="note-tag">+{note.tags.length - 3}</Tag>
              )}
            </div>
            <Dropdown
              menu={{ items: getMenuItems(note) }}
              trigger={['click']}
              placement="bottomRight"
            >
              <MoreOutlined
                className="note-actions"
                onClick={(e) => e.stopPropagation()}
              />
            </Dropdown>
          </div>
        }
      />
    </Card>
    )
  }

  const renderNoteList = (note) => (
    <div
      key={note.id}
      className="note-list-item"
      onClick={() => handleNoteClick(note)}
      draggable
      onDragStart={(e) => handleDragStart(e, note.id)}
    >
      <div className="note-list-thumb">
        <img
          src={notesAPI.getImageUrl(note.id, 'processed')}
          alt={note.title}
          onError={(e) => {
            e.target.style.display = 'none'
          }}
        />
      </div>
      <div className="note-list-content">
        <div className="note-list-title">{note.title}</div>
        <div className="note-list-tags">
          {note.tags?.map((tag) => (
            <Tag key={tag.id} color={tag.color} className="note-tag">
              {tag.name}
            </Tag>
          ))}
        </div>
      </div>
      <div className="note-list-date">
        {new Date(note.created_at).toLocaleDateString()}
      </div>
      <Dropdown
        menu={{ items: getMenuItems(note) }}
        trigger={['click']}
        placement="bottomRight"
      >
        <MoreOutlined
          className="note-list-actions"
          onClick={(e) => e.stopPropagation()}
        />
      </Dropdown>
    </div>
  )

  // Sort notes
  const sortedNotes = [...notes].sort((a, b) => {
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title)
    }
    return new Date(b[sortBy]) - new Date(a[sortBy])
  })

  return (
    <div className="home-page">
      {/* Top Toolbar */}
      <div className="top-toolbar">
        <Space size={12}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className="collapse-btn"
          />
          <div className="breadcrumb-inline">
            <span
              className="breadcrumb-item clickable"
              onClick={() => {
                setSelectedFolder(null)
                clearTagSelection()
                fetchNotes({})
              }}
            >
              <span className="breadcrumb-icon">🏠</span>
              <span>全部笔记</span>
            </span>
            {getBreadcrumbPath().map(folder => (
              <span
                key={folder.id}
                className="breadcrumb-item clickable"
                onClick={() => setSelectedFolder(folder.id)}
              >
                <span className="breadcrumb-sep">/</span>
                <span className="breadcrumb-icon">📂</span> {folder.name}
              </span>
            ))}
            {selectedTagIds.length > 0 && (
              <>
                <span className="breadcrumb-sep">/</span>
                <span className="breadcrumb-item">筛选</span>
                {selectedTagIds.map(tagId => {
                  const tag = tags.find(t => t.id === tagId)
                  return tag ? (
                    <span
                      key={tagId}
                      className="tag-chip"
                      style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                      onClick={() => clearTagSelection()}
                    >
                      {tag.name} ×
                    </span>
                  ) : null
                })}
              </>
            )}
          </div>
        </Space>
        <Space>
          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={() => setUploadVisible(true)}
          >
            上传笔记
          </Button>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space className="user-info">
              <Avatar icon={<UserOutlined />} />
              <span className="username">{user?.username || 'User'}</span>
            </Space>
          </Dropdown>
        </Space>
      </div>

      {/* Content Area */}
      <div className="home-content">
        {/* Multi-select Toolbar */}
        {multiSelectMode && (
          <div className="multi-select-toolbar">
            <Space>
              <span>已选择 {selectedNotes.length} 个笔记</span>
              <Button onClick={handleExitMultiSelect}>取消</Button>
            </Space>
            <Space>
              <Button 
                icon={<FolderOutlined />}
                onClick={() => setMoveModalVisible(true)}
                disabled={selectedNotes.length === 0}
              >
                移动到
              </Button>
              <Button 
                icon={<FolderOutlined />}
                onClick={() => setCopyModalVisible(true)}
                disabled={selectedNotes.length === 0}
              >
                复制到
              </Button>
              <Button 
                danger
                icon={<DeleteOutlined />}
                onClick={handleBatchDelete}
                disabled={selectedNotes.length === 0}
              >
                删除
              </Button>
            </Space>
          </div>
        )}

        {/* Toolbar */}
        {!multiSelectMode && (
          <div className="home-header">
            <Space>
              <Input
                placeholder="搜索笔记..."
                prefix={<SearchOutlined />}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onPressEnter={(e) => handleSearch(e.target.value)}
                allowClear
                className="search-input"
              />
              <Select
                value={sortBy}
                onChange={setSortBy}
                style={{ width: 120 }}
                options={[
                  { value: 'updated_at', label: '最近修改' },
                  { value: 'created_at', label: '创建时间' },
                  { value: 'title', label: '标题' },
                ]}
                prefix={<SortAscendingOutlined />}
              />
              {selectedFolderId > 0 && (
                <Select
                  value={includeSubfolders ? 'include' : 'exclude'}
                  onChange={(value) => setIncludeSubfolders(value === 'include')}
                  style={{ width: 180 }}
                  options={[
                    { value: 'exclude', label: '不显示子文件夹笔记' },
                    { value: 'include', label: '显示子文件夹笔记' },
                  ]}
                />
              )}
            </Space>
            <Space>
              <Segmented
                value={viewMode}
                onChange={setViewMode}
                options={[
                  { value: 'grid', icon: <AppstoreOutlined /> },
                  { value: 'list', icon: <BarsOutlined /> },
                ]}
              />
            </Space>
          </div>
        )}

        {loading ? (
          <div className="loading-container">
            <Spin size="large" />
          </div>
        ) : notes.length === 0 ? (
          <Empty
            description="暂无笔记"
            className="empty-container"
          />
        ) : viewMode === 'grid' ? (
          <div className="notes-grid">
            {sortedNotes.map(renderNoteCard)}
          </div>
        ) : (
          <div className="notes-list">
            {sortedNotes.map(renderNoteList)}
          </div>
        )}
      </div>

      {/* Move Modal */}
      <Modal
        title={multiSelectMode ? `移动 ${selectedNotes.length} 个笔记到文件夹` : "移动到文件夹"}
        open={moveModalVisible}
        onCancel={() => setMoveModalVisible(false)}
        onOk={() => {
          const selectedFolderId = document.querySelector('input[name="folder"]:checked')?.value
          if (multiSelectMode) {
            handleBatchMove(selectedFolderId ? parseInt(selectedFolderId) : null)
          } else {
            handleMoveNote(selectedFolderId ? parseInt(selectedFolderId) : null)
          }
        }}
        okText="移动"
        cancelText="取消"
      >
        <Radio.Group name="folder" style={{ width: '100%' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Radio value={null}>未分类</Radio>
            {folders.map(folder => (
              <Radio key={folder.id} value={folder.id}>
                <FolderOutlined /> {folder.name}
              </Radio>
            ))}
          </Space>
        </Radio.Group>
      </Modal>

      {/* Copy Modal */}
      <Modal
        title={multiSelectMode ? `复制 ${selectedNotes.length} 个笔记到文件夹` : "复制到文件夹"}
        open={copyModalVisible}
        onCancel={() => setCopyModalVisible(false)}
        onOk={() => {
          const selectedFolderId = document.querySelector('input[name="copy-folder"]:checked')?.value
          if (multiSelectMode) {
            handleBatchCopy(selectedFolderId ? parseInt(selectedFolderId) : null)
          } else {
            handleCopyNote(selectedFolderId ? parseInt(selectedFolderId) : null)
          }
        }}
        okText="复制"
        cancelText="取消"
      >
        <Radio.Group name="copy-folder" style={{ width: '100%' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Radio value={null}>未分类</Radio>
            {folders.map(folder => (
              <Radio key={folder.id} value={folder.id}>
                <FolderOutlined /> {folder.name}
              </Radio>
            ))}
          </Space>
        </Radio.Group>
      </Modal>

      {/* Upload Modal */}
      <UploadModal
        open={uploadVisible}
        onClose={() => setUploadVisible(false)}
      />
    </div>
  )
}
