// 주문 상태별 한글 변환
export const getStatusLabel = (status) => {
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

// 주문 상태별 배지 정보
export const getStatusBadge = (status) => {
  switch (status) {
    case 'preparing':
      return { label: '상품준비중', className: 'badge-preparing', icon: 'Package' }
    case 'shipped':
      return { label: '배송중', className: 'badge-shipping', icon: 'Truck' }
    case 'delivered':
      return { label: '배송완료', className: 'badge-delivered', icon: 'CheckCircle' }
    case 'cancelled':
      return { label: '주문취소', className: 'badge-cancelled', icon: 'X' }
    default:
      return { label: getStatusLabel(status), className: 'badge-default', icon: null }
  }
}

// 가격 포맷팅
export const formatPrice = (price) => {
  return price?.toLocaleString() + '원'
}

// 날짜 포맷팅
export const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}.${month}.${day}`
}

