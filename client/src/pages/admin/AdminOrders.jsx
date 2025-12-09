import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../../contexts/AuthContext'
import { formatPrice, formatDate, getStatusBadge } from '../../utils/orderUtils'
import { OrderIcons } from '../../components/OrderIcons'
import './Admin.css'
import './AdminOrders.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// 어드민 네비게이션 메뉴
const ADMIN_MENU = [
  { path: '/admin', label: '대시보드' },
  { path: '/admin/products', label: '상품관리' },
  { path: '/admin/orders', label: '주문관리', active: true },
  { path: '/admin/users', label: '회원관리' },
]

// 주문 상태 옵션
const STATUS_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'pending', label: '결제대기' },
  { value: 'paid', label: '결제완료' },
  { value: 'preparing', label: '상품준비중' },
  { value: 'shipped', label: '배송중' },
  { value: 'delivered', label: '배송완료' },
  { value: 'cancelled', label: '주문취소' },
]

// 결제 수단 옵션
const PAYMENT_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'card', label: '신용카드' },
  { value: 'bank', label: '계좌이체' },
  { value: 'kakao', label: '카카오페이' },
  { value: 'toss', label: '토스페이' },
  { value: 'naver', label: '네이버페이' },
]

// 결제 수단 한글 변환
const getPaymentMethodLabel = (method) => {
  const methods = {
    card: '신용카드',
    bank: '계좌이체',
    kakao: '카카오페이',
    toss: '토스페이',
    naver: '네이버페이',
  }
  return methods[method] || method
}

// 날짜/시간 포맷팅 (관리자 페이지용)
const formatDateTime = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

