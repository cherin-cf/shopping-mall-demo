const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const { protect } = require('../middlewares/auth.middleware');

// 모든 장바구니 라우트는 로그인 필요
router.use(protect);

// ===== Cart Routes =====

// GET /api/cart - 장바구니 조회
router.get('/', cartController.getCart);

// POST /api/cart - 장바구니에 상품 추가
router.post('/', cartController.addToCart);

// PUT /api/cart/items/:itemId - 장바구니 아이템 수량 변경
router.put('/items/:itemId', cartController.updateCartItem);

// DELETE /api/cart/items/:itemId - 장바구니 아이템 삭제
router.delete('/items/:itemId', cartController.removeCartItem);

// DELETE /api/cart - 장바구니 비우기
router.delete('/', cartController.clearCart);

// POST /api/cart/remove-selected - 선택한 아이템들 삭제
router.post('/remove-selected', cartController.removeSelectedItems);

module.exports = router;

