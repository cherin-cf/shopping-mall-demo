import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../../contexts/AuthContext'
import './Admin.css'
import './AdminOrders.css'
import './AdminUsers.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// 어드민 네비게이션 메뉴
const ADMIN_MENU = [
  { path: '/admin', label: '대시보드' },
  { path: '/admin/products', label: '상품관리' },
  { path: '/admin/orders', label: '주문관리' },
  { path: '/admin/users', label: '회원관리', active: true },
]

function AdminUsers() {
  const { user, isAdmin, loading: authLoading, token } = useAuth()
  const navigate = useNavigate()
  
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [updatingUserId, setUpdatingUserId] = useState(null)
  const [deletingUserId, setDeletingUserId] = useState(null)

  // 어드민이 아니면 홈으로 리다이렉트
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/', { replace: true })
    }
  }, [isAdmin, authLoading, navigate])

  // 회원 목록 조회
  useEffect(() => {
    const fetchUsers = async () => {
      if (!isAdmin) return

      try {
        setLoading(true)
        const response = await axios.get(`${API_URL}/users`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (response.data.success) {
          setUsers(response.data.data)
        }
      } catch (err) {
        console.error('회원 조회 에러:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [isAdmin, token])

  // 검색 필터링
  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase()
    return (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    )
  })

  // 관리자 권한 변경
  const handleRoleChange = async (userId, currentRole) => {
    if (!window.confirm(`이 사용자의 권한을 ${currentRole === 'admin' ? '일반 사용자' : '관리자'}로 변경하시겠습니까?`)) {
      return
    }

    try {
      setUpdatingUserId(userId)
      const newRole = currentRole === 'admin' ? 'customer' : 'admin'
      const response = await axios.patch(
        `${API_URL}/users/${userId}/role`,
        { user_type: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (response.data.success) {
        alert(response.data.message)
        // 회원 목록 새로고침
        const refreshResponse = await axios.get(`${API_URL}/users`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (refreshResponse.data.success) {
          setUsers(refreshResponse.data.data)
        }
      }
    } catch (err) {
      console.error('권한 변경 에러:', err)
      alert(err.response?.data?.message || '권한 변경에 실패했습니다')
    } finally {
      setUpdatingUserId(null)
    }
  }

  // 회원 삭제
  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`정말 ${userName}님을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
      return
    }

    try {
      setDeletingUserId(userId)
      const response = await axios.delete(
        `${API_URL}/users/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (response.data.success) {
        alert('회원이 삭제되었습니다')
        // 회원 목록 새로고침
        const refreshResponse = await axios.get(`${API_URL}/users`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (refreshResponse.data.success) {
          setUsers(refreshResponse.data.data)
        }
      }
    } catch (err) {
      console.error('회원 삭제 에러:', err)
      alert(err.response?.data?.message || '회원 삭제에 실패했습니다')
    } finally {
      setDeletingUserId(null)
    }
  }

  // 날짜 포맷팅
  const formatDate = (date) => {
    if (!date) return ''
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  if (authLoading || loading) {
    return (
      <div className="admin-loading">
        <p>로딩 중...</p>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="admin">
      {/* Admin Header */}
      <header className="admin-header">
        <div className="admin-header-left">
          <Link to="/admin" className="admin-logo">KHAKI GRADO</Link>
          <nav className="admin-nav">
            {ADMIN_MENU.map(({ path, label, active }) => (
              <Link 
                key={path} 
                to={path} 
                className={`admin-nav-link ${active ? 'active' : ''}`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="admin-header-right">
          <Link to="/" className="btn-view-site">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            사이트 보기
          </Link>
          <div className="admin-profile">
            {user?.name?.charAt(0).toUpperCase() || 'A'}
          </div>
        </div>
      </header>

      {/* Admin Content */}
      <main className="admin-content">
        {/* Page Header */}
        <div className="admin-page-header">
          <div>
            <h1>회원 관리</h1>
            <p className="page-description">회원 정보를 확인하고 관리자 권한을 관리하세요</p>
          </div>
        </div>

        {/* Search */}
        <div className="admin-filters">
          <div className="search-form">
            <div className="search-input-wrapper">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="이름, 이메일로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="admin-table-container">
          <table className="admin-users-table">
            <thead>
              <tr>
                <th>이름</th>
                <th>이메일</th>
                <th>권한</th>
                <th>가입일</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-table-message">
                    {searchQuery ? '검색 결과가 없습니다.' : '회원이 없습니다.'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u._id}>
                    <td className="user-name-cell">{u.name}</td>
                    <td className="user-email-cell">{u.email}</td>
                    <td>
                      <span className={`role-badge ${u.user_type === 'admin' ? 'admin' : 'customer'}`}>
                        {u.user_type === 'admin' ? '관리자' : '일반 사용자'}
                      </span>
                    </td>
                    <td className="date-cell">{formatDate(u.createdAt)}</td>
                    <td>
                      <div className="action-buttons">
                        {u._id !== user?._id && (
                          <button
                            className="btn-change-role"
                            onClick={() => handleRoleChange(u._id, u.user_type)}
                            disabled={updatingUserId === u._id}
                          >
                            {updatingUserId === u._id 
                              ? '처리 중...' 
                              : u.user_type === 'admin' 
                                ? '일반 사용자로 변경' 
                                : '관리자로 변경'}
                          </button>
                        )}
                        {u._id !== user?._id && (
                          <button
                            className="btn-delete-user"
                            onClick={() => handleDeleteUser(u._id, u.name)}
                            disabled={deletingUserId === u._id}
                          >
                            {deletingUserId === u._id ? '삭제 중...' : '삭제'}
                          </button>
                        )}
                        {u._id === user?._id && (
                          <span className="current-user-label">본인</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="admin-summary">
          <div className="summary-info">
            총 {filteredUsers.length}명의 회원
            {searchQuery && ` (검색 결과: ${filteredUsers.length}명)`}
          </div>
        </div>
      </main>
    </div>
  )
}

export default AdminUsers

