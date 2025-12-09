import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import './Checkout.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// ===== 아이콘 컴포넌트 =====
const Icons = {
  ChevronLeft: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
  CreditCard: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
      <line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  ),
  Building: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
      <path d="M9 22v-4h6v4"/>
      <line x1="8" y1="6" x2="8" y2="6"/>
      <line x1="16" y1="6" x2="16" y2="6"/>
      <line x1="12" y1="6" x2="12" y2="6"/>
      <line x1="8" y1="10" x2="8" y2="10"/>
      <line x1="16" y1="10" x2="16" y2="10"/>
      <line x1="12" y1="10" x2="12" y2="10"/>
      <line x1="8" y1="14" x2="8" y2="14"/>
      <line x1="16" y1="14" x2="16" y2="14"/>
      <line x1="12" y1="14" x2="12" y2="14"/>
    </svg>
  ),
  Smartphone: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
      <line x1="12" y1="18" x2="12.01" y2="18"/>
    </svg>
  ),
}

// 결제 수단 옵션
const PAYMENT_METHODS = [
  { id: 'card', label: '신용카드 / 체크카드', sublabel: '모든 카드 결제 가능', icon: 'CreditCard' },
  { id: 'bank', label: '실시간 계좌이체', sublabel: '간편한 계좌이체 결제', icon: 'Building' },
  { id: 'kakao', label: '카카오페이', sublabel: '카카오페이로 간편결제', icon: 'Smartphone' },
  { id: 'toss', label: '토스페이', sublabel: '토스로 간편결제', icon: 'Smartphone' },
]

