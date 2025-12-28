/**
 * Home Page - Note list/grid view
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input, Segmented, Empty, Spin, Card, Tag, Dropdown, Modal, message } from 'antd'
import {
  AppstoreOutlined,
  BarsOutlined,
  SearchOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  FolderOutlined,
} from '@ant-design/icons'
import { useNotesStore, useFoldersStore, useTagsStore } from '../../stores'
import { notesAPI } from '../../api'
import './index.css'

export default function Home() {
  const [viewMode, setViewMode] = useState('grid')
  const [searchValue, setSearchValue] = useState('')
  const navigate = useNavigate()

  const { notes, loading, fetchNotes, deleteNote, setSearchKeyword } = useNotesStore()
  const { selectedFolderId } = useFoldersStore()
  const { selectedTagIds } = useTagsStore()

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

  return (
    <div className="home-page">
      <div className="home-header">
        <Input
          placeholder="搜索笔记..."
          prefix={<SearchOutlined />}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onPressEnter={(e) => handleSearch(e.target.value)}
          allowClear
          className="search-input"
        />
        <Segmented
          value={viewMode}
          onChange={setViewMode}
          options={[
            { value: 'grid', icon: <AppstoreOutlined /> },
            { value: 'list', icon: <BarsOutlined /> },
          ]}
        />
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
          {notes.map(renderNoteCard)}
        </div>
      ) : (
        <div className="notes-list">
          {notes.map(renderNoteList)}
        </div>
      )}
    </div>
  )
}
