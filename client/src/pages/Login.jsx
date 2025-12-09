import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import './Login.css'

function Login() {
  const navigate = useNavigate()
  const { login, isAuthenticated, loading: authLoading } = useAuth()

  // 이미 로그인된 상태면 메인 페이지로 이동
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, authLoading, navigate])
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 인증 상태 확인 중이면 로딩 표시
  if (authLoading) {
    return (
      <>
        <Navbar />
        <div className="login-page">
          <div className="login-container">
            <div className="loading-text">로딩 중...</div>
          </div>
        </div>
      </>
    )
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('') // 입력 시 에러 메시지 초기화
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // 유효성 검사
    if (!formData.email || !formData.password) {
      setError('이메일과 비밀번호를 모두 입력해주세요')
      return
    }

    // 이메일 형식 검사
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(formData.email)) {
      setError('올바른 이메일 형식을 입력해주세요')
      return
    }

    setLoading(true)

    try {
      const result = await login(formData.email, formData.password)
      
      if (result.success) {
        navigate('/')
      } else {
        setError(result.message || '로그인에 실패했습니다')
      }
    } catch (err) {
      setError('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className="login-page">
        <div className="login-container">
          <div className="login-header">
            <h1>로그인</h1>
            <p>쇼핑몰에 오신 것을 환영합니다</p>
          </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">이메일</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="example@email.com"
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <div className="input-with-icon">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="비밀번호를 입력하세요"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="btn-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div className="login-options">
            <label className="remember-me">
              <input type="checkbox" />
              <span className="checkmark"></span>
              <span>로그인 상태 유지</span>
            </label>
            <Link to="/forgot-password" className="forgot-password">
              비밀번호 찾기
            </Link>
          </div>

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? (
              <span className="loading-spinner">로그인 중...</span>
            ) : (
              '로그인'
            )}
          </button>

          <div className="divider">
            <span>또는</span>
          </div>

          <div className="social-login">
            <button type="button" className="btn-social btn-kakao">
              <span className="social-icon">💬</span>
              카카오로 로그인
            </button>
            <button type="button" className="btn-social btn-naver">
              <span className="social-icon">N</span>
              네이버로 로그인
            </button>
          </div>

          <div className="register-link">
            아직 계정이 없으신가요? <Link to="/register">회원가입</Link>
          </div>
        </form>
      </div>
    </div>
    </>
  )
}

export default Login

