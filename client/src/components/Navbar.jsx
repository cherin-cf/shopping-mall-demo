import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import './Navbar.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// ===== 아이콘 컴포넌트 =====
const Icons = {
  Search: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8"/>
      <path d="m21 21-4.35-4.35"/>
    </svg>
  ),
  User: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Settings: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  Cart: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  ),
}

// ===== 네비게이션 메뉴 데이터 =====
const NAV_MENU = [
  { path: '/shop', label: 'SHOP' },
  { path: '/archive', label: 'ARCHIVE' },
  { path: '/lookbook', label: 'LOOKBOOK' },
  { path: '/athlete', label: 'ATHLETE' },
  { path: '/house', label: 'KHAKI HOUSE' },
  { path: '/board', label: 'BOARD' },
]

function Navbar() {
  const { user, token, isAuthenticated, isAdmin, logout, loading } = useAuth()
  const navigate = useNavigate()
  const [showBanner, setShowBanner] = useState(true)
  const [cartCount, setCartCount] = useState(0)

  // 장바구니 개수 조회
  useEffect(() => {
    const fetchCartCount = async () => {
      if (!isAuthenticated || !token) {
        setCartCount(0)
        return
      }

      try {
        const response = await axios.get(`${API_URL}/cart`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (response.data.success) {
          // 총 수량 계산 (각 아이템의 quantity 합계)
          const totalQuantity = response.data.data.items.reduce(
            (sum, item) => sum + item.quantity, 0
          )
          setCartCount(totalQuantity)
        }
      } catch (err) {
        console.error('장바구니 조회 에러:', err)
        setCartCount(0)
      }
    }

    fetchCartCount()
  }, [isAuthenticated, token])

  // 로그아웃 처리
  const handleLogout = () => {
    logout()
    setCartCount(0)
    navigate('/')
  }

  return (
    <>
      {/* Top Banner */}
      {showBanner && (
        <div className="top-banner">
          <p>JOIN US! 회원가입시 다양한 혜택이 있어요!</p>
          <button className="banner-close" onClick={() => setShowBanner(false)}>×</button>
        </div>
      )}

      {/* Navigation Bar */}
      <header className="navbar">
        <div className="navbar-container">
          <Link to="/" className="navbar-logo">KHAKI GRADO</Link>

          <nav className="navbar-menu">
            {NAV_MENU.map(({ path, label }) => (
              <Link key={path} to={path} className="nav-link">{label}</Link>
            ))}
          </nav>

          <div className="navbar-actions">
            <button className="btn-icon" title="검색">
              <Icons.Search />
            </button>
            
            {loading ? (
              <span className="loading-text">로딩중...</span>
            ) : isAuthenticated ? (
              <>
                <span className="welcome-message">{user?.name}님 환영합니다!</span>
                {!isAdmin && (
                  <Link to="/orders" className="nav-action">
                    내 주문 목록
                  </Link>
                )}
                {isAdmin && (
                  <Link to="/admin" className="nav-action admin-link">
                    <Icons.Settings />
                    Admin
                  </Link>
                )}
                <button className="nav-action" onClick={handleLogout}>로그아웃</button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-action">
                  <Icons.User />
                  로그인
                </Link>
                <Link to="/register" className="nav-action">회원가입</Link>
              </>
            )}
            
            <Link to="/cart" className="nav-action cart-link">
              <Icons.Cart />
              ( {cartCount} )
            </Link>
          </div>
        </div>
      </header>
    </>
  )
}

export default Navbar

