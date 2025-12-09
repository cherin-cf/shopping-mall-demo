import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import './OrderDetail.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// ===== 아이콘 컴포넌트 =====
const Icons = {
  ChevronLeft: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
  Truck: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="1" y="3" width="15" height="13"/>
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
      <circle cx="5.5" cy="18.5" r="2.5"/>
      <circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  ),
  Package: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  CheckCircle: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
}

// 주문 상태별 한글 변환
const getStatusLabel = (status) => {
  const statusMap = {
    pending: '결제대기',
    paid: '결제완료',
    preparing: '상품준비중',
    shipped: '배송중',
    delivered: '배송완료',
    cancelled: '주문취소',
    refunded: '환불완료',
  }
  return statusMap[status] || status
}

// 주문 상태별 배지 스타일
const getStatusBadge = (status) => {
  switch (status) {
    case 'preparing':
      return { label: '상품준비중', className: 'badge-preparing', icon: 'Package' }
    case 'shipped':
      return { label: '배송중', className: 'badge-shipping', icon: 'Truck' }
    case 'delivered':
      return { label: '배송완료', className: 'badge-delivered', icon: 'CheckCircle' }
    case 'cancelled':
      return { label: '주문취소', className: 'badge-cancelled', icon: null }
    default:
      return { label: getStatusLabel(status), className: 'badge-default', icon: null }
  }
}

// 주문 상태 옵션
const STATUS_OPTIONS = [
  { value: 'pending', label: '결제대기' },
  { value: 'paid', label: '결제완료' },
  { value: 'preparing', label: '상품준비중' },
  { value: 'shipped', label: '배송중' },
  { value: 'delivered', label: '배송완료' },
  { value: 'cancelled', label: '주문취소' },
  { value: 'refunded', label: '환불완료' },
]

