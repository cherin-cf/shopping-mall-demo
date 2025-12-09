import { useNavigate } from 'react-router-dom'
import { formatPrice, formatDate, getStatusBadge } from '../utils/orderUtils'
import { OrderIcons } from './OrderIcons'
import './OrderCard.css'

// 결제수단 한글 변환
const getPaymentMethodLabel = (method) => {
  const methods = {
    card: '신용카드',
    bank: '계좌이체',
    kakao: '카카오페이',
    toss: '토스페이',
    naver: '네이버페이',
  }
  return methods[method] || method || '신용카드'
}

function OrderCard({ order, onCancelOrder, cancellingOrderId }) {
  const navigate = useNavigate()
  const badge = getStatusBadge(order.status)

  const renderIcon = () => {
    switch (badge.icon) {
      case 'Package':
        return <OrderIcons.Package />
      case 'Truck':
        return <OrderIcons.Truck />
      case 'CheckCircle':
        return <OrderIcons.CheckCircle />
      case 'X':
        return <OrderIcons.X />
      default:
        return null
    }
  }

  // 배송 추적 버튼 클릭
  const handleTrackDelivery = () => {
    if (order.trackingNumber) {
      // 실제 배송 추적 사이트로 이동 (예: CJ대한통운)
      window.open(`https://www.cjlogistics.com/ko/tool/parcel/tracking?gnbInvcNo=${order.trackingNumber}`, '_blank')
    }
  }

  return (
    <div className="order-card">
      {/* 주문 헤더 */}
      <div className="order-header">
        <div className="order-date-number">
          <span className="order-date-label">주문일자: {formatDate(order.createdAt)}</span>
          <span className="order-number-label">주문번호: {order.orderNumber}</span>
        </div>
        <button className={`status-badge-btn ${badge.className}`}>
          {badge.label}
        </button>
      </div>

      {/* 운송장 번호 (배송중일 때) */}
      {order.status === 'shipped' && order.trackingNumber && (
        <div className="tracking-section">
          <div className="tracking-number-input">
            <span className="tracking-label">운송장 번호</span>
            <span className="tracking-number-value">{order.trackingNumber}</span>
          </div>
          <button className="btn-track-delivery" onClick={handleTrackDelivery}>
            배송 추적
          </button>
        </div>
      )}

      {/* 주문 상품 섹션 */}
      <div className="order-section">
        <h3 className="section-title">주문 상품</h3>
        <div className="order-items">
          {order.items?.map((item, index) => (
            <div key={index} className="order-item">
              <div className="order-item-image">
                <img 
                  src={item.image || item.product?.image || 'https://via.placeholder.com/80x100?text=No+Image'} 
                  alt={item.name}
                />
              </div>
              <div className="order-item-info">
                <h4>{item.name}</h4>
                <p className="order-item-quantity">수량: {item.quantity}개</p>
                <p className="order-item-price">{formatPrice(item.price * item.quantity)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 배송지 정보 섹션 */}
      {order.shipping && (
        <div className="order-section">
          <h3 className="section-title">배송지 정보</h3>
          <div className="shipping-info">
            <div className="info-row">
              <span className="info-label">수령인</span>
              <span className="info-value">{order.shipping.recipientName || '-'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">연락처</span>
              <span className="info-value">{order.shipping.phone || '-'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">주소</span>
              <span className="info-value">{order.shipping.address || '-'}</span>
            </div>
            {order.shipping.deliveryMemo && (
              <div className="info-row">
                <span className="info-label">배송메모</span>
                <span className="info-value">{order.shipping.deliveryMemo}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 결제 정보 섹션 */}
      <div className="order-section">
        <h3 className="section-title">결제 정보</h3>
        <div className="payment-info">
          <div className="info-row">
            <span className="info-label">결제수단</span>
            <span className="info-value">{getPaymentMethodLabel(order.payment?.method)}</span>
          </div>
          <div className="info-row">
            <span className="info-label">상품금액</span>
            <span className="info-value">{formatPrice(order.totalProductAmount || 0)}</span>
          </div>
          <div className="info-row">
            <span className="info-label">배송비</span>
            <span className="info-value">{formatPrice(order.shippingFee || 0)}</span>
          </div>
          <div className="info-row total-row">
            <span className="info-label">총 결제금액</span>
            <span className="info-value total-payment">{formatPrice(order.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="order-actions">
        {(order.status === 'pending' || order.status === 'paid' || order.status === 'preparing') && (
          <button 
            className="btn-cancel-order"
            onClick={() => onCancelOrder(order._id)}
            disabled={cancellingOrderId === order._id}
          >
            {cancellingOrderId === order._id ? '처리 중...' : '주문 취소'}
          </button>
        )}
        <button className="btn-customer-service">
          고객센터 문의
        </button>
      </div>
    </div>
  )
}

export default OrderCard

