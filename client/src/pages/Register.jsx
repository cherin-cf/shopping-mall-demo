import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import './Register.css'

function Register() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    passwordConfirm: '',
    address: '',
  })
  const [agreements, setAgreements] = useState({
    all: false,
    terms: false,
    privacy: false,
    marketing: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [emailChecked, setEmailChecked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // 휴대폰 인증 관련 상태
  const [verificationSent, setVerificationSent] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [phoneVerified, setPhoneVerified] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (name === 'email') setEmailChecked(false)
  }

  const handleAgreementChange = (e) => {
    const { name, checked } = e.target

    if (name === 'all') {
      setAgreements({
        all: checked,
        terms: checked,
        privacy: checked,
        marketing: checked,
      })
    } else {
      const newAgreements = { ...agreements, [name]: checked }
      newAgreements.all = newAgreements.terms && newAgreements.privacy && newAgreements.marketing
      setAgreements(newAgreements)
    }
  }

  const checkEmailDuplicate = async () => {
    if (!formData.email) {
      alert('이메일을 입력해주세요')
      return
    }
    
    try {
      // 실제로는 서버에 중복 체크 API 호출
      // const response = await axios.post('/api/users/check-email', { email: formData.email })
      setEmailChecked(true)
      alert('사용 가능한 이메일입니다')
    } catch (err) {
      alert('이미 사용 중인 이메일입니다')
    }
  }

  const sendVerificationCode = () => {
    if (!formData.phone) {
      alert('휴대폰 번호를 입력해주세요')
      return
    }
    // 실제로는 서버에서 SMS 발송
    setVerificationSent(true)
    setPhoneVerified(false)
    setVerificationCode('')
    alert('인증번호가 발송되었습니다 (테스트: 123456)')
  }

  const verifyCode = () => {
    if (!verificationCode) {
      alert('인증번호를 입력해주세요')
      return
    }
    // 실제로는 서버에서 인증번호 검증
    if (verificationCode === '123456') {
      setPhoneVerified(true)
      alert('휴대폰 인증이 완료되었습니다')
    } else {
      alert('인증번호가 일치하지 않습니다')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // 유효성 검사
    if (!formData.name || !formData.email || !formData.password || !formData.passwordConfirm) {
      setError('필수 항목을 모두 입력해주세요')
      return
    }

    // 이메일 형식 검사
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(formData.email)) {
      setError('올바른 이메일 형식을 입력해주세요 (예: example@email.com)')
      return
    }

    if (formData.password !== formData.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다')
      return
    }

    if (formData.password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다')
      return
    }

    if (!agreements.terms || !agreements.privacy) {
      setError('필수 약관에 동의해주세요')
      return
    }

    setLoading(true)

    try {
      const response = await axios.post('/api/users/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        address: formData.address,
        user_type: 'customer',
      })

      if (response.data.success) {
        alert('회원가입이 완료되었습니다!')
        navigate('/')
      }
    } catch (err) {
      setError(err.response?.data?.message || '회원가입에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-header">
          <h1>회원가입</h1>
          <p>쇼핑몰 회원이 되어 다양한 혜택을 누리세요</p>
        </div>

        <form className="register-form" onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

          <section className="form-section">
            <h2>기본 정보</h2>

            <div className="form-group">
              <label>이름 <span className="required">*</span></label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="이름을 입력하세요"
              />
            </div>

            <div className="form-group">
              <label>이메일 <span className="required">*</span></label>
              <div className="input-with-button">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@email.com"
                />
                <button type="button" className="btn-check" onClick={checkEmailDuplicate}>
                  중복확인
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>휴대폰 번호 <span className="required">*</span></label>
              <div className="input-with-button">
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="01012345678"
                  disabled={phoneVerified}
                />
                <button 
                  type="button" 
                  className="btn-check" 
                  onClick={sendVerificationCode}
                  disabled={phoneVerified}
                >
                  {phoneVerified ? '인증완료' : verificationSent ? '재발송' : '인증번호'}
                </button>
              </div>
              {verificationSent && !phoneVerified && (
                <div className="verification-input">
                  <div className="input-with-button">
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="인증번호 6자리 입력"
                      maxLength={6}
                    />
                    <button type="button" className="btn-check btn-verify" onClick={verifyCode}>
                      확인
                    </button>
                  </div>
                  <p className="verification-hint">테스트 인증번호: 123456</p>
                </div>
              )}
              {phoneVerified && (
                <p className="verification-success">✓ 휴대폰 인증 완료</p>
              )}
            </div>

            <div className="form-group">
              <label>비밀번호 <span className="required">*</span></label>
              <div className="input-with-icon">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="영문, 숫자 포함 8자 이상"
                />
                <button
                  type="button"
                  className="btn-toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>비밀번호 확인 <span className="required">*</span></label>
              <input
                type="password"
                name="passwordConfirm"
                value={formData.passwordConfirm}
                onChange={handleChange}
                placeholder="비밀번호를 다시 입력하세요"
              />
            </div>

            <div className="form-group">
              <label>주소</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="주소를 입력하세요 (선택)"
              />
            </div>
          </section>

          <section className="form-section">
            <h2>약관 동의</h2>

            <div className="agreement-box">
              <div className="agreement-item agreement-all">
                <label>
                  <input
                    type="checkbox"
                    name="all"
                    checked={agreements.all}
                    onChange={handleAgreementChange}
                  />
                  <span className="checkmark"></span>
                  <span className="agreement-text">전체 동의</span>
                </label>
              </div>

              <div className="agreement-divider"></div>

              <div className="agreement-item">
                <label>
                  <input
                    type="checkbox"
                    name="terms"
                    checked={agreements.terms}
                    onChange={handleAgreementChange}
                  />
                  <span className="checkmark"></span>
                  <span className="agreement-text">
                    <span className="required-tag">[필수]</span> 이용약관 동의
                  </span>
                </label>
                <button type="button" className="btn-view">보기</button>
              </div>

              <div className="agreement-item">
                <label>
                  <input
                    type="checkbox"
                    name="privacy"
                    checked={agreements.privacy}
                    onChange={handleAgreementChange}
                  />
                  <span className="checkmark"></span>
                  <span className="agreement-text">
                    <span className="required-tag">[필수]</span> 개인정보 수집 및 이용 동의
                  </span>
                </label>
                <button type="button" className="btn-view">보기</button>
              </div>

              <div className="agreement-item">
                <label>
                  <input
                    type="checkbox"
                    name="marketing"
                    checked={agreements.marketing}
                    onChange={handleAgreementChange}
                  />
                  <span className="checkmark"></span>
                  <span className="agreement-text">
                    <span className="optional-tag">[선택]</span> 마케팅 정보 수신 동의
                  </span>
                </label>
                <button type="button" className="btn-view">보기</button>
              </div>
            </div>
          </section>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? '처리 중...' : '회원가입'}
          </button>

          <div className="login-link">
            이미 계정이 있으신가요? <Link to="/login">로그인</Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Register

