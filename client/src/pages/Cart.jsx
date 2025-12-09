import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import './Cart.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// ===== 아이콘 컴포넌트 =====
const Icons = {
  Trash: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
      <line x1="10" y1="11" x2="10" y2="17"/>
      <line x1="14" y1="11" x2="14" y2="17"/>
    </svg>
  ),
  ShoppingBag: ({ size = 48 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  ),
  ChevronLeft: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
}

function Cart() {
  const { isAuthenticated, token } = useAuth()
  const navigate = useNavigate()
  
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedItems, setSelectedItems] = useState([])
  const [updating, setUpdating] = useState(false)

  // 장바구니 데이터 가져오기
  const fetchCart = async () => {
    if (!isAuthenticated) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (response.data.success) {
        setCart(response.data.data)
        // 모든 아이템 선택 상태로 초기화
        setSelectedItems(response.data.data.items.map(item => item._id))
      }
    } catch (err) {
      console.error('장바구니 조회 에러:', err)
      setError('장바구니를 불러오는데 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCart()
  }, [isAuthenticated, token])

  // 가격 포맷팅
  const formatPrice = (price) => {
    return price?.toLocaleString() + '원'
  }

  // 전체 선택/해제
  const handleSelectAll = () => {
    if (selectedItems.length === cart?.items.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(cart?.items.map(item => item._id) || [])
    }
  }

  // 개별 선택/해제
  const handleSelectItem = (itemId) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter(id => id !== itemId))
    } else {
      setSelectedItems([...selectedItems, itemId])
    }
  }

  // 수량 변경
  const handleQuantityChange = async (itemId, newQuantity) => {
    if (updating) return
    
    try {
      setUpdating(true)
      const response = await axios.put(
        `${API_URL}/cart/items/${itemId}`,
        { quantity: newQuantity },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      if (response.data.success) {
        setCart(response.data.data)
      }
    } catch (err) {
      console.error('수량 변경 에러:', err)
      alert(err.response?.data?.message || '수량 변경에 실패했습니다')
    } finally {
      setUpdating(false)
    }
  }

  // 아이템 삭제
  const handleRemoveItem = async (itemId) => {
    if (updating) return
    
    try {
      setUpdating(true)
      const response = await axios.delete(
        `${API_URL}/cart/items/${itemId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      if (response.data.success) {
        setCart(response.data.data)
        setSelectedItems(selectedItems.filter(id => id !== itemId))
      }
    } catch (err) {
      console.error('삭제 에러:', err)
      alert('삭제에 실패했습니다')
    } finally {
      setUpdating(false)
    }
  }

  // 선택 아이템 삭제
  const handleRemoveSelected = async () => {
    if (updating || selectedItems.length === 0) return
    
    if (!window.confirm(`선택한 ${selectedItems.length}개의 상품을 삭제하시겠습니까?`)) {
      return
    }
    
    try {
      setUpdating(true)
      const response = await axios.post(
        `${API_URL}/cart/remove-selected`,
        { itemIds: selectedItems },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      if (response.data.success) {
        setCart(response.data.data)
        setSelectedItems([])
      }
    } catch (err) {
      console.error('삭제 에러:', err)
      alert('삭제에 실패했습니다')
    } finally {
      setUpdating(false)
    }
  }

  // 선택된 상품 금액 계산
  const getSelectedTotal = () => {
    if (!cart) return 0
    return cart.items
      .filter(item => selectedItems.includes(item._id))
      .reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }

  // 선택된 상품 총 수량 계산
  const getSelectedQuantity = () => {
    if (!cart) return 0
    return cart.items
      .filter(item => selectedItems.includes(item._id))
      .reduce((sum, item) => sum + item.quantity, 0)
  }

  // 비로그인 상태
  if (!isAuthenticated) {
    return (
      <div className="cart-page">
        <Navbar />
        <div className="cart-container">
          <div className="cart-empty">
            <Icons.ShoppingBag />
            <h2>로그인이 필요합니다</h2>
            <p>장바구니를 이용하시려면 로그인해주세요</p>
            <Link to="/login" className="btn-login">로그인하기</Link>
          </div>
        </div>
      </div>
    )
  }

  // 로딩 상태
  if (loading) {
    return (
      <div className="cart-page">
        <Navbar />
        <div className="cart-container">
          <div className="cart-loading">
            <div className="loading-spinner"></div>
            <p>장바구니를 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  // 에러 상태
  if (error) {
    return (
      <div className="cart-page">
        <Navbar />
        <div className="cart-container">
          <div className="cart-error">
            <p>{error}</p>
            <button onClick={fetchCart} className="btn-retry">다시 시도</button>
          </div>
        </div>
      </div>
    )
  }

  // 빈 장바구니
  if (!cart || cart.items.length === 0) {
    return (
      <div className="cart-page">
        <Navbar />
        <div className="cart-container">
          <div className="cart-empty">
            <Icons.ShoppingBag />
            <h2>장바구니가 비어있습니다</h2>
            <p>마음에 드는 상품을 담아보세요</p>
            <Link to="/" className="btn-shop">쇼핑하러 가기</Link>
          </div>
        </div>
      </div>
    )
  }

  const selectedTotal = getSelectedTotal()
  const shippingFee = selectedTotal >= 30000 ? 0 : 3000
  const finalTotal = selectedTotal + shippingFee

  return (
    <div className="cart-page">
      <Navbar />
      
      {/* 헤더 */}
      <div className="cart-header">
        <div className="cart-header-container">
          <Link to="/" className="back-link">
            <Icons.ChevronLeft />
            <span>쇼핑 계속하기</span>
          </Link>
          <h1>장바구니</h1>
          <span className="cart-count">{cart.totalItems}개의 상품</span>
        </div>
      </div>

      <div className="cart-container">
        <div className="cart-content">
          {/* 장바구니 아이템 목록 */}
          <div className="cart-items-section">
            {/* 선택 컨트롤 */}
            <div className="cart-controls">
              <label className="select-all">
                <input
                  type="checkbox"
                  checked={selectedItems.length === cart.items.length}
                  onChange={handleSelectAll}
                />
                <span>전체선택 ({selectedItems.length}/{cart.items.length})</span>
              </label>
              <button 
                className="btn-delete-selected"
                onClick={handleRemoveSelected}
                disabled={selectedItems.length === 0 || updating}
              >
                선택삭제
              </button>
            </div>

            {/* 아이템 목록 */}
            <div className="cart-items">
              {cart.items.map((item) => (
                <div key={item._id} className="cart-item">
                  <div className="item-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item._id)}
                      onChange={() => handleSelectItem(item._id)}
                    />
                  </div>
                  
                  <Link to={`/product/${item.product?._id}`} className="item-image">
                    <img 
                      src={item.product?.image || 'https://via.placeholder.com/120x150?text=No+Image'} 
                      alt={item.product?.name}
                    />
                  </Link>
                  
                  <div className="item-details">
                    <Link to={`/product/${item.product?._id}`} className="item-name">
                      {item.product?.name || '상품 정보 없음'}
                    </Link>
                    <div className="item-options">
                      {item.selectedColor && <span>컬러: {item.selectedColor}</span>}
                      {item.selectedSize && <span>사이즈: {item.selectedSize}</span>}
                    </div>
                    <div className="item-price">{formatPrice(item.price)}</div>
                  </div>
                  
                  <div className="item-quantity">
                    <button 
                      className="qty-btn"
                      onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                      disabled={item.quantity <= 1 || updating}
                    >
                      −
                    </button>
                    <span className="qty-value">{item.quantity}</span>
                    <button 
                      className="qty-btn"
                      onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                      disabled={updating}
                    >
                      +
                    </button>
                  </div>
                  
                  <div className="item-total">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                  
                  <button 
                    className="btn-remove"
                    onClick={() => handleRemoveItem(item._id)}
                    disabled={updating}
                    title="삭제"
                  >
                    <Icons.Trash size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 주문 요약 */}
          <div className="cart-summary">
            <h3>주문 요약</h3>
            
            <div className="summary-row">
              <span>상품금액</span>
              <span>{formatPrice(selectedTotal)}</span>
            </div>
            
            <div className="summary-row">
              <span>배송비</span>
              <span>
                {selectedTotal === 0 ? '-' : shippingFee === 0 ? '무료' : formatPrice(shippingFee)}
              </span>
            </div>
            
            {selectedTotal > 0 && selectedTotal < 30000 && (
              <div className="shipping-notice">
                {formatPrice(30000 - selectedTotal)} 더 담으면 무료배송!
              </div>
            )}
            
            <div className="summary-divider"></div>
            
            <div className="summary-total">
              <span>결제예정금액</span>
              <span className="total-amount">{formatPrice(finalTotal)}</span>
            </div>
            
            <button 
              className="btn-checkout"
              disabled={selectedItems.length === 0}
              onClick={() => navigate('/checkout', { 
                state: { 
                  selectedItems,
                  totalProductAmount: selectedTotal,
                  shippingFee,
                  totalAmount: finalTotal
                }
              })}
            >
              {selectedItems.length === 0 
                ? '상품을 선택해주세요' 
                : `${getSelectedQuantity()}개 상품 주문하기`}
            </button>
            
            <div className="summary-info">
              <p>• 쿠폰/포인트는 주문서에서 적용 가능합니다</p>
              <p>• 장바구니 상품은 최대 30일간 보관됩니다</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-bottom">
          <p>© 2025 KHAKI GRADO. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default Cart

