import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import './Admin.css'

// 통계 데이터 (실제로는 API에서 가져와야 함)
const STATS = [
  {
    id: 1,
    title: '총 매출',
    value: '₩12,456,000',
    change: '+12.5%',
    changeType: 'positive',
    changeLabel: '전월 대비',
    icon: '$',
  },
  {
    id: 2,
    title: '신규 주문',
    value: '156',
    change: '+8.2%',
    changeType: 'positive',
    changeLabel: '전월 대비',
    icon: '🛒',
  },
  {
    id: 3,
    title: '총 상품',
    value: '432',
    change: '+5',
    changeType: 'positive',
    changeLabel: '전월 대비',
    icon: '📦',
  },
  {
    id: 4,
    title: '총 회원',
    value: '8,234',
    change: '+145',
    changeType: 'positive',
    changeLabel: '전월 대비',
    icon: '👥',
  },
]

// 최근 주문 데이터
const RECENT_ORDERS = [
  {
    id: 'ORD-001234',
    customer: '김철수',
    product: '블루 애슬레틱 티셔츠',
    amount: '₩45,000',
    status: '배송중',
    statusType: 'shipping',
    date: '2024-01-15',
  },
  {
    id: 'ORD-001233',
    customer: '이영희',
    product: '그레이 후디',
    amount: '₩78,000',
    status: '결제완료',
    statusType: 'paid',
    date: '2024-01-15',
  },
  {
    id: 'ORD-001232',
    customer: '박민수',
    product: '블랙 트레이닝 팬츠',
    amount: '₩56,000',
    status: '배송완료',
    statusType: 'delivered',
    date: '2024-01-14',
  },
  {
    id: 'ORD-001231',
    customer: '정수진',
    product: '카키 베이스볼 캡',
    amount: '₩32,000',
    status: '배송중',
    statusType: 'shipping',
    date: '2024-01-14',
  },
  {
    id: 'ORD-001230',
    customer: '최동욱',
    product: '블루 티셔츠 x2',
    amount: '₩90,000',
    status: '결제완료',
    statusType: 'paid',
    date: '2024-01-13',
  },
]

// 인기 상품 데이터
const POPULAR_PRODUCTS = [
  {
    rank: 1,
    name: '블루 애슬레틱 티셔츠',
    sales: '234개 판매',
    revenue: '₩10,530,000',
  },
  {
    rank: 2,
    name: '그레이 후디',
    sales: '189개 판매',
    revenue: '₩14,742,000',
  },
  {
    rank: 3,
    name: '블랙 트레이닝 팬츠',
    sales: '156개 판매',
    revenue: '₩8,736,000',
  },
  {
    rank: 4,
    name: '카키 베이스볼 캡',
    sales: '143개 판매',
    revenue: '₩4,576,000',
  },
]

// 어드민 네비게이션 메뉴
const ADMIN_MENU = [
  { path: '/admin', label: '대시보드', active: true },
  { path: '/admin/products', label: '상품관리' },
  { path: '/admin/orders', label: '주문관리' },
  { path: '/admin/users', label: '회원관리' },
]

function Admin() {
  const { user, isAdmin, loading } = useAuth()
  const navigate = useNavigate()

  // 어드민이 아니면 홈으로 리다이렉트
  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/', { replace: true })
    }
  }, [isAdmin, loading, navigate])

  if (loading) {
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
        {/* Stats Cards */}
        <section className="stats-section">
          {STATS.map((stat) => (
            <div key={stat.id} className="stat-card">
              <div className="stat-header">
                <span className="stat-title">{stat.title}</span>
                <span className="stat-icon">{stat.icon}</span>
              </div>
              <div className="stat-value">{stat.value}</div>
              <div className={`stat-change ${stat.changeType}`}>
                <span className="change-arrow">↗</span>
                {stat.change} {stat.changeLabel}
              </div>
            </div>
          ))}
        </section>

        {/* Main Content Area */}
        <section className="main-section">
          {/* Recent Orders */}
          <div className="orders-card">
            <div className="card-header">
              <h2>최근 주문</h2>
              <Link to="/admin/orders" className="view-all-link">전체보기</Link>
            </div>
            <table className="orders-table">
              <thead>
                <tr>
                  <th>주문번호</th>
                  <th>고객명</th>
                  <th>상품</th>
                  <th>금액</th>
                  <th>상태</th>
                  <th>날짜</th>
                </tr>
              </thead>
              <tbody>
                {RECENT_ORDERS.map((order) => (
                  <tr key={order.id}>
                    <td className="order-id">{order.id}</td>
                    <td>{order.customer}</td>
                    <td>{order.product}</td>
                    <td>{order.amount}</td>
                    <td>
                      <span className={`status-badge ${order.statusType}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="order-date">{order.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Popular Products */}
          <div className="popular-card">
            <div className="card-header">
              <h2>인기 상품</h2>
            </div>
            <div className="popular-list">
              {POPULAR_PRODUCTS.map((product) => (
                <div key={product.rank} className="popular-item">
                  <div className={`rank-badge rank-${product.rank}`}>
                    {product.rank}
                  </div>
                  <div className="product-details">
                    <div className="product-name">{product.name}</div>
                    <div className="product-sales">{product.sales}</div>
                  </div>
                  <div className="product-revenue">{product.revenue}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default Admin

