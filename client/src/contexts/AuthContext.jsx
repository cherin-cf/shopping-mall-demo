import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

// API 기본 URL 설정
const BASE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const API_URL = `${BASE_API_URL}/users`

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  // 앱 시작 시 토큰이 있으면 사용자 정보 복원
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('token')
      if (savedToken) {
        try {
          // 토큰으로 사용자 정보 조회
          const response = await axios.get(`${API_URL}/me`, {
            headers: { Authorization: `Bearer ${savedToken}` }
          })
          
          if (response.data.success) {
            setUser(response.data.data)
            setToken(savedToken)
          } else {
            // 토큰이 유효하지 않으면 제거
            localStorage.removeItem('token')
            setToken(null)
          }
        } catch (error) {
          // 에러 발생 시 토큰 제거
          localStorage.removeItem('token')
          setToken(null)
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  // 로그인
  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/login`, {
        email,
        password,
      })

      if (response.data.success) {
        const { token: newToken, user: userData } = response.data.data
        
        // 토큰 저장
        localStorage.setItem('token', newToken)
        setToken(newToken)
        setUser(userData)

        return { success: true, message: '로그인 성공' }
      } else {
        return { success: false, message: response.data.message }
      }
    } catch (error) {
      const message = error.response?.data?.message || '로그인에 실패했습니다'
      return { success: false, message }
    }
  }

  // 로그아웃
  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  // 사용자 정보 업데이트
  const updateUser = (userData) => {
    setUser(prev => ({ ...prev, ...userData }))
  }

  // 인증 여부 확인
  const isAuthenticated = !!token && !!user

  // 관리자 여부 확인
  const isAdmin = user?.user_type === 'admin'

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated,
    isAdmin,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom Hook
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth는 AuthProvider 내에서 사용해야 합니다')
  }
  return context
}

export default AuthContext