function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, token, isAdmin } = useAuth()
  
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [statusForm, setStatusForm] = useState({
    status: '',
    shippingCompany: '',
    trackingNumber: '',
    cancelReason: '',
    refundAmount: '',
  })

  // 주문 정보 조회
  useEffect(() => {
    const fetchOrder = async () => {
      if (!isAuthenticated) {
        navigate('/login')
        return
      }

      try {
        setLoading(true)
        const response = await axios.get(`${API_URL}/orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (response.data.success) {
          setOrder(response.data.data)
        } else {
          setError('주문을 찾을 수 없습니다')
        }
      } catch (err) {
        console.error('주문 조회 에러:', err)
        setError(err.response?.data?.message || '주문 정보를 불러오는데 실패했습니다')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchOrder()
    }
  }, [id, isAuthenticated, token, navigate])

  // 가격 포맷팅
  const formatPrice = (price) => {
    return price?.toLocaleString() + '원'
  }

  // 날짜 포맷팅
  const formatDate = (date) => {
    if (!date) return ''
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}.${month}.${day}`
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

  // 주문 취소
  const handleCancelOrder = async () => {
    if (!window.confirm('정말 주문을 취소하시겠습니까?')) {
      return
    }

    try {
      setCancelling(true)
      const response = await axios.patch(
        `${API_URL}/orders/${id}/cancel`,
        { cancelReason: '고객 요청' },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (response.data.success) {
        alert('주문이 취소되었습니다')
        // 주문 정보 새로고침
        const refreshResponse = await axios.get(`${API_URL}/orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (refreshResponse.data.success) {
          setOrder(refreshResponse.data.data)
        }
      }
    } catch (err) {
      console.error('주문 취소 에러:', err)
      alert(err.response?.data?.message || '주문 취소에 실패했습니다')
    } finally {
      setCancelling(false)
    }
  }

  // 상태 변경 모달 열기
  const handleOpenStatusModal = () => {
    setStatusForm({
      status: order.status,
      shippingCompany: order.shippingCompany || '',
      trackingNumber: order.trackingNumber || '',
      cancelReason: order.cancelReason || '',
      refundAmount: order.refundAmount || '',
    })
    setShowStatusModal(true)
  }

  // 상태 변경 모달 닫기
  const handleCloseStatusModal = () => {
    setShowStatusModal(false)
    setStatusForm({
      status: '',
      shippingCompany: '',
      trackingNumber: '',
      cancelReason: '',
      refundAmount: '',
    })
  }

  // 상태 변경 폼 입력
  const handleStatusFormChange = (e) => {
    const { name, value } = e.target
    setStatusForm(prev => ({ ...prev, [name]: value }))
  }

  // 주문 상태 변경 (관리자)
  const handleUpdateStatus = async () => {
    if (!statusForm.status) {
      alert('상태를 선택해주세요')
      return
    }

    if (statusForm.status === 'shipped' && !statusForm.trackingNumber) {
      alert('배송중 상태로 변경 시 운송장 번호를 입력해주세요')
      return
    }

    if (statusForm.status === 'cancelled' && !statusForm.cancelReason) {
      alert('주문 취소 시 취소 사유를 입력해주세요')
      return
    }

    try {
      setUpdatingStatus(true)
      const response = await axios.patch(
        `${API_URL}/orders/admin/${id}/status`,
        {
          status: statusForm.status,
          shippingCompany: statusForm.shippingCompany || undefined,
          trackingNumber: statusForm.trackingNumber || undefined,
          cancelReason: statusForm.cancelReason || undefined,
          refundAmount: statusForm.refundAmount ? parseInt(statusForm.refundAmount) : undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (response.data.success) {
        alert('주문 상태가 변경되었습니다')
        handleCloseStatusModal()
        // 주문 정보 새로고침
        const refreshResponse = await axios.get(`${API_URL}/orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (refreshResponse.data.success) {
          setOrder(refreshResponse.data.data)
        }
      }
    } catch (err) {
      console.error('상태 변경 에러:', err)
      alert(err.response?.data?.message || '상태 변경에 실패했습니다')
    } finally {
      setUpdatingStatus(false)
    }
  }

  // 로딩 상태
  if (loading) {
    return (
      <div className="order-detail-page">
        <Navbar />
        <div className="order-detail-container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>주문 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  // 에러 상태
  if (error || !order) {
    return (
      <div className="order-detail-page">
        <Navbar />
        <div className="order-detail-container">
          <div className="error-container">
            <p>{error || '주문을 찾을 수 없습니다'}</p>
            <Link to="/orders" className="btn-back">주문 내역으로 돌아가기</Link>
          </div>
        </div>
      </div>
    )
  }

  const badge = getStatusBadge(order.status)

  return (
    <div className="order-detail-page">
      <Navbar />
      
      <div className="order-detail-container">
        {/* 헤더 */}
        <div className="order-detail-header">
          <Link to="/orders" className="back-link">
            <Icons.ChevronLeft />
            <span>주문 내역</span>
          </Link>
          <h1>주문 상세</h1>
        </div>

        {/* 주문 정보 카드 */}
        <div className="order-info-card">
          <div className="order-header-info">
            <div>
              <p className="order-date">주문일: {formatDate(order.createdAt)}</p>
              <p className="order-number">주문번호: {order.orderNumber}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className={`status-badge ${badge.className}`}>
                {badge.icon === 'Package' && <Icons.Package />}
                {badge.icon === 'Truck' && <Icons.Truck />}
                {badge.icon === 'CheckCircle' && <Icons.CheckCircle />}
                <span>{badge.label}</span>
              </div>
              {isAdmin && (
                <button
                  className="btn-change-status"
                  onClick={handleOpenStatusModal}
                >
                  상태 변경
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 주문 상품 */}
        <section className="detail-section">
          <h2 className="section-title">주문 상품</h2>
          <div className="order-items-list">
            {order.items?.map((item, index) => (
              <div key={index} className="order-item-card">
                <div className="order-item-image">
                  <img 
                    src={item.image || 'https://via.placeholder.com/100x125?text=No+Image'} 
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
        <section className="detail-section">
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
        <section className="detail-section">
          <h2 className="section-title">결제 정보</h2>
          <div className="info-grid">
            <div className="info-row">
              <span className="info-label">결제 수단</span>
              <span className="info-value">{getPaymentMethodLabel(order.payment?.method)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">결제 상태</span>
              <span className="info-value">
                {order.payment?.status === 'completed' ? '결제완료' : 
                 order.payment?.status === 'cancelled' ? '결제취소' : 
                 order.payment?.status === 'refunded' ? '환불완료' : '결제대기'}
              </span>
            </div>
            {order.payment?.paidAt && (
              <div className="info-row">
                <span className="info-label">결제일시</span>
                <span className="info-value">{formatDate(order.payment.paidAt)}</span>
              </div>
            )}
            <div className="info-row">
              <span className="info-label">상품금액</span>
              <span className="info-value">{formatPrice(order.totalProductAmount)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">배송비</span>
              <span className="info-value">{order.shippingFee === 0 ? '무료' : formatPrice(order.shippingFee)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">할인금액</span>
              <span className="info-value">{formatPrice(order.discountAmount || 0)}</span>
            </div>
            <div className="info-row total-row">
              <span className="info-label">최종 결제금액</span>
              <span className="info-value total-amount">{formatPrice(order.totalAmount)}</span>
            </div>
          </div>
        </section>

        {/* 배송 정보 */}
        {order.status === 'shipped' && (
          <section className="detail-section">
            <h2 className="section-title">배송 정보</h2>
            <div className="info-grid">
              {order.shippingCompany && (
                <div className="info-row">
                  <span className="info-label">택배사</span>
                  <span className="info-value">{order.shippingCompany}</span>
                </div>
              )}
              {order.trackingNumber && (
                <div className="info-row">
                  <span className="info-label">운송장 번호</span>
                  <span className="info-value tracking-number">{order.trackingNumber}</span>
                </div>
              )}
              {order.shippedAt && (
                <div className="info-row">
                  <span className="info-label">배송 시작일</span>
                  <span className="info-value">{formatDate(order.shippedAt)}</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 취소 정보 */}
        {order.status === 'cancelled' && order.cancelReason && (
          <section className="detail-section">
            <h2 className="section-title">취소 정보</h2>
            <div className="info-grid">
              <div className="info-row">
                <span className="info-label">취소 사유</span>
                <span className="info-value">{order.cancelReason}</span>
              </div>
              {order.cancelledAt && (
                <div className="info-row">
                  <span className="info-label">취소일시</span>
                  <span className="info-value">{formatDate(order.cancelledAt)}</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 액션 버튼 */}
        <div className="action-buttons">
          {(order.status === 'pending' || order.status === 'paid') && (
            <button 
              className="btn-cancel-order"
              onClick={handleCancelOrder}
              disabled={cancelling}
            >
              {cancelling ? '처리 중...' : '주문 취소'}
            </button>
          )}
          {order.status === 'shipped' && (
            <button className="btn-track-delivery">
              배송 조회
            </button>
          )}
          {order.status === 'delivered' && (
            <button className="btn-write-review">
              리뷰 작성
            </button>
          )}
          <Link to="/orders" className="btn-back-to-list">
            주문 내역으로 돌아가기
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-bottom">
          <p>© 2025 KHAKI GRADO. All rights reserved.</p>
        </div>
      </footer>

      {/* 상태 변경 모달 */}
      {showStatusModal && (
        <div className="modal-overlay" onClick={handleCloseStatusModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>주문 상태 변경</h2>
              <button className="modal-close" onClick={handleCloseStatusModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>주문 상태 *</label>
                <select
                  name="status"
                  value={statusForm.status}
                  onChange={handleStatusFormChange}
                  className="form-select"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {statusForm.status === 'shipped' && (
                <>
                  <div className="form-group">
                    <label>택배사</label>
                    <input
                      type="text"
                      name="shippingCompany"
                      value={statusForm.shippingCompany}
                      onChange={handleStatusFormChange}
                      placeholder="예: CJ대한통운"
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>운송장 번호 *</label>
                    <input
                      type="text"
                      name="trackingNumber"
                      value={statusForm.trackingNumber}
                      onChange={handleStatusFormChange}
                      placeholder="운송장 번호를 입력하세요"
                      className="form-input"
                    />
                  </div>
                </>
              )}

              {statusForm.status === 'cancelled' && (
                <div className="form-group">
                  <label>취소 사유 *</label>
                  <textarea
                    name="cancelReason"
                    value={statusForm.cancelReason}
                    onChange={handleStatusFormChange}
                    placeholder="취소 사유를 입력하세요"
                    className="form-textarea"
                    rows="3"
                  />
                </div>
              )}

              {statusForm.status === 'refunded' && (
                <div className="form-group">
                  <label>환불 금액</label>
                  <input
                    type="number"
                    name="refundAmount"
                    value={statusForm.refundAmount}
                    onChange={handleStatusFormChange}
                    placeholder="환불 금액을 입력하세요"
                    className="form-input"
                  />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="btn-modal-cancel"
                onClick={handleCloseStatusModal}
                disabled={updatingStatus}
              >
                취소
              </button>
              <button
                className="btn-modal-submit"
                onClick={handleUpdateStatus}
                disabled={updatingStatus}
              >
                {updatingStatus ? '처리 중...' : '변경하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderDetail

