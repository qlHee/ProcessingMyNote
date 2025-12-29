/**
 * DraggableNote - 可拖拽的笔记组件
 */
import { useDrag } from 'react-dnd'
import { Card, Tag, Dropdown } from 'antd'
import { MoreOutlined } from '@ant-design/icons'
import { notesAPI } from '../../api'
import './index.css'

export default function DraggableNote({ note, onClick, getMenuItems }) {
  const [{ isDragging }, drag] = useDrag({
    type: 'note',
    item: { id: note.id, type: 'note' },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const renderNoteCard = () => (
    <Card
      ref={drag}
      className={`note-card ${isDragging ? 'dragging' : ''}`}
      cover={
        <img
          src={notesAPI.getImageUrl(note.id, 'processed')}
          alt={note.title}
          onError={(e) => {
            e.target.style.display = 'none'
          }}
        />
      }
      onClick={() => onClick(note)}
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
  )

  const renderNoteList = () => (
    <div
      ref={drag}
      className={`note-list-item ${isDragging ? 'dragging' : ''}`}
      onClick={() => onClick(note)}
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

  return { renderNoteCard, renderNoteList }
}
