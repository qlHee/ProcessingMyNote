/**
 * Main Layout - App shell with sidebar and content area
 */
import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Layout, Button, Avatar, Dropdown, Space } from 'antd'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import { useAuthStore, useFoldersStore, useNotesStore, useTagsStore } from '../../stores'
import FolderTree from '../FolderTree'
import TagManager from '../TagManager'
import UploadModal from '../UploadModal'
import './MainLayout.css'

const { Header, Sider, Content } = Layout

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [uploadVisible, setUploadVisible] = useState(false)
  const { user, logout } = useAuthStore()
  const { folders, selectedFolderId, setSelectedFolder } = useFoldersStore()
  const { tags, selectedTagIds, clearTagSelection } = useTagsStore()
  const { fetchNotes } = useNotesStore()
  const navigate = useNavigate()

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

  return (
    <Layout className="main-layout">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={280}
        collapsedWidth={0}
        className="main-sider"
      >
        <div className="logo">
          {collapsed ? '📝' : '📝 Processing My Note'}
        </div>
        
        <div className="sider-content">
          <div className="sider-section">
            <FolderTree collapsed={collapsed} />
          </div>
          
          <div className="sider-section">
            <TagManager collapsed={collapsed} />
          </div>
        </div>
      </Sider>

      <Layout>
        <Outlet context={{ collapsed, setCollapsed }} />
      </Layout>

      <UploadModal
        open={uploadVisible}
        onClose={() => setUploadVisible(false)}
      />
    </Layout>
  )
}
