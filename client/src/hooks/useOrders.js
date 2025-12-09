import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const useOrders = (selectedStatus) => {
  const { isAuthenticated, token } = useAuth()
  const navigate = useNavigate()
  
  const [orders, setOrders] = useState([])
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    preparing: 0,
    shipped: 0,
    delivered: 0,
  })
  const [loading, setLoading] = useState(true)

  // 주문 목록 조회
  useEffect(() => {
    const fetchOrders = async () => {
      if (!isAuthenticated) {
        navigate('/login')
        return
      }

      try {
        setLoading(true)
        const status = selectedStatus === 'all' ? '' : selectedStatus
        const response = await axios.get(`${API_URL}/orders`, {
          params: { status },
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (response.data.success) {
          setOrders(response.data.data)
          if (response.data.statusCounts) {
            setStatusCounts(response.data.statusCounts)
          }
        }
      } catch (err) {
        console.error('주문 조회 에러:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [isAuthenticated, token, selectedStatus, navigate])

  // 주문 목록 새로고침
  const refreshOrders = async () => {
    if (!isAuthenticated) return

    try {
      const status = selectedStatus === 'all' ? '' : selectedStatus
      const response = await axios.get(`${API_URL}/orders`, {
        params: { status },
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (response.data.success) {
        setOrders(response.data.data)
        if (response.data.statusCounts) {
          setStatusCounts(response.data.statusCounts)
        }
      }
    } catch (err) {
      console.error('주문 조회 에러:', err)
    }
  }

  return { orders, statusCounts, loading, refreshOrders }
}

