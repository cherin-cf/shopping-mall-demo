import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import './Home.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// ===== 아이콘 컴포넌트 =====
const Icons = {
  Search: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8"/>
      <path d="m21 21-4.35-4.35"/>
    </svg>
  ),
  Instagram: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  ),
  YouTube: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/>
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>
    </svg>
  ),
}

// ===== 데이터 정의 =====
const FOOTER_LINKS = {
  customerService: {
    title: 'CUSTOMER SERVICE',
    links: [
      { path: '/notice', label: '공지사항' },
      { path: '/faq', label: '자주 묻는 질문' },
      { path: '/contact', label: '1:1 문의' },
      { path: '/reviews', label: '상품 후기' },
    ],
  },
  about: {
    title: 'ABOUT',
    links: [
      { path: '/about', label: '브랜드 소개' },
      { path: '/stores', label: '매장 안내' },
      { path: '/collaboration', label: '콜라보레이션' },
    ],
  },
}

// ===== 서브 컴포넌트 =====
const ProductCard = ({ product }) => {
  // 가격 포맷팅
  const formatPrice = (price) => {
    return `₩${price.toLocaleString()}`
  }

  // 상태에 따른 뱃지 결정
  const getBadge = () => {
    if (product.status === '품절') return 'soldout'
    if (product.status === '품절임박') return 'best'
    // 최근 7일 이내 등록된 상품은 NEW
    const createdDate = new Date(product.createdAt)
    const now = new Date()
    const diffDays = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24))
    if (diffDays <= 7) return 'new'
    return null
  }

  const badge = getBadge()

  return (
    <Link to={`/product/${product._id}`} className="product-card">
      <div className="product-image">
        {badge && (
          <span className={`product-badge ${badge}`}>
            {badge === 'soldout' ? 'SOLD OUT' : badge.toUpperCase()}
          </span>
        )}
        <img 
          src={product.image || 'https://via.placeholder.com/600x750?text=No+Image'} 
          alt={product.name}
          loading="lazy"
        />
      </div>
      <div className="product-info">
        <h4>{product.name}</h4>
        <p className="product-price">{formatPrice(product.price)}</p>
      </div>
    </Link>
  )
}

// ===== 메인 컴포넌트 =====
function Home() {
  const { isAuthenticated } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // 상품 데이터 가져오기
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const response = await axios.get(`${API_URL}/products`)
        
        if (response.data.success) {
          setProducts(response.data.data)
        }
      } catch (err) {
        console.error('상품 조회 에러:', err)
        setError('상품을 불러오는데 실패했습니다')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  return (
    <div className="home">
      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="hero-overlay"></div>
          <div className="hero-content">
            <h1 className="hero-title">ATHLETIC DEPT.</h1>
            <p className="hero-subtitle">URBAN ATHLETE</p>
            <Link to="/shop" className="btn-shop">SHOP MORE</Link>
          </div>
        </div>
        
        <div className="side-social">
          <a href="#" className="social-icon" title="검색">
            <Icons.Search />
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-icon" title="Instagram">
            <Icons.Instagram />
          </a>
          <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="social-icon" title="YouTube">
            <Icons.YouTube />
          </a>
        </div>
      </section>

      {/* New Arrivals Section */}
      <section className="arrivals-section">
        <div className="section-header">
          <h2 className="section-title">NEW ARRIVALS</h2>
          <Link to="/shop" className="view-all">View All &gt;</Link>
        </div>
        
        {loading ? (
          <div className="products-loading">
            <div className="loading-spinner"></div>
            <p>상품을 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className="products-error">
            <p>{error}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="products-empty">
            <p>등록된 상품이 없습니다</p>
          </div>
        ) : (
          <div className="products-grid">
            {products.slice(0, 8).map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Brand Story Section */}
      <section className="brand-section">
        <h2 className="brand-title">URBAN ATHLETE</h2>
        <p className="brand-description">
          카키그라도는 도시에서 활동하는 모든 이들을 위한 애슬레틱 브랜드입니다.<br />
          기능성과 스타일을 동시에 추구하며, 일상에서도 스포츠에서도 완벽한 퍼포먼스를 제공합니다.
        </p>
        <Link to="/about" className="btn-outline">브랜드 스토리 보기</Link>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          {/* Customer Service */}
          <div className="footer-section">
            <h4>{FOOTER_LINKS.customerService.title}</h4>
            {FOOTER_LINKS.customerService.links.map(({ path, label }) => (
              <Link key={path} to={path}>{label}</Link>
            ))}
          </div>
          
          {/* About */}
          <div className="footer-section">
            <h4>{FOOTER_LINKS.about.title}</h4>
            {FOOTER_LINKS.about.links.map(({ path, label }) => (
              <Link key={path} to={path}>{label}</Link>
            ))}
          </div>
          
          {/* My Account */}
          <div className="footer-section">
            <h4>MY ACCOUNT</h4>
            {isAuthenticated ? (
              <>
                <Link to="/mypage">마이페이지</Link>
                <Link to="/orders">주문조회</Link>
                <Link to="/wishlist">위시리스트</Link>
              </>
            ) : (
              <>
                <Link to="/login">로그인</Link>
                <Link to="/register">회원가입</Link>
                <Link to="/orders">주문조회</Link>
                <Link to="/wishlist">위시리스트</Link>
              </>
            )}
          </div>
          
          {/* Follow Us */}
          <div className="footer-section">
            <h4>FOLLOW US</h4>
            <div className="footer-social">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" title="Instagram">
                <Icons.Instagram size={24} />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" title="YouTube">
                <Icons.YouTube size={24} />
              </a>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>© 2025 KHAKI GRADO. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default Home
