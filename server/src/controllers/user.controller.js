const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// JWT 시크릿 키 (환경변수 필수)
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET 환경변수가 설정되지 않았습니다. .env 파일을 확인하세요.');
}

// 회원가입
exports.register = async (req, res) => {
  try {
    const { email, name, password, user_type, address } = req.body;

    console.log('[회원가입 요청]', { email, name, user_type, address: address ? '있음' : '없음' });

    // 필수 필드 검증
    if (!email || !name || !password) {
      console.log('[회원가입 실패] 필수 필드 누락');
      return res.status(400).json({
        success: false,
        message: '필수 필드를 모두 입력해주세요',
      });
    }

    // 이메일 중복 확인
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('[회원가입 실패] 이미 등록된 이메일:', email);
      return res.status(400).json({
        success: false,
        message: '이미 등록된 이메일입니다',
      });
    }

    // 비밀번호 해싱
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 유저 생성
    console.log('[회원가입 진행] 유저 생성 시도...');
    const user = await User.create({
      email,
      name,
      password: hashedPassword,
      user_type: user_type || 'customer',
      address,
    });

    console.log('[회원가입 성공] 유저 생성 완료:', user._id, user.email);

    // 비밀번호 제외하고 응답
    const userResponse = {
      _id: user._id,
      email: user.email,
      name: user.name,
      user_type: user.user_type,
      address: user.address,
      createdAt: user.createdAt,
    };

    res.status(201).json({
      success: true,
      message: '회원가입 성공',
      data: userResponse,
    });
  } catch (error) {
    console.error('[회원가입 에러]', error);
    console.error('[회원가입 에러 상세]', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// 로그인
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 유저 찾기
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '이메일 또는 비밀번호가 일치하지 않습니다',
      });
    }

    // 비밀번호 확인
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: '이메일 또는 비밀번호가 일치하지 않습니다',
      });
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      { id: user._id, email: user.email, user_type: user.user_type },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: '로그인 성공',
      data: {
        token,
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          user_type: user.user_type,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 내 정보 조회
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 모든 유저 조회 (관리자용)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 유저 정보 수정
exports.updateUser = async (req, res) => {
  try {
    const { name, address } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, address },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다',
      });
    }

    res.status(200).json({
      success: true,
      message: '정보가 수정되었습니다',
      data: user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// 회원 탈퇴 (본인)
exports.deleteMe = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다',
      });
    }

    res.status(200).json({
      success: true,
      message: '회원 탈퇴가 완료되었습니다',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 유저 삭제 (관리자용)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다',
      });
    }

    res.status(200).json({
      success: true,
      message: '유저가 삭제되었습니다',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 관리자 권한 변경 (관리자용)
exports.updateUserRole = async (req, res) => {
  try {
    const { user_type } = req.body;
    const { id } = req.params;

    // 본인 권한 변경 방지
    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: '본인의 권한은 변경할 수 없습니다',
      });
    }

    // 유효한 user_type인지 확인
    if (!['customer', 'admin'].includes(user_type)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 사용자 유형입니다',
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { user_type },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다',
      });
    }

    res.status(200).json({
      success: true,
      message: `사용자 권한이 ${user_type === 'admin' ? '관리자' : '일반 사용자'}로 변경되었습니다`,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