function Checkout() {
  const { isAuthenticated, token, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  // 전달받은 데이터 (장바구니 또는 바로구매)
  const { 
    selectedItems, 
    totalProductAmount, 
    shippingFee, 
    totalAmount,
    buyNow,
    buyNowItem 
  } = location.state || {}
  
  const [cart, setCart] = useState(null)
  const [orderItems, setOrderItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isBuyNow, setIsBuyNow] = useState(false)
  
  // 배송 정보 상태
  const [shipping, setShipping] = useState({
    recipientName: user?.name || '',
    recipientPhone: '',
    postalCode: '',
    address: '',
    addressDetail: '',
    deliveryMemo: '',
  })
  
  // 결제 수단 상태
  const [paymentMethod, setPaymentMethod] = useState('card')

  // 포트원 결제 모듈 초기화
  useEffect(() => {
    const IMP = window.IMP
    if (IMP) {
      IMP.init('imp33112821') // 고객사 식별코드
    }
  }, [])

  // 주문 데이터 초기화
  useEffect(() => {
    const initOrderData = async () => {
      if (!isAuthenticated) {
        navigate('/login')
        return
      }

      // 바로구매인 경우
      if (buyNow && buyNowItem) {
        setIsBuyNow(true)
        setOrderItems([buyNowItem])
        setLoading(false)
        return
      }

      // 장바구니 주문인 경우
      if (!selectedItems) {
        navigate('/cart')
        return
      }

      try {
        setLoading(true)
        const response = await axios.get(`${API_URL}/cart`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (response.data.success) {
          setCart(response.data.data)
          // 선택된 아이템만 필터링
          const items = response.data.data.items.filter(
            item => selectedItems.includes(item._id)
          )
          setOrderItems(items)
          
          if (items.length === 0) {
            alert('주문할 상품이 없습니다')
            navigate('/cart')
          }
        }
      } catch (err) {
        console.error('장바구니 조회 에러:', err)
        navigate('/cart')
      } finally {
        setLoading(false)
      }
    }

    initOrderData()
  }, [isAuthenticated, token, selectedItems, buyNow, buyNowItem, navigate])

  // 배송 정보 변경 핸들러
  const handleShippingChange = (e) => {
    const { name, value } = e.target
    setShipping(prev => ({ ...prev, [name]: value }))
  }

  // 가격 포맷팅
  const formatPrice = (price) => {
    return price?.toLocaleString() + '원'
  }

  // 총 수량 계산
  const getTotalQuantity = () => {
    return orderItems.reduce((sum, item) => sum + item.quantity, 0)
  }

  // 결제 수단에 따른 PG사 설정
  const getPgProvider = (method) => {
    switch (method) {
      case 'kakao':
        return 'kakaopay'
      case 'toss':
        return 'tosspay'
      case 'bank':
        return 'html5_inicis'
      case 'card':
      default:
        return 'html5_inicis'
    }
  }

  // 결제 수단에 따른 pay_method 설정
  const getPayMethod = (method) => {
    switch (method) {
      case 'kakao':
      case 'toss':
        return 'card' // 간편결제
      case 'bank':
        return 'trans'
      case 'card':
      default:
        return 'card'
    }
  }

  // 주문 제출 (포트원 결제 연동)
  const handleSubmitOrder = async () => {
    // 유효성 검사
    if (!shipping.recipientName.trim()) {
      alert('받는 분 이름을 입력해주세요')
      return
    }
    if (!shipping.recipientPhone.trim()) {
      alert('연락처를 입력해주세요')
      return
    }
    if (!shipping.postalCode.trim()) {
      alert('우편번호를 입력해주세요')
      return
    }
    if (!shipping.address.trim()) {
      alert('주소를 입력해주세요')
      return
    }

    const IMP = window.IMP
    if (!IMP) {
      alert('결제 모듈을 불러오는데 실패했습니다. 페이지를 새로고침해주세요.')
      return
    }

    setSubmitting(true)

    // 주문번호 생성 (임시)
    const merchantUid = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // 상품명 생성
    const productName = orderItems.length > 1 
      ? `${orderItems[0].product?.name} 외 ${orderItems.length - 1}건`
      : orderItems[0].product?.name || '상품'

    // 포트원 결제 요청
    IMP.request_pay(
      {
        pg: getPgProvider(paymentMethod),
        pay_method: getPayMethod(paymentMethod),
        merchant_uid: merchantUid,
        name: productName,
        amount: totalAmount,
        buyer_email: user?.email || '',
        buyer_name: shipping.recipientName,
        buyer_tel: shipping.recipientPhone,
        buyer_addr: `${shipping.address} ${shipping.addressDetail}`,
        buyer_postcode: shipping.postalCode,
      },
      async (response) => {
        if (response.success) {
          // 결제 성공 시 서버에 주문 생성
          try {
            let orderResponse
            
            if (isBuyNow && buyNowItem) {
              // 바로구매인 경우
              orderResponse = await axios.post(
                `${API_URL}/orders/buy-now`,
                {
                  shipping,
                  paymentMethod,
                  productId: buyNowItem.product._id,
                  quantity: buyNowItem.quantity,
                  selectedColor: buyNowItem.selectedColor,
                  selectedSize: buyNowItem.selectedSize,
                  impUid: response.imp_uid,
                  merchantUid: response.merchant_uid,
                },
                {
                  headers: { Authorization: `Bearer ${token}` }
                }
              )
            } else {
              // 장바구니 주문인 경우
              orderResponse = await axios.post(
                `${API_URL}/orders`,
                {
                  shipping,
                  paymentMethod,
                  itemIds: selectedItems,
                  impUid: response.imp_uid,
                  merchantUid: response.merchant_uid,
                },
                {
                  headers: { Authorization: `Bearer ${token}` }
                }
              )
            }

            if (orderResponse.data.success) {
              // 주문 성공 페이지로 이동
              navigate('/order-success', {
                state: {
                  orderId: orderResponse.data.data._id,
                  orderNumber: orderResponse.data.data.orderNumber,
                }
              })
            }
          } catch (err) {
            console.error('주문 생성 에러:', err)
            alert('결제는 완료되었으나 주문 처리 중 오류가 발생했습니다.\n고객센터로 문의해주세요.')
          }
        } else {
          // 결제 실패
          alert(`결제에 실패했습니다.\n${response.error_msg}`)
        }
        setSubmitting(false)
      }
    )
  }

  // 로딩 상태
  if (loading) {
    return (
      <div className="checkout-page">
        <Navbar />
        <div className="checkout-container">
          <div className="checkout-loading">
            <div className="loading-spinner"></div>
            <p>주문 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="checkout-page">
      <Navbar />
      
      {/* 헤더 */}
      <div className="checkout-header">
        <div className="checkout-header-container">
          <Link to="/cart" className="back-link">
            <Icons.ChevronLeft />
            <span>장바구니</span>
          </Link>
          <h1>주문/결제</h1>
        </div>
      </div>

      <div className="checkout-container">
        <div className="checkout-content">
          {/* 왼쪽: 주문 정보 */}
          <div className="checkout-main">
            {/* 주문 상품 */}
            <section className="checkout-section">
              <h2 className="section-title">주문상품 ({getTotalQuantity()}개)</h2>
              <div className="order-items">
                {orderItems.map((item) => (
                  <div key={item._id} className="order-item">
                    <div className="order-item-image">
                      <img 
                        src={item.product?.image || 'https://via.placeholder.com/80x100?text=No+Image'} 
                        alt={item.product?.name}
                      />
                    </div>
                    <div className="order-item-info">
                      <h4>{item.product?.name || '상품 정보 없음'}</h4>
                      <p className="order-item-options">
                        {item.selectedColor && `${item.selectedColor}`}
                        {item.selectedColor && item.selectedSize && ' / '}
                        {item.selectedSize && `${item.selectedSize}`}
                        {` / 수량: ${item.quantity}개`}
                      </p>
                      <p className="order-item-price">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 배송지 정보 */}
            <section className="checkout-section">
              <h2 className="section-title">배송지 정보</h2>
              <div className="shipping-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>받는 분 이름*</label>
                    <input
                      type="text"
                      name="recipientName"
                      value={shipping.recipientName}
                      onChange={handleShippingChange}
                      placeholder="홍길동"
                    />
                  </div>
                  <div className="form-group">
                    <label>연락처*</label>
                    <input
                      type="tel"
                      name="recipientPhone"
                      value={shipping.recipientPhone}
                      onChange={handleShippingChange}
                      placeholder="010-0000-0000"
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label>우편번호*</label>
                  <div className="postal-code-row">
                    <input
                      type="text"
                      name="postalCode"
                      value={shipping.postalCode}
                      onChange={handleShippingChange}
                      placeholder="우편번호"
                    />
                    <button type="button" className="btn-search-address">주소 검색</button>
                  </div>
                </div>
                
                <div className="form-group">
                  <label>주소*</label>
                  <input
                    type="text"
                    name="address"
                    value={shipping.address}
                    onChange={handleShippingChange}
                    placeholder="기본 주소"
                  />
                </div>
                
                <div className="form-group">
                  <label>상세 주소</label>
                  <input
                    type="text"
                    name="addressDetail"
                    value={shipping.addressDetail}
                    onChange={handleShippingChange}
                    placeholder="상세 주소를 입력해주세요"
                  />
                </div>
                
                <div className="form-group">
                  <label>배송 메모</label>
                  <input
                    type="text"
                    name="deliveryMemo"
                    value={shipping.deliveryMemo}
                    onChange={handleShippingChange}
                    placeholder="배송 시 요청사항을 입력해주세요 (선택)"
                  />
                </div>
              </div>
            </section>

            {/* 결제 수단 */}
            <section className="checkout-section">
              <h2 className="section-title">결제 수단</h2>
              <div className="payment-methods">
                {PAYMENT_METHODS.map((method) => (
                  <label 
                    key={method.id} 
                    className={`payment-method ${paymentMethod === method.id ? 'active' : ''}`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.id}
                      checked={paymentMethod === method.id}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <div className="payment-method-content">
                      <div className="payment-method-icon">
                        {method.icon === 'CreditCard' && <Icons.CreditCard />}
                        {method.icon === 'Building' && <Icons.Building />}
                        {method.icon === 'Smartphone' && <Icons.Smartphone />}
                      </div>
                      <div className="payment-method-text">
                        <span className="payment-method-label">{method.label}</span>
                        <span className="payment-method-sublabel">{method.sublabel}</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </section>
          </div>

          {/* 오른쪽: 결제 금액 */}
          <div className="checkout-sidebar">
            <div className="payment-summary">
              <h3>최종 결제금액</h3>
              
              <div className="summary-row">
                <span>상품금액</span>
                <span>{formatPrice(totalProductAmount)}</span>
              </div>
              
              <div className="summary-row">
                <span>배송비</span>
                <span>{shippingFee === 0 ? '무료' : formatPrice(shippingFee)}</span>
              </div>
              
              <div className="summary-divider"></div>
              
              <div className="summary-total">
                <span>총 결제금액</span>
                <span className="total-amount">{formatPrice(totalAmount)}</span>
              </div>
              
              <button 
                className="btn-pay"
                onClick={handleSubmitOrder}
                disabled={submitting}
              >
                {submitting ? '처리 중...' : `${formatPrice(totalAmount)} 결제하기`}
              </button>
              
              <div className="payment-info">
                <p>• 위 주문 내용을 확인하였으며, 결제에 동의합니다.</p>
                <p>• 결제 후 2-3일 내 배송됩니다.</p>
                <p>• 배송 상태는 마이페이지에서 확인 가능합니다.</p>
              </div>
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

export default Checkout

