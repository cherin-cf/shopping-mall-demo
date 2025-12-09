import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import './ProductDetail.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// ===== 아이콘 컴포넌트 =====
const Icons = {
  Heart: ({ size = 20, filled = false }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
  Gift: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 12 20 22 4 22 4 12"/>
      <rect x="2" y="7" width="20" height="5"/>
      <line x1="12" y1="22" x2="12" y2="7"/>
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
    </svg>
  ),
  Truck: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="1" y="3" width="15" height="13"/>
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
      <circle cx="5.5" cy="18.5" r="2.5"/>
      <circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  ),
  RefreshCw: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="23 4 23 10 17 10"/>
      <polyline points="1 20 1 14 7 14"/>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>
  ),
  Package: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  Star: ({ size = 16, filled = false }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "#FF9500" : "none"} stroke="#FF9500" strokeWidth="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  ChevronLeft: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
}

// ===== 컬러 옵션 매핑 =====
const COLOR_MAP = {
  '블루': '#2563eb',
  '파랑': '#2563eb',
  '블랙': '#1a1a1a',
  '검정': '#1a1a1a',
  '화이트': '#ffffff',
  '흰색': '#ffffff',
  '레드': '#dc2626',
  '빨강': '#dc2626',
  '그린': '#16a34a',
  '초록': '#16a34a',
  '네이비': '#1e3a5f',
  '그레이': '#6b7280',
  '회색': '#6b7280',
  '베이지': '#d4b896',
  '카키': '#6b8e23',
  '오렌지': '#f97316',
  '옐로우': '#eab308',
  '노랑': '#eab308',
  '퍼플': '#9333ea',
  '보라': '#9333ea',
  '핑크': '#ec4899',
  '분홍': '#ec4899',
  '브라운': '#8b4513',
  '갈색': '#8b4513',
}

