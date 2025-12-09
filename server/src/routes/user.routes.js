const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { protect, adminOnly } = require('../middlewares/auth.middleware');

// POST /api/users/register - 회원가입
router.post('/register', userController.register);

// POST /api/users/login - 로그인
router.post('/login', userController.login);

// GET /api/users/me - 내 정보 조회 (로그인 필요)
router.get('/me', protect, userController.getMe);

// PUT /api/users/me - 내 정보 수정 (로그인 필요)
router.put('/me', protect, userController.updateUser);

// DELETE /api/users/me - 회원 탈퇴 (로그인 필요)
router.delete('/me', protect, userController.deleteMe);

// GET /api/users - 모든 유저 조회 (관리자만)
router.get('/', protect, adminOnly, userController.getAllUsers);

// DELETE /api/users/:id - 유저 삭제 (관리자만)
router.delete('/:id', protect, adminOnly, userController.deleteUser);

// PATCH /api/users/:id/role - 관리자 권한 변경 (관리자만)
router.patch('/:id/role', protect, adminOnly, userController.updateUserRole);

module.exports = router;

