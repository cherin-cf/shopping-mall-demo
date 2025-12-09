import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../../contexts/AuthContext'
import './Admin.css'
import './AdminProducts.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// 어드민 네비게이션 메뉴
const ADMIN_MENU = [
  { path: '/admin', label: '대시보드' },
  { path: '/admin/products', label: '상품관리' },
  { path: '/admin/orders', label: '주문관리' },
  { path: '/admin/users', label: '회원관리' },
]

const ITEMS_PER_PAGE = 2 // 페이지당 상품 수

function AdminProducts() {
  const { user, isAdmin, loading } = useAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [error, setError] = useState('')
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // 상품 목록 가져오기
  const fetchProducts = async (page = currentPage) => {
    try {
      setLoadingProducts(true)
      setError('')

      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/login')
        return
      }

      const response = await axios.get(`${API_URL}/products/admin/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          search: searchTerm || undefined,
          page,
          limit: ITEMS_PER_PAGE,
        },
      })

      if (response.data.success) {
        setProducts(response.data.data)
        setTotalCount(response.data.totalCount)
        setTotalPages(response.data.totalPages)
        setCurrentPage(response.data.currentPage)
      } else {
        setError('상품 목록을 불러오는데 실패했습니다')
      }
    } catch (err) {
      console.error('상품 목록 조회 에러:', err)
      if (err.response?.status === 401) {
        setError('로그인이 만료되었습니다')
        navigate('/login')
      } else if (err.response?.status === 403) {
        setError('접근 권한이 없습니다')
      } else {
        setError('상품 목록을 불러오는데 실패했습니다')
      }
    } finally {
      setLoadingProducts(false)
    }
  }

  // 페이지 변경 핸들러
  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
    fetchProducts(page)
  }

  // 상품 삭제
  const handleDelete = async (productId, productName) => {
    if (!window.confirm(`"${productName}" 상품을 삭제하시겠습니까?`)) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await axios.delete(`${API_URL}/products/${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.data.success) {
        alert('상품이 삭제되었습니다')
        // 현재 페이지에 상품이 1개뿐이었으면 이전 페이지로
        if (products.length === 1 && currentPage > 1) {
          handlePageChange(currentPage - 1)
        } else {
          fetchProducts(currentPage)
        }
      }
    } catch (err) {
      console.error('상품 삭제 에러:', err)
      alert(err.response?.data?.message || '상품 삭제에 실패했습니다')
    }
  }

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/', { replace: true })
    }
  }, [isAdmin, loading, navigate])

  // 관리자 인증 완료 후 상품 목록 조회
  useEffect(() => {
    if (!loading && isAdmin) {
      fetchProducts()
    }
  }, [loading, isAdmin])

  // 검색어 변경 시 디바운스 처리 (페이지 1로 리셋)
  useEffect(() => {
    if (!loading && isAdmin) {
      const timer = setTimeout(() => {
        setCurrentPage(1)
        fetchProducts(1)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [searchTerm])

  if (loading) {
    return <div className="admin-loading"><p>로딩 중...</p></div>
  }

  if (!isAdmin) {
    return null
  }

  const formatPrice = (price) => {
    return `₩${price.toLocaleString()}`
  }

  const getStatusClass = (status) => {
    switch (status) {
      case '판매중': return 'selling'
      case '품절임박': return 'low-stock'
      case '품절': return 'out-of-stock'
      case '판매중지': return 'stopped'
      default: return ''
    }
  }

  return (
    <div className="admin">
      {/* Admin Header */}
      <header className="admin-header">
        <div className="admin-header-left">
          <Link to="/admin" className="admin-logo">KHAKI GRADO</Link>
          <nav className="admin-nav">
            {ADMIN_MENU.map(({ path, label }) => (
              <Link 
                key={path} 
                to={path} 
                className={`admin-nav-link ${path === '/admin/products' ? 'active' : ''}`}
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

      {/* Page Content */}
      <main className="admin-content">
        {/* Page Header */}
        <div className="page-header">
          <div className="page-header-left">
            <h1>상품 관리</h1>
            <p>등록된 상품을 관리하고 새로운 상품을 추가하세요</p>
          </div>
          <Link to="/admin/products/create" className="btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            신규 상품 등록
          </Link>
        </div>

        {/* Products Card */}
        <div className="products-card">
          {/* Search & Filter */}
          <div className="products-toolbar">
            <div className="search-box">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="상품명, SKU로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="filter-buttons">
              <button className="btn-filter" onClick={fetchProducts}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 4v6h-6"/>
                  <path d="M1 20v-6h6"/>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                </svg>
                새로고침
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="products-error">
              <p>{error}</p>
              <button onClick={fetchProducts}>다시 시도</button>
            </div>
          )}

          {/* Loading State */}
          {loadingProducts ? (
            <div className="products-loading">
              <div className="loading-spinner"></div>
              <p>상품 목록을 불러오는 중...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="products-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                <line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
              <p>등록된 상품이 없습니다</p>
              <Link to="/admin/products/create" className="btn-primary">
                첫 상품 등록하기
              </Link>
            </div>
          ) : (
            <>
              {/* Products Table */}
              <table className="products-table">
                <thead>
                  <tr>
                    <th>상품</th>
                    <th>SKU</th>
                    <th>카테고리</th>
                    <th>가격</th>
                    <th>재고</th>
                    <th>상태</th>
                    <th>액션</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product._id}>
                      <td>
                        <div className="product-cell">
                          <img 
                            src={product.image || 'https://via.placeholder.com/100x100?text=No+Image'} 
                            alt={product.name} 
                            className="product-thumb" 
                          />
                          <span className="product-name">{product.name}</span>
                        </div>
                      </td>
                      <td className="sku-cell">{product.sku}</td>
                      <td>{product.category}</td>
                      <td>{formatPrice(product.price)}</td>
                      <td className={product.stock <= 10 ? 'stock-low' : ''}>{product.stock}개</td>
                      <td>
                        <span className={`status-badge ${getStatusClass(product.status)}`}>
                          {product.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="action-btn" title="보기">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                          </button>
                          <Link 
                            to={`/admin/products/edit/${product._id}`} 
                            className="action-btn" 
                            title="수정"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </Link>
                          <button 
                            className="action-btn delete" 
                            title="삭제"
                            onClick={() => handleDelete(product._id, product.name)}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="table-footer">
                <span className="total-count">
                  총 {totalCount}개의 상품 중 {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, totalCount)}개 표시
                </span>
                <div className="pagination">
                  <button 
                    className="page-btn" 
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    이전
                  </button>
                  
                  {/* 페이지 번호들 */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      className={`page-btn ${currentPage === page ? 'active' : ''}`}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button 
                    className="page-btn" 
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    다음
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default AdminProducts

