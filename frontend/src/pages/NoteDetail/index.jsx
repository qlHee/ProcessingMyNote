/**
 * NoteDetail Page - View and edit note
 * Placeholder for Phase 5-7
 */
import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Spin, Typography } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useNotesStore } from '../../stores'
import { notesAPI } from '../../api'
import './index.css'

const { Title } = Typography

export default function NoteDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentNote, loading, fetchNote, clearCurrentNote } = useNotesStore()

  useEffect(() => {
    fetchNote(id)
    return () => clearCurrentNote()
  }, [id, fetchNote, clearCurrentNote])

  if (loading || !currentNote) {
    return (
      <div className="note-detail-loading">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="note-detail">
      <div className="note-detail-header">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/')}
        >
          返回
        </Button>
        <Title level={4} className="note-detail-title">
          {currentNote.title}
        </Title>
      </div>

      <div className="note-detail-content">
        <div className="note-image-container">
          <img
            src={notesAPI.getImageUrl(currentNote.id, 'processed')}
            alt={currentNote.title}
            className="note-image"
          />
        </div>
      </div>
    </div>
  )
}
