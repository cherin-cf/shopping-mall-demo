import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../../contexts/AuthContext'
import './Admin.css'
import './AdminProducts.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Cloudinary 설정 - 환경변수에서 가져옴
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

// 어드민 네비게이션 메뉴
const ADMIN_MENU = [
  { path: '/admin', label: '대시보드' },
  { path: '/admin/products', label: '상품관리' },
  { path: '/admin/orders', label: '주문관리' },
  { path: '/admin/users', label: '회원관리' },
]

const CATEGORIES = ['상의', '하의', '악세사리']
const STATUS_OPTIONS = ['판매중', '품절', '품절임박', '판매중지']

function AdminProductCreate() {
  const { user, isAdmin, loading } = useAuth()
  const navigate = useNavigate()
  const cloudinaryWidgetRef = useRef(null)
  
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    description: '',
    price: '',
    originalPrice: '',
    stock: '',
    status: '판매중',
    sizes: '',
    colors: '',
    image: '',
  })
  const [imagePreview, setImagePreview] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)

  // Cloudinary 스크립트 로드
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://widget.cloudinary.com/v2.0/global/all.js'
    script.async = true
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/', { replace: true })
    }
  }, [isAdmin, loading, navigate])

  // Cloudinary 위젯 열기
  const openCloudinaryWidget = () => {
    if (!window.cloudinary) {
      setError('이미지 업로드 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.')
      return
    }

    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      setError('Cloudinary 설정이 필요합니다. 환경변수를 확인해주세요.')
      console.error('Missing Cloudinary environment variables:', {
        VITE_CLOUDINARY_CLOUD_NAME: CLOUDINARY_CLOUD_NAME ? '✓' : '✗',
        VITE_CLOUDINARY_UPLOAD_PRESET: CLOUDINARY_UPLOAD_PRESET ? '✓' : '✗'
      })
      return
    }

    setUploadingImage(true)

    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: CLOUDINARY_CLOUD_NAME,
        uploadPreset: CLOUDINARY_UPLOAD_PRESET,
        sources: ['local', 'url', 'camera'],
        multiple: false,
        maxFiles: 1,
        maxFileSize: 10000000, // 10MB
        cropping: true,
        croppingAspectRatio: 1,
        croppingShowDimensions: true,
        resourceType: 'image',
        clientAllowedFormats: ['png', 'jpg', 'jpeg', 'webp'],
        styles: {
          palette: {
            window: '#FFFFFF',
            windowBorder: '#90A0B3',
            tabIcon: '#1A1A1A',
            menuIcons: '#5A616A',
            textDark: '#000000',
            textLight: '#FFFFFF',
            link: '#1A1A1A',
            action: '#1A1A1A',
            inactiveTabIcon: '#6B7280',
            error: '#F44235',
            inProgress: '#1A1A1A',
            complete: '#20B832',
            sourceBg: '#F4F4F5'
          },
          fonts: {
            default: null,
            "'Pretendard', sans-serif": {
              url: 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css',
              active: true
            }
          }
        },
        language: 'ko',
        text: {
          ko: {
            or: '또는',
            back: '뒤로',
            close: '닫기',
            menu: {
              files: '내 파일',
              web: 'URL 주소',
              camera: '카메라'
            },
            local: {
              browse: '파일 선택',
              dd_title_single: '여기에 이미지를 드래그하세요',
            },
            crop: {
              title: '이미지 자르기',
              crop_btn: '자르기',
              skip_btn: '건너뛰기',
            },
            queue: {
              title: '업로드 대기열',
              done: '완료',
            }
          }
        }
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary 업로드 에러:', error)
          setError('이미지 업로드에 실패했습니다.')
          setUploadingImage(false)
          return
        }

        if (result && result.event === 'success') {
          const imageUrl = result.info.secure_url
          setFormData(prev => ({ ...prev, image: imageUrl }))
          setImagePreview(imageUrl)
          setUploadingImage(false)
        }

        if (result && result.event === 'close') {
          setUploadingImage(false)
        }
      }
    )

    cloudinaryWidgetRef.current = widget
    widget.open()
  }

  if (loading) {
    return <div className="admin-loading"><p>로딩 중...</p></div>
  }

  if (!isAdmin) {
    return null
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  // 이미지 삭제
  const removeImage = () => {
    setImagePreview(null)
    setFormData(prev => ({ ...prev, image: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // 유효성 검사
    if (!formData.name) {
      setError('상품명을 입력해주세요')
      return
    }
    if (!formData.sku) {
      setError('SKU를 입력해주세요')
      return
    }
    // SKU 형식 검사 (예: KG-TS-001)
    const skuPattern = /^[A-Za-z]{2}-[A-Za-z]{2}-\d{3}$/
    if (!skuPattern.test(formData.sku)) {
      setError('SKU 형식이 올바르지 않습니다 (예: KG-TS-001)')
      return
    }
    if (!formData.category) {
      setError('카테고리를 선택해주세요')
      return
    }
    if (!formData.price) {
      setError('판매가를 입력해주세요')
      return
    }
    if (!formData.stock && formData.stock !== 0) {
      setError('재고 수량을 입력해주세요')
      return
    }
    if (!formData.image) {
      setError('상품 이미지를 등록해주세요')
      return
    }

    setSubmitting(true)

    try {
      // localStorage에서 토큰 가져오기
      const token = localStorage.getItem('token')
      if (!token) {
        setError('로그인이 필요합니다')
        navigate('/login')
        return
      }

      // API 호출
      const response = await axios.post(
        `${API_URL}/products`,
        {
          sku: formData.sku,
          name: formData.name,
          price: Number(formData.price),
          originalPrice: formData.originalPrice ? Number(formData.originalPrice) : 0,
          category: formData.category,
          image: formData.image,
          description: formData.description || '',
          stock: Number(formData.stock),
          status: formData.status,
          sizes: formData.sizes,
          colors: formData.colors,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (response.data.success) {
        alert('상품이 등록되었습니다!')
        navigate('/admin/products')
      } else {
        setError(response.data.message || '상품 등록에 실패했습니다')
      }
    } catch (err) {
      console.error('상품 등록 에러:', err)
      if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else if (err.response?.status === 401) {
        setError('로그인이 만료되었습니다. 다시 로그인해주세요.')
        navigate('/login')
      } else if (err.response?.status === 403) {
        setError('상품 등록 권한이 없습니다.')
      } else {
        setError('상품 등록에 실패했습니다. 다시 시도해주세요.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="admin">
      {/* Admin Header */}
      <header className="admin-header">
        <div className="admin-header-left">
          <Link to="/admin" className="admin-logo">KHAKI GRADO</Link>
          <nav className="admin-nav">
            {ADMIN_MENU.map(({ path, label }) => (
              <Link 
                key={path} 
                to={path} 
                className={`admin-nav-link ${path === '/admin/products' ? 'active' : ''}`}
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

      {/* Page Content */}
      <main className="admin-content">
        {/* Back Link */}
        <Link to="/admin/products" className="back-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
          상품 목록으로
        </Link>

        {/* Page Header */}
        <div className="page-header">
          <div className="page-header-left">
            <h1>신규 상품 등록</h1>
            <p>새로운 상품 정보를 입력하세요</p>
          </div>
        </div>

        {/* Form */}
        <form className="product-form" onSubmit={handleSubmit}>
          {error && <div className="form-error">{error}</div>}

          {/* 기본 정보 */}
          <div className="form-section">
            <h3>기본 정보</h3>
            
            <div className="form-group">
              <label>상품명 <span className="required">*</span></label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="예: 블루 애슬레틱 티셔츠"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>SKU <span className="required">*</span></label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  placeholder="예: KG-TS-001"
                />
              </div>
              <div className="form-group">
                <label>카테고리 <span className="required">*</span></label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                >
                  <option value="">선택하세요</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>상품 설명</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="상품에 대한 자세한 설명을 입력하세요"
                rows={4}
              />
            </div>
          </div>

          {/* 가격 및 재고 */}
          <div className="form-section">
            <h3>가격 및 재고</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>판매가 <span className="required">*</span></label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>정가</label>
                <input
                  type="number"
                  name="originalPrice"
                  value={formData.originalPrice}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>재고 수량 <span className="required">*</span></label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>판매 상태 <span className="required">*</span></label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  {STATUS_OPTIONS.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 상품 이미지 */}
          <div className="form-section">
            <h3>상품 이미지</h3>
            
            <div className="image-upload-area">
              {imagePreview ? (
                <div className="image-preview-container">
                  <div className="image-preview">
                    <img src={imagePreview} alt="상품 이미지 미리보기" />
                    <button 
                      type="button" 
                      className="remove-image"
                      onClick={removeImage}
                    >
                      ×
                    </button>
                  </div>
                  <div className="image-info">
                    <p className="image-uploaded-text">✓ 이미지가 업로드되었습니다</p>
                    <button 
                      type="button" 
                      className="btn-change-image"
                      onClick={openCloudinaryWidget}
                      disabled={uploadingImage}
                    >
                      이미지 변경
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  className="upload-label"
                  onClick={openCloudinaryWidget}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && openCloudinaryWidget()}
                >
                  {uploadingImage ? (
                    <>
                      <div className="upload-spinner"></div>
                      <p>업로드 중...</p>
                    </>
                  ) : (
                    <>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      <p>클릭하여 이미지 업로드</p>
                      <span>PNG, JPG, WEBP (최대 10MB)</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 옵션 */}
          <div className="form-section">
            <h3>옵션</h3>
            
            <div className="form-group">
              <label>사이즈</label>
              <input
                type="text"
                name="sizes"
                value={formData.sizes}
                onChange={handleChange}
                placeholder="예: S, M, L, XL (쉼표로 구분)"
              />
            </div>

            <div className="form-group">
              <label>색상</label>
              <input
                type="text"
                name="colors"
                value={formData.colors}
                onChange={handleChange}
                placeholder="예: 블랙, 화이트, 블루 (쉼표로 구분)"
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="form-actions">
            <Link to="/admin/products" className="btn-cancel">취소</Link>
            <button type="submit" className="btn-submit" disabled={submitting}>
              {submitting ? '등록 중...' : '상품 등록'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}

export default AdminProductCreate