// ===== 메인 컴포넌트 =====
function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, token } = useAuth()
  
  const [product, setProduct] = useState(null)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // 상품 옵션 상태
  const [selectedColor, setSelectedColor] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState('detail')
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [addingToCart, setAddingToCart] = useState(false)

  // 상품 데이터 가져오기
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        const response = await axios.get(`${API_URL}/products/${id}`)
        
        if (response.data.success) {
          const productData = response.data.data
          setProduct(productData)
          
          // 기본 선택값 설정
          if (productData.colors && productData.colors.length > 0) {
            setSelectedColor(productData.colors[0])
          }
          if (productData.sizes && productData.sizes.length > 0) {
            setSelectedSize(productData.sizes[0])
          }
          
          // 관련 상품 가져오기
          fetchRelatedProducts(productData.category)
        }
      } catch (err) {
        console.error('상품 조회 에러:', err)
        setError('상품을 불러오는데 실패했습니다')
      } finally {
        setLoading(false)
      }
    }

    const fetchRelatedProducts = async (category) => {
      try {
        const response = await axios.get(`${API_URL}/products`)
        if (response.data.success) {
          const filtered = response.data.data
            .filter(p => p.category === category && p._id !== id)
            .slice(0, 4)
          setRelatedProducts(filtered)
        }
      } catch (err) {
        console.error('관련 상품 조회 에러:', err)
      }
    }

    if (id) {
      fetchProduct()
    }
  }, [id])

  // 가격 포맷팅
  const formatPrice = (price) => {
    return price?.toLocaleString() + '원'
  }

  // 수량 변경
  const handleQuantityChange = (delta) => {
    const newQuantity = quantity + delta
    if (newQuantity >= 1 && newQuantity <= (product?.stock || 99)) {
      setQuantity(newQuantity)
    }
  }

  // 총 가격 계산
  const totalPrice = product ? product.price * quantity : 0

  // 컬러 코드 가져오기
  const getColorCode = (colorName) => {
    return COLOR_MAP[colorName] || '#cccccc'
  }

  // 장바구니에 추가
  const handleAddToCart = async () => {
    // 로그인 체크
    if (!isAuthenticated) {
      if (window.confirm('로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?')) {
        navigate('/login')
      }
      return
    }

    // 옵션 선택 체크
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      alert('컬러를 선택해주세요')
      return
    }
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      alert('사이즈를 선택해주세요')
      return
    }

    try {
      setAddingToCart(true)
      const response = await axios.post(
        `${API_URL}/cart`,
        {
          productId: product._id,
          quantity,
          selectedColor,
          selectedSize,
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (response.data.success) {
        if (window.confirm('장바구니에 상품이 추가되었습니다.\n장바구니로 이동하시겠습니까?')) {
          navigate('/cart')
        }
      }
    } catch (err) {
      console.error('장바구니 추가 에러:', err)
      alert(err.response?.data?.message || '장바구니 추가에 실패했습니다')
    } finally {
      setAddingToCart(false)
    }
  }

  // 바로구매
  const handleBuyNow = () => {
    // 로그인 체크
    if (!isAuthenticated) {
      if (window.confirm('로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?')) {
        navigate('/login')
      }
      return
    }

    // 옵션 선택 체크
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      alert('컬러를 선택해주세요')
      return
    }
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      alert('사이즈를 선택해주세요')
      return
    }

    // 바로구매 상품 정보와 함께 주문 페이지로 이동
    const totalProductAmount = product.price * quantity
    const shippingFee = totalProductAmount >= 30000 ? 0 : 3000
    const totalAmount = totalProductAmount + shippingFee

    navigate('/checkout', {
      state: {
        buyNow: true,
        buyNowItem: {
          product: {
            _id: product._id,
            name: product.name,
            image: product.image,
          },
          price: product.price,
          quantity,
          selectedColor,
          selectedSize,
        },
        totalProductAmount,
        shippingFee,
        totalAmount,
      }
    })
  }

  // 로딩 상태
  if (loading) {
    return (
      <div className="product-detail-page">
        <Navbar />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>상품을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // 에러 상태
  if (error || !product) {
    return (
      <div className="product-detail-page">
        <Navbar />
        <div className="error-container">
          <p>{error || '상품을 찾을 수 없습니다'}</p>
          <Link to="/" className="btn-back-home">홈으로 돌아가기</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="product-detail-page">
      <Navbar />
      
      {/* 뒤로가기 & 브레드크럼 */}
      <div className="breadcrumb-container">
        <Link to="/" className="back-link">
          <Icons.ChevronLeft size={18} />
          <span>홈으로</span>
        </Link>
        <div className="breadcrumb">
          <Link to="/">홈</Link>
          <span>/</span>
          <span>{product.category}</span>
          <span>/</span>
          <span>{product.name}</span>
        </div>
      </div>

      {/* 상품 상세 정보 영역 */}
      <div className="product-detail-container">
        {/* 왼쪽: 이미지 갤러리 */}
        <div className="product-gallery">
          <div className="main-image-container">
            {product.status === '품절' && (
              <div className="soldout-overlay">SOLD OUT</div>
            )}
            {product.status !== '품절' && (
              <span className="product-badge new">NEW</span>
            )}
            <img 
              src={product.image || 'https://via.placeholder.com/600x750?text=No+Image'} 
              alt={product.name}
              className="main-image"
            />
          </div>
          <div className="thumbnail-list">
            <button 
              className={`thumbnail ${selectedImageIndex === 0 ? 'active' : ''}`}
              onClick={() => setSelectedImageIndex(0)}
            >
              <img 
                src={product.image || 'https://via.placeholder.com/100x125?text=No+Image'} 
                alt={`${product.name} 썸네일`}
              />
            </button>
            {/* 추가 이미지가 있다면 여기에 표시 */}
          </div>
        </div>

        {/* 오른쪽: 상품 정보 */}
        <div className="product-info-section">
          <h1 className="product-name">{product.name}</h1>
          
          {/* 별점 & 리뷰 */}
          <div className="rating-section">
            <div className="stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <Icons.Star key={star} size={16} filled={star <= 5} />
              ))}
            </div>
            <span className="review-count">(128 리뷰)</span>
          </div>

          {/* 가격 */}
          <div className="price-section">
            {product.originalPrice > product.price && (
              <span className="original-price">{formatPrice(product.originalPrice)}</span>
            )}
            <span className="current-price">{formatPrice(product.price)}</span>
          </div>

          {/* 컬러 선택 */}
          {product.colors && product.colors.length > 0 && (
            <div className="option-section">
              <label className="option-label">컬러: {selectedColor}</label>
              <div className="color-options">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    className={`color-btn ${selectedColor === color ? 'active' : ''}`}
                    style={{ 
                      backgroundColor: getColorCode(color),
                      border: getColorCode(color) === '#ffffff' ? '1px solid #ddd' : 'none'
                    }}
                    onClick={() => setSelectedColor(color)}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 사이즈 선택 */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="option-section">
              <label className="option-label">사이즈</label>
              <div className="size-options">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    className={`size-btn ${selectedSize === size ? 'active' : ''}`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 수량 선택 */}
          <div className="option-section">
            <label className="option-label">수량</label>
            <div className="quantity-selector">
              <button 
                className="qty-btn"
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
              >
                −
              </button>
              <span className="qty-value">{quantity}</span>
              <button 
                className="qty-btn"
                onClick={() => handleQuantityChange(1)}
                disabled={quantity >= product.stock}
              >
                +
              </button>
            </div>
          </div>

          {/* 총 상품금액 */}
          <div className="total-price-section">
            <span className="total-label">총 상품금액</span>
            <span className="total-amount">{formatPrice(totalPrice)}</span>
          </div>

          {/* 액션 버튼들 */}
          <div className="action-buttons">
            <button 
              className={`btn-wishlist ${isWishlisted ? 'active' : ''}`}
              onClick={() => setIsWishlisted(!isWishlisted)}
            >
              <Icons.Heart size={18} filled={isWishlisted} />
              <span>찜하기</span>
            </button>
            <button className="btn-gift">
              <Icons.Gift size={18} />
              <span>선물하기</span>
            </button>
          </div>

          <div className="purchase-buttons">
            <button 
              className="btn-cart"
              disabled={product.status === '품절' || addingToCart}
              onClick={handleAddToCart}
            >
              {addingToCart ? '추가 중...' : '장바구니'}
            </button>
            <button 
              className="btn-buy"
              disabled={product.status === '품절'}
              onClick={handleBuyNow}
            >
              바로구매
            </button>
          </div>

          {/* 배송 정보 */}
          <div className="delivery-info">
            <div className="info-item">
              <Icons.Truck size={18} />
              <div className="info-content">
                <strong>배송</strong>
                <p>무료배송 (3만원 이상 구매 시)<br/>2-3일 내에 도착</p>
              </div>
            </div>
            <div className="info-item">
              <Icons.RefreshCw size={18} />
              <div className="info-content">
                <strong>교환/반품</strong>
                <p>구매 후 7일 이내 무료 교환/반품</p>
              </div>
            </div>
            <div className="info-item">
              <Icons.Package size={18} />
              <div className="info-content">
                <strong>포장</strong>
                <p>친환경 패키지로 안전하게 배송됩니다</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 탭 섹션 */}
      <div className="tabs-section">
        <div className="tabs-header">
          <button 
            className={`tab-btn ${activeTab === 'detail' ? 'active' : ''}`}
            onClick={() => setActiveTab('detail')}
          >
            상세정보
          </button>
          <button 
            className={`tab-btn ${activeTab === 'review' ? 'active' : ''}`}
            onClick={() => setActiveTab('review')}
          >
            리뷰 <span className="tab-count">(128)</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'qna' ? 'active' : ''}`}
            onClick={() => setActiveTab('qna')}
          >
            Q&A
          </button>
          <button 
            className={`tab-btn ${activeTab === 'guide' ? 'active' : ''}`}
            onClick={() => setActiveTab('guide')}
          >
            구매안내
          </button>
        </div>

        <div className="tabs-content">
          {activeTab === 'detail' && (
            <div className="tab-panel">
              <div className="product-description">
                <h3>제품 설명</h3>
                <p>{product.description || '도시형 애슬레틱 라이프스타일을 위한 필수 아이템입니다. 빠른 흡수가 빠른 고기능성 원단으로 제작되었으며, 인체공학으로도 운동복으로도 완벽한 핏을 자랑합니다.'}</p>
              </div>
              <div className="product-specs">
                <h3>제품 상세</h3>
                <table className="specs-table">
                  <tbody>
                    <tr>
                      <th>소재</th>
                      <td>폴리에스터 100%</td>
                    </tr>
                    <tr>
                      <th>생산지</th>
                      <td>한국</td>
                    </tr>
                    <tr>
                      <th>세탁방법</th>
                      <td>미지근한 물로 단독 세탁</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {activeTab === 'review' && (
            <div className="tab-panel">
              <div className="empty-state">
                <p>아직 작성된 리뷰가 없습니다.</p>
              </div>
            </div>
          )}
          
          {activeTab === 'qna' && (
            <div className="tab-panel">
              <div className="empty-state">
                <p>등록된 Q&A가 없습니다.</p>
              </div>
            </div>
          )}
          
          {activeTab === 'guide' && (
            <div className="tab-panel">
              <div className="guide-content">
                <h4>배송 안내</h4>
                <p>• 배송비: 3만원 이상 무료배송 (3만원 미만 3,000원)</p>
                <p>• 배송기간: 결제 완료 후 2-3일 이내 (주말/공휴일 제외)</p>
                
                <h4>교환/반품 안내</h4>
                <p>• 교환/반품 기간: 상품 수령 후 7일 이내</p>
                <p>• 교환/반품 배송비: 무료 (단순 변심의 경우 왕복 배송비 고객 부담)</p>
                
                <h4>환불 안내</h4>
                <p>• 카드 결제: 카드사 승인 취소 (3-5일 소요)</p>
                <p>• 무통장 입금: 환불 계좌로 입금 (3-5일 소요)</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 추천 상품 */}
      {relatedProducts.length > 0 && (
        <div className="related-section">
          <h2 className="related-title">추천 상품</h2>
          <div className="related-products">
            {relatedProducts.map((item) => (
              <Link to={`/product/${item._id}`} key={item._id} className="related-card">
                <div className="related-image">
                  {item.status === '품절임박' && (
                    <span className="product-badge best">BEST</span>
                  )}
                  {item.status !== '품절임박' && item.status !== '품절' && (
                    <span className="product-badge new">NEW</span>
                  )}
                  <img 
                    src={item.image || 'https://via.placeholder.com/300x375?text=No+Image'} 
                    alt={item.name}
                  />
                </div>
                <div className="related-info">
                  <h4>{item.name}</h4>
                  <p className="related-price">{formatPrice(item.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="footer">
        <div className="footer-bottom">
          <p>© 2025 KHAKI GRADO. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default ProductDetail

