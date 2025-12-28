/**
 * Main Layout - App shell with sidebar and content area
 */
import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Layout, Menu, Button, Avatar, Dropdown, Space } from 'antd'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HomeOutlined,
  FolderOutlined,
  TagsOutlined,
  UserOutlined,
  LogoutOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '../../stores'
import FolderTree from '../FolderTree'
import TagManager from '../TagManager'
import UploadModal from '../UploadModal'
import './MainLayout.css'

const { Header, Sider, Content } = Layout

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [uploadVisible, setUploadVisible] = useState(false)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

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
        collapsedWidth={80}
        className="main-sider"
      >
        <div className="logo">
          {collapsed ? '📝' : '📝 Processing My Note'}
        </div>
        
        <div className="sider-content">
          <div className="sider-section">
            <div className="section-title">
              {!collapsed && <><FolderOutlined /> 文件夹</>}
            </div>
            <FolderTree collapsed={collapsed} />
          </div>
          
          <div className="sider-section">
            <div className="section-title">
              {!collapsed && <><TagsOutlined /> 标签</>}
            </div>
            <TagManager collapsed={collapsed} />
          </div>
        </div>
      </Sider>

      <Layout>
        <Header className="main-header">
          <Space>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="collapse-btn"
            />
            <Button
              type="primary"
              icon={<UploadOutlined />}
              onClick={() => setUploadVisible(true)}
            >
              上传笔记
            </Button>
          </Space>

          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space className="user-info">
              <Avatar icon={<UserOutlined />} />
              <span className="username">{user?.username || 'User'}</span>
            </Space>
          </Dropdown>
        </Header>

        <Content className="main-content">
          <Outlet />
        </Content>
      </Layout>

      <UploadModal
        open={uploadVisible}
        onClose={() => setUploadVisible(false)}
      />
    </Layout>
  )
}
