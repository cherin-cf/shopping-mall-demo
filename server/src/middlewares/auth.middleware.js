const jwt = require('jsonwebtoken');

// JWT 시크릿 키 (환경변수 필수)
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET 환경변수가 설정되지 않았습니다. .env 파일을 확인하세요.');
}

// 인증 미들웨어
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Authorization 헤더에서 토큰 추출
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '로그인이 필요합니다',
      });
    }

    // 토큰 검증
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: '유효하지 않은 토큰입니다',
    });
  }
};

// 관리자 권한 확인 미들웨어
exports.adminOnly = (req, res, next) => {
  if (req.user.user_type !== 'admin') {
    return res.status(403).json({
      success: false,
      message: '관리자 권한이 필요합니다',
    });
  }
  next();
};

