import { useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import { useOrders } from '../hooks/useOrders'
import Navbar from '../components/Navbar'
import OrderCard from '../components/OrderCard'
import './Orders.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// 탭 목록
const TABS = [
  { id: 'all', label: '전체' },
  { id: 'preparing', label: '상품준비중' },
  { id: 'shipped', label: '배송중' },
  { id: 'delivered', label: '배송완료' },
]

function Orders() {
  const { isAuthenticated, token } = useAuth()
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [cancellingOrderId, setCancellingOrderId] = useState(null)
  
  const { orders, statusCounts, loading, refreshOrders } = useOrders(selectedStatus)

  // 주문 취소
  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('정말 주문을 취소하시겠습니까?')) {
      return
    }

    try {
      setCancellingOrderId(orderId)
      const response = await axios.patch(
        `${API_URL}/orders/${orderId}/cancel`,
        { cancelReason: '고객 요청' },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (response.data.success) {
        alert('주문이 취소되었습니다')
        refreshOrders()
      }
    } catch (err) {
      console.error('주문 취소 에러:', err)
      alert(err.response?.data?.message || '주문 취소에 실패했습니다')
    } finally {
      setCancellingOrderId(null)
    }
  }

  // 상태별 주문 개수
  const getStatusCount = (status) => {
    return statusCounts[status] || 0
  }

  // 상태별 빈 상태 메시지
  const getEmptyMessage = (status) => {
    switch (status) {
      case 'preparing':
        return '상품 준비 중인 주문이 없습니다.'
      case 'shipped':
        return '배송 중인 주문이 없습니다.'
      case 'delivered':
        return '배송 완료된 주문이 없습니다.'
      default:
        return '주문 내역이 없습니다.'
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="orders-page">
        <Navbar />
        <div className="orders-container">
          <div className="error-container">
            <p>로그인이 필요합니다.</p>
            <Link to="/login" className="btn-login">로그인하기</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="orders-page">
      <Navbar />
      
      <div className="orders-container">
        <h1 className="page-title">주문/배송 조회</h1>

        {/* 탭 메뉴 */}
        <div className="tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`tab ${selectedStatus === tab.id ? 'active' : ''}`}
              onClick={() => setSelectedStatus(tab.id)}
            >
              {tab.label} ({getStatusCount(tab.id)})
            </button>
          ))}
        </div>

        {/* 주문 목록 */}
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>주문 내역을 불러오는 중...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-container">
            <p>{getEmptyMessage(selectedStatus)}</p>
            <Link to="/" className="btn-shop">쇼핑하러 가기</Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                onCancelOrder={handleCancelOrder}
                cancellingOrderId={cancellingOrderId}
              />
            ))}
          </div>
        )}
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

export default Orders