function AdminOrders() {
  const { user, isAdmin, loading: authLoading, token } = useAuth()
  const navigate = useNavigate()
  
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [showPaymentDropdown, setShowPaymentDropdown] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [statusForm, setStatusForm] = useState({
    status: '',
    shippingCompany: '',
    trackingNumber: '',
    cancelReason: '',
    refundAmount: '',
  })

  // 어드민이 아니면 홈으로 리다이렉트
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/', { replace: true })
    }
  }, [isAdmin, authLoading, navigate])

  // 주문 목록 조회
  useEffect(() => {
    const fetchOrders = async () => {
      if (!isAdmin) return

      try {
        setLoading(true)
        const params = {
          page: currentPage,
          limit: 10,
        }
        
        if (statusFilter) params.status = statusFilter
        // TODO: 서버에 paymentMethod 필터 추가 필요
        // if (paymentFilter) params.paymentMethod = paymentFilter
        if (searchQuery) params.search = searchQuery

        const response = await axios.get(`${API_URL}/orders/admin/all`, {
          params,
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (response.data.success) {
          setOrders(response.data.data)
          setTotalCount(response.data.totalCount || 0)
          setTotalPages(response.data.totalPages || 1)
        }
      } catch (err) {
        console.error('주문 조회 에러:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [isAdmin, currentPage, statusFilter, paymentFilter, searchQuery, token])

  // 검색 핸들러
  const handleSearch = (e) => {
    e.preventDefault()
    setCurrentPage(1)
  }

  // 상태 필터 변경
  const handleStatusFilter = (status) => {
    setStatusFilter(status)
    setCurrentPage(1)
    setShowStatusDropdown(false)
  }

  // 결제수단 필터 변경
  const handlePaymentFilter = (payment) => {
    setPaymentFilter(payment)
    setCurrentPage(1)
    setShowPaymentDropdown(false)
  }

  // 페이지 변경
  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 엑셀 다운로드 (임시 - 실제 구현 필요)
  const handleExcelDownload = () => {
    alert('엑셀 다운로드 기능은 준비 중입니다.')
  }

  // 상태 변경 모달 열기
  const handleOpenStatusModal = (order) => {
    setSelectedOrder(order)
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
    setSelectedOrder(null)
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

  // 주문 상태 변경
  const handleUpdateStatus = async () => {
    if (!selectedOrder) return

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
        `${API_URL}/orders/admin/${selectedOrder._id}/status`,
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
        // 주문 목록 새로고침
        const params = {
          page: currentPage,
          limit: 10,
        }
        if (statusFilter) params.status = statusFilter
        if (searchQuery) params.search = searchQuery

        const refreshResponse = await axios.get(`${API_URL}/orders/admin/all`, {
          params,
          headers: { Authorization: `Bearer ${token}` }
        })
        if (refreshResponse.data.success) {
          setOrders(refreshResponse.data.data)
          setTotalCount(refreshResponse.data.totalCount || 0)
          setTotalPages(refreshResponse.data.totalPages || 1)
        }
      }
    } catch (err) {
      console.error('상태 변경 에러:', err)
      alert(err.response?.data?.message || '상태 변경에 실패했습니다')
    } finally {
      setUpdatingStatus(false)
    }
  }

  if (authLoading || loading) {
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
        {/* Page Header */}
        <div className="admin-page-header">
          <div>
            <h1>주문 관리</h1>
            <p className="page-description">고객의 주문을 확인하고 배송 상태를 관리하세요</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="admin-filters">
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-wrapper">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="주문번호, 고객명으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
          </form>

          <div className="filter-buttons">
            <div className="filter-dropdown">
              <button
                type="button"
                className="filter-btn"
                onClick={() => {
                  setShowStatusDropdown(!showStatusDropdown)
                  setShowPaymentDropdown(false)
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                </svg>
                ▽ 주문 상태
              </button>
              {showStatusDropdown && (
                <div className="dropdown-menu">
                  {STATUS_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`dropdown-item ${statusFilter === option.value ? 'active' : ''}`}
                      onClick={() => handleStatusFilter(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="filter-dropdown">
              <button
                type="button"
                className="filter-btn"
                onClick={() => {
                  setShowPaymentDropdown(!showPaymentDropdown)
                  setShowStatusDropdown(false)
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                  <line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
                결제수단
              </button>
              {showPaymentDropdown && (
                <div className="dropdown-menu">
                  {PAYMENT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`dropdown-item ${paymentFilter === option.value ? 'active' : ''}`}
                      onClick={() => handlePaymentFilter(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              className="btn-excel-download"
              onClick={handleExcelDownload}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              엑셀 다운로드
            </button>
          </div>
        </div>

        {/* Orders Table */}
        <div className="admin-table-container">
          <table className="admin-orders-table">
            <thead>
              <tr>
                <th>주문번호</th>
                <th>고객정보</th>
                <th>상품수</th>
                <th>주문금액</th>
                <th>결제수단</th>
                <th>주문일시</th>
                <th>상태</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty-table-message">
                    주문 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const badge = getStatusBadge(order.status)
                  return (
                    <tr key={order._id}>
                      <td className="order-number-cell">{order.orderNumber}</td>
                      <td className="customer-info-cell">
                        <div className="customer-name">{order.user?.name || '고객'}</div>
                        <div className="customer-email">{order.user?.email || ''}</div>
                      </td>
                      <td>{order.items?.length || 0}개</td>
                      <td className="amount-cell">{formatPrice(order.totalAmount)}</td>
                      <td>{getPaymentMethodLabel(order.payment?.method)}</td>
                      <td className="date-cell">{formatDateTime(order.createdAt)}</td>
                      <td>
                        <button
                          className={`status-badge-btn ${badge.className}`}
                          onClick={() => handleOpenStatusModal(order)}
                          title="상태 변경"
                        >
                          {badge.icon === 'Package' && <OrderIcons.Package size={12} />}
                          {badge.icon === 'Truck' && <OrderIcons.Truck size={12} />}
                          {badge.icon === 'CheckCircle' && <OrderIcons.CheckCircle size={12} />}
                          {badge.label}
                        </button>
                      </td>
                      <td>
                        <button
                          className="btn-view-detail"
                          onClick={() => navigate(`/order/${order._id}`)}
                        >
                          상세보기
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="admin-pagination">
          <div className="pagination-info">
            총 {totalCount}개의 주문
          </div>
          <div className="pagination-controls">
            <button
              className="pagination-btn"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              이전
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </button>
            ))}
            <button
              className="pagination-btn"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              다음
            </button>
          </div>
        </div>
      </main>

      {/* 상태 변경 모달 */}
      {showStatusModal && selectedOrder && (
        <div className="modal-overlay" onClick={handleCloseStatusModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>주문 상태 변경</h2>
              <button className="modal-close" onClick={handleCloseStatusModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="modal-order-info">
                <p><strong>주문번호:</strong> {selectedOrder.orderNumber}</p>
                <p><strong>고객:</strong> {selectedOrder.user?.name} ({selectedOrder.user?.email})</p>
              </div>

              <div className="form-group">
                <label>주문 상태 *</label>
                <select
                  name="status"
                  value={statusForm.status}
                  onChange={handleStatusFormChange}
                  className="form-select"
                >
                  {STATUS_OPTIONS.filter(opt => opt.value !== '').map((option) => (
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

export default AdminOrders

