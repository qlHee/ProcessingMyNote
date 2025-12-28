/**
 * Home Page - File Manager style note list/grid view
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Input, Segmented, Empty, Spin, Card, Tag, Dropdown, Modal, message,
  Breadcrumb, Select, Space, Tooltip, Badge
} from 'antd'
import {
  AppstoreOutlined,
  BarsOutlined,
  SearchOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  FolderOutlined,
  HomeOutlined,
  SortAscendingOutlined,
  FilterOutlined,
  FileImageOutlined,
} from '@ant-design/icons'
import { useNotesStore, useFoldersStore, useTagsStore } from '../../stores'
import { notesAPI } from '../../api'
import './index.css'

export default function Home() {
  const [viewMode, setViewMode] = useState('grid')
  const [searchValue, setSearchValue] = useState('')
  const [sortBy, setSortBy] = useState('updated_at')
  const navigate = useNavigate()

  const { notes, loading, fetchNotes, deleteNote, setSearchKeyword } = useNotesStore()
  const { folders, selectedFolderId, setSelectedFolder } = useFoldersStore()
  const { tags, selectedTagIds, clearTagSelection } = useTagsStore()

  // Get current folder info
  const currentFolder = folders.find(f => f.id === selectedFolderId)
  
  // Build breadcrumb path
  const getBreadcrumbPath = () => {
    if (!selectedFolderId) return []
    const path = []
    let current = currentFolder
    while (current) {
      path.unshift(current)
      current = folders.find(f => f.id === current.parent_id)
    }
    return path
  }

  useEffect(() => {
    const params = {}
    if (selectedFolderId) params.folder_id = selectedFolderId
    if (selectedTagIds.length) params.tag_ids = selectedTagIds.join(',')
    if (searchValue) params.keyword = searchValue
    fetchNotes(params)
  }, [selectedFolderId, selectedTagIds, fetchNotes])

  const handleSearch = (value) => {
    setSearchValue(value)
    setSearchKeyword(value)
    const params = { keyword: value }
    if (selectedFolderId) params.folder_id = selectedFolderId
    if (selectedTagIds.length) params.tag_ids = selectedTagIds.join(',')
    fetchNotes(params)
  }

  const handleNoteClick = (note) => {
    navigate(`/note/${note.id}`)
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

  const getMenuItems = (note) => [
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: '编辑',
      onClick: (e) => {
        e.domEvent.stopPropagation()
        navigate(`/note/${note.id}`)
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

  const renderNoteCard = (note) => (
    <Card
      key={note.id}
      className="note-card"
      hoverable
      onClick={() => handleNoteClick(note)}
      cover={
        <div className="note-cover">
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
        title={
          <div className="note-title">
            <span>{note.title}</span>
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
            <div className="note-date">
              {new Date(note.created_at).toLocaleDateString()}
            </div>
          </div>
        }
      />
    </Card>
  )

  const renderNoteList = (note) => (
    <div
      key={note.id}
      className="note-list-item"
      onClick={() => handleNoteClick(note)}
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

  const breadcrumbPath = getBreadcrumbPath()

  return (
    <div className="home-page">
      {/* Breadcrumb Navigation */}
      <div className="breadcrumb-bar">
        <Breadcrumb
          items={[
            {
              title: (
                <span 
                  className="breadcrumb-item clickable"
                  onClick={() => {
                    setSelectedFolder(null)
                    clearTagSelection()
                  }}
                >
                  <HomeOutlined /> 全部笔记
                </span>
              ),
            },
            ...breadcrumbPath.map(folder => ({
              title: (
                <span 
                  className="breadcrumb-item clickable"
                  onClick={() => setSelectedFolder(folder.id)}
                >
                  <FolderOutlined /> {folder.name}
                </span>
              ),
            })),
          ]}
        />
        {selectedTagIds.length > 0 && (
          <div className="active-filters">
            <FilterOutlined />
            {selectedTagIds.map(tagId => {
              const tag = tags.find(t => t.id === tagId)
              return tag ? (
                <Tag 
                  key={tagId} 
                  color={tag.color}
                  closable
                  onClose={() => clearTagSelection()}
                >
                  {tag.name}
                </Tag>
              ) : null
            })}
          </div>
        )}
      </div>

      {/* Toolbar */}
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
        </Space>
        <Space>
          <Badge count={notes.length} showZero color="#1677ff">
            <span className="note-count">
              <FileImageOutlined /> 笔记
            </span>
          </Badge>
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
  )
}
