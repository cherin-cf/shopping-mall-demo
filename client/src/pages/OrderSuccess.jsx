import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import './OrderSuccess.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// ===== 아이콘 컴포넌트 =====
const Icons = {
  Check: ({ size = 64 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  Phone: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  ),
  FileText: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  Home: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
}

function OrderSuccess() {
  const { isAuthenticated, token } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  // 주문 정보 (location.state에서 받거나 API로 조회)
  const { orderId, orderNumber } = location.state || {}
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  // 주문 정보 조회
  useEffect(() => {
    const fetchOrder = async () => {
      if (!isAuthenticated) {
        navigate('/')
        return
      }

      if (!orderId) {
        // orderId가 없으면 홈으로 이동
        navigate('/')
        return
      }

      try {
        setLoading(true)
        const response = await axios.get(`${API_URL}/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (response.data.success) {
          setOrder(response.data.data)
        }
      } catch (err) {
        console.error('주문 조회 에러:', err)
        // 에러 발생 시에도 기본 정보로 표시
        if (orderNumber) {
          setOrder({ orderNumber })
        }
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [isAuthenticated, token, orderId, orderNumber, navigate])

  // 가격 포맷팅
  const formatPrice = (price) => {
    return price?.toLocaleString() + '원'
  }

  // 날짜 포맷팅
  const formatDate = (date) => {
    if (!date) return ''
    const d = new Date(date)
    const year = d.getFullYear()
    const month = d.getMonth() + 1
    const day = d.getDate()
    return `${year}년 ${month}월 ${day}일`
  }

  // 결제 수단 한글 변환
  const getPaymentMethodLabel = (method) => {
    const methods = {
      card: '신용카드',
      bank: '실시간 계좌이체',
      kakao: '카카오페이',
      toss: '토스페이',
      naver: '네이버페이',
    }
    return methods[method] || method
  }

  if (loading) {
    return (
      <div className="order-success-page">
        <Navbar />
        <div className="order-success-container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>주문 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="order-success-page">
        <Navbar />
        <div className="order-success-container">
          <div className="error-container">
            <p>주문 정보를 불러올 수 없습니다.</p>
            <Link to="/" className="btn-home">홈으로 가기</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="order-success-page">
      <Navbar />
      
      <div className="order-success-container">
        {/* 성공 아이콘 및 메시지 */}
        <div className="success-header">
          <div className="success-icon">
            <Icons.Check />
          </div>
          <h1>주문이 완료되었습니다!</h1>
          <div className="order-info-header">
            <p>주문번호: {order.orderNumber || orderNumber}</p>
            <p>{formatDate(order.createdAt)}</p>
          </div>
        </div>

        {/* 주문 상품 */}
        <section className="order-section">
          <h2 className="section-title">주문 상품</h2>
          <div className="order-items-list">
            {order.items?.map((item, index) => (
              <div key={index} className="order-item-card">
                <div className="order-item-image">
                  <img 
                    src={item.image || 'https://via.placeholder.com/80x100?text=No+Image'} 
                    alt={item.name}
                  />
                </div>
                <div className="order-item-details">
                  <h4>{item.name}</h4>
                  <p className="order-item-meta">
                    {item.selectedColor && `${item.selectedColor}`}
                    {item.selectedColor && item.selectedSize && ' / '}
                    {item.selectedSize && `${item.selectedSize}`}
                  </p>
                  <p className="order-item-quantity">수량: {item.quantity}개</p>
                  <p className="order-item-price">{formatPrice(item.price * item.quantity)}</p>
                </div>
              </div>
            ))}
            <div className="order-total-row">
              <span>총 결제금액</span>
              <span className="total-price">{formatPrice(order.totalAmount)}</span>
            </div>
          </div>
        </section>

        {/* 배송지 정보 */}
        <section className="order-section">
          <h2 className="section-title">배송지 정보</h2>
          <div className="info-grid">
            <div className="info-row">
              <span className="info-label">받는 분</span>
              <span className="info-value">{order.shipping?.recipientName}</span>
            </div>
            <div className="info-row">
              <span className="info-label">연락처</span>
              <span className="info-value">{order.shipping?.recipientPhone}</span>
            </div>
            <div className="info-row">
              <span className="info-label">배송지</span>
              <span className="info-value">
                {order.shipping?.address} {order.shipping?.addressDetail}
                {order.shipping?.postalCode && ` (우: ${order.shipping.postalCode})`}
              </span>
            </div>
            {order.shipping?.deliveryMemo && (
              <div className="info-row">
                <span className="info-label">배송 메모</span>
                <span className="info-value">{order.shipping.deliveryMemo}</span>
              </div>
            )}
          </div>
        </section>

        {/* 결제 정보 */}
        <section className="order-section">
          <h2 className="section-title">결제 정보</h2>
          <div className="info-grid">
            <div className="info-row">
              <span className="info-label">결제 수단</span>
              <span className="info-value">{getPaymentMethodLabel(order.payment?.method)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">상품금액</span>
              <span className="info-value">{formatPrice(order.totalProductAmount)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">배송비</span>
              <span className="info-value">{order.shippingFee === 0 ? '무료' : formatPrice(order.shippingFee)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">결제금액</span>
              <span className="info-value">{formatPrice(order.totalAmount)}</span>
            </div>
          </div>
        </section>

        {/* 다음 단계 */}
        <section className="order-section">
          <h2 className="section-title">다음 단계</h2>
          <div className="steps-list">
            <div className="step-item">
              <span className="step-number">1</span>
              <span className="step-text">상품 준비중 (1-2일 소요)</span>
            </div>
            <div className="step-item">
              <span className="step-number">2</span>
              <span className="step-text">배송 시작 (배송 시작 시 알림 발송)</span>
            </div>
            <div className="step-item">
              <span className="step-number">3</span>
              <span className="step-text">배송 완료 (2-3일 내 도착 예정)</span>
            </div>
          </div>
        </section>

        {/* 고객센터 */}
        <section className="order-section">
          <h2 className="section-title">
            <Icons.Phone size={18} />
            고객센터
          </h2>
          <div className="customer-service">
            <p>주문 관련 문의사항이 있으시면 고객센터로 연락주세요.</p>
            <div className="contact-info">
              <p>전화: 010-8076-9283</p>
              <p>카카오톡: @카키그래도</p>
              <p>운영시간: 평일 10:00-17:00 (점심 12:00-13:00)</p>
            </div>
          </div>
        </section>

        {/* 하단 버튼 */}
        <div className="action-buttons">
          <Link to="/orders" className="btn-order-history">
            <Icons.FileText />
            <span>주문내역</span>
          </Link>
          <Link to="/" className="btn-home">
            <Icons.Home />
            <span>홈으로</span>
          </Link>
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

export default OrderSuccess

