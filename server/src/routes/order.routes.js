const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { protect, adminOnly } = require('../middlewares/auth.middleware');

// 모든 주문 라우트는 로그인 필요
router.use(protect);

// ===== 사용자 라우트 =====

// POST /api/orders - 주문 생성 (장바구니)
router.post('/', orderController.createOrder);

// POST /api/orders/buy-now - 바로구매 주문 생성
router.post('/buy-now', orderController.createBuyNowOrder);

// GET /api/orders - 내 주문 목록 조회
router.get('/', orderController.getMyOrders);

// GET /api/orders/:id - 주문 상세 조회
router.get('/:id', orderController.getOrderById);

// PATCH /api/orders/:id/cancel - 주문 취소
router.patch('/:id/cancel', orderController.cancelOrder);

// ===== 관리자 라우트 =====

// GET /api/orders/admin/all - 모든 주문 조회 (관리자)
router.get('/admin/all', adminOnly, orderController.getAllOrders);

// GET /api/orders/admin/:id - 주문 상세 조회 (관리자)
router.get('/admin/:id', adminOnly, orderController.getOrderByIdAdmin);

// PATCH /api/orders/admin/:id/status - 주문 상태 변경 (관리자)
router.patch('/admin/:id/status', adminOnly, orderController.updateOrderStatus);

// PATCH /api/orders/admin/:id/shipping - 배송 정보 업데이트 (관리자)
router.patch('/admin/:id/shipping', adminOnly, orderController.updateShippingInfo);

module.exports = router;

